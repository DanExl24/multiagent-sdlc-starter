/**
 * Lectura y validación de las pistas de trabajo (ver .workflow/STAGE_GATES.md §2.1):
 *   - Proyecto/Release: .workflow/current_state.json
 *   - Módulo:           .workflow/modules/[XX_nombre].json (uno por módulo)
 *
 * Los datos de compuertas se leen de STAGE_GATES.md; aquí solo vive la lógica de coherencia.
 */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './stage-gates.mjs';
import { DEFAULT_CONFIG, activeLayers, contractsDir, layerModulesDir } from './project-config.mjs';
import { DEFAULT_SCALE, resolvePlan } from './profiles.mjs';

export const PROJECT_STATE_PATH = path.join(rootDir, '.workflow', 'current_state.json');
export const MODULES_DIR = path.join(rootDir, '.workflow', 'modules');
export const MODULE_ID_RE = /^\d{2}_[a-z0-9]+(?:_[a-z0-9]+)*$/;

const COMMON_FIELDS = ['fase_activa', 'gate_activo', 'estado', 'rol_en_turno', 'bloqueos', 'historial_transiciones'];
const MODULE_FIELDS = ['modulo', 'responsable', 'rama', 'depende_de', 'incluido_en_release'];

/** Compuertas omitidas porque su capa está inactiva en project.json (ej. G3B sin frontend). */
export function skippedGates(table, config = DEFAULT_CONFIG) {
  const active = new Set(activeLayers(config));
  return new Map([...table.capas].filter(([, layer]) => !active.has(layer)));
}

/**
 * Compuertas con estado que pertenecen a una pista, sin las de capas inactivas.
 * Con `tipos` (plan del perfil), cada compuerta lleva su tipo efectivo en lugar del de la tabla.
 */
export function gatesForTrack(table, track, config = DEFAULT_CONFIG, tipos = null) {
  const skipped = skippedGates(table, config);
  const gates = track === 'modulo'
    ? table.stateful.filter((g) => g.niveles.includes('modulo') && !skipped.has(g.id))
    : table.stateful.filter((g) => g.niveles.includes('proyecto') || g.niveles.includes('release'));
  return tipos ? gates.map((g) => ({ ...g, tipo: tipos.get(g.id) ?? g.tipo })) : gates;
}

/** Modificadores que afectan a la pista de proyecto: los del proyecto más los de módulos aún no liberados. */
export function projectModifiers(config, modules) {
  const pending = modules.filter((m) => m.state && m.state.incluido_en_release == null).flatMap((m) => m.state.modificadores ?? []);
  return [...new Set([...(config.perfil?.modificadores ?? []), ...pending])];
}

/** Modificadores de un módulo: los del proyecto más los propios. */
export function moduleModifiers(config, state) {
  return [...new Set([...(config.perfil?.modificadores ?? []), ...(Array.isArray(state.modificadores) ? state.modificadores : [])])];
}

/** Posición de una compuerta en el orden global de la Tabla Maestra (-1 si no existe). */
export const gateIndex = (table, gateValue) => table.stateful.findIndex((g) => g.gate === gateValue);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function loadProjectState() {
  return readJson(PROJECT_STATE_PATH);
}

/** @returns {Array<{id: string, file: string, state?: object, error?: string}>} */
export function loadModuleStates() {
  if (!fs.existsSync(MODULES_DIR)) return [];
  return fs.readdirSync(MODULES_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const file = path.join(MODULES_DIR, name);
      const id = name.replace(/\.json$/, '');
      try {
        return { id, file, state: readJson(file) };
      } catch (err) {
        return { id, file, error: err.message };
      }
    });
}

/** Reglas comunes a cualquier pista: campos, fase/gate de la misma fila, estados y coherencia. */
function validateTrack(state, table, track, label, config, tipos) {
  const errors = [];
  const allowed = gatesForTrack(table, track, config, tipos);
  const skipped = skippedGates(table, config);
  const required = track === 'modulo' ? [...MODULE_FIELDS, ...COMMON_FIELDS] : COMMON_FIELDS;
  for (const key of required) {
    if (!(key in state)) errors.push(`${label}: falta el campo obligatorio "${key}".`);
  }

  const current = allowed.find((g) => g.fase === state.fase_activa);
  if (!current) {
    const elsewhere = table.stateful.find((g) => g.fase === state.fase_activa);
    errors.push(elsewhere && track === 'modulo' && skipped.has(elsewhere.id)
      ? `${label}: ${elsewhere.id} no aplica porque la capa "${skipped.get(elsewhere.id)}" está inactiva en .workflow/project.json. Permitidas: ${allowed.map((g) => g.id).join(', ')}.`
      : elsewhere
      ? `${label}: ${elsewhere.id} no se recorre en la pista de ${track === 'modulo' ? 'módulo' : 'proyecto/release'}. Permitidas: ${allowed.map((g) => g.id).join(', ')}.`
      : `${label}: fase_activa "${state.fase_activa}" no es válida. Permitidas: ${allowed.map((g) => g.fase).join(', ')}.`);
  } else if (state.gate_activo !== current.gate) {
    errors.push(`${label}: gate_activo "${state.gate_activo}" no corresponde a ${state.fase_activa} (se esperaba "${current.gate}").`);
  }

  if (!table.estados.includes(state.estado)) {
    errors.push(`${label}: estado "${state.estado}" no es válido. Permitidos: ${table.estados.join(', ')}.`);
  }
  if (state.estado === 'ESPERANDO_APROBACION_HUMANA' && current && current.tipo !== 'halt') {
    errors.push(`${label}: ${current.id} es un ${current.tipo} automático y no admite "ESPERANDO_APROBACION_HUMANA".`);
  }
  if (!Array.isArray(state.bloqueos)) {
    errors.push(`${label}: "bloqueos" debe ser un arreglo.`);
  } else if (state.estado === 'BLOQUEADO' && state.bloqueos.length === 0) {
    errors.push(`${label}: estado "BLOQUEADO" exige al menos un elemento en "bloqueos".`);
  }
  const last = allowed[allowed.length - 1];
  if (state.estado === 'COMPLETADO' && last && state.gate_activo !== last.gate) {
    errors.push(`${label}: estado "COMPLETADO" solo es válido en la última compuerta de su pista (${last.id}).`);
  }
  if (!Array.isArray(state.historial_transiciones)) errors.push(`${label}: "historial_transiciones" debe ser un arreglo.`);
  return errors;
}

/** "Ha superado" una compuerta: está más adelante en el flujo, o la tiene aprobada y cerrada. */
function hasPassed(table, state, gate) {
  const idx = gateIndex(table, state.gate_activo);
  const target = gateIndex(table, gate.gate);
  return idx > target || (idx === target && state.estado === 'COMPLETADO');
}

function findCycle(graph) {
  const visiting = new Set();
  const done = new Set();
  const visit = (node, trail) => {
    if (visiting.has(node)) return [...trail.slice(trail.indexOf(node)), node];
    if (done.has(node)) return null;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next, [...trail, node]);
      if (cycle) return cycle;
    }
    visiting.delete(node);
    done.add(node);
    return null;
  };
  for (const node of graph.keys()) {
    const cycle = visit(node, []);
    if (cycle) return cycle;
  }
  return null;
}

/**
 * Valida la pista de proyecto y todas las de módulo, incluidas las reglas entre pistas.
 * @returns {{errors: string[], warnings: string[]}} errores (bloquean) y avisos (no bloquean)
 */
export function validateWorkflow(table, project, modules, config = DEFAULT_CONFIG, profiles = null) {
  const errors = [];
  const warnings = [];
  const perfil = config.perfil ?? DEFAULT_CONFIG.perfil;
  const planOf = (modificadores) => (profiles ? resolvePlan(table, profiles, { escala: perfil.escala, modificadores }) : null);

  if (profiles) {
    errors.push(...profiles.errors);
    const base = resolvePlan(table, profiles, { escala: perfil.escala, modificadores: perfil.modificadores });
    errors.push(...base.errors.map((e) => `project.json: ${e}`));
    // Un perfil distinto del predeterminado es una decisión de arquitectura: se justifica con un ADR firmado.
    if (perfil.escala !== DEFAULT_SCALE || perfil.modificadores.length > 0) {
      if (!perfil.adr) errors.push(`project.json: el perfil "${[perfil.escala, ...perfil.modificadores].join(' + ')}" exige un ADR en perfil.adr (ver .workflow/PROFILES.md).`);
      else if (!fs.existsSync(path.join(rootDir, perfil.adr))) errors.push(`project.json: perfil.adr apunta a "${perfil.adr}", que no existe.`);
    }
  }

  if ('modulo_en_curso' in project) {
    errors.push('current_state.json: "modulo_en_curso" ya no se usa. Cada módulo tiene su propio archivo en .workflow/modules/ (crea uno con npm run new:module).');
  }
  const projectPlan = planOf(projectModifiers(config, modules));
  errors.push(...validateTrack(project, table, 'proyecto', 'current_state.json', config, projectPlan?.tipos));

  // Compuertas de línea base: las que se recorren en proyecto y en módulo (G1, G2).
  const baseline = table.stateful.filter((g) => g.niveles.includes('proyecto') && g.niveles.includes('modulo'));
  const lastBaseline = baseline[baseline.length - 1];
  const valid = new Map();

  for (const mod of modules) {
    const label = `modules/${mod.id}.json`;
    if (mod.error) { errors.push(`${label}: JSON inválido (${mod.error}).`); continue; }
    const s = mod.state;
    const before = errors.length;

    if (!MODULE_ID_RE.test(mod.id)) errors.push(`${label}: el nombre debe seguir el formato "XX_nombre" (dos dígitos, minúsculas y guiones bajos).`);
    if (s.modulo !== mod.id) errors.push(`${label}: "modulo" vale "${s.modulo}" pero debe coincidir con el nombre del archivo ("${mod.id}").`);
    if (!fs.existsSync(path.join(rootDir, 'docs', 'modules', mod.id))) errors.push(`${label}: no existe la carpeta docs/modules/${mod.id}/.`);
    if (s.incluido_en_release != null && s.estado !== 'COMPLETADO') {
      errors.push(`${label}: "incluido_en_release" solo puede tener valor cuando el módulo está COMPLETADO (superó G4).`);
    }
    if ('depende_de' in s && !Array.isArray(s.depende_de)) errors.push(`${label}: "depende_de" debe ser un arreglo de IDs de módulo.`);
    if ('modificadores' in s && !(Array.isArray(s.modificadores) && s.modificadores.every((m) => typeof m === 'string'))) {
      errors.push(`${label}: "modificadores" debe ser una lista de nombres de modificador.`);
    }
    const modulePlan = planOf(moduleModifiers(config, s));
    if (modulePlan) errors.push(...modulePlan.errors.filter((e) => e.startsWith('el modificador')).map((e) => `${label}: ${e}`));
    errors.push(...validateTrack(s, table, 'modulo', label, config, modulePlan?.tipos));
    if (errors.length === before) valid.set(mod.id, s);
  }

  const prefixes = new Map();
  for (const mod of modules) {
    const prefix = mod.id.slice(0, 2);
    if (prefixes.has(prefix)) errors.push(`modules/: los módulos "${prefixes.get(prefix)}" y "${mod.id}" comparten el número ${prefix}.`);
    else prefixes.set(prefix, mod.id);
  }

  // Reglas entre pistas (solo con módulos estructuralmente válidos).
  for (const [id, s] of valid) {
    const label = `modules/${id}.json`;
    // Se informa solo la compuerta de línea base más avanzada que el módulo adelanta al proyecto.
    const ahead = [...baseline].reverse().find((gate) =>
      gateIndex(table, s.gate_activo) > gateIndex(table, gate.gate) && !hasPassed(table, project, gate));
    if (ahead) {
      errors.push(`${label}: el módulo ya superó ${ahead.id}, pero la línea base del proyecto aún no (current_state.json está en ${project.gate_activo}).`);
    }
    // Regla de oro del contrato previo (AGENTS.md §6): pasada la línea base, el contrato debe existir.
    if (lastBaseline && hasPassed(table, s, lastBaseline)) {
      const names = [id, id.slice(3)].flatMap((n) => [`${n}.contract.ts`, `${n}.contract.js`]);
      if (!names.some((n) => fs.existsSync(path.join(contractsDir(config), n)))) {
        errors.push(`${label}: superó ${lastBaseline.id} pero no existe su contrato (${config.rutas.contratos}/${id}.contract.ts). No hay código sin contrato previo (AGENTS.md §6).`);
      }
    }
    for (const dep of s.depende_de) {
      if (dep === id) { errors.push(`${label}: un módulo no puede depender de sí mismo.`); continue; }
      const depState = valid.get(dep);
      if (!depState) {
        if (!modules.some((m) => m.id === dep)) errors.push(`${label}: depende de "${dep}", que no existe en .workflow/modules/.`);
        continue;
      }
      if (lastBaseline && hasPassed(table, s, lastBaseline) && !hasPassed(table, depState, lastBaseline)) {
        errors.push(`${label}: no puede construirse (superó ${lastBaseline.id}) mientras su dependencia "${dep}" no tenga su contrato aprobado en ${lastBaseline.id}.`);
      }
      if (s.estado === 'COMPLETADO' && depState.estado !== 'COMPLETADO') {
        errors.push(`${label}: no puede fusionarse a main (COMPLETADO) antes que su dependencia "${dep}".`);
      }
    }
  }

  const cycle = findCycle(new Map([...valid].map(([id, s]) => [id, s.depende_de.filter((d) => valid.has(d))])));
  if (cycle) errors.push(`modules/: dependencia circular entre módulos: ${cycle.join(' → ')}.`);

  // Carpetas de código: cada una debería llevar el ID del módulo (o su nombre sin número).
  const known = new Set(modules.flatMap((m) => [m.id, m.id.slice(3)]));
  for (const layer of activeLayers(config)) {
    const dir = layerModulesDir(config, layer);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !known.has(entry.name)) {
        warnings.push(`${config.capas[layer].modulos}/${entry.name}: no corresponde a ningún módulo de .workflow/modules/ (usa el ID "XX_nombre" o el nombre sin número).`);
      }
    }
  }

  return { errors, warnings };
}
