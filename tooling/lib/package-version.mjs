/**
 * Mantiene alineados el nombre y la versión de package.json y package-lock.json.
 * Lo usan init-project (proyecto nuevo en 0.1.0) y release:changelog (versión del release).
 */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './stage-gates.mjs';

const PACKAGE = path.join(rootDir, 'package.json');
const LOCK = path.join(rootDir, 'package-lock.json');

function update(file, apply) {
  if (!fs.existsSync(file)) return false;
  const raw = fs.readFileSync(file, 'utf-8');
  const data = JSON.parse(raw);
  apply(data);
  const out = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(file, raw.includes('\r\n') ? out.replace(/\n/g, '\r\n') : out);
  return true;
}

/** Fija la versión (y opcionalmente el nombre) en package.json y en la raíz de package-lock.json. */
export function syncPackageVersion({ version, name = null }) {
  const set = (obj) => {
    if (!obj) return;
    if (name) obj.name = name;
    obj.version = version;
  };
  update(PACKAGE, (pkg) => set(pkg));
  update(LOCK, (lock) => {
    set(lock);
    set(lock.packages?.['']);
  });
}
