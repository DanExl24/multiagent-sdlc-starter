#!/usr/bin/env node
/**
 * Semáforo consolidado del proyecto (npm run status).
 * Es una vista generada: lee current_state.json y .workflow/modules/*.json y no escribe nada,
 * para que el estado global nunca sea un archivo que varias personas editen a la vez.
 */
import { loadStageGates } from './lib/stage-gates.mjs';
import { loadProjectConfig, activeLayers } from './lib/project-config.mjs';
import { loadProjectState, loadModuleStates, validateWorkflow } from './lib/workflow-state.mjs';

const table = loadStageGates();
const project = loadProjectState();
const modules = loadModuleStates();
const { config } = loadProjectConfig();
const byGate = new Map(table.stateful.map((g) => [g.gate, g]));

const ICON = { EN_PROCESO: '🟡', ESPERANDO_APROBACION_HUMANA: '🛑', BLOQUEADO: '🔴', COMPLETADO: '🟢' };
const gateLabel = (s) => byGate.get(s.gate_activo)?.id ?? s.gate_activo;
const pad = (text, width) => String(text).padEnd(width);

console.log(`\n📍 Proyecto: ${project.proyecto ?? '-'} · versión ${project.version_actual ?? '-'}`);
console.log(`   Capas activas: ${activeLayers(config).join(', ')}`);
console.log(`   Pista de proyecto/release: ${ICON[project.estado] ?? '⚪'} ${gateLabel(project)} · ${project.estado} · rol en turno: ${project.rol_en_turno}`);

if (modules.length === 0) {
  console.log('\n📦 Módulos: ninguno todavía. Crea el primero con: npm run new:module -- 01_nombre');
} else {
  const rows = modules.map((m) => m.error
    ? [m.id, '-', '❌ JSON inválido', '-', '-', '-', '-']
    : [m.id, gateLabel(m.state), `${ICON[m.state.estado] ?? '⚪'} ${m.state.estado}`, m.state.rol_en_turno,
      m.state.responsable, m.state.rama, (m.state.depende_de ?? []).join(', ') || '-']);
  const header = ['Módulo', 'Gate', 'Estado', 'Rol en turno', 'Responsable', 'Rama', 'Depende de'];
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  console.log(`\n📦 Módulos (${modules.length}):`);
  console.log(`   ${header.map((h, i) => pad(h, widths[i])).join('  ')}`);
  console.log(`   ${widths.map((w) => '─'.repeat(w)).join('  ')}`);
  for (const r of rows) console.log(`   ${r.map((c, i) => pad(c, widths[i])).join('  ')}`);

  const listos = modules.filter((m) => m.state?.estado === 'COMPLETADO' && m.state.incluido_en_release == null);
  if (listos.length) console.log(`\n🚀 Listos para el próximo release (superaron G4): ${listos.map((m) => m.id).join(', ')}`);
  const bloqueados = modules.filter((m) => m.state?.estado === 'BLOQUEADO');
  for (const m of bloqueados) console.log(`🔴 ${m.id} bloqueado: ${m.state.bloqueos.join('; ')}`);
}

const { errors } = validateWorkflow(table, project, modules, config);
if (errors.length) {
  console.log(`\n⚠️  Incoherencias detectadas (${errors.length}). Ejecuta npm run validate:state para el detalle.`);
}
console.log('');
