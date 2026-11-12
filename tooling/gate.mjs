#!/usr/bin/env node
/**
 * Transiciones de estado sin editar JSON a mano (npm run gate).
 *
 *   npm run gate -- <pista> estado
 *   npm run gate -- <pista> solicitar  [--nota "..."]            Pide la firma humana (solo en un Halt efectivo)
 *   npm run gate -- <pista> aprobar    --cita "palabras del humano" Registra la firma y pasa a la siguiente compuerta
 *   npm run gate -- <pista> avanzar    [--nota "..."]            Pasa un Checkpoint efectivo con todo en verde
 *   npm run gate -- <pista> bloquear   --motivo "..."            Veto, rechazo o impedimento
 *   npm run gate -- <pista> desbloquear [--nota "..."]
 *   npm run gate -- <pista> volver <G3A|G3B|...> --motivo "..."  Regresa a una compuerta anterior (veto de QA)
 *
 * <pista> es "proyecto" o el ID de un módulo (04_pagos). Opciones comunes: --autor "nombre".
 * En la pista de proyecto, `aprobar` en G6 abre el siguiente release (vuelve a G5); con --cerrar marca COMPLETADO.
 *
 * Cada cambio se valida con las mismas reglas que `npm run validate:state`; si algo no cuadra,
 * el archivo queda como estaba y se explica por qué.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadStageGates, rootDir } from './lib/stage-gates.mjs';
import { loadProjectConfig } from './lib/project-config.mjs';
import { loadProfiles, resolvePlan } from './lib/profiles.mjs';
import {
  MODULES_DIR, PROJECT_STATE_PATH, gatesForTrack, loadModuleStates, loadProjectState,
  moduleModifiers, projectModifiers, validateWorkflow,
} from './lib/workflow-state.mjs';

const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };
const [pista, accion, ...rest] = process.argv.slice(2);
if (!pista || !accion) fail('Uso: npm run gate -- <proyecto|XX_nombre> <estado|solicitar|aprobar|avanzar|bloquear|desbloquear|volver> [opciones]');

const opts = {};
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const key = rest[i].slice(2);
    const next = rest[i + 1];
    opts[key] = next !== undefined && !next.startsWith('--') ? (i++, next) : true;
  } else positional.push(rest[i]);
}

const table = loadStageGates();
const { config, errors: configErrors } = loadProjectConfig();
if (configErrors.length) fail(`.workflow/project.json inválido:\n   - ${configErrors.join('\n   - ')}`);
const profiles = loadProfiles(table);
const modules = loadModuleStates();
const isProject = pista === 'proyecto';
const file = isProject ? PROJECT_STATE_PATH : path.join(MODULES_DIR, `${pista}.json`);
if (!fs.existsSync(file)) fail(`La pista "${pista}" no existe. Usa "proyecto" o un módulo de .workflow/modules/ (${modules.map((m) => m.id).join(', ') || 'ninguno'}).`);

const original = fs.readFileSync(file, 'utf-8');
const state = JSON.parse(original);
const mods = isProject ? projectModifiers(config, modules) : moduleModifiers(config, state);
const plan = resolvePlan(table, profiles, { escala: config.perfil.escala, modificadores: mods });
if (plan.errors.length) fail(plan.errors.join(' '));
const track = gatesForTrack(table, isProject ? 'proyecto' : 'modulo', config, plan.tipos);
const idx = track.findIndex((g) => g.gate === state.gate_activo);
const current = track[idx];
if (!current) fail(`${state.gate_activo} no pertenece a la pista ${pista}. Ejecuta npm run validate:state.`);

const TIPO = { halt: '🛑 Halt', checkpoint: '⚡ Checkpoint' };
const today = new Date().toLocaleDateString('sv-SE');
const gitUser = () => { try { return execSync('git config user.name', { cwd: rootDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const autor = typeof opts.autor === 'string' ? opts.autor : (state.rol_en_turno ?? gitUser() ?? 'desconocido');

function rolFor(gate) {
  if (isProject && gate.id === 'G2' && config.fundacion?.estado !== 'COMPLETADA') return '07_foundation_architect';
  return gate.rol;
}

function record({ to = current, estado, motivo, extra = {} }) {
  state.historial_transiciones.push({ de: state.fase_activa, a: to.fase, fecha: today, autor, accion, motivo, ...extra });
  state.fase_activa = to.fase;
  state.gate_activo = to.gate;
  state.estado = estado;
  if (to !== current) state.rol_en_turno = rolFor(to);
  if ('fecha_actualizacion' in state) state.fecha_actualizacion = today;
}

function requireText(key, label) {
  if (typeof opts[key] !== 'string' || !opts[key].trim()) fail(`"${accion}" exige ${label} (--${key} "...").`);
  return opts[key].trim();
}

let next = null;
let sessionEnd = false;
switch (accion) {
  case 'estado': {
    console.log(`\n${pista}: ${current.id} ${TIPO[current.tipo]} · ${state.estado} · rol en turno: ${state.rol_en_turno}`);
    const acciones = {
      EN_PROCESO: current.tipo === 'halt' ? 'solicitar, bloquear' : 'avanzar, bloquear',
      ESPERANDO_APROBACION_HUMANA: 'aprobar --cita "...", bloquear, volver',
      BLOQUEADO: 'desbloquear, volver',
      COMPLETADO: isProject ? '—' : '— (módulo fusionado; lo incluye el próximo release)',
    };
    console.log(`Acciones posibles: ${acciones[state.estado] ?? '—'}\n`);
    process.exit(0);
  }
  case 'solicitar': {
    if (state.estado !== 'EN_PROCESO') fail(`Solo se pide firma desde EN_PROCESO (estado actual: ${state.estado}).`);
    if (current.tipo !== 'halt') fail(`${current.id} es un Checkpoint en el perfil activo: no se pide firma, se usa "avanzar" cuando todo está en verde.`);
    record({ estado: 'ESPERANDO_APROBACION_HUMANA', motivo: opts.nota || `Entregables de ${current.id} listos; se solicita la firma del Director Humano.` });
    sessionEnd = true;
    break;
  }
  case 'aprobar': {
    if (state.estado !== 'ESPERANDO_APROBACION_HUMANA') fail(`Solo se aprueba una firma solicitada (estado actual: ${state.estado}). Primero: npm run gate -- ${pista} solicitar`);
    const cita = requireText('cita', 'las palabras exactas del Director Humano');
    if (idx === track.length - 1) {
      if (isProject && !opts.cerrar) {
        next = track.find((g) => g.niveles.includes('release'));
        record({ to: next, estado: 'EN_PROCESO', motivo: `${current.id} aprobado: comienza el siguiente release.`, extra: { cita } });
      } else {
        record({ estado: 'COMPLETADO', motivo: `${current.id} aprobado: ${isProject ? 'proyecto cerrado' : 'módulo listo para fusionar a main'}.`, extra: { cita } });
      }
    } else {
      next = track[idx + 1];
      const salto = isProject && current.niveles.includes('modulo') && next.niveles.includes('release')
        ? ' La línea base queda cerrada: desde aquí los módulos avanzan en sus propias pistas y la pista de proyecto pasa a release (STAGE_GATES.md §2.1). No es un salto de fases.'
        : '';
      record({ to: next, estado: 'EN_PROCESO', motivo: `${current.id} aprobado por el Director Humano.${salto}`, extra: { cita } });
    }
    break;
  }
  case 'avanzar': {
    if (state.estado !== 'EN_PROCESO') fail(`Solo se avanza desde EN_PROCESO (estado actual: ${state.estado}).`);
    if (current.tipo !== 'checkpoint') fail(`${current.id} es un Halt en el perfil activo: requiere "solicitar" y la firma humana ("aprobar").`);
    next = track[idx + 1];
    if (!next) fail(`${current.id} es la última compuerta de la pista.`);
    record({ to: next, estado: 'EN_PROCESO', motivo: opts.nota || `Checkpoint ${current.id} superado: verificaciones en verde.` });
    break;
  }
  case 'bloquear': {
    const motivo = requireText('motivo', 'el motivo del bloqueo');
    state.bloqueos = [...(state.bloqueos ?? []), motivo];
    record({ estado: 'BLOQUEADO', motivo });
    break;
  }
  case 'desbloquear': {
    if (state.estado !== 'BLOQUEADO') fail(`La pista no está bloqueada (estado actual: ${state.estado}).`);
    state.bloqueos = [];
    record({ estado: 'EN_PROCESO', motivo: opts.nota || 'Bloqueo resuelto.' });
    break;
  }
  case 'volver': {
    const target = track.find((g) => g.id === positional[0]);
    const motivo = requireText('motivo', 'el motivo del retroceso');
    if (!target) fail(`Indica la compuerta de destino (${track.map((g) => g.id).join(', ')}): npm run gate -- ${pista} volver G3A --motivo "..."`);
    if (track.indexOf(target) >= idx) fail(`Solo se vuelve a una compuerta anterior a ${current.id}.`);
    state.bloqueos = [];
    next = target;
    record({ to: target, estado: 'EN_PROCESO', motivo });
    break;
  }
  default:
    fail(`Acción desconocida "${accion}".`);
}

fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
const check = validateWorkflow(table, loadProjectState(), loadModuleStates(), config, profiles);
if (check.errors.length) {
  fs.writeFileSync(file, original);
  console.error(`❌ La transición no se aplicó porque deja el flujo inválido:\n   - ${check.errors.join('\n   - ')}`);
  process.exit(1);
}

const now = track.find((g) => g.gate === state.gate_activo);
console.log(`✅ ${pista}: ${now.id} ${TIPO[now.tipo]} · ${state.estado} · rol en turno: ${state.rol_en_turno}`);
if (sessionEnd) {
  console.log('🛑 Fin de sesión: espera la firma del Director Humano. Tras la firma, registra "aprobar" y continúa en una sesión nueva (empieza con npm run status).');
} else if (next) {
  console.log(`➡️  Siguiente trabajo: ${now.id} con ${state.rol_en_turno}. Recomendado: una sesión nueva para este rol (AGENTS.md §5).`);
}
