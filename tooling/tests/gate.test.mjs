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

/** Repositorio temporal: línea base cerrada, solo backend activo y el módulo 01_demo en la compuerta indicada. */
function fixture({ moduleGate = 'G3A', verificaciones = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdlc-gate-'));
  roots.push(root);
  fs.cpSync(path.join(STARTER, 'tooling'), path.join(root, 'tooling'), { recursive: true, filter: (src) => !src.includes(`${path.sep}tests`) });
  fs.cpSync(path.join(STARTER, '.workflow', 'profiles'), path.join(root, '.workflow', 'profiles'), { recursive: true });
  fs.copyFileSync(path.join(STARTER, '.workflow', 'STAGE_GATES.md'), path.join(root, '.workflow', 'STAGE_GATES.md'));
  write(root, 'package.json', { name: 'fixture', version: '0.1.0', type: 'module' });
  write(root, '.workflow/project.json', {
    capas: {
      backend: { activa: true, raiz: 'backend', modulos: 'backend/src/modules' },
      frontend: { activa: false, raiz: 'frontend', modulos: 'frontend/src/modules' },
    },
    rutas: { contratos: 'docs/contracts' },
    perfil: { escala: 'standard', modificadores: [], adr: null, confirmado: true },
    fundacion: { estado: 'COMPLETADA', stack: { backend: ['node'] }, adr_stack: 'docs/adrs/ADR-001.md', adr_estructura: 'docs/adrs/ADR-002.md' },
    verificaciones,
  });
  const g5 = gate('G5');
  write(root, '.workflow/current_state.json', {
    proyecto: 'Fixture', dominio: 'Pruebas', version_actual: 'v0.1.0',
    fase_activa: g5.fase, gate_activo: g5.gate, estado: 'EN_PROCESO', rol_en_turno: g5.rol, bloqueos: [], historial_transiciones: [],
  });
  write(root, `.workflow/modules/${MOD}.json`, moduleState(moduleGate));
  for (const f of ['docs/adrs/ADR-001.md', 'docs/adrs/ADR-002.md', `docs/modules/${MOD}/README.md`, `backend/src/modules/${MOD}/index.ts`]) write(root, f, '# fixture\n');
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

function qaReport({ s2 = 0 } = {}) {
  return `# QA\n\n## 0. Revisión\n\n| Indicador | Valor |\n| :--- | ---: |\n| Defectos S1 abiertos | 0 |\n| Defectos S2 abiertos | ${s2} |\n| Requisitos aprobados no cumplidos | 0 |\n| Pruebas omitidas sin evidencia | 0 |\n\n### 0.1. Requisitos aprobados no cumplidos\nNinguno\n\n### 0.2. Limitaciones de entorno\nNinguna\n`;
}

function g4Fixture({ s2 = 0 } = {}) {
  const root = fixture({ moduleGate: 'G4' });
  write(root, `docs/qa/${MOD}/v0.1.0/QA_REPORT.md`, qaReport({ s2 }));
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

test('avanzar G3A con verificaciones en verde pasa y deja la evidencia en el historial', () => {
  const root = fixture({ verificaciones: { G3A: ['node -e "process.exit(0)"'] } });
  const r = run(root, 'avanzar');
  assert.equal(r.status, 0, r.stderr);
  const s = state(root);
  assert.equal(s.gate_activo, gate('G4').gate);
  assert.equal(s.historial_transiciones.at(-1).verificaciones[0].resultado, 'PASS');
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
  write(root, `docs/modules/${MOD}/README.md`, '# cambiado durante la revisión\n');
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
