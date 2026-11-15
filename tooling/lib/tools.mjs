/**
 * Herramientas del stack (.workflow/project.json → herramientas): las declara el rol de fundación,
 * cada una con el uso que cubre y el comando que comprueba que está instalada.
 *
 * Las usan `npm run doctor` y `npm run gate` en G2 (STAGE_GATES.md §2.5): una herramienta que falta
 * aparece antes de construir, cuando el Director Humano puede instalarla, y no en G4.
 * Son comandos, no herramientas fijas: sirven igual para Node, PHP o cualquier otro stack.
 */
import { execSync } from 'node:child_process';
import { rootDir } from './stage-gates.mjs';

/**
 * Usos que exige el plan efectivo y que ninguna herramienta declarada cubre.
 * @returns {{uso: string, entregables: string[]}[]}
 */
export function toolCoverageGaps(table, planEntregables, config) {
  const declarados = new Set((config.herramientas ?? []).map((h) => h.uso));
  const faltan = new Map();
  for (const id of planEntregables.keys()) {
    const uso = table.entregables.get(id)?.herramienta;
    if (uso && !declarados.has(uso)) faltan.set(uso, [...(faltan.get(uso) ?? []), id]);
  }
  return [...faltan].map(([uso, entregables]) => ({ uso, entregables }));
}

/** Ejecuta el comando `comprobar` de cada herramienta declarada. */
export function checkTools(config) {
  return (config.herramientas ?? []).map((h) => {
    const inicio = Date.now();
    try {
      const salida = execSync(h.comprobar, { cwd: rootDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 });
      return { ...h, ok: true, salida: salida.trim().split(/\r?\n/)[0] ?? '', segundos: Math.round((Date.now() - inicio) / 1000) };
    } catch (err) {
      const detalle = `${err.stderr ?? ''}${err.stdout ?? ''}`.trim().split(/\r?\n/)[0] || err.message.split('\n')[0];
      return { ...h, ok: false, salida: detalle, segundos: Math.round((Date.now() - inicio) / 1000) };
    }
  });
}

/** Líneas legibles para la consola, compartidas por doctor y gate. */
export const toolLine = (r) => `${r.ok ? '✅' : '❌'} ${r.nombre} (${r.uso}) · ${r.comprobar}${r.ok ? (r.salida ? ` → ${r.salida}` : '') : ` → falló: ${r.salida}\n      Instalar: ${r.instalar}`}`;

export const gapLine = (g) => `⚠️  Sin herramienta para "${g.uso}" (la exige${g.entregables.length > 1 ? 'n' : ''} ${g.entregables.join(', ')})`;
