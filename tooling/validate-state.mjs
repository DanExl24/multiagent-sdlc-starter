#!/usr/bin/env node
/**
 * Valida las pistas de trabajo contra las tablas de .workflow/STAGE_GATES.md:
 *   - .workflow/project.json        (capas activas y rutas del proyecto)
 *   - .workflow/current_state.json  (proyecto y release)
 *   - .workflow/modules/*.json      (un archivo por módulo)
 * Los datos (fases, gates, tipos, niveles, capas, estados) se leen de STAGE_GATES.md en cada ejecución.
 */
import { loadStageGates } from './lib/stage-gates.mjs';
import { loadProjectConfig } from './lib/project-config.mjs';
import { loadProjectState, loadModuleStates, validateWorkflow } from './lib/workflow-state.mjs';

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
const { errors, warnings } = validateWorkflow(table, project, modules, config);
errors.unshift(...configErrors);
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
console.log(`✅ State Machine válida. Proyecto: ${project.gate_activo} (${project.estado}) | Módulos: ${modules.length}`);
