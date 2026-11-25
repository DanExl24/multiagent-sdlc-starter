/**
 * Pruebas de comportamiento de `npm run gate` y `npm run validate:state` (npm run test:tooling).
 *
 * Cada prueba arma un repositorio temporal mínimo (tooling + STAGE_GATES + perfiles, con Git) y ejecuta
 * los comandos reales. Cubren las transiciones que deben bloquearse aunque el JSON sea estructuralmente válido.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadStageGates } from '../lib/stage-gates.mjs';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const table = loadStageGates();
const gate = (id) => table.gates.find((g) => g.id === id);
const MOD = '01_demo';
const roots = [];
after(() => { for (const r of roots) fs.rmSync(r, { recursive: true, force: true }); });

function write(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
}

const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function moduleState(gateId, estado = 'EN_PROCESO') {
  const g = gate(gateId);
  return {
    modulo: MOD, nombre: 'Demo', responsable: 'test', rama: 'feature/01-demo', depende_de: [], modificadores: [],
    fase_activa: g.fase, gate_activo: g.gate, estado, rol_en_turno: g.rol, incluido_en_release: null,
    bloqueos: [], historial_transiciones: [],
  };
}

/** Índice del módulo con la tabla "Pruebas del módulo": una fila por uso; la fila de plantilla (con corchetes) se ignora. */
function readmeConPruebas(usos, ruta = `backend/src/modules/${MOD}/*.ts`) {
  const filas = usos.map((u) => `| Suite ${u} | \`${ruta}\` | \`${u}\` | G3A |`);
  return ['# Demo', '', '### Pruebas del módulo', '', '| Tipo | Ruta | Herramienta | Compuerta |', '| :--- | :--- | :--- | :--- |',
    '| [Ejemplo] | `[ruta real]` | `backend` | G3A |', ...filas, '', '## Historial', ''].join('\n');
}

/** Repositorio temporal: línea base cerrada, solo backend activo y el módulo 01_demo en la compuerta indicada. */
function fixture({ moduleGate = 'G3A', moduleEstado = 'EN_PROCESO', moduleHistorial = [], verificaciones = {}, escala = 'standard', projectGate = 'G5', extraProfiles = {}, frontend = false, ejecucion = undefined, herramientas = undefined, moduleReadme = undefined } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdlc-gate-'));
  roots.push(root);
  fs.cpSync(path.join(STARTER, 'tooling'), path.join(root, 'tooling'), { recursive: true, filter: (src) => !src.includes(`${path.sep}tests`) });
  fs.cpSync(path.join(STARTER, '.workflow', 'profiles'), path.join(root, '.workflow', 'profiles'), { recursive: true });
  fs.copyFileSync(path.join(STARTER, '.workflow', 'STAGE_GATES.md'), path.join(root, '.workflow', 'STAGE_GATES.md'));
  fs.copyFileSync(path.join(STARTER, '.workflow', 'EXECUTION_MODES.md'), path.join(root, '.workflow', 'EXECUTION_MODES.md'));
  for (const rol of ['03_backend_engineer', '04_frontend_engineer', '05_qa_security_tester']) fs.cpSync(path.join(STARTER, 'multiAgents', rol, 'subroles'), path.join(root, 'multiAgents', rol, 'subroles'), { recursive: true });
  write(root, '.gitignore', '.workflow/encargos/\n');
  write(root, 'package.json', { name: 'fixture', version: '0.1.0', type: 'module' });
  write(root, '.workflow/project.json', {
    capas: {
      backend: { activa: true, raiz: 'backend', modulos: 'backend/src/modules' },
      frontend: { activa: frontend, raiz: 'frontend', modulos: 'frontend/src/modules' },
    },
    rutas: { contratos: 'docs/contracts' },
    perfil: { escala, modificadores: [], adr: escala === 'standard' ? null : 'docs/adrs/ADR-000.md', confirmado: true },
    fundacion: { estado: 'COMPLETADA', stack: { backend: ['node'] }, adr_stack: 'docs/adrs/ADR-001.md', adr_estructura: 'docs/adrs/ADR-002.md' },
    verificaciones,
    ...(herramientas ? { herramientas } : {}),
    ...(ejecucion ? { ejecucion } : {}),
  });
  for (const [name, data] of Object.entries(extraProfiles)) write(root, `.workflow/profiles/${name}.json`, data);
  const pg = gate(projectGate);
  write(root, '.workflow/current_state.json', {
    proyecto: 'Fixture', dominio: 'Pruebas', version_actual: 'v0.1.0',
    fase_activa: pg.fase, gate_activo: pg.gate, estado: 'EN_PROCESO', rol_en_turno: pg.rol, bloqueos: [], historial_transiciones: [],
  });
  write(root, `.workflow/modules/${MOD}.json`, { ...moduleState(moduleGate, moduleEstado), historial_transiciones: moduleHistorial });
  for (const f of ['docs/adrs/ADR-000.md', 'docs/adrs/ADR-001.md', 'docs/adrs/ADR-002.md', `backend/src/modules/${MOD}/index.ts`]) write(root, f, '# fixture\n');
  write(root, `docs/modules/${MOD}/README.md`, moduleReadme ?? readmeConPruebas(['backend', 'datos', 'frontend', 'qa_api', 'qa_e2e', 'qa_carga', 'qa_seguridad']));
  write(root, `docs/contracts/${MOD}.contract.ts`, "import { z } from 'zod';\nexport const DemoSchema = z.object({ estado: z.enum(['A', 'B']) });\n");
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'test');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'core.autocrlf', 'false');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'fixture');
  return root;
}

const run = (root, ...args) => spawnSync(process.execPath, ['tooling/gate.mjs', MOD, ...args], { cwd: root, encoding: 'utf-8' });
const state = (root) => JSON.parse(fs.readFileSync(path.join(root, '.workflow', 'modules', `${MOD}.json`), 'utf-8'));
const commitAll = (root, msg) => { git(root, 'add', '-A'); git(root, 'commit', '-q', '-m', msg); };

test('G1 usa las rutas canónicas de Buzón y conserva los demás requisitos', () => {
  const root = fixture({ moduleGate: 'G1' });
  const oldState = state(root);
  fs.unlinkSync(path.join(root, '.workflow', 'modules', `${MOD}.json`));
  write(root, '.workflow/modules/buzon.json', { ...oldState, modulo: 'buzon' });
  write(root, 'docs/modules/buzon/historias_usuario.md', '# Historias existentes\n');
  write(root, 'docs/modules/buzon/reglas_negocio.md', '# Reglas existentes\n');
  write(root, 'docs/modules/buzon/01_SPEC_FUNCIONAL.md', '# Nombre anterior\n');
  const configFile = '.workflow/project.json';
  const config = JSON.parse(fs.readFileSync(path.join(root, configFile), 'utf8'));
  const validate = () => spawnSync(process.execPath, ['tooling/validate-state.mjs'], { cwd: root, encoding: 'utf8' });
  assert.notEqual(validate().status, 0, 'un ID sin declarar debe rechazarse');
  const routes = {
    spec_funcional: ['docs/modules/buzon/reglas_negocio.md', 'docs/product/especificacion/incremento.md'],
    historias_bdd: ['docs/modules/buzon/historias_usuario.md'],
    codigo: { backend: ['echo'] },
  };
  write(root, configFile, { ...config, modulos_existentes: { buzon: { ...routes, historias_bdd: ['docs/../fuera.md'] } } });
  assert.match(validate().stderr, /modulos_existentes\.buzon\.historias_bdd/);
  write(root, configFile, { ...config, modulos_existentes: { buzon: { ...routes, codigo: { backend: ['../echo'] } } } });
  assert.match(validate().stderr, /modulos_existentes\.buzon\.codigo\.backend/);
  write(root, 'backend/src/modules/echo/index.ts', '// Alias del módulo existente\n');
  write(root, configFile, { ...config, modulos_existentes: { buzon: routes } });
  const validation = validate();
  assert.equal(validation.status, 0, validation.stderr);
  assert.doesNotMatch(validation.stderr, /backend\/src\/modules\/echo:/);
  assert.match(validation.stderr, /backend\/src\/modules\/01_demo:/);
  const status = spawnSync(process.execPath, ['tooling/status.mjs', 'buzon'], { cwd: root, encoding: 'utf8' });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /historias_usuario\.md \(presente\)/);
  assert.match(status.stdout, /incremento\.md \(falta\)/);
  assert.match(status.stdout, /03_FLUJO_Y_ESTADOS\.md \(falta\)/);
  assert.doesNotMatch(status.stdout, /01_SPEC_FUNCIONAL\.md|02_HISTORIAS_USUARIO\.md/);
  commitAll(root, 'adopcion documental');
  const request = () => spawnSync(process.execPath, ['tooling/gate.mjs', 'buzon', 'solicitar'], { cwd: root, encoding: 'utf8' });
  const missing = request();
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /spec_funcional: docs\/product\/especificacion\/incremento\.md/);
  assert.match(missing.stderr, /flujo_estados: .*03_FLUJO_Y_ESTADOS\.md/);
  assert.doesNotMatch(missing.stderr, /historias_bdd/);
  write(root, 'docs/product/especificacion/incremento.md', '# Especificación del incremento\n');
  write(root, 'docs/modules/buzon/03_FLUJO_Y_ESTADOS.md', '# Flujo y estados\n');
  commitAll(root, 'entregables del ejercicio');
  const requested = request();
  assert.equal(requested.status, 0, requested.stderr);
  const after = JSON.parse(fs.readFileSync(path.join(root, '.workflow/modules/buzon.json'), 'utf8'));
  assert.equal(after.gate_activo, oldState.gate_activo);
  assert.equal(after.estado, 'ESPERANDO_APROBACION_HUMANA');
  assert.equal(after.historial_transiciones.at(-1).accion, 'solicitar');
  assert.ok(!fs.existsSync(path.join(root, 'docs/modules/buzon/02_HISTORIAS_USUARIO.md')));
});

test('G1 con atdd_spec configurado bloquea si falta, exige re-solicitar si cambia y respeta la línea base', () => {
  const root = fixture({ moduleGate: 'G1', projectGate: 'G1' });
  const oldState = state(root);
  fs.unlinkSync(path.join(root, '.workflow', 'modules', `${MOD}.json`));
  write(root, '.workflow/modules/buzon.json', { ...oldState, modulo: 'buzon' });
  write(root, 'docs/modules/buzon/reglas_negocio.md', '# Reglas\n');
  write(root, 'docs/modules/buzon/historias_usuario.md', '# Historias\n');
  write(root, 'docs/modules/buzon/flujo_estados.md', '# Flujo\n');
  write(root, 'backend/src/modules/echo/index.ts', '// Echo\n');

  const configFile = '.workflow/project.json';
  const config = JSON.parse(fs.readFileSync(path.join(root, configFile), 'utf8'));
  write(root, configFile, {
    ...config,
    modulos_existentes: {
      buzon: {
        spec_funcional: ['docs/modules/buzon/reglas_negocio.md'],
        historias_bdd: ['docs/modules/buzon/historias_usuario.md'],
        flujo_estados: ['docs/modules/buzon/flujo_estados.md'],
        atdd_spec: ['docs/modules/buzon/01_ATDD_SPEC.md'],
        codigo: { backend: ['echo'] },
      },
    },
  });
  commitAll(root, 'buzon con atdd_spec');

  const statusMissing = spawnSync(process.execPath, ['tooling/status.mjs', 'buzon'], { cwd: root, encoding: 'utf8' });
  assert.equal(statusMissing.status, 0, statusMissing.stderr);
  assert.match(statusMissing.stdout, /01_ATDD_SPEC\.md \(falta\)/);

  const runBuzon = (...args) => spawnSync(process.execPath, ['tooling/gate.mjs', 'buzon', ...args], { cwd: root, encoding: 'utf8' });
  const buzonState = () => JSON.parse(fs.readFileSync(path.join(root, '.workflow/modules/buzon.json'), 'utf8'));

  const missing = runBuzon('solicitar');
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /atdd_spec: docs\/modules\/buzon\/01_ATDD_SPEC\.md/);
  assert.equal(buzonState().estado, 'EN_PROCESO');
  assert.equal(buzonState().historial_transiciones.length, 0);

  write(root, 'docs/modules/buzon/01_ATDD_SPEC.md', '# ATDD inicial\n');
  commitAll(root, 'agregar atdd_spec');

  const statusPresent = spawnSync(process.execPath, ['tooling/status.mjs', 'buzon'], { cwd: root, encoding: 'utf8' });
  assert.equal(statusPresent.status, 0, statusPresent.stderr);
  assert.match(statusPresent.stdout, /01_ATDD_SPEC\.md \(presente\)/);

  const requested = runBuzon('solicitar');
  assert.equal(requested.status, 0, requested.stderr);
  assert.equal(buzonState().estado, 'ESPERANDO_APROBACION_HUMANA');

  write(root, 'docs/modules/buzon/01_ATDD_SPEC.md', '# ATDD editada\n');
  commitAll(root, 'editar atdd tras solicitar');

  const staleApprove = runBuzon('aprobar', '--cita', 'Apruebo G1 de buzon');
  assert.notEqual(staleApprove.status, 0);
  assert.match(staleApprove.stderr, /cambiaron después de solicitar la firma/);
  assert.match(staleApprove.stderr, /01_ATDD_SPEC\.md/);

  const reRequested = runBuzon('solicitar');
  assert.equal(reRequested.status, 0, reRequested.stderr);

  const noQuote = runBuzon('aprobar');
  assert.notEqual(noQuote.status, 0);
  assert.match(noQuote.stderr, /exige las palabras exactas.*--cita/);

  const beforeProject = runBuzon('aprobar', '--cita', 'Apruebo G1 de buzon');
  assert.notEqual(beforeProject.status, 0);
  assert.match(beforeProject.stderr, /la línea base del proyecto aún no/);
  assert.equal(buzonState().gate_activo, oldState.gate_activo);

  write(root, 'docs/project/prd.md', '# PRD\n');
  write(root, 'docs/project/glossary.md', '# Glosario\n');
  commitAll(root, 'linea base G1');
  const reqProject = spawnSync(process.execPath, ['tooling/gate.mjs', 'proyecto', 'solicitar'], { cwd: root, encoding: 'utf8' });
  assert.equal(reqProject.status, 0, reqProject.stderr);
  const appProject = spawnSync(process.execPath, ['tooling/gate.mjs', 'proyecto', 'aprobar', '--cita', 'Apruebo G1 proyecto'], { cwd: root, encoding: 'utf8' });
  assert.equal(appProject.status, 0, appProject.stderr);

  const reRequested2 = runBuzon('solicitar');
  assert.equal(reRequested2.status, 0, reRequested2.stderr);
  const approved = runBuzon('aprobar', '--cita', 'Apruebo G1 de buzon');
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal(buzonState().gate_activo, gate('G2').gate);
  assert.equal(buzonState().estado, 'EN_PROCESO');
});

function qaReport({ s2 = 0 } = {}) {
  return `# QA\n\n## 0. Revisión\n\n| Indicador | Valor |\n| :--- | ---: |\n| Defectos S1 abiertos | 0 |\n| Defectos S2 abiertos | ${s2} |\n| Requisitos aprobados no cumplidos | 0 |\n| Pruebas omitidas sin evidencia | 0 |\n\n### 0.1. Requisitos aprobados no cumplidos\nNinguno\n\n### 0.2. Limitaciones de entorno\nNinguna\n`;
}

function g4Fixture({ s2 = 0, report, ...opts } = {}) {
  const root = fixture({ moduleGate: 'G4', ...opts });
  write(root, `docs/qa/${MOD}/v0.1.0/QA_REPORT.md`, report ?? qaReport({ s2 }));
  write(root, `changelog.d/${MOD}.md`, '### Added\n- Demo.\n');
  commitAll(root, 'entregables G4');
  return root;
}

test('avanzar G3A sin verificaciones configuradas se rechaza', () => {
  const root = fixture();
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /exige verificaciones ejecutables/);
  assert.equal(state(root).gate_activo, gate('G3A').gate);
});

test('avanzar G3A con una verificación que falla se rechaza y el estado no cambia', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"', 'node -e "console.error(\'2 tests fallidos\'); process.exit(1)"'] } });
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /falló/);
  assert.match(r.stderr, /2 tests fallidos/);
  assert.equal(state(root).gate_activo, gate('G3A').gate);
});

test('avanzar G3A con verificaciones en verde pasa, deja la evidencia en el historial e imprime el prompt de continuación', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] } });
  const r = run(root, 'avanzar');
  assert.equal(r.status, 0, r.stderr);
  const s = state(root);
  assert.equal(s.gate_activo, gate('G4').gate);
  assert.equal(s.historial_transiciones.at(-1).verificaciones[0].resultado, 'PASS');
  assert.match(r.stdout, new RegExp(`📋 Prompt para seguir en una conversación nueva[^\\n]*\\n\\s+Lee AGENTS\\.md y aterriza en el módulo ${MOD}: G4 .*rol 05_qa_security_tester`));
});

test('avanzar se niega con entregables sin commit', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] } });
  write(root, `backend/src/modules/${MOD}/service.ts`, 'export const x = 1;\n');
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /cambios sin commit/);
  assert.equal(state(root).gate_activo, gate('G3A').gate);
});

test('ninguna transición se aplica si el proyecto no pasó por init:project (G0)', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] } });
  const p = path.join(root, '.workflow', 'current_state.json');
  write(root, '.workflow/current_state.json', { ...JSON.parse(fs.readFileSync(p, 'utf-8')), proyecto: '{{PROJECT_NAME}}' });
  commitAll(root, 'sin inicializar');
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /init:project/);
  assert.equal(run(root, 'estado').status, 0);
});

test('solicitar imprime el prompt para registrar la firma en una conversación nueva', () => {
  const root = g4Fixture();
  const r = run(root, 'solicitar');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Alto obligatorio/);
  assert.match(r.stdout, new RegExp(`apruebo G4 del módulo ${MOD}.*npm run gate -- ${MOD} aprobar --cita`));
});

test('solicitar G4 sin los entregables con ruta fija se rechaza', () => {
  const root = fixture({ moduleGate: 'G4' });
  write(root, `docs/qa/${MOD}/v0.1.0/QA_REPORT.md`, qaReport());
  commitAll(root, 'solo el reporte');
  const r = run(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /changelog_fragmento/);
});

test('solicitar G4 con un S2 declarado en el resumen verificable se rechaza (veto)', () => {
  const root = g4Fixture({ s2: 1 });
  const r = run(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Defectos S2 abiertos: 1/);
  assert.equal(state(root).estado, 'EN_PROCESO');
});

test('aprobar se niega si los entregables cambiaron tras solicitar; tras volver a solicitar, aprueba', () => {
  const root = g4Fixture();
  assert.equal(run(root, 'solicitar').status, 0);
  write(root, `docs/qa/${MOD}/v0.1.0/QA_REPORT.md`, `${qaReport()}\nCorrección durante la revisión.\n`);
  commitAll(root, 'cambio durante la revisión');
  const rechazo = run(root, 'aprobar', '--cita', 'apruebo');
  assert.notEqual(rechazo.status, 0);
  assert.match(rechazo.stderr, /cambiaron después de solicitar/);
  assert.equal(run(root, 'solicitar').status, 0);
  const ok = run(root, 'aprobar', '--cita', 'apruebo G4');
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(state(root).estado, 'COMPLETADO');
});

test('si el commit de la transición falla, la transición se deshace', () => {
  const root = g4Fixture();
  write(root, '.git/hooks/pre-commit', '#!/bin/sh\nexit 1\n');
  fs.chmodSync(path.join(root, '.git', 'hooks', 'pre-commit'), 0o755);
  const r = run(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /se deshizo/);
  assert.equal(state(root).estado, 'EN_PROCESO');
  assert.equal(git(root, 'status', '--porcelain'), '');
});

test('validate:state rechaza verificaciones de una compuerta inexistente', () => {
  const root = fixture({ verificaciones: { G9: ['npm test'] } });
  const r = spawnSync(process.execPath, ['tooling/validate-state.mjs'], { cwd: root, encoding: 'utf-8' });
  assert.notEqual(r.status, 0);
  assert.match(`${r.stdout}${r.stderr}`, /verificaciones\.G9/);
});

// ── Perfil spike: sin producción, G4 como Checkpoint con verificaciones obligatorias ──

const runProject = (root, ...args) => spawnSync(process.execPath, ['tooling/gate.mjs', 'proyecto', ...args], { cwd: root, encoding: 'utf-8' });
const projectState = (root) => JSON.parse(fs.readFileSync(path.join(root, '.workflow', 'current_state.json'), 'utf-8'));

test('spike: G4 no avanza sin verificaciones que sustituyan la firma', () => {
  const root = g4Fixture({ escala: 'spike' });
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /pasa sin firma humana/);
  assert.equal(state(root).estado, 'EN_PROCESO');
});

test('spike: G4 no se cierra con avanzar si el QA_REPORT no trae la sección 0', () => {
  const root = g4Fixture({ escala: 'spike', verificaciones: { G4: ['node -e "process.exit(0)"'] }, report: '# QA\n\n## 1. Resumen\nTodo en verde.\n' });
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /no está listo para cerrar G4/);
  assert.match(r.stderr, /Defectos S1 abiertos/);
  assert.equal(state(root).estado, 'EN_PROCESO');
});

test('spike: G4 con verificaciones en verde cierra el módulo sin firma', () => {
  const root = g4Fixture({ escala: 'spike', verificaciones: { G4: ['node -e "process.exit(0)"'] } });
  const r = run(root, 'avanzar');
  assert.equal(r.status, 0, r.stderr);
  const s = state(root);
  assert.equal(s.estado, 'COMPLETADO');
  assert.equal(s.historial_transiciones.at(-1).accion, 'avanzar');
});

test('spike: la pista de proyecto no abre un release', () => {
  const root = fixture({ escala: 'spike' });
  const r = runProject(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /no llega a producción/);
  assert.equal(projectState(root).estado, 'EN_PROCESO');
});

test('promoción: un módulo cerrado sin firma de G4 bloquea el release hasta reabrirlo desde G4', () => {
  const historial = [{ de: gate('G4').fase, a: gate('G4').fase, fecha: '2026-11-14', autor: 'test', accion: 'avanzar', motivo: 'spike' }];
  const root = fixture({ escala: 'sprint', moduleGate: 'G4', moduleEstado: 'COMPLETADO', moduleHistorial: historial });
  const r = runProject(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /sin la firma de G4/);
  assert.equal(run(root, 'reabrir', '--desde', 'G4', '--motivo', 'promoción del spike', '--cita', 'promuevo').status, 0);
  assert.equal(state(root).estado, 'EN_PROCESO');
});

test('una escala que llega a producción no puede volver G4 Checkpoint', () => {
  const root = fixture({ extraProfiles: { rapido: { escala: 'rapido', descripcion: 'x', tipos: { G4: 'checkpoint' }, entregables: {} } } });
  const r = spawnSync(process.execPath, ['tooling/validate-state.mjs'], { cwd: root, encoding: 'utf-8' });
  assert.notEqual(r.status, 0);
  assert.match(`${r.stdout}${r.stderr}`, /rapido\.json: G4 debe ser Halt/);
});

test('sprint: G6 como Checkpoint avanza al siguiente release', () => {
  const root = fixture({ escala: 'sprint', projectGate: 'G6' });
  const r = runProject(root, 'avanzar');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(projectState(root).gate_activo, gate('G5').gate);
});

// ── Modo orquestado: encargos como memoria temporal de los subagentes ──

const planAgentes = (root, ...args) => spawnSync(process.execPath, ['tooling/plan-agentes.mjs', ...args], { cwd: root, encoding: 'utf-8' });
const encargos = (root) => {
  const dir = path.join(root, '.workflow', 'encargos');
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
};

test('modo secuencial: plan:agentes no recomienda subagentes', () => {
  const root = fixture({ frontend: true });
  const r = planAgentes(root, MOD);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /no se lanzan subagentes/);
  assert.deepEqual(encargos(root), []);
});

test('modo orquestado: en G3A genera encargos de backend, frontend y preparación de QA con su contrato e insumos', () => {
  const root = fixture({ frontend: true, ejecucion: { modo: 'orquestado', max_subagentes: 3 }, verificaciones: { G3A: ['npm test --prefix backend'] } });
  const r = planAgentes(root, MOD);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(encargos(root), [`${MOD}-backend.md`, `${MOD}-frontend.md`, `${MOD}-qa_preparacion.md`]);
  const qa = fs.readFileSync(path.join(root, '.workflow', 'encargos', `${MOD}-qa_preparacion.md`), 'utf-8');
  assert.match(qa, /sin leer su implementación/);
  assert.match(qa, /02_HISTORIAS_USUARIO\.md/);
  assert.match(qa, /nunca código de producción/);
  const backend = fs.readFileSync(path.join(root, '.workflow', 'encargos', `${MOD}-backend.md`), 'utf-8');
  assert.match(backend, /Sigue \*\*solo\*\* este encargo/);
  assert.match(backend, /\| \*\*Responsabilidad\*\* \|/);
  assert.match(backend, new RegExp(`docs/contracts/${MOD}\\.contract\\.ts\``));
  assert.match(backend, /01_SPEC_FUNCIONAL\.md` \(⚠️ no existe/);
  assert.match(backend, /npm test --prefix backend/);
  assert.doesNotMatch(backend, /## 1\. ¿Qué es este Subrol\?/);
});

test('modo orquestado: respeta max_subagentes', () => {
  const root = fixture({ frontend: true, ejecucion: { modo: 'orquestado', max_subagentes: 1 } });
  const r = planAgentes(root, MOD);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(encargos(root).length, 1);
  assert.match(r.stdout, /En espera/);
});

test('gate borra los encargos del módulo al cerrar su compuerta y registra marca y modo', () => {
  const root = fixture({ ejecucion: { modo: 'orquestado', max_subagentes: 3 }, verificaciones: { G3A: ['node -e "process.exit(0)"'] } });
  assert.equal(planAgentes(root, MOD).status, 0);
  write(root, '.workflow/encargos/02_otro-backend.md', '# de otro módulo\n');
  assert.deepEqual(encargos(root), ['01_demo-backend.md', '01_demo-qa_preparacion.md', '02_otro-backend.md']);
  const r = run(root, 'avanzar');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(encargos(root), ['02_otro-backend.md']);
  assert.match(r.stdout, new RegExp(`Eres el orquestador: ejecuta npm run plan:agentes -- ${MOD}`));
  const ultima = state(root).historial_transiciones.at(-1);
  assert.equal(ultima.modo, 'orquestado');
  assert.match(ultima.marca, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
});

test('validate:state rechaza un modo de ejecución desconocido', () => {
  const root = fixture({ ejecucion: { modo: 'paralelo', max_subagentes: 3 } });
  const r = spawnSync(process.execPath, ['tooling/validate-state.mjs'], { cwd: root, encoding: 'utf-8' });
  assert.notEqual(r.status, 0);
  assert.match(`${r.stdout}${r.stderr}`, /ejecucion\.modo/);
});

// ── Herramientas del stack: declaradas por la fundación, comprobadas en G2 y con npm run doctor ──

const tool = (nombre, uso, comprobar = 'node --version') => ({ nombre, uso, comprobar, instalar: `instala ${nombre}` });
const STACK_BACKEND = [tool('Node.js', 'backend'), tool('PostgreSQL', 'datos'), tool('Bruno CLI', 'qa_api'), tool('k6', 'qa_carga')];

function g2Fixture(opts = {}) {
  const root = fixture({ moduleGate: 'G2', ...opts });
  write(root, `docs/modules/${MOD}/04_ARQUITECTURA_Y_CODIGO.md`, '# DDL\n');
  commitAll(root, 'entregables G2');
  return root;
}
const doctor = (root, ...args) => spawnSync(process.execPath, ['tooling/doctor.mjs', ...args], { cwd: root, encoding: 'utf-8' });

test('G2 se niega si el stack no declara herramienta para un uso que exige el plan', () => {
  const root = g2Fixture({ herramientas: STACK_BACKEND.filter((h) => h.uso !== 'qa_carga') });
  const r = run(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Sin herramienta para "qa_carga" \(la exige carga_k6\)/);
  assert.equal(state(root).estado, 'EN_PROCESO');
});

test('G2 se niega si una herramienta declarada no está instalada y dice cómo instalarla', () => {
  const root = g2Fixture({ herramientas: [...STACK_BACKEND.filter((h) => h.uso !== 'qa_carga'), tool('k6', 'qa_carga', 'node -e "process.exit(1)"')] });
  const r = run(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /❌ k6 \(qa_carga\)/);
  assert.match(r.stdout, /Instalar: instala k6/);
  assert.match(r.stderr, /Faltan herramientas del stack en este entorno: k6/);
});

test('G2 con el stack completo e instalado pide la firma y deja la comprobación en el historial', () => {
  const root = g2Fixture({ herramientas: STACK_BACKEND });
  const r = run(root, 'solicitar');
  assert.equal(r.status, 0, r.stderr);
  const ultima = state(root).historial_transiciones.at(-1);
  assert.equal(ultima.verificaciones.length, STACK_BACKEND.length);
  assert.ok(ultima.verificaciones.every((v) => v.resultado === 'PASS'));
});

test('doctor: en spike el plan no exige pruebas de API ni de carga', () => {
  const root = fixture({ escala: 'spike', herramientas: [tool('Node.js', 'backend'), tool('PostgreSQL', 'datos')] });
  const r = doctor(root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /qa_carga|qa_api/);
  const std = doctor(fixture({ herramientas: [tool('Node.js', 'backend')] }));
  assert.notEqual(std.status, 0);
  assert.match(std.stdout, /Sin herramienta para "qa_carga"/);
});

test('validate:state rechaza una herramienta con un uso desconocido', () => {
  const root = fixture({ herramientas: [tool('Postman', 'qa_postman')] });
  const r = spawnSync(process.execPath, ['tooling/validate-state.mjs'], { cwd: root, encoding: 'utf-8' });
  assert.notEqual(r.status, 0);
  assert.match(`${r.stdout}${r.stderr}`, /herramientas\[0\] \(Postman\): "uso" debe ser uno de/);
});

test('modo orquestado: el encargo de QA lista las herramientas de QA del stack, no las de otros roles', () => {
  const root = fixture({ ejecucion: { modo: 'orquestado', max_subagentes: 3 }, herramientas: STACK_BACKEND });
  assert.equal(planAgentes(root, MOD).status, 0);
  const qa = fs.readFileSync(path.join(root, '.workflow', 'encargos', `${MOD}-qa_preparacion.md`), 'utf-8');
  assert.match(qa, /\*\*k6\*\* \(qa_carga\)/);
  assert.match(qa, /\*\*Bruno CLI\*\* \(qa_api\)/);
  assert.doesNotMatch(qa, /PostgreSQL/);
  const backend = fs.readFileSync(path.join(root, '.workflow', 'encargos', `${MOD}-backend.md`), 'utf-8');
  assert.match(backend, /\*\*PostgreSQL\*\* \(datos\)/);
});

// ── Pruebas registradas en el índice del módulo ──

test('G3A se niega si el índice del módulo no registra una prueba de un uso exigido', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] }, moduleReadme: readmeConPruebas(['backend']) });
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Falta una fila de uso "datos" \(la exige integracion_persistencia_backend\)/);
  assert.equal(state(root).gate_activo, gate('G3A').gate);
});

test('G3A se niega si una ruta registrada no existe, y la fila de plantilla no cuenta', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] }, moduleReadme: readmeConPruebas(['backend', 'datos'], 'backend/tests/integration/no_existe.test.ts') });
  const r = run(root, 'avanzar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /La ruta "backend\/tests\/integration\/no_existe\.test\.ts" \(Suite backend\) no existe/);
  const sinTabla = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] }, moduleReadme: '# Demo\n' });
  assert.match(run(sinTabla, 'avanzar').stderr, /No existe la tabla "Pruebas del módulo"/);
});

// ── Modo de ejecución: lo elige el Director Humano en la línea base de G2 ──

function baselineG2Fixture(ejecucion) {
  const root = fixture({ projectGate: 'G2', moduleGate: 'G1', herramientas: STACK_BACKEND, ejecucion });
  write(root, 'docs/project/architecture.md', '# C4\n');
  write(root, 'docs/project/repo-structure.md', '# Estructura\n');
  commitAll(root, 'línea base G2');
  return root;
}

test('la línea base de G2 no se solicita sin que el Director Humano haya elegido el modo de ejecución', () => {
  const root = baselineG2Fixture({ modo: 'secuencial', max_subagentes: 3, confirmado: false });
  const r = runProject(root, 'solicitar');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /elige el modo de ejecución/);
  assert.match(r.stderr, /puede lanzar subagentes/);
  assert.equal(projectState(root).estado, 'EN_PROCESO');
});

test('con el modo confirmado, la línea base de G2 se solicita', () => {
  const root = baselineG2Fixture({ modo: 'orquestado', max_subagentes: 3, confirmado: true });
  const r = runProject(root, 'solicitar');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(projectState(root).estado, 'ESPERANDO_APROBACION_HUMANA');
});
