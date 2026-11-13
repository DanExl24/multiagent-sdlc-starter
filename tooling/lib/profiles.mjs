/**
 * Perfiles de proyecto (ver .workflow/PROFILES.md):
 *   - Escala (una):        .workflow/profiles/{sprint,standard,enterprise}.json
 *   - Modificadores (0..n): .workflow/profiles/modifiers/*.json
 *
 * Un perfil no crea compuertas: cambia el tipo efectivo (halt/checkpoint) y los entregables
 * obligatorios, citando IDs de la Tabla Maestra y del Catálogo de Entregables de STAGE_GATES.md.
 * Los modificadores solo añaden exigencias: pueden convertir un checkpoint en halt y sumar
 * entregables, nunca quitarlos. Ningún perfil puede romper los invariantes de STAGE_GATES.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './stage-gates.mjs';

export const PROFILES_DIR = path.join(rootDir, '.workflow', 'profiles');
export const MODIFIERS_DIR = path.join(PROFILES_DIR, 'modifiers');
export const DEFAULT_SCALE = 'standard';

function readDir(dir, label) {
  if (!fs.existsSync(dir)) return { items: [], errors: [`No existe ${path.relative(rootDir, dir)}/.`] };
  const items = [];
  const errors = [];
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    try {
      items.push({ name: name.replace(/\.json$/, ''), data: JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')) });
    } catch (err) {
      errors.push(`${label}/${name}: JSON inválido (${err.message}).`);
    }
  }
  return { items, errors };
}

/** Comprueba que unos tipos efectivos respeten los invariantes de STAGE_GATES.md. */
export function checkInvariants(table, tipos) {
  const errors = [];
  for (const { ids, regla } of table.invariantes) {
    if (regla === 'halt') {
      for (const id of ids) if (tipos.get(id) !== 'halt') errors.push(`${id} debe ser Halt en cualquier perfil.`);
    } else if (regla === 'al_menos_un_halt' && !ids.some((id) => tipos.get(id) === 'halt')) {
      errors.push(`al menos una de ${ids.join(', ')} debe ser Halt (firma humana antes de construir).`);
    }
  }
  return errors;
}

function validateDefinition(table, def, kind, label) {
  const errors = [];
  const stateful = new Set(table.stateful.map((g) => g.id));
  for (const [id, tipo] of Object.entries(def.tipos ?? {})) {
    if (!stateful.has(id)) errors.push(`${label}: la compuerta "${id}" no existe o no tiene estado.`);
    const allowed = kind === 'modificador' ? ['halt'] : ['halt', 'checkpoint'];
    if (!allowed.includes(tipo)) errors.push(`${label}: tipo "${tipo}" no permitido para ${id}. Un ${kind} solo admite: ${allowed.join(', ')}.`);
  }
  const lists = kind === 'modificador' ? ['adicionales'] : ['opcionales', 'adicionales'];
  for (const key of Object.keys(def.entregables ?? {})) {
    if (!lists.includes(key)) errors.push(`${label}: "entregables.${key}" no está permitido en un ${kind} (solo ${lists.join(', ')}).`);
  }
  for (const key of lists) {
    for (const id of def.entregables?.[key] ?? []) {
      if (!table.entregables.has(id)) errors.push(`${label}: el entregable "${id}" no existe en el Catálogo de Entregables (STAGE_GATES.md §7).`);
    }
  }
  return errors;
}

/** @returns {{escalas: Map<string, object>, modificadores: Map<string, object>, errors: string[]}} */
export function loadProfiles(table) {
  const escalas = new Map();
  const modificadores = new Map();
  const scaleFiles = readDir(PROFILES_DIR, 'profiles');
  const modFiles = readDir(MODIFIERS_DIR, 'profiles/modifiers');
  const errors = [...scaleFiles.errors, ...modFiles.errors];

  for (const { name, data } of scaleFiles.items) {
    const label = `profiles/${name}.json`;
    if (data.escala !== name) errors.push(`${label}: "escala" debe valer "${name}" (igual que el nombre del archivo).`);
    const defErrors = validateDefinition(table, data, 'escala', label);
    if (defErrors.length === 0) {
      const tipos = new Map(table.stateful.map((g) => [g.id, data.tipos?.[g.id] ?? g.tipo]));
      for (const e of checkInvariants(table, tipos)) defErrors.push(`${label}: ${e}`);
    }
    errors.push(...defErrors);
    escalas.set(name, data);
  }
  for (const { name, data } of modFiles.items) {
    const label = `profiles/modifiers/${name}.json`;
    if (data.modificador !== name) errors.push(`${label}: "modificador" debe valer "${name}" (igual que el nombre del archivo).`);
    errors.push(...validateDefinition(table, data, 'modificador', label));
    modificadores.set(name, data);
  }
  if (!escalas.has(DEFAULT_SCALE)) errors.push(`Falta el perfil por defecto profiles/${DEFAULT_SCALE}.json.`);
  return { escalas, modificadores, errors };
}

/**
 * Plan efectivo para una combinación de escala y modificadores (y, si se indican, las capas activas).
 * @returns {{tipos: Map<string, string>, entregables: Map<string, string>, errors: string[]}}
 *   tipos: compuerta → halt|checkpoint; entregables: ID obligatorio → origen (base, escala o modificador)
 */
export function resolvePlan(table, profiles, { escala = DEFAULT_SCALE, modificadores = [], capas = null } = {}) {
  const errors = [];
  const scale = profiles.escalas.get(escala);
  if (!scale) errors.push(`la escala "${escala}" no existe en .workflow/profiles/.`);
  const mods = [];
  for (const name of modificadores) {
    const mod = profiles.modificadores.get(name);
    if (!mod) errors.push(`el modificador "${name}" no existe en .workflow/profiles/modifiers/.`);
    else mods.push([name, mod]);
  }

  const tipos = new Map(table.stateful.map((g) => [g.id, scale?.tipos?.[g.id] ?? g.tipo]));
  for (const [, mod] of mods) for (const [id, tipo] of Object.entries(mod.tipos ?? {})) tipos.set(id, tipo);

  const entregables = new Map([...table.entregables.values()].filter((e) => e.base).map((e) => [e.id, 'base']));
  for (const id of scale?.entregables?.opcionales ?? []) entregables.delete(id);
  for (const id of scale?.entregables?.adicionales ?? []) entregables.set(id, escala);
  for (const [name, mod] of mods) {
    for (const id of mod.entregables?.adicionales ?? []) {
      // Precedencia: si la escala lo hizo opcional, el modificador lo vuelve obligatorio.
      entregables.set(id, entregables.get(id) === 'base' ? 'base' : name);
    }
  }
  // Los entregables de una capa inactiva no aplican (por ejemplo, k6 o Bruno sin backend).
  if (capas) {
    for (const id of [...entregables.keys()]) {
      const capa = table.entregables.get(id)?.capa;
      if (capa && !capas.includes(capa)) entregables.delete(id);
    }
  }
  return { tipos, entregables, errors };
}
