/**
 * Verificación previa de una compuerta (la ejecuta `npm run gate` antes de `avanzar` o `solicitar`):
 *   1. Entregables con ruta fija (columna Ruta del catálogo, STAGE_GATES.md §7) que deben existir.
 *   2. Comandos de `verificaciones` en .workflow/project.json, que deben terminar con código 0.
 *
 * El agente no declara que todo está en verde: lo comprueba la herramienta y deja la evidencia en el historial.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { rootDir } from './stage-gates.mjs';

const VERIFICATION_TIMEOUT_MS = 20 * 60 * 1000;

/** Sustituye {modulo} y {version} en un patrón de ruta o de comando. */
export function fillPlaceholders(text, { modulo = '', version = '' } = {}) {
  return text.replace(/\{modulo\}/g, modulo).replace(/\{version\}/g, version);
}

/** ¿Existe la ruta? Un segmento con `*` coincide con cualquier nombre de ese nivel (por ejemplo, la carpeta de versión). */
export function pathExists(pattern, base = rootDir) {
  const segments = pattern.split('/').filter(Boolean);
  let candidates = [base];
  for (const segment of segments) {
    const next = [];
    for (const dir of candidates) {
      if (!segment.includes('*')) {
        const p = path.join(dir, segment);
        if (fs.existsSync(p)) next.push(p);
        continue;
      }
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
      const re = new RegExp(`^${segment.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
      for (const name of fs.readdirSync(dir)) if (re.test(name)) next.push(path.join(dir, name));
    }
    if (!next.length) return false;
    candidates = next;
  }
  return true;
}

/**
 * Tabla "Pruebas del módulo" del índice (docs/modules/{modulo}/README.md): | Tipo | Ruta | Herramienta | Compuerta |.
 * Devuelve las filas con una ruta real; las de la plantilla (con corchetes) se ignoran. `rows` es null si no hay tabla.
 */
export function moduleTestRows(modulo, usosValidos) {
  const rel = `docs/modules/${modulo}/README.md`;
  const file = path.join(rootDir, rel);
  if (!fs.existsSync(file)) return { file: rel, rows: null };
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  const start = lines.findIndex((l) => /^#{2,4}\s.*pruebas del m[oó]dulo/i.test(l));
  if (start < 0) return { file: rel, rows: null };
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,4}\s/.test(line)) break;
    if (!line.trim().startsWith('|') || /^\|\s*:?-{3}/.test(line.trim())) continue;
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const ruta = cells[1]?.match(/`([^`]+)`/)?.[1];
    if (!ruta || /[[\]]/.test(ruta)) continue;
    const usos = [...(cells[2] ?? '').matchAll(/`?([a-z_]+)`?/g)].map((m) => m[1]).filter((u) => usosValidos.includes(u));
    rows.push({ tipo: cells[0], ruta, usos, compuerta: cells[3] ?? '' });
  }
  return { file: rel, rows };
}

/**
 * Pruebas que el plan exige en esta compuerta (usos de la columna Herramienta del catálogo) y que el índice
 * del módulo no registra, más las rutas registradas que no existen. Solo aplica si la compuerta exige algún uso.
 */
export function testIndexGaps(table, planEntregables, { gateId, modulo, usosValidos }) {
  const exigidos = new Map();
  for (const id of planEntregables.keys()) {
    const e = table.entregables.get(id);
    if (e?.gate === gateId && e.pista === 'modulo' && e.herramienta) exigidos.set(e.herramienta, [...(exigidos.get(e.herramienta) ?? []), id]);
  }
  if (!exigidos.size) return { file: null, gaps: [] };
  const { file, rows } = moduleTestRows(modulo, usosValidos);
  if (!rows) return { file, gaps: ['No existe la tabla "Pruebas del módulo" (encabezado y columnas Tipo | Ruta | Herramienta | Compuerta).'] };
  const gaps = [];
  for (const [uso, ids] of exigidos) {
    if (!rows.some((r) => r.usos.includes(uso))) gaps.push(`Falta una fila de uso "${uso}" (la exige${ids.length > 1 ? 'n' : ''} ${ids.join(', ')}).`);
  }
  for (const r of rows) {
    if (!pathExists(fillPlaceholders(r.ruta, { modulo }))) gaps.push(`La ruta "${r.ruta}" (${r.tipo}) no existe.`);
  }
  return { file, gaps };
}

/**
 * Entregables del plan efectivo para esta compuerta cuya ruta fija no existe.
 * @param {Map<string, string>} planEntregables  id → origen (de resolvePlan)
 */
export function missingDeliverables(table, planEntregables, { gateId, pistas, modulo, version }) {
  const missing = [];
  for (const id of planEntregables.keys()) {
    const e = table.entregables.get(id);
    if (!e?.ruta || e.gate !== gateId || !pistas.includes(e.pista)) continue;
    const ruta = fillPlaceholders(e.ruta, { modulo, version });
    if (!pathExists(ruta)) missing.push({ id, ruta });
  }
  return missing;
}

/** Ejecuta los comandos en orden; se detiene en el primero que falla. */
export function runVerifications(commands, vars) {
  const resultados = [];
  for (const raw of commands) {
    const comando = fillPlaceholders(raw, vars);
    const inicio = Date.now();
    try {
      execSync(comando, { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8', timeout: VERIFICATION_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
      resultados.push({ comando, resultado: 'PASS', segundos: Math.round((Date.now() - inicio) / 1000) });
    } catch (err) {
      const salida = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim().split(/\r?\n/).slice(-20).join('\n');
      resultados.push({ comando, resultado: 'FAIL', segundos: Math.round((Date.now() - inicio) / 1000), salida: salida || err.message });
      break;
    }
  }
  return resultados;
}
