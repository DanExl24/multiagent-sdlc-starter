#!/usr/bin/env node
/**
 * Valida las pistas de trabajo contra las tablas de .workflow/STAGE_GATES.md:
 *   - .workflow/project.json        (capas activas, rutas y perfil del proyecto)
 *   - .workflow/profiles/           (escalas y modificadores: tipo efectivo de cada compuerta)
 *   - .workflow/current_state.json  (proyecto y release)
 *   - .workflow/modules/*.json      (un archivo por módulo)
 *   - .workflow/EXECUTION_MODES.md  (tabla de paquetes de trabajo del modo orquestado)
 * Los datos (fases, gates, tipos, niveles, capas, estados) se leen de STAGE_GATES.md en cada ejecución.
 */
import { loadStageGates } from './lib/stage-gates.mjs';
import { loadProjectConfig } from './lib/project-config.mjs';
import { loadProfiles } from './lib/profiles.mjs';
import { loadProjectState, loadModuleStates, validateWorkflow } from './lib/workflow-state.mjs';
import { EXECUTION_MODES_PATH, loadWorkPackages } from './lib/work-packages.mjs';
import fs from 'node:fs';

let table;
let project;
try {
  table = loadStageGates();
} catch (err) {
  console.error(`❌ No se pudo leer el mapa de compuertas de .workflow/STAGE_GATES.md: ${err.message}`);
  process.exit(1);
}
try {
  project = loadProjectState();
} catch (err) {
  console.error(`❌ No se pudo leer .workflow/current_state.json: ${err.message}`);
  process.exit(1);
}

const { config, exists, errors: configErrors } = loadProjectConfig();
const modules = loadModuleStates();
const profiles = loadProfiles(table);
const { errors, warnings } = validateWorkflow(table, project, modules, config, profiles);
errors.unshift(...configErrors);
if (fs.existsSync(EXECUTION_MODES_PATH)) {
  try { loadWorkPackages(table); } catch (err) { errors.push(`EXECUTION_MODES.md: ${err.message}`); }
} else if (config.ejecucion.modo === 'orquestado') errors.push('El modo orquestado necesita .workflow/EXECUTION_MODES.md (tabla de paquetes de trabajo).');
if (!exists) warnings.unshift('.workflow/project.json no existe: se usan las rutas por defecto (backend/ y frontend/).');

if (warnings.length > 0) {
  console.warn('⚠️  Avisos:');
  for (const w of warnings) console.warn(`   - ${w}`);
}
if (errors.length > 0) {
  console.error('❌ Estado del flujo inválido frente a .workflow/STAGE_GATES.md:');
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}
console.log(`✅ State Machine válida. Perfil: ${[config.perfil.escala, ...config.perfil.modificadores].join(' + ')} | Proyecto: ${project.gate_activo} (${project.estado}) | Módulos: ${modules.length}`);
