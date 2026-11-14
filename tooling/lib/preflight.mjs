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
