import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { inspectVeltrix, VARIANT_PATH } from '../lib/veltrix-adoption.mjs';
import { rootDir } from '../lib/stage-gates.mjs';

const variant = JSON.parse(fs.readFileSync(VARIANT_PATH, 'utf-8'));
const temporaryRoots = [];

after(() => {
  const temporaryBase = path.resolve(os.tmpdir());
  for (const root of temporaryRoots) {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), temporaryBase);
    assert.ok(path.basename(resolved).startsWith('veltrix-adoption-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'veltrix-adoption-'));
  temporaryRoots.push(root);
  for (const relative of Object.values(variant.componentes)) fs.mkdirSync(path.join(root, relative), { recursive: true });
  for (const relative of Object.values(variant.modulo.artefactos_existentes)) {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '# Documento existente\nEstado: bloqueado por decisión pendiente.\n');
  }
  return root;
}

function snapshot(root) {
  const files = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      files[path.relative(root, file)] = entry.isDirectory() ? null : fs.readFileSync(file, 'utf-8');
      if (entry.isDirectory()) walk(file);
    }
  }
  walk(root);
  return files;
}

test('sin kit ni ficha, la inspección conserva las fuentes y usa la técnica propia sin aprobar la adopción', () => {
  const project = fixture();
  const before = snapshot(project);
  const report = inspectVeltrix(project);
  assert.equal(report.fuentes_obligatorias_presentes, true);
  assert.equal(report.skill.fuentes_disponibles, false);
  assert.equal(report.skill.tecnica_efectiva, variant.integracion_skill.tecnica_alternativa);
  assert.equal(report.ficha.existe, false);
  assert.equal(report.instalable, false);
  assert.deepEqual(snapshot(project), before);
});

test('el kit presente no se activa por disponibilidad y tampoco se modifica', () => {
  const project = fixture();
  const kit = fixture();
  for (const relative of [variant.integracion_skill.ruta_en_kit, ...variant.integracion_skill.estandares_en_kit]) {
    const file = path.join(kit, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '# Fuente de la técnica\n');
  }
  const before = snapshot(kit);
  const report = inspectVeltrix(project, kit);
  assert.equal(report.skill.fuentes_disponibles, true);
  assert.equal(report.skill.habilitada, false);
  assert.equal(report.skill.tecnica_efectiva, variant.integracion_skill.tecnica_alternativa);
  assert.equal(report.skill.revision_instalada, 'NO_COMPROBADA');
  assert.deepEqual(snapshot(kit), before);
});

test('una carpeta con el nombre de un documento no cuenta como artefacto y el CLI devuelve error', () => {
  const project = fixture();
  const relative = variant.modulo.artefactos_existentes.historias;
  const file = path.join(project, relative);
  fs.unlinkSync(file);
  fs.mkdirSync(file);
  const cli = spawnSync(process.execPath, [path.join(rootDir, 'tooling', 'inspect-veltrix.mjs'), '--project-root', project], { encoding: 'utf-8' });
  assert.equal(cli.status, 1, cli.stderr);
  const report = JSON.parse(cli.stdout);
  assert.equal(report.fuentes_obligatorias_presentes, false);
  assert.equal(report.artefactos.find((entry) => entry.nombre === 'historias').existe, false);
});

test('el CLI rechaza opciones desconocidas y una ruta de proyecto inexistente no se crea', () => {
  const project = fixture();
  const cliPath = path.join(rootDir, 'tooling', 'inspect-veltrix.mjs');
  const invalid = spawnSync(process.execPath, [cliPath, '--apply', project], { encoding: 'utf-8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Uso:/);
  const absent = path.join(project, 'ausente');
  const missing = spawnSync(process.execPath, [cliPath, '--project-root', absent], { encoding: 'utf-8' });
  assert.equal(missing.status, 1);
  assert.equal(fs.existsSync(absent), false);
});

test('la configuración propuesta usa el esquema actual sin inicializar ni confirmar el proyecto', () => {
  const project = fixture();
  const tooling = path.join(project, 'tooling', 'lib');
  fs.mkdirSync(tooling, { recursive: true });
  fs.mkdirSync(path.join(project, '.workflow'), { recursive: true });
  for (const name of ['stage-gates.mjs', 'project-config.mjs']) fs.copyFileSync(path.join(rootDir, 'tooling', 'lib', name), path.join(tooling, name));
  fs.copyFileSync(path.join(rootDir, 'variants', 'veltrix', 'project.example.json'), path.join(project, '.workflow', 'project.json'));
  const url = pathToFileURL(path.join(tooling, 'project-config.mjs')).href;
  const cli = spawnSync(process.execPath, ['--input-type=module', '-e', `const { loadProjectConfig } = await import(${JSON.stringify(url)}); process.stdout.write(JSON.stringify(loadProjectConfig()));`], { encoding: 'utf-8' });
  assert.equal(cli.status, 0, cli.stderr);
  const { config, errors } = JSON.parse(cli.stdout);
  assert.deepEqual(errors, []);
  assert.equal(config.capas.backend.raiz, 'hub');
  assert.equal(config.capas.frontend.raiz, 'web');
  assert.equal(config.perfil.confirmado, false);
  assert.equal(config.ejecucion.confirmado, false);
  assert.equal(config.fundacion.estado, 'PENDIENTE');
  assert.equal(fs.existsSync(path.join(project, '.workflow', 'current_state.json')), false);
});
