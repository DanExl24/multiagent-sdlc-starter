#!/usr/bin/env node
/**
 * Subagentes recomendados en modo orquestado (npm run plan:agentes -- [XX_nombre]).
 *
 * Mira la compuerta en curso de cada módulo EN_PROCESO, elige los paquetes de trabajo de
 * .workflow/EXECUTION_MODES.md §3 que aplican (respetando capas activas y max_subagentes) y escribe
 * un encargo por subagente en .workflow/encargos/. No lanza nada: el orquestador decide y lanza,
 * con la herramienta que use (Claude Code, Codex, Gemini...).
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadStageGates, rootDir } from './lib/stage-gates.mjs';
import { activeLayers, loadProjectConfig } from './lib/project-config.mjs';
import { loadProfiles, resolvePlan } from './lib/profiles.mjs';
import { gatesForTrack, loadModuleStates, moduleModifiers } from './lib/workflow-state.mjs';
import { ENCARGOS_DIR, encargoId, loadWorkPackages, renderEncargo } from './lib/work-packages.mjs';

const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };

const table = loadStageGates();
const { config, errors } = loadProjectConfig();
if (errors.length) fail(`.workflow/project.json inválido:\n   - ${errors.join('\n   - ')}`);
const { modo, max_subagentes: max } = config.ejecucion;
if (modo !== 'orquestado') {
  console.log(`ℹ️  Modo "${modo}": no se lanzan subagentes; cada subrol se aplica en el turno del agente (AGENTS.md §5.1).`);
  console.log('   Para usar subagentes, cambia ejecucion.modo a "orquestado" en .workflow/project.json (.workflow/EXECUTION_MODES.md).');
  process.exit(0);
}

const profiles = loadProfiles(table);
const modules = loadModuleStates();
const target = process.argv[2];
if (target && !modules.some((m) => m.id === target)) fail(`El módulo "${target}" no existe en .workflow/modules/.`);
const packages = loadWorkPackages(table);
const layers = activeLayers(config);
const today = new Date().toLocaleDateString('sv-SE');

const recomendados = [];
const omitidos = [];
for (const m of modules.filter((x) => x.state && (!target || x.id === target))) {
  if (m.state.estado !== 'EN_PROCESO') { omitidos.push(`${m.id} (${m.state.estado})`); continue; }
  const plan = resolvePlan(table, profiles, { escala: config.perfil.escala, modificadores: moduleModifiers(config, m.state), capas: layers });
  const current = gatesForTrack(table, 'modulo', config, plan.tipos).find((g) => g.gate === m.state.gate_activo);
  if (!current) continue;
  const aplicables = packages.filter((p) => p.compuertas.includes(current.id) && (!p.capa || layers.includes(p.capa)));
  if (!aplicables.length) omitidos.push(`${m.id} (${current.id}: trabajo del orquestador, sin paquetes paralelizables)`);
  for (const pkg of aplicables) recomendados.push({ modulo: m.id, gateId: current.id, pkg });
}

if (!recomendados.length) {
  console.log('ℹ️  No hay paquetes para subagentes ahora mismo.');
  if (omitidos.length) console.log(`   Módulos sin paquetes: ${omitidos.join(', ')}.`);
  process.exit(0);
}

const lanzar = recomendados.slice(0, max);
const pendientes = recomendados.slice(max);
fs.mkdirSync(ENCARGOS_DIR, { recursive: true });
console.log(`\n🧩 Subagentes recomendados (modo orquestado, máximo ${max} a la vez):\n`);
for (const { modulo, gateId, pkg } of lanzar) {
  const id = encargoId(modulo, pkg.id);
  const file = path.join(ENCARGOS_DIR, `${id}.md`);
  fs.writeFileSync(file, renderEncargo(pkg, { modulo, gateId, config, today }));
  const rel = path.relative(rootDir, file).split(path.sep).join('/');
  console.log(`   • ${id} · ${pkg.rol} · ${gateId}`);
  console.log(`     Prompt: "Lee ${rel} y cúmplelo exactamente. No leas nada fuera de lo que indica."`);
}
if (pendientes.length) console.log(`\n   En espera (por max_subagentes): ${pendientes.map((r) => encargoId(r.modulo, r.pkg.id)).join(', ')}. Vuelve a ejecutar el comando cuando terminen los primeros.`);
if (omitidos.length) console.log(`\n   Sin paquetes: ${omitidos.join(', ')}.`);
console.log('\n   Recuerda (EXECUTION_MODES.md §2): solo el orquestador ejecuta npm run gate; lee solo los *.resultado.md;');
console.log('   si un paquete ya se completó antes (por ejemplo, el frontend adelantado durante G3A), no lo relances.\n');
