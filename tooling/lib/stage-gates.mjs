/**
 * Lector de las tablas de .workflow/STAGE_GATES.md (única copia de los datos de compuertas).
 *
 * Lee dos bloques delimitados por marcadores HTML:
 *   <!-- gates:start --> ... <!-- gates:end -->      Tabla Maestra de Compuertas
 *   <!-- estados:start --> ... <!-- estados:end -->  Valores permitidos de `estado`
 *   <!-- capas:start --> ... <!-- capas:end -->      Compuertas que dependen de una capa
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

/** Convierte la celda "Nivel" en el conjunto de pistas: proyecto, modulo y/o release. */
function parseNiveles(cell, id) {
  const text = cell.toLowerCase();
  const niveles = [];
  if (text.includes('proyecto')) niveles.push('proyecto');
  if (/m[oó]dulo/.test(text)) niveles.push('modulo');
  if (text.includes('release')) niveles.push('release');
  if (niveles.length === 0) throw new Error(`gates: la compuerta ${id} tiene un Nivel desconocido: "${cell}".`);
  return niveles;
}

/**
 * @typedef {'proyecto'|'modulo'|'release'} Nivel
 * @returns {{
 *   gates: Array<{id: string, tipo: 'halt'|'checkpoint'|'bootstrap', niveles: Nivel[], fase: string|null, gate: string|null}>,
 *   stateful: Array<{id: string, tipo: 'halt'|'checkpoint', niveles: Nivel[], fase: string, gate: string}>,
 *   estados: string[],
 *   capas: Map<string, string>
 * }}
 */
export function loadStageGates(file = STAGE_GATES_PATH) {
  const markdown = fs.readFileSync(file, 'utf-8');

  const gates = tableRows(extractBlock(markdown, 'gates'), 'gates').map((cells, i) => {
    if (cells.length < 7) throw new Error(`gates: la fila ${i + 1} tiene ${cells.length} columnas (se esperaban 7).`);
    const id = cells[0].replace(/\*/g, '').trim();
    const tipoCell = cells[2].toLowerCase();
    const tipo = tipoCell.includes('halt') ? 'halt'
      : tipoCell.includes('checkpoint') ? 'checkpoint'
      : tipoCell.includes('bootstrap') ? 'bootstrap'
      : null;
    if (!/^G\d[AB]?$/.test(id)) throw new Error(`gates: ID de compuerta inválido "${id}".`);
    if (!tipo) throw new Error(`gates: la compuerta ${id} tiene un Tipo desconocido: "${cells[2]}".`);
    const niveles = parseNiveles(cells[3], id);
    const fase = backticked(cells[5]);
    const gate = backticked(cells[6]);
    if (tipo !== 'bootstrap' && (!fase || !gate)) {
      throw new Error(`gates: la compuerta ${id} (${tipo}) debe declarar fase_activa y gate_activo entre acentos graves.`);
    }
    return { id, tipo, niveles, fase, gate };
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

  // Compuertas que solo existen si el proyecto tiene una capa (G3A → backend, G3B → frontend).
  const capas = new Map(tableRows(extractBlock(markdown, 'capas'), 'capas').map((cells, i) => {
    const id = cells[0].replace(/\*/g, '').trim();
    const layer = backticked(cells[1] ?? '');
    if (!gates.some((g) => g.id === id)) throw new Error(`capas: la fila ${i + 1} cita la compuerta "${id}", que no existe en la Tabla Maestra.`);
    if (!layer) throw new Error(`capas: la fila ${i + 1} no declara la capa entre acentos graves.`);
    return [id, layer];
  }));

  return { gates, stateful, estados, capas };
}
