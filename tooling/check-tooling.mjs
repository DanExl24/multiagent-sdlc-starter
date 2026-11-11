#!/usr/bin/env node
/**
 * Comprueba la sintaxis de todos los scripts de tooling/ (npm run check:tooling).
 * Así un error en una herramienta que npm test no ejecuta (status, new:module,
 * release:changelog, init:project...) se detecta antes del commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { rootDir } from './lib/stage-gates.mjs';

const toolingDir = path.join(rootDir, 'tooling');
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.mjs')) files.push(full);
  }
})(toolingDir);

const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf-8' });
  if (result.status !== 0) failures.push(`${path.relative(rootDir, file)}\n${result.stderr.trim()}`);
}

if (failures.length) {
  console.error('❌ Errores de sintaxis en tooling/:');
  for (const f of failures) console.error(`\n${f}`);
  process.exit(1);
}
console.log(`✅ Tooling sin errores de sintaxis (${files.length} scripts).`);
