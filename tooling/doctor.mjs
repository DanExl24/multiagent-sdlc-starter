#!/usr/bin/env node
/**
 * Comprueba las herramientas del stack (npm run doctor).
 *
 * Lee .workflow/project.json → herramientas (las declara el rol de fundación con el stack), ejecuta el
 * comando `comprobar` de cada una y avisa de los usos que el plan efectivo exige sin herramienta declarada
 * (columna Herramienta del catálogo, STAGE_GATES.md §7). No cambia nada: es lo mismo que `npm run gate`
 * comprueba en G2, para descubrir lo que falta antes de construir y no en G4.
 *
 *   npm run doctor               Plan de la línea base (todos los módulos con los modificadores del proyecto)
 *   npm run doctor -- 04_pagos   Plan de un módulo (con sus modificadores)
 */
import { loadStageGates } from './lib/stage-gates.mjs';
import { activeLayers, loadProjectConfig } from './lib/project-config.mjs';
import { loadProfiles, resolvePlan } from './lib/profiles.mjs';
import { loadModuleStates, moduleModifiers, projectModifiers } from './lib/workflow-state.mjs';
import { checkTools, gapLine, toolCoverageGaps, toolLine } from './lib/tools.mjs';

const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };
const table = loadStageGates();
const { config, errors } = loadProjectConfig();
if (errors.length) fail(`.workflow/project.json inválido:\n   - ${errors.join('\n   - ')}`);
const profiles = loadProfiles(table);
const modules = loadModuleStates();
const target = process.argv[2];
const mod = target ? modules.find((m) => m.id === target) : null;
if (target && !mod?.state) fail(`El módulo "${target}" no existe en .workflow/modules/.`);
const mods = mod ? moduleModifiers(config, mod.state) : projectModifiers(config, modules);
const plan = resolvePlan(table, profiles, { escala: config.perfil.escala, modificadores: mods, capas: activeLayers(config) });
if (plan.errors.length) fail(plan.errors.join(' '));

console.log(`\n🩺 Herramientas del stack · perfil: ${[config.perfil.escala, ...mods].join(' + ')}${mod ? ` · módulo ${mod.id}` : ''}\n`);
const huecos = toolCoverageGaps(table, plan.entregables, config);
const resultados = checkTools(config);
if (!resultados.length && !huecos.length) {
  console.log('   No hay herramientas declaradas y el plan no exige ninguna.');
  console.log('   El rol de fundación las declara con el stack en project.json → herramientas (Stack Selector).\n');
  process.exit(0);
}
for (const r of resultados) console.log(`   ${toolLine(r)}`);
for (const g of huecos) console.log(`   ${gapLine(g)}`);
const rotas = resultados.filter((r) => !r.ok);
if (rotas.length || huecos.length) {
  console.log(`\n   ${rotas.length ? `${rotas.length} sin instalar` : ''}${rotas.length && huecos.length ? ' · ' : ''}${huecos.length ? `${huecos.length} uso(s) sin herramienta: el Stack Selector la propone y el Director Humano la acepta` : ''}. npm run gate no pasa G2 hasta resolverlo.\n`);
  process.exit(1);
}
console.log(`\n   ✅ ${resultados.length} herramienta(s) instaladas y todos los usos del plan cubiertos.\n`);
