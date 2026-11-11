#!/usr/bin/env node
/**
 * Verifica la política de fuentes de verdad definida en AGENTS.md (sección 0):
 *   A. Ningún documento distinto de AGENTS.md (y del CHANGELOG histórico) cita una
 *      Regla de Oro por su número ("Regla de Oro #N"). Se cita por nombre y enlace.
 *   B. Los documentos puente (README.md, LANDING_PROMPT.md, CLAUDE.md, GEMINI.md) no
 *      numeran compuertas ni reglas: solo describen y enlazan a AGENTS.md.
 *   D. CLAUDE.md y GEMINI.md existen y se limitan a importar AGENTS.md (línea "@AGENTS.md").
 *   C. Los IDs de compuerta del diagrama de AGENTS.md coinciden con la tabla de
 *      .workflow/STAGE_GATES.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadStageGates, rootDir } from './lib/stage-gates.mjs';

const SKIP_DIRS = new Set(['node_modules', '.git']);
const SCAN_EXT = new Set(['.md', '.ts']);
const RULE_CITATION = /regla(?:s)?\s+de\s+oro[\s*:]*#\s*\d+/i;
const IMPORT_BRIDGES = ['CLAUDE.md', 'GEMINI.md'];
const BRIDGES = ['README.md', 'LANDING_PROMPT.md', ...IMPORT_BRIDGES];
const BRIDGE_NUMBERING = [
  { re: /\bG[0-6][AB]?\b/, label: 'ID de compuerta (G0..G6)' },
  { re: /\bGate[ _-]?\d/i, label: 'compuerta numerada ("Gate N")' },
  { re: /regla(?:s)?\s+de\s+oro[\s*:]*#\s*\d+/i, label: 'cita numerada de regla de oro' },
  { re: /\b\d+\s+reglas\s+de\s+oro/i, label: 'conteo de reglas de oro' },
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name));
    } else if (SCAN_EXT.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name);
    }
  }
}

const rel = (file) => path.relative(rootDir, file).split(path.sep).join('/');
const errors = [];

// A. Citas numeradas de reglas de oro fuera de AGENTS.md
for (const file of walk(rootDir)) {
  const name = rel(file);
  if (name === 'AGENTS.md' || name === 'CHANGELOG.md') continue;
  fs.readFileSync(file, 'utf-8').split(/\r?\n/).forEach((line, i) => {
    if (RULE_CITATION.test(line)) errors.push(`${name}:${i + 1} cita una Regla de Oro por número. Cítala por nombre y enlaza a AGENTS.md §6.`);
  });
}

// B. Puentes sin numeración
for (const bridge of BRIDGES) {
  const file = path.join(rootDir, bridge);
  if (!fs.existsSync(file)) continue;
  fs.readFileSync(file, 'utf-8').split(/\r?\n/).forEach((line, i) => {
    for (const { re, label } of BRIDGE_NUMBERING) {
      if (re.test(line)) errors.push(`${bridge}:${i + 1} contiene ${label}. Los puentes solo enlazan a AGENTS.md.`);
    }
  });
}

// D. Puentes de importación: deben existir e importar AGENTS.md
for (const bridge of IMPORT_BRIDGES) {
  const file = path.join(rootDir, bridge);
  if (!fs.existsSync(file)) {
    errors.push(`${bridge} no existe. Debe ser un puente que importe AGENTS.md con la línea "@AGENTS.md".`);
  } else if (!/^@AGENTS\.md\s*$/m.test(fs.readFileSync(file, 'utf-8'))) {
    errors.push(`${bridge} debe importar AGENTS.md con una línea "@AGENTS.md".`);
  }
}

// C. Diagrama de AGENTS.md vs tabla de STAGE_GATES.md
try {
  const tableIds = new Set(loadStageGates().gates.map((g) => g.id));
  const agents = fs.readFileSync(path.join(rootDir, 'AGENTS.md'), 'utf-8');
  const diagramIds = new Set([...agents.matchAll(/\b(G\d[AB]?)\["/g)].map((m) => m[1]));
  if (diagramIds.size === 0) errors.push('AGENTS.md: no se encontró el diagrama de compuertas (nodos G0..G6).');
  for (const id of diagramIds) if (!tableIds.has(id)) errors.push(`AGENTS.md: el diagrama cita ${id}, que no existe en STAGE_GATES.md.`);
  for (const id of tableIds) if (!diagramIds.has(id)) errors.push(`AGENTS.md: el diagrama no incluye ${id}, definida en STAGE_GATES.md.`);
} catch (err) {
  errors.push(`No se pudo comparar con STAGE_GATES.md: ${err.message}`);
}

if (errors.length > 0) {
  console.error('❌ Política de fuentes de verdad incumplida (ver AGENTS.md §0):');
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}
console.log('✅ Fuentes de verdad coherentes: sin citas numeradas fuera de AGENTS.md, puentes limpios y diagrama alineado con STAGE_GATES.md.');
