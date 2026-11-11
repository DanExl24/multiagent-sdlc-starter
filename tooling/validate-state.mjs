#!/usr/bin/env node
/**
 * Valida .workflow/current_state.json contra las tablas de .workflow/STAGE_GATES.md.
 * Los datos (fases, gates, tipos, estados) se leen de STAGE_GATES.md en cada ejecución;
 * aquí solo vive la lógica de coherencia.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadStageGates, rootDir } from './lib/stage-gates.mjs';

const statePath = path.join(rootDir, '.workflow', 'current_state.json');
const REQUIRED = ['fase_activa', 'gate_activo', 'estado', 'rol_en_turno', 'bloqueos', 'historial_transiciones'];

let table;
try {
  table = loadStageGates();
} catch (err) {
  console.error(`❌ No se pudo leer el mapa de compuertas de .workflow/STAGE_GATES.md: ${err.message}`);
  process.exit(1);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
} catch (err) {
  console.error(`❌ No se pudo leer ${statePath}: ${err.message}`);
  process.exit(1);
}

const errors = [];
const byFase = new Map(table.stateful.map((g) => [g.fase, g]));
const lastGate = table.stateful[table.stateful.length - 1];

for (const key of REQUIRED) {
  if (!(key in state)) errors.push(`Falta el campo obligatorio "${key}".`);
}

const current = byFase.get(state.fase_activa);
if (!current) {
  errors.push(`fase_activa "${state.fase_activa}" no es válida. Permitidas: ${[...byFase.keys()].join(', ')}.`);
} else if (state.gate_activo !== current.gate) {
  errors.push(`gate_activo "${state.gate_activo}" no corresponde a ${state.fase_activa} (se esperaba "${current.gate}").`);
}

if (!table.estados.includes(state.estado)) {
  errors.push(`estado "${state.estado}" no es válido. Permitidos: ${table.estados.join(', ')}.`);
}
if (state.estado === 'ESPERANDO_APROBACION_HUMANA' && current && current.tipo !== 'halt') {
  errors.push(`${current.id} es un ${current.tipo} automático y no admite "ESPERANDO_APROBACION_HUMANA".`);
}
if (state.estado === 'BLOQUEADO' && !(Array.isArray(state.bloqueos) && state.bloqueos.length > 0)) {
  errors.push('estado "BLOQUEADO" exige al menos un elemento en "bloqueos".');
}
if (state.estado === 'COMPLETADO' && state.gate_activo !== lastGate.gate) {
  errors.push(`estado "COMPLETADO" solo es válido con gate_activo "${lastGate.gate}" (${lastGate.id}).`);
}
if (!Array.isArray(state.bloqueos)) errors.push('"bloqueos" debe ser un arreglo.');
if (!Array.isArray(state.historial_transiciones)) errors.push('"historial_transiciones" debe ser un arreglo.');

if (errors.length > 0) {
  console.error('❌ current_state.json inválido frente a .workflow/STAGE_GATES.md:');
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}
console.log(`✅ State Machine válida. Fase: ${state.fase_activa} | Gate: ${state.gate_activo} | Estado: ${state.estado}`);
