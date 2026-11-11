/**
 * Lector de las tablas de .workflow/STAGE_GATES.md (única copia de los datos de compuertas).
 *
 * Lee dos bloques delimitados por marcadores HTML:
 *   <!-- gates:start --> ... <!-- gates:end -->      Tabla Maestra de Compuertas
 *   <!-- estados:start --> ... <!-- estados:end -->  Valores permitidos de `estado`
 *
 * Falla con un Error explícito ante marcadores ausentes o filas mal formadas
 * (diseño intencional: un cambio de formato debe romper el CI, nunca pasar en silencio).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const STAGE_GATES_PATH = path.join(rootDir, '.workflow', 'STAGE_GATES.md');

function extractBlock(markdown, name) {
  const re = new RegExp(`<!--\\s*${name}:start\\s*-->([\\s\\S]*?)<!--\\s*${name}:end\\s*-->`);
  const match = markdown.match(re);
  if (!match) {
    throw new Error(`No se encontraron los marcadores <!-- ${name}:start --> / <!-- ${name}:end --> en .workflow/STAGE_GATES.md`);
  }
  return match[1];
}

/** Devuelve las filas de datos (sin encabezado ni separador) como arreglos de celdas. */
function tableRows(block, name) {
  const rows = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))
    .map((line) => line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
  if (rows.length < 2) {
    throw new Error(`La tabla del bloque "${name}" no contiene filas de datos.`);
  }
  return rows.slice(1); // descarta el encabezado
}

const backticked = (cell) => {
  const match = cell.match(/`([^`]+)`/);
  return match ? match[1] : null;
};

/**
 * @returns {{
 *   gates: Array<{id: string, tipo: 'halt'|'checkpoint'|'bootstrap', fase: string|null, gate: string|null}>,
 *   stateful: Array<{id: string, tipo: 'halt'|'checkpoint', fase: string, gate: string}>,
 *   estados: string[]
 * }}
 */
export function loadStageGates(file = STAGE_GATES_PATH) {
  const markdown = fs.readFileSync(file, 'utf-8');

  const gates = tableRows(extractBlock(markdown, 'gates'), 'gates').map((cells, i) => {
    if (cells.length < 6) throw new Error(`gates: la fila ${i + 1} tiene ${cells.length} columnas (se esperaban 6).`);
    const id = cells[0].replace(/\*/g, '').trim();
    const tipoCell = cells[2].toLowerCase();
    const tipo = tipoCell.includes('halt') ? 'halt'
      : tipoCell.includes('checkpoint') ? 'checkpoint'
      : tipoCell.includes('bootstrap') ? 'bootstrap'
      : null;
    if (!/^G\d[AB]?$/.test(id)) throw new Error(`gates: ID de compuerta inválido "${id}".`);
    if (!tipo) throw new Error(`gates: la compuerta ${id} tiene un Tipo desconocido: "${cells[2]}".`);
    const fase = backticked(cells[4]);
    const gate = backticked(cells[5]);
    if (tipo !== 'bootstrap' && (!fase || !gate)) {
      throw new Error(`gates: la compuerta ${id} (${tipo}) debe declarar fase_activa y gate_activo entre acentos graves.`);
    }
    return { id, tipo, fase, gate };
  });

  const stateful = gates.filter((g) => g.tipo !== 'bootstrap');
  if (stateful.length === 0) throw new Error('gates: la tabla no define ninguna compuerta con estado.');
  const dupFase = stateful.map((g) => g.fase).filter((v, i, a) => a.indexOf(v) !== i);
  const dupGate = stateful.map((g) => g.gate).filter((v, i, a) => a.indexOf(v) !== i);
  if (dupFase.length || dupGate.length) {
    throw new Error(`gates: valores duplicados en la tabla (fase: ${dupFase.join(', ') || '-'}; gate: ${dupGate.join(', ') || '-'}).`);
  }

  const estados = tableRows(extractBlock(markdown, 'estados'), 'estados').map((cells, i) => {
    const value = backticked(cells[0]);
    if (!value) throw new Error(`estados: la fila ${i + 1} no declara el valor entre acentos graves.`);
    return value;
  });
  for (const required of ['ESPERANDO_APROBACION_HUMANA', 'BLOQUEADO', 'COMPLETADO']) {
    if (!estados.includes(required)) {
      throw new Error(`estados: falta el valor "${required}", del que dependen las reglas de coherencia.`);
    }
  }

  return { gates, stateful, estados };
}
