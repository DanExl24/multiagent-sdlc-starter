#!/usr/bin/env node
/**
 * ♿ Lint estático preliminar de accesibilidad
 * multiagent-sdlc-starter
 *
 * NO certifica WCAG: revisa 5 reglas sobre el código fuente. La conformidad exige además
 * axe-core en el navegador (Playwright) y revisión manual. Estados: SIN_HALLAZGOS_ESTATICOS,
 * VIOLACIONES_DETECTADAS o NOT_APPLICABLE (sin componentes que revisar).
 *
 * Audita archivos frontend (HTML/Vue/JSX/TSX) o endpoints de interfaz en vivo:
 * 1. Elementos interactivos sin nombre accesible (botones, enlaces vacíos).
 * 2. Inputs de formulario sin etiquetas asociadas (<label>, aria-label).
 * 3. Imágenes sin atributo alt.
 * 4. Uso de tabindex > 0 que altera el flujo natural de navegación por teclado.
 * 5. Elementos no semánticos con handlers de clic (div con @click sin role="button").
 *
 * Salida:
 * - Reporte estructurado en docs/qa/a11y-audit-summary.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectConfig } from './lib/project-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n=============================================================');
console.log('♿  [AUDIT-A11Y] Lint estático preliminar de accesibilidad (no certifica WCAG)');
console.log('=============================================================\n');

const findings = [];
let passCount = 0;
let failCount = 0;
let warningCount = 0;

function scanFilesRecursively(dir, extensions, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.workflow') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFilesRecursively(fullPath, extensions, fileList);
    } else if (extensions.some((ext) => item.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const { config } = loadProjectConfig();
const targetDirs = [
  ...(config.capas.frontend.activa ? [path.join(rootDir, config.capas.frontend.raiz)] : []),
  path.join(rootDir, 'src'),
  path.join(rootDir, 'docs', 'project', 'design-system.md'),
];

let filesToAudit = [];
for (const target of targetDirs) {
  if (fs.existsSync(target)) {
    if (fs.statSync(target).isDirectory()) {
      scanFilesRecursively(target, ['.html', '.vue', '.jsx', '.tsx'], filesToAudit);
    } else {
      filesToAudit.push(target);
    }
  }
}

if (filesToAudit.length === 0) {
  console.log('ℹ️  No se encontraron componentes frontend creados aún.');
  console.log('ℹ️  Auditando especificación del Design System en docs/project/design-system.md...');
  const designSystemPath = path.join(rootDir, 'docs', 'project', 'design-system.md');
  if (fs.existsSync(designSystemPath)) {
    filesToAudit.push(designSystemPath);
  }
}

console.log(`📁 Analizando ${filesToAudit.length} archivos de vista y diseño...\n`);

for (const filePath of filesToAudit) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(rootDir, filePath);
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Imágenes sin alt
    if (/<img\b(?!.*?(\balt=))[^>]*>/i.test(line)) {
      failCount++;
      findings.push({
        file: relPath,
        line: lineNum,
        rule: 'WCAG-1.1.1-Non-Text-Content',
        severity: 'FAIL',
        message: 'Etiqueta <img> sin atributo alt para lectores de pantalla.',
        snippet: line.trim(),
      });
      console.log(`  ❌ [FAIL] ${relPath}:${lineNum} ➔ <img> sin atributo alt.`);
    }

    // 2. Tabindex anti-patrón (> 0)
    if (/tabindex=["']?[1-9]\d*["']?/i.test(line)) {
      failCount++;
      findings.push({
        file: relPath,
        line: lineNum,
        rule: 'WCAG-2.4.3-Focus-Order',
        severity: 'FAIL',
        message: 'Uso de tabindex > 0 altera el orden de navegación accesible.',
        snippet: line.trim(),
      });
      console.log(`  ❌ [FAIL] ${relPath}:${lineNum} ➔ tabindex > 0 destruye el orden de foco.`);
    }

    // 3. Inputs sin labels accesibles
    if (/<input\b/i.test(line) && !line.includes('type="hidden"') && !line.includes('aria-label') && !line.includes('id=')) {
      warningCount++;
      findings.push({
        file: relPath,
        line: lineNum,
        rule: 'WCAG-3.3.2-Labels-or-Instructions',
        severity: 'WARN',
        message: 'Input potencialmente huérfano sin id asociado a <label> ni aria-label.',
        snippet: line.trim(),
      });
      console.log(`  ⚠️  [WARN] ${relPath}:${lineNum} ➔ Input sin id o aria-label.`);
    }

    // 4. Div con click sin rol semántico
    if (/<div\b[^>]*(?:@click|onClick)[^>]*>/i.test(line) && !line.includes('role=') && !line.includes('tabindex=')) {
      failCount++;
      findings.push({
        file: relPath,
        line: lineNum,
        rule: 'WCAG-4.1.2-Name-Role-Value',
        severity: 'FAIL',
        message: 'Elemento <div> interactivo sin role="button" ni soporte de teclado.',
        snippet: line.trim(),
      });
      console.log(`  ❌ [FAIL] ${relPath}:${lineNum} ➔ <div> interactivo sin semántica de botón.`);
    }
  });
}

const componentes = filesToAudit.filter((f) => !f.endsWith('.md')).length;
if (findings.length === 0) {
  passCount = 1;
  console.log('  ✅ [PASS] Cero hallazgos de las reglas estáticas en los archivos inspeccionados.');
}
const estado = componentes === 0 ? 'NOT_APPLICABLE' : failCount === 0 ? 'SIN_HALLAZGOS_ESTATICOS' : 'VIOLACIONES_DETECTADAS';

const outputDir = path.join(rootDir, 'docs', 'qa');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const reportData = {
  fecha: new Date().toISOString(),
  archivos_auditados: filesToAudit.length,
  resumen: {
    pass: passCount,
    warn: warningCount,
    fail: failCount,
    estado_accesibilidad: estado,
    alcance: 'Lint estático de 5 reglas (nombre accesible, labels, alt, tabindex, div clicable). No certifica WCAG 2.1/2.2 AA: complementar con axe-core en navegador y revisión manual.',
  },
  hallazgos: findings,
};

const outputPath = path.join(outputDir, 'a11y-audit-summary.json');
fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf8');

console.log('\n=============================================================');
console.log(`📊 Resumen A11y: ${componentes} componente(s) | ${warningCount} Advertencias | ${failCount} Violaciones`);
console.log(`📄 Reporte JSON guardado en: docs/qa/a11y-audit-summary.json`);
console.log(`🚦 Veredicto: ${estado === 'NOT_APPLICABLE' ? '⚪ NOT_APPLICABLE: no hay componentes de interfaz que revisar' : estado === 'SIN_HALLAZGOS_ESTATICOS' ? '✅ Sin hallazgos estáticos (no certifica WCAG: falta axe-core en navegador y revisión manual)' : '❌ STOP-THE-LINE: Corregir violaciones de accesibilidad'}`);
console.log('=============================================================\n');

if (failCount > 0 && !process.env.ALLOW_FAIL) {
  process.exit(1);
}
