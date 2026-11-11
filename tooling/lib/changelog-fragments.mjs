/**
 * Fragmentos de changelog (changelog.d/): cada módulo o cambio transversal registra sus
 * cambios en su propio archivo, para que varias ramas no editen CHANGELOG.md a la vez.
 * En G5, `npm run release:changelog` los consolida en una versión (ver SEMVER_CHANGELOG_PROTOCOL.md).
 *
 * Nombre:  [XX_nombre](-descripcion).md  ó  proyecto(-descripcion).md
 * Formato: encabezados "### <Sección>" de Keep a Changelog seguidos de viñetas "- ...".
 */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './stage-gates.mjs';

export const FRAGMENTS_DIR = path.join(rootDir, 'changelog.d');
export const SECTIONS = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
const NAME_RE = /^(proyecto|\d{2}_[a-z0-9]+(?:_[a-z0-9]+)*)(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?\.md$/;
const IGNORED = new Set(['README.md']);

/** @returns {{sections: Map<string, string[]>, errors: string[]}} */
export function parseFragment(text) {
  const sections = new Map();
  const errors = [];
  let current = null;
  let lastBullet = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const n = i + 1;
    if (!line.trim()) { lastBullet = null; return; }
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      const name = heading[1].replace(/^\[|\]$/g, '');
      if (!SECTIONS.includes(name)) errors.push(`línea ${n}: sección "${heading[1]}" no válida. Usa: ${SECTIONS.join(', ')}.`);
      current = name;
      if (!sections.has(name)) sections.set(name, []);
      lastBullet = null;
      return;
    }
    if (/^- /.test(line)) {
      if (!current) { errors.push(`línea ${n}: viñeta fuera de una sección "### ...".`); return; }
      sections.get(current).push(line.slice(2).trim());
      lastBullet = sections.get(current).length - 1;
      return;
    }
    if (/^\s{2,}\S/.test(line) && lastBullet !== null) {
      const list = sections.get(current);
      list[lastBullet] = `${list[lastBullet]} ${line.trim()}`;
      return;
    }
    errors.push(`línea ${n}: solo se admiten encabezados "### Sección" y viñetas "- ...".`);
  });
  for (const [name, bullets] of sections) {
    if (bullets.length === 0) errors.push(`la sección "${name}" está vacía.`);
  }
  if (sections.size === 0 && errors.length === 0) errors.push('el fragmento no contiene cambios.');
  return { sections, errors };
}

/** @returns {Array<{name: string, file: string, owner: string|null, sections: Map<string, string[]>, errors: string[]}>} */
export function loadFragments() {
  if (!fs.existsSync(FRAGMENTS_DIR)) return [];
  return fs.readdirSync(FRAGMENTS_DIR)
    .filter((name) => name.endsWith('.md') && !IGNORED.has(name))
    .sort()
    .map((name) => {
      const file = path.join(FRAGMENTS_DIR, name);
      const match = name.match(NAME_RE);
      const { sections, errors } = parseFragment(fs.readFileSync(file, 'utf-8'));
      if (!match) errors.unshift('nombre no válido. Usa "[XX_nombre](-descripcion).md" o "proyecto(-descripcion).md".');
      return { name, file, owner: match ? match[1] : null, sections, errors };
    });
}
