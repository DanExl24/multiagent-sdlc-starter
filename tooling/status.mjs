#!/usr/bin/env node
/**
 * Semáforo consolidado del proyecto (npm run status).
 *   npm run status                 Proyecto y módulos: gate, estado, responsable, rama, bloqueos y
 *                                  qué módulos entró en cada release (desde incluido_en_release).
 *   npm run status -- 04_pagos     Plan efectivo del módulo según el perfil: tipo de cada compuerta y entregables.
 *   npm run status -- proyecto     Plan efectivo de la línea base y del release.
 *
 * Es una vista generada: no escribe nada, para que el estado global nunca sea un archivo
 * que varias personas editen a la vez.
 */
import { execSync } from 'node:child_process';
import { loadStageGates, rootDir } from './lib/stage-gates.mjs';
import { loadProjectConfig, activeLayers } from './lib/project-config.mjs';
import { loadProfiles, resolvePlan } from './lib/profiles.mjs';
import {
  gatesForTrack, loadModuleStates, loadProjectState, moduleModifiers, projectModifiers, validateWorkflow,
} from './lib/workflow-state.mjs';

const table = loadStageGates();
const project = loadProjectState();
const modules = loadModuleStates();
const { config } = loadProjectConfig();
const profiles = loadProfiles(table);
const byGate = new Map(table.stateful.map((g) => [g.gate, g]));

const ICON = { EN_PROCESO: '🟡', ESPERANDO_APROBACION_HUMANA: '🛑', BLOQUEADO: '🔴', COMPLETADO: '🟢' };
const TIPO = { halt: '🛑 Halt', checkpoint: '⚡ Checkpoint' };
const gateLabel = (s) => byGate.get(s.gate_activo)?.id ?? s.gate_activo;
const pad = (text, width) => String(text).padEnd(width);
const perfilLabel = (mods) => [config.perfil.escala, ...mods].join(' + ');

function printPlan(title, track, mods, current) {
  const plan = resolvePlan(table, profiles, { escala: config.perfil.escala, modificadores: mods, capas: activeLayers(config) });
  if (plan.errors.length) {
    console.error(`❌ ${plan.errors.join(' ')}`);
    process.exit(1);
  }
  const pistas = track === 'modulo' ? ['modulo'] : ['proyecto', 'release'];
  console.log(`\n🧭 Plan efectivo de ${title} · perfil: ${perfilLabel(mods)}\n`);
  for (const gate of gatesForTrack(table, track, config, plan.tipos)) {
    const marker = current === gate.gate ? '  ◀ en curso' : '';
    console.log(`   ${pad(gate.id, 4)} ${pad(TIPO[gate.tipo], 13)}${marker}`);
    const items = [...plan.entregables].filter(([id]) => {
      const e = table.entregables.get(id);
      return e.gate === gate.id && pistas.includes(e.pista);
    });
    for (const [id, origen] of items) {
      const tag = origen === 'base' ? '' : `  (${origen})`;
      console.log(`        - ${table.entregables.get(id).descripcion.replace(/`/g, '')}${tag}`);
    }
  }
  const skipped = [...table.capas].filter(([, layer]) => !activeLayers(config).includes(layer));
  if (track === 'modulo' && skipped.length) console.log(`\n   Omitidas por capa inactiva: ${skipped.map(([id, layer]) => `${id} (${layer})`).join(', ')}`);
  console.log('\n   🛑 = el agente se detiene y espera firma humana · ⚡ = pasa automáticamente si todo está en verde\n');
}

const target = process.argv[2];
if (target) {
  if (target === 'proyecto') {
    printPlan('la línea base y el release', 'proyecto', projectModifiers(config, modules), project.gate_activo);
  } else {
    const mod = modules.find((m) => m.id === target);
    if (!mod?.state) {
      console.error(`❌ El módulo "${target}" no existe en .workflow/modules/. Módulos: ${modules.map((m) => m.id).join(', ') || 'ninguno'}.`);
      process.exit(1);
    }
    printPlan(`${mod.id}`, 'modulo', moduleModifiers(config, mod.state), mod.state.gate_activo);
  }
  process.exit(0);
}

console.log(`\n📍 Proyecto: ${project.proyecto ?? '-'} · versión ${project.version_actual ?? '-'}`);
console.log(`   Perfil: ${perfilLabel(config.perfil.modificadores)}${config.perfil.confirmado ? '' : ' (⚠️ SIN CONFIRMAR: pregúntalo al Director Humano antes de G1)'} · capas activas: ${activeLayers(config).join(', ')}`);
console.log(`   Pista de proyecto/release: ${ICON[project.estado] ?? '⚪'} ${gateLabel(project)} · ${project.estado} · rol en turno: ${project.rol_en_turno}`);

// Git: cambios sin commit y commits sin publicar (los agentes tienden a olvidarlos).
try {
  const run = (args) => execSync(`git ${args}`, { cwd: rootDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const rama = run('rev-parse --abbrev-ref HEAD');
  const sucios = run('status --porcelain').split(/\r?\n/).filter((l) => l && !(l.startsWith('??') && !l.slice(3).replace(/^"|"$/g, '').includes('/'))).length;
  let publicar = '';
  try {
    const [ahead] = run('rev-list --left-right --count HEAD...@{u}').split(/\s+/);
    publicar = Number(ahead) > 0 ? ` · ⚠️ ${ahead} commit(s) sin publicar (el push requiere autorización del Director Humano)` : ' · sincronizada con remoto';
  } catch { publicar = ' · sin rama remota'; }
  console.log(`   Git: rama ${rama}${sucios ? ` · ⚠️ ${sucios} cambio(s) sin commit` : ' · sin cambios pendientes'}${publicar}`);
} catch { /* no es un repositorio Git */ }

if (modules.length === 0) {
  console.log('\n📦 Módulos: ninguno todavía. Crea el primero con: npm run new:module -- 01_nombre');
} else {
  const rows = modules.map((m) => m.error
    ? [m.id, '-', '❌ JSON inválido', '-', '-', '-', '-', '-']
    : [m.id, gateLabel(m.state), `${ICON[m.state.estado] ?? '⚪'} ${m.state.estado}`, m.state.rol_en_turno,
      m.state.responsable, m.state.rama, (m.state.depende_de ?? []).join(', ') || '-', (m.state.modificadores ?? []).join(', ') || '-']);
  const header = ['Módulo', 'Gate', 'Estado', 'Rol en turno', 'Responsable', 'Rama', 'Depende de', 'Modificadores'];
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  console.log(`\n📦 Módulos (${modules.length}):`);
  console.log(`   ${header.map((h, i) => pad(h, widths[i])).join('  ')}`);
  console.log(`   ${widths.map((w) => '─'.repeat(w)).join('  ')}`);
  for (const r of rows) console.log(`   ${r.map((c, i) => pad(c, widths[i])).join('  ')}`);

  const listos = modules.filter((m) => m.state?.estado === 'COMPLETADO' && m.state.incluido_en_release == null);
  if (listos.length) console.log(`\n🚀 Listos para el próximo release (superaron G4): ${listos.map((m) => m.id).join(', ')}`);
  const releases = new Map();
  for (const m of modules) {
    const v = m.state?.incluido_en_release;
    if (v) releases.set(v, [...(releases.get(v) ?? []), m.id]);
  }
  if (releases.size) {
    console.log('\n🏷️  Releases (versión → módulos incluidos):');
    for (const [v, ids] of releases) console.log(`   ${v}: ${ids.join(', ')}`);
  }
  const bloqueados = modules.filter((m) => m.state?.estado === 'BLOQUEADO');
  for (const m of bloqueados) console.log(`🔴 ${m.id} bloqueado: ${m.state.bloqueos.join('; ')}`);
  console.log('\n   Plan de un módulo (compuertas y entregables según el perfil): npm run status -- [XX_nombre]');
}

const { errors } = validateWorkflow(table, project, modules, config, profiles);
if (errors.length) {
  console.log(`\n⚠️  Incoherencias detectadas (${errors.length}). Ejecuta npm run validate:state para el detalle.`);
}
console.log('');
