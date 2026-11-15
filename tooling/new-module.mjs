#!/usr/bin/env node
/**
 * Crea un módulo nuevo (npm run new:module -- XX_nombre [opciones]):
 *   - docs/modules/XX_nombre/ con el índice y los 4 documentos desde MODULE_TEMPLATE
 *   - .workflow/modules/XX_nombre.json con su pista de estado en G1
 *
 * Opciones:
 *   --nombre "Texto"         Nombre legible (por defecto, derivado del ID)
 *   --responsable "Texto"    Persona o agente a cargo (por defecto, user.name de Git)
 *   --depende-de a,b         IDs de módulos de los que depende
 *   --modificadores a,b      Modificadores de riesgo propios del módulo (pagos, tiempo_real...)
 *   --origen ruta            Plan Kaizen del que sale un módulo de mantenimiento (docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md)
 *
 * No crea el contrato Zod: lo redacta Arquitectura en G2 (AGENTS.md §6).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { rootDir, loadStageGates } from './lib/stage-gates.mjs';
import { MODULES_DIR, MODULE_ID_RE, gatesForTrack, loadModuleStates } from './lib/workflow-state.mjs';
import { loadProjectConfig } from './lib/project-config.mjs';
import { loadProfiles } from './lib/profiles.mjs';

const TEMPLATE_DIR = path.join(rootDir, 'multiAgents', 'protocols', 'TEMPLATES', 'MODULE_TEMPLATE');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { id: null, nombre: null, responsable: null, dependeDe: [], modificadores: [], origen: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) fail(`Falta el valor de ${arg}.`);
      return argv[++i];
    };
    if (arg === '--nombre') opts.nombre = value();
    else if (arg === '--responsable') opts.responsable = value();
    else if (arg === '--depende-de') opts.dependeDe = value().split(',').map((d) => d.trim()).filter(Boolean);
    else if (arg === '--modificadores') opts.modificadores = value().split(',').map((d) => d.trim()).filter(Boolean);
    else if (arg === '--origen') opts.origen = value().trim().replace(/\\/g, '/');
    else if (arg.startsWith('--')) fail(`Opción desconocida: ${arg}`);
    else if (!opts.id) opts.id = arg;
    else fail(`Argumento inesperado: ${arg}`);
  }
  return opts;
}

function gitUserName() {
  try {
    return execSync('git config user.name', { cwd: rootDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.id) fail('Uso: npm run new:module -- XX_nombre [--nombre "Texto"] [--responsable "Texto"] [--depende-de a,b] [--modificadores a,b] [--origen docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md]');
if (!MODULE_ID_RE.test(opts.id)) fail(`ID inválido "${opts.id}". Formato: dos dígitos, guion bajo y nombre en minúsculas (ej. 04_pagos).`);

const id = opts.id;
const numero = id.slice(0, 2);
const nombre = opts.nombre ?? id.slice(3).split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const responsable = opts.responsable ?? gitUserName() ?? 'por asignar';
const docsDir = path.join(rootDir, 'docs', 'modules', id);
const stateFile = path.join(MODULES_DIR, `${id}.json`);

const existing = loadModuleStates();
if (fs.existsSync(docsDir)) fail(`Ya existe docs/modules/${id}/.`);
if (fs.existsSync(stateFile)) fail(`Ya existe .workflow/modules/${id}.json.`);
const clash = existing.find((m) => m.id.slice(0, 2) === numero);
if (clash) fail(`El número ${numero} ya lo usa el módulo "${clash.id}".`);
for (const dep of opts.dependeDe) {
  if (!existing.some((m) => m.id === dep)) fail(`La dependencia "${dep}" no existe en .workflow/modules/.`);
}

const table = loadStageGates();
const profiles = loadProfiles(table);
if (opts.origen && !fs.existsSync(path.join(rootDir, opts.origen))) fail(`El plan de origen "${opts.origen}" no existe. Debe ser la ruta (desde la raíz) del plan Kaizen, por ejemplo docs/quality/IMPROVEMENT_PLAN_v0.3.0.md.`);
for (const mod of opts.modificadores) {
  if (!profiles.modificadores.has(mod)) fail(`El modificador "${mod}" no existe. Disponibles: ${[...profiles.modificadores.keys()].join(', ')}.`);
}
const firstGate = gatesForTrack(table, 'modulo', loadProjectConfig().config)[0];
const today = new Date().toLocaleDateString('sv-SE');
const replacements = [
  ['PLANTILLA: ', ''],
  ['[XX. Nombre del Módulo]', `${numero}. ${nombre}`],
  ['[Nombre del Módulo]', nombre],
  ['[XX_nombre_modulo]', id],
  ['[AAAA-MM-DD]', today],
];

fs.mkdirSync(docsDir, { recursive: true });
const templates = fs.readdirSync(TEMPLATE_DIR).filter((name) => /^\d\d_.+_TEMPLATE\.md$/.test(name)).sort();
const created = [];
for (const name of templates) {
  const target = name === '00_README_TEMPLATE.md' ? 'README.md' : name.replace('_TEMPLATE.md', '.md');
  let content = fs.readFileSync(path.join(TEMPLATE_DIR, name), 'utf-8');
  for (const [from, to] of replacements) content = content.split(from).join(to);
  fs.writeFileSync(path.join(docsDir, target), content);
  created.push(`docs/modules/${id}/${target}`);
}

const state = {
  modulo: id,
  nombre,
  responsable,
  rama: `feature/${id.replace(/_/g, '-')}`,
  depende_de: opts.dependeDe,
  modificadores: opts.modificadores,
  origen: opts.origen,
  fase_activa: firstGate.fase,
  gate_activo: firstGate.gate,
  estado: 'EN_PROCESO',
  rol_en_turno: '01_product_manager',
  incluido_en_release: null,
  bloqueos: [],
  historial_transiciones: [
    { de: 'ORIGEN', a: firstGate.fase, fecha: today, autor: responsable, motivo: 'Módulo creado con npm run new:module' },
  ],
};
fs.mkdirSync(MODULES_DIR, { recursive: true });
fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
created.push(`.workflow/modules/${id}.json`);

console.log(`✅ Módulo ${id} (${nombre}) creado:`);
for (const file of created) console.log(`   - ${file}`);
if (state.origen) console.log(`   Módulo de mantenimiento: sus historias son las acciones de ${state.origen} (CONTINUOUS_IMPROVEMENT_PROTOCOL.md, paso 6).`);
console.log(`\nSiguientes pasos:`);
console.log(`   1. git switch -c ${state.rama}`);
console.log(`   2. El Product Manager completa 01 a 03; al terminar, commit en la rama y npm run gate -- ${id} solicitar.`);
console.log(`   3. Cada rol registra su bitácora en multiAgents/[rol]/worklog/${id}.md y los cambios en changelog.d/${id}.md (nunca en CHANGELOG.md).`);
console.log(`   4. Plan del módulo según el perfil: npm run status -- ${id}. En cada Halt el agente se detiene hasta la firma humana (AGENTS.md §5.1).`);
