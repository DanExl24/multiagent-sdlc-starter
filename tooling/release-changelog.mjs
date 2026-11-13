#!/usr/bin/env node
/**
 * Consolida los fragmentos de changelog.d/ en una versión de CHANGELOG.md (entregable de G5).
 *
 *   npm run release:changelog -- 0.2.0 [--dry-run]
 *
 * - Agrupa las viñetas por sección de Keep a Changelog, en orden canónico, anteponiendo el módulo.
 * - Registra la versión en `incluido_en_release` de los módulos COMPLETADO que aún no tenían release.
 * - Borra los fragmentos consumidos.
 * - Fija la versión en package.json, package-lock.json y version_actual de current_state.json.
 * Con --dry-run solo muestra el resultado. Si el Director Humano rechaza G5, se revierte el commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './lib/stage-gates.mjs';
import { SECTIONS, loadFragments } from './lib/changelog-fragments.mjs';
import { loadModuleStates } from './lib/workflow-state.mjs';
import { syncPackageVersion } from './lib/package-version.mjs';

const CHANGELOG = path.join(rootDir, 'CHANGELOG.md');
const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const versionArg = args.find((a) => !a.startsWith('--'));
if (!versionArg) fail('Uso: npm run release:changelog -- X.Y.Z [--dry-run]');
const version = versionArg.replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`Versión inválida "${versionArg}". Formato SemVer: X.Y.Z.`);

const fragments = loadFragments();
if (fragments.length === 0) fail('No hay fragmentos en changelog.d/. Nada que consolidar.');
const invalid = fragments.filter((f) => f.errors.length);
if (invalid.length) {
  for (const f of invalid) for (const e of f.errors) console.error(`   - changelog.d/${f.name}: ${e}`);
  fail('Corrige los fragmentos antes de consolidar (npm run check:docs muestra el detalle).');
}

const modules = loadModuleStates();
const byId = new Map(modules.filter((m) => m.state).map((m) => [m.id, m.state]));
for (const f of fragments) {
  if (f.owner === 'proyecto') continue;
  const state = byId.get(f.owner);
  if (!state) fail(`changelog.d/${f.name} pertenece al módulo "${f.owner}", que no existe en .workflow/modules/.`);
  if (state.estado !== 'COMPLETADO') fail(`changelog.d/${f.name}: el módulo ${f.owner} no ha superado G4 y no puede entrar en un release.`);
}

const raw = fs.readFileSync(CHANGELOG, 'utf-8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
if (lines.some((l) => l.startsWith(`## [${version}]`))) fail(`CHANGELOG.md ya contiene la versión ${version}.`);

const today = new Date().toLocaleDateString('sv-SE');
const block = [`## [${version}] - ${today}`, ''];
for (const section of SECTIONS) {
  const bullets = fragments.flatMap((f) => (f.sections.get(section) ?? [])
    .map((b) => (f.owner === 'proyecto' ? `- ${b}` : `- **${f.owner}:** ${b}`)));
  if (bullets.length) block.push(`### ${section}`, ...bullets, '');
}
block.push('---', '');

// Se inserta después de [Unreleased] si existe; si no, antes de la primera versión.
let at = lines.findIndex((l) => /^## \[/.test(l));
if (at !== -1 && /^## \[Unreleased\]/i.test(lines[at])) {
  const next = lines.findIndex((l, i) => i > at && /^## \[/.test(l));
  at = next === -1 ? lines.length : next;
}
if (at === -1) at = lines.length;

const included = modules.filter((m) => m.state?.estado === 'COMPLETADO' && m.state.incluido_en_release == null);
const withoutFragment = included.filter((m) => !fragments.some((f) => f.owner === m.id));

console.log(`📝 Versión ${version}: ${fragments.length} fragmento(s), ${included.length} módulo(s) incluido(s).\n`);
console.log(block.join('\n'));
for (const m of withoutFragment) console.warn(`⚠️  ${m.id} superó G4 pero no dejó fragmento en changelog.d/.`);

if (dryRun) {
  console.log('\n(--dry-run) No se modificó ningún archivo.');
  process.exit(0);
}

fs.writeFileSync(CHANGELOG, [...lines.slice(0, at), ...block, ...lines.slice(at)].join(nl));
for (const m of included) {
  const state = { ...m.state, incluido_en_release: `v${version}` };
  fs.writeFileSync(m.file, `${JSON.stringify(state, null, 2)}\n`);
}
for (const f of fragments) fs.unlinkSync(f.file);
syncPackageVersion({ version });
// La pista de proyecto refleja la versión del release preparado.
const statePath = path.join(rootDir, '.workflow', 'current_state.json');
if (fs.existsSync(statePath)) {
  const rawState = fs.readFileSync(statePath, 'utf-8');
  const projectState = JSON.parse(rawState);
  projectState.version_actual = `v${version}`;
  if ('fecha_actualizacion' in projectState) projectState.fecha_actualizacion = today;
  const outState = `${JSON.stringify(projectState, null, 2)}\n`;
  fs.writeFileSync(statePath, rawState.includes('\r\n') ? outState.replace(/\n/g, '\r\n') : outState);
}
console.log(`\n✅ CHANGELOG.md actualizado, ${fragments.length} fragmento(s) consumido(s) y ${included.length} módulo(s) marcados con v${version}; package.json, package-lock.json y version_actual en ${version}.`);
