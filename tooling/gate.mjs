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
 *   npm run gate -- <modulo> reabrir --desde <Gx> --motivo "..." --cita "..."  Rehace un módulo ya COMPLETADO
 *
 * En la pista de proyecto, `aprobar` en G6 abre el siguiente release (vuelve a G5); con --cerrar marca COMPLETADO.
 * `solicitar` y `avanzar` exigen que no haya cambios sin commit; `solicitar` guarda el commit revisado y `aprobar`
 * se niega si los entregables cambiaron desde entonces (se vuelve a `solicitar`). Cada transición hace commit de
 * su archivo de estado y, si ese commit falla, se deshace. Nada avanza sin `npm run init:project` (G0).
 * En G4 de un módulo, `solicitar` y `avanzar` exigen además la sección 0 del QA_REPORT, con su resumen verificable en cero.
 * Tras cada transición se imprime un prompt de continuación para abrir una conversación nueva (AGENTS.md §5.1).
 * Antes de `avanzar` o `solicitar`, la verificación previa comprueba los entregables con ruta fija (STAGE_GATES.md §7)
 * y ejecuta los comandos de `verificaciones` del project.json para esa compuerta (obligatorios en G3A y G3B).
 * En G2 comprueba además las herramientas del stack (project.json → herramientas), como npm run doctor, y en las
 * compuertas que exigen pruebas, que el índice del módulo las registre con rutas reales (tabla "Pruebas del módulo").
 * El push a remoto nunca lo hace el comando: requiere autorización explícita del Director Humano.
 *
 * Cada cambio se valida con las mismas reglas que `npm run validate:state`; si algo no cuadra,
 * el archivo queda como estaba y se explica por qué.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadStageGates, rootDir, USOS_HERRAMIENTA } from './lib/stage-gates.mjs';
import { activeLayers, loadProjectConfig } from './lib/project-config.mjs';
import { missingDeliverables, runVerifications, testIndexGaps } from './lib/preflight.mjs';
import { checkTools, gapLine, toolCoverageGaps, toolLine } from './lib/tools.mjs';
import { ENCARGOS_DIR } from './lib/work-packages.mjs';
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
const plan = resolvePlan(table, profiles, { escala: config.perfil.escala, modificadores: mods, capas: activeLayers(config) });
if (plan.errors.length) fail(plan.errors.join(' '));
const track = gatesForTrack(table, isProject ? 'proyecto' : 'modulo', config, plan.tipos);
const idx = track.findIndex((g) => g.gate === state.gate_activo);
const current = track[idx];
if (!current) fail(`${state.gate_activo} no pertenece a la pista ${pista}. Ejecuta npm run validate:state.`);

// G0 Bootstrap: sin init:project, el proyecto conserva el nombre, la versión y el CHANGELOG del starter.
const proyectoBase = isProject ? state : loadProjectState();
if (accion !== 'estado' && /\{\{[A-Z_]+\}\}/.test(`${proyectoBase.proyecto ?? ''} ${proyectoBase.dominio ?? ''}`)) {
  fail('El proyecto no está inicializado (G0 Bootstrap): .workflow/current_state.json conserva los marcadores del starter ({{PROJECT_NAME}}) y, con ellos, su versión y su CHANGELOG. Ejecuta primero npm run init:project.');
}

const TIPO = { halt: '🛑 Halt', checkpoint: '⚡ Checkpoint' };
const today = new Date().toLocaleDateString('sv-SE');
const gitUser = () => { try { return execSync('git config user.name', { cwd: rootDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const autor = typeof opts.autor === 'string' ? opts.autor : (state.rol_en_turno ?? gitUser() ?? 'desconocido');

function rolFor(gate) {
  if (isProject && gate.id === 'G2' && config.fundacion?.estado !== 'COMPLETADA') return '07_foundation_architect';
  return gate.rol;
}

function record({ to = current, estado, motivo, extra = {} }) {
  // marca (fecha y hora) y modo permiten medir el tiempo entre transiciones y comparar modos (EXECUTION_MODES.md §4).
  state.historial_transiciones.push({ de: state.fase_activa, a: to.fase, fecha: today, marca: new Date().toISOString(), modo: config.ejecucion.modo, autor, accion, motivo, ...extra });
  state.fase_activa = to.fase;
  state.gate_activo = to.gate;
  state.estado = estado;
  if (to !== current) state.rol_en_turno = rolFor(to);
  if ('fecha_actualizacion' in state) state.fecha_actualizacion = today;
}

function git(args) {
  return execSync(`git ${args}`, { cwd: rootDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const isGitRepo = (() => { try { return git('rev-parse --is-inside-work-tree') === 'true'; } catch { return false; } })();

/** Cambios sin commit, salvo archivos sueltos sin seguimiento en la raíz (notas personales, PDFs). */
function uncommittedChanges() {
  if (!isGitRepo) return [];
  return git('status --porcelain').split(/\r?\n/).filter(Boolean)
    .filter((line) => !(line.startsWith('??') && !line.slice(3).replace(/^"|"$/g, '').includes('/')));
}

const headCommit = () => { if (!isGitRepo) return null; try { return git('rev-parse HEAD'); } catch { return null; } };

/** Commit del archivo de estado. Si Git falla, la transición se deshace: estado en disco y en Git nunca divergen. */
function commitStateFile(relFile, message) {
  if (!isGitRepo) return null;
  try {
    git(`add -- "${relFile}"`);
    git(`commit -q -m "${message.replace(/"/g, '\\"')}" -- "${relFile}"`);
    return git('log -1 --format=%h');
  } catch (err) {
    fs.writeFileSync(file, original);
    try { git(`reset -q -- "${relFile}"`); } catch { /* sin nada que deshacer en el índice */ }
    fail(`No se pudo hacer commit de la transición (${err.message.split('\n')[0]}). La transición se deshizo y el estado quedó como estaba: resuelve el problema de Git y repite el comando.`);
  }
}

/** Archivos que cambiaron desde el commit en que se solicitó la firma (sin contar los archivos de estado). */
function changesSince(commit) {
  let cambios;
  try {
    cambios = git(`diff --name-only ${commit} HEAD`).split(/\r?\n/).filter(Boolean);
  } catch {
    fail(`No encuentro el commit ${commit.slice(0, 7)} en el que se solicitó la firma (¿se reescribió el historial?). Vuelve a solicitarla: npm run gate -- ${pista} solicitar`);
  }
  const pendientes = uncommittedChanges().map((line) => line.slice(3).replace(/^"|"$/g, ''));
  return [...new Set([...cambios, ...pendientes])]
    .filter((f) => f !== '.workflow/current_state.json' && !f.startsWith('.workflow/modules/'));
}

// Indicadores de la tabla "0. Resumen verificable" del QA_REPORT: todos deben valer 0 para pedir G4.
const QA_INDICADORES = ['Defectos S1 abiertos', 'Defectos S2 abiertos', 'Requisitos aprobados no cumplidos', 'Pruebas omitidas sin evidencia'];

// G4: el QA_REPORT más reciente del módulo debe traer la sección 0 de la plantilla
// (QA_REPORT_TEMPLATE.md), que el Director Humano revisa antes de firmar, y su resumen verificable.
function qaReportGaps(moduleId) {
  const dir = path.join(rootDir, 'docs', 'qa', moduleId);
  const reports = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'QA_REPORT.md') reports.push(p);
    }
  };
  walk(dir);
  if (!reports.length) return { report: null, gaps: [`No existe docs/qa/${moduleId}/[vX.Y.Z]/QA_REPORT.md.`] };
  const ver = (p) => (path.relative(dir, p).match(/v?(\d+)\.(\d+)\.(\d+)/) ?? [0, 0, 0, 0]).slice(1).map(Number);
  reports.sort((a, b) => { const x = ver(a); const y = ver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; });
  const text = fs.readFileSync(reports[0], 'utf-8');
  const gaps = [];
  const bloqueos = [];
  for (const label of QA_INDICADORES) {
    const m = text.match(new RegExp(`^\\|\\s*\\**${label}\\**\\s*\\|\\s*\\**(\\d+)\\**\\s*\\|`, 'im'));
    if (!m) gaps.push(`Falta el indicador "${label}" con un número en la tabla "0. Resumen verificable".`);
    else if (Number(m[1]) > 0) bloqueos.push(`${label}: ${m[1]}`);
  }
  if (!/^#{2,4}\s*0\.1\.?\s.*requisitos aprobados no cumplidos/im.test(text)) gaps.push('Falta la sección "0.1. Requisitos aprobados no cumplidos" (escribe "Ninguno" si no hay).');
  if (!/^#{2,4}\s*0\.2\.?\s.*limitaciones de entorno/im.test(text)) gaps.push('Falta la sección "0.2. Limitaciones de entorno" (con evidencia de cada prueba no ejecutada, o "Ninguna").');
  if (/\[RNF-XX-NN\]/.test(text)) gaps.push('La sección 0.1 conserva la fila de ejemplo de la plantilla ([RNF-XX-NN]).');
  return { report: path.relative(rootDir, reports[0]).split(path.sep).join('/'), gaps, bloqueos };
}

/**
 * Verificación previa de la compuerta en curso: entregables con ruta fija y comandos de verificación.
 * Devuelve la evidencia que queda en el historial; si algo falla, la transición no se aplica.
 */
function preflight() {
  const version = loadProjectState().version_actual ?? '';
  const modulo = isProject ? '' : pista;
  const faltan = missingDeliverables(table, plan.entregables, { gateId: current.id, pistas: isProject ? ['proyecto', 'release'] : ['modulo'], modulo, version });
  if (faltan.length) {
    fail(`Faltan entregables de ${current.id} (STAGE_GATES.md §7, columna "Ruta comprobada"):\n   ${faltan.map((f) => `${f.id}: ${f.ruta}`).join('\n   ')}`);
  }
  if (!isProject) {
    const { file: indice, gaps: pruebas } = testIndexGaps(table, plan.entregables, { gateId: current.id, modulo, usosValidos: USOS_HERRAMIENTA });
    if (pruebas.length) {
      fail(`Las pruebas de ${current.id} no están registradas en ${indice} (tabla "Pruebas del módulo", STAGE_GATES.md §2.5):\n   ${pruebas.join('\n   ')}\nAñade una fila por suite con su ruta real y el uso que ejercita, por ejemplo:\n   | Integración API | \`backend/tests/integration/${modulo}.test.ts\` | \`datos\` | ${current.id} |`);
    }
  }
  // Línea base de G2: el último alto antes de construir. El Director Humano elige el modo de ejecución.
  if (isProject && current.id === 'G2' && !config.ejecucion.confirmado) {
    fail(`Antes de construir, el Director Humano elige el modo de ejecución (.workflow/EXECUTION_MODES.md §1.1). Dile si tu herramienta puede lanzar subagentes, preséntale la tabla de §1 (secuencial u orquestado: para qué sirve cada uno y cuánto cuesta) y registra su respuesta en .workflow/project.json:\n   "ejecucion": { "modo": "secuencial" | "orquestado", "max_subagentes": 3, "confirmado": true }\nHaz commit y repite "${accion}". Actual: "${config.ejecucion.modo}", sin confirmar.`);
  }
  const previas = current.id === 'G2' ? herramientasDelStack() : [];
  const comandos = config.verificaciones?.[current.id] ?? [];
  const capa = table.capas.get(current.id);
  // Una compuerta que normalmente exige firma y aquí pasa como Checkpoint (perfil sin producción): las verificaciones sustituyen a la firma.
  const sinFirma = current.tipo === 'checkpoint' && table.invariantes.some((inv) => inv.regla === 'halt_si_produccion' && inv.ids.includes(current.id));
  if (!comandos.length) {
    if (capa) {
      fail(`${current.id} construye la capa ${capa} y exige verificaciones ejecutables en .workflow/project.json, por ejemplo:\n   "verificaciones": { "${current.id}": ["npm test --prefix ${config.capas[capa].raiz}", "npm run check:no-any"] }\nLas define el rol de fundación junto con el stack (o el rol en turno, si faltan). Sin ellas, "${accion}" no puede comprobar que todo está en verde.`);
    }
    if (sinFirma) {
      fail(`${current.id} pasa sin firma humana en el perfil "${config.perfil.escala}", así que exige verificaciones ejecutables que la sustituyan en .workflow/project.json, por ejemplo:\n   "verificaciones": { "${current.id}": ["npm test", "npm run build", "npm run check:no-any"] }`);
    }
    return previas;
  }
  console.log(`🔎 Verificaciones de ${current.id}:`);
  const resultados = runVerifications(comandos, { modulo, version });
  for (const r of resultados) console.log(`   ${r.resultado === 'PASS' ? '✅' : '❌'} ${r.comando} (${r.segundos} s)`);
  const fallo = resultados.find((r) => r.resultado === 'FAIL');
  if (fallo) {
    fail(`La verificación "${fallo.comando}" falló, así que ${current.id} no puede ${accion === 'avanzar' ? 'avanzar' : 'solicitarse'}. Últimas líneas:\n${fallo.salida.split('\n').map((l) => `   ${l}`).join('\n')}`);
  }
  return [...previas, ...resultados.map(({ comando, resultado, segundos }) => ({ comando, resultado, segundos }))];
}

/**
 * G2 (línea base y módulos): el stack declara una herramienta por cada uso que exige el plan efectivo
 * (columna Herramienta del catálogo) y todas las declaradas están instaladas. Lo mismo que npm run doctor.
 */
function herramientasDelStack() {
  const huecos = toolCoverageGaps(table, plan.entregables, config);
  if (huecos.length) {
    fail(`El stack no declara herramientas para todo lo que exige el plan (STAGE_GATES.md §2.5):\n   ${huecos.map(gapLine).join('\n   ')}\nEl rol de fundación (Stack Selector) las propone y el Director Humano las acepta; se declaran en .workflow/project.json → herramientas, una por uso:\n   { "nombre": "k6", "uso": "qa_carga", "comprobar": "k6 version", "instalar": "cómo instalarla" }\nSi el perfil vuelve opcional un entregable, su herramienta deja de exigirse.`);
  }
  const resultados = checkTools(config);
  if (resultados.length) {
    console.log(`🩺 Herramientas del stack (${current.id}):`);
    for (const r of resultados) console.log(`   ${toolLine(r)}`);
  }
  const rotas = resultados.filter((r) => !r.ok);
  if (rotas.length) {
    fail(`Faltan herramientas del stack en este entorno: ${rotas.map((r) => r.nombre).join(', ')}. Instálalas (arriba está cómo) y repite; npm run doctor las comprueba sin cambiar el estado.`);
  }
  return resultados.map((r) => ({ comando: r.comprobar, resultado: 'PASS', segundos: r.segundos }));
}

/**
 * Primera compuerta de release (G5): un perfil sin producción no la abre, y ningún módulo cerrado
 * sin la firma de G4 (spike) entra en un release sin reabrirse desde G4.
 */
function releaseGuard() {
  if (!isProject || current !== track.find((g) => g.niveles.includes('release'))) return;
  const reabrir = 'npm run gate -- [XX_nombre] reabrir --desde G4 --motivo "promoción del spike" --cita "..."';
  if (!plan.produccion) {
    fail(`El perfil "${config.perfil.escala}" no llega a producción: no hay release. Para publicar, el Director Humano cambia la escala con un ADR nuevo (PROFILES.md §3) y cada módulo se reabre desde G4 para que QA lo certifique:\n   ${reabrir}`);
  }
  const sinFirma = modules
    .filter((m) => m.state?.estado === 'COMPLETADO' && m.state.incluido_en_release == null && m.state.historial_transiciones?.at(-1)?.accion === 'avanzar')
    .map((m) => m.id);
  if (sinFirma.length) {
    fail(`Estos módulos se cerraron sin la firma de G4 (perfil sin producción) y no pueden entrar en un release: ${sinFirma.join(', ')}. Reábrelos desde G4:\n   ${reabrir}`);
  }
}

/** Los entregables van en un commit antes de cualquier transición que los dé por buenos. */
function exigirArbolLimpio() {
  const pendientes = uncommittedChanges();
  if (pendientes.length) {
    const para = accion === 'avanzar' ? `avanzar ${current.id}` : `pedir la firma de ${current.id}`;
    fail(`Hay cambios sin commit. Haz commit de los entregables de ${current.id} en la rama antes de ${para} (GIT_COMMIT_CONVENTION.md §1.1):\n   ${pendientes.slice(0, 10).join('\n   ')}${pendientes.length > 10 ? `\n   … y ${pendientes.length - 10} más` : ''}`);
  }
}

/**
 * G4 de un módulo: la sección 0 del QA_REPORT se exige para pedir la firma y también para cerrar sin ella,
 * siempre que el perfil pida el reporte completo (qa_report) o su versión reducida a la sección 0 (qa_resumen, spike).
 */
function exigirReporteQa() {
  if (isProject || current.id !== 'G4') return;
  if (!plan.entregables.has('qa_report') && !plan.entregables.has('qa_resumen')) return;
  const { report, gaps, bloqueos } = qaReportGaps(pista);
  const para = accion === 'avanzar' ? 'cerrar G4' : 'la firma de G4';
  if (gaps.length) fail(`El reporte de QA no está listo para ${para} (QA_REPORT_TEMPLATE.md, sección 0)${report ? ` en ${report}` : ''}:\n   ${gaps.join('\n   ')}`);
  if (bloqueos.length) {
    fail(`G4 no ${accion === 'avanzar' ? 'avanza' : 'se solicita'} con ${bloqueos.join(', ')} (${report}). Es un veto de QA: npm run gate -- ${pista} volver G3A|G3B --motivo "...". Una prueba omitida se ejecuta o se documenta con su evidencia; un requisito incumplido solo se reevalúa si el Director Humano lo cambia de forma explícita.`);
  }
}

/** Verificación previa y comprobación de que no dejó archivos versionados modificados. */
function verificarSinEnsuciar() {
  const evidencias = preflight();
  const sucios = uncommittedChanges();
  if (sucios.length) {
    fail(`Las verificaciones modificaron archivos versionados (${sucios.slice(0, 5).join(', ')}). Añade esas salidas a .gitignore o haz commit, y vuelve a ${accion === 'avanzar' ? 'avanzar' : 'solicitar'}.`);
  }
  return evidencias;
}

/** Prompt de una o dos líneas para seguir en una conversación nueva (AGENTS.md §5.1). */
function promptContinuacion(gateAhora) {
  const ref = isProject ? 'la pista de proyecto' : `el módulo ${pista}`;
  if (state.estado === 'ESPERANDO_APROBACION_HUMANA') {
    return `Lee AGENTS.md. Soy el Director Humano y apruebo ${gateAhora.id} ${isProject ? 'de la pista de proyecto' : `del módulo ${pista}`}: "<tus palabras>". Registra la firma con npm run gate -- ${pista} aprobar --cita "<mis palabras>" y sigue con la compuerta siguiente.`;
  }
  if (state.estado !== 'EN_PROCESO') return null;
  const orquestado = config.ejecucion.modo === 'orquestado' && !isProject
    ? ` Eres el orquestador: ejecuta npm run plan:agentes -- ${pista} y lanza un subagente por encargo.`
    : '';
  return `Lee AGENTS.md y aterriza en ${ref}: ${gateAhora.id} (${TIPO[gateAhora.tipo]}), rol ${state.rol_en_turno}. Empieza con npm run status -- ${pista}.${orquestado}`;
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
      ESPERANDO_APROBACION_HUMANA: 'aprobar --cita "...", solicitar (de nuevo, si cambiaron los entregables), bloquear, volver',
      BLOQUEADO: 'desbloquear, volver',
      COMPLETADO: isProject ? '—' : 'reabrir --desde Gx --motivo "..." --cita "..." (solo ante inconsistencias graves; STAGE_GATES.md §2.4)',
    };
    console.log(`Acciones posibles: ${acciones[state.estado] ?? '—'}`);
    const prompt = promptContinuacion(current);
    if (prompt) console.log(`📋 Prompt para seguir en una conversación nueva:\n   ${prompt}`);
    console.log('');
    process.exit(0);
  }
  case 'solicitar': {
    const resolicitud = state.estado === 'ESPERANDO_APROBACION_HUMANA';
    if (state.estado !== 'EN_PROCESO' && !resolicitud) fail(`Solo se pide firma desde EN_PROCESO (estado actual: ${state.estado}).`);
    if (current.tipo !== 'halt') fail(`${current.id} es un Checkpoint en el perfil activo: no se pide firma, se usa "avanzar" cuando todo está en verde.`);
    releaseGuard();
    exigirArbolLimpio();
    exigirReporteQa();
    const evidencias = verificarSinEnsuciar();
    const commit = headCommit();
    record({
      estado: 'ESPERANDO_APROBACION_HUMANA',
      motivo: opts.nota || (resolicitud
        ? `Nueva solicitud de firma de ${current.id}: los entregables cambiaron durante la revisión.`
        : `Entregables de ${current.id} listos; se solicita la firma del Director Humano.`),
      extra: { ...(commit ? { commit } : {}), ...(evidencias.length ? { verificaciones: evidencias } : {}) },
    });
    sessionEnd = true;
    break;
  }
  case 'aprobar': {
    if (state.estado !== 'ESPERANDO_APROBACION_HUMANA') fail(`Solo se aprueba una firma solicitada (estado actual: ${state.estado}). Primero: npm run gate -- ${pista} solicitar`);
    const cita = requireText('cita', 'las palabras exactas del Director Humano');
    // La firma cubre lo que se revisó: si los entregables cambiaron después de solicitarla, hay que volver a pedirla.
    const solicitud = [...state.historial_transiciones].reverse().find((h) => h.accion === 'solicitar');
    if (solicitud?.commit && isGitRepo) {
      const cambios = changesSince(solicitud.commit);
      if (cambios.length) {
        fail(`Los entregables cambiaron después de solicitar la firma, así que la firma no cubriría lo revisado:\n   ${cambios.slice(0, 10).join('\n   ')}${cambios.length > 10 ? `\n   … y ${cambios.length - 10} más` : ''}\nHaz commit de los cambios, vuelve a solicitar (npm run gate -- ${pista} solicitar) y pide al Director Humano que revise lo nuevo.`);
      }
    }
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
    releaseGuard();
    exigirArbolLimpio();
    exigirReporteQa();
    const evidencias = verificarSinEnsuciar();
    const extra = evidencias.length ? { verificaciones: evidencias } : {};
    next = track[idx + 1];
    if (next) {
      record({ to: next, estado: 'EN_PROCESO', motivo: opts.nota || `Checkpoint ${current.id} superado: verificación previa en verde.`, extra });
    } else if (isProject && !opts.cerrar) {
      // Última compuerta del release como Checkpoint (por ejemplo, G6 en sprint): comienza el siguiente release.
      next = track.find((g) => g.niveles.includes('release'));
      record({ to: next, estado: 'EN_PROCESO', motivo: opts.nota || `Checkpoint ${current.id} superado: comienza el siguiente release.`, extra });
    } else {
      record({
        estado: 'COMPLETADO',
        motivo: opts.nota || (isProject
          ? `Checkpoint ${current.id} superado: proyecto cerrado.`
          : `Checkpoint ${current.id} superado sin firma humana (perfil ${config.perfil.escala}): módulo listo para fusionar a main. No entra en un release sin reabrirse desde G4.`),
        extra,
      });
    }
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
  case 'reabrir': {
    // Rehacer un módulo ya cerrado cuando aparecen inconsistencias graves (STAGE_GATES.md §2.4).
    if (isProject) fail('Solo se reabren módulos. La pista de proyecto avanza por releases.');
    if (state.estado !== 'COMPLETADO') fail(`Solo se reabre un módulo COMPLETADO (estado actual: ${state.estado}). Para retroceder dentro del ciclo usa "volver".`);
    const target = track.find((g) => g.id === opts.desde);
    if (!target) fail(`Indica desde qué compuerta se rehace (${track.map((g) => g.id).join(', ')}): npm run gate -- ${pista} reabrir --desde G3B --motivo "..." --cita "..."`);
    const motivo = requireText('motivo', 'el motivo de la reapertura (hallazgo, severidad y origen)');
    const cita = requireText('cita', 'la autorización del Director Humano');
    if (state.incluido_en_release) {
      state.releases_previos = [...(state.releases_previos ?? []), state.incluido_en_release];
      state.incluido_en_release = null;
    }
    state.bloqueos = [];
    next = target;
    record({ to: target, estado: 'EN_PROCESO', motivo: `Reapertura desde ${target.id}: ${motivo}`, extra: { cita } });
    if (target === current) state.rol_en_turno = rolFor(target);
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

// Memoria temporal del modo orquestado: al cerrar la compuerta de un módulo, sus encargos ya no sirven.
function limpiarEncargos() {
  if (isProject || !fs.existsSync(ENCARGOS_DIR)) return 0;
  const cerrada = now.id !== current.id || state.estado === 'COMPLETADO';
  if (!cerrada) return 0;
  const propios = fs.readdirSync(ENCARGOS_DIR).filter((f) => f.startsWith(`${pista}-`));
  for (const f of propios) fs.rmSync(path.join(ENCARGOS_DIR, f), { force: true });
  return propios.length;
}

// La transición queda en Git: commit solo del archivo de estado (los entregables ya se commitearon antes).
const version = loadProjectState().version_actual ?? 'v0.0.0';
const relFile = path.relative(rootDir, file).split(path.sep).join('/');
const committed = commitStateFile(relFile, `[${version.startsWith('v') ? version : `v${version}`}] chore(workflow): ${pista} ${accion} ${current.id}${now.id !== current.id ? ` -> ${now.id}` : ''}`);
console.log(`✅ ${pista}: ${now.id} ${TIPO[now.tipo]} · ${state.estado} · rol en turno: ${state.rol_en_turno}`);
if (committed) console.log(`📝 Commit de la transición: ${committed}`);
const encargosBorrados = limpiarEncargos();
if (encargosBorrados) console.log(`🧹 Encargos de ${pista} borrados: ${encargosBorrados} (memoria temporal del modo orquestado).`);

if ((accion === 'aprobar' || accion === 'avanzar') && !isProject && state.estado === 'COMPLETADO') {
  console.log(`🔀 Pendiente: fusionar ${state.rama} en main (${accion === 'avanzar' ? 'G4 superado con verificaciones; sin firma humana, el módulo no entra en un release' : 'G4 lo autoriza'}). El push a remoto requiere la autorización explícita del Director Humano.`);
}
if (accion === 'aprobar' && isProject && current.niveles.includes('release') && current === track.find((g) => g.niveles.includes('release'))) {
  console.log('🚀 Pendiente: publicar main y el tag del release (git push origin main --tags) cuando el Director Humano lo autorice explícitamente.');
}
if (sessionEnd) {
  console.log('🛑 Alto obligatorio: termina tu turno sin empezar la compuerta siguiente y espera la firma del Director Humano. Cuando firme, registra "aprobar"; la compuerta siguiente puede seguir en esta misma conversación (AGENTS.md §5.1).');
} else if (next) {
  console.log(`➡️  Siguiente trabajo: ${now.id} con ${state.rol_en_turno}. Puede seguir en esta conversación; conviene una nueva si el contexto ya es largo o si la compuerta construye código (AGENTS.md §5.1).`);
  if (config.ejecucion.modo === 'orquestado' && !isProject) console.log(`🧩 Modo orquestado: npm run plan:agentes -- ${pista} para ver los subagentes recomendados.`);
}
const prompt = promptContinuacion(now);
if (prompt && (sessionEnd || next)) console.log(`📋 Prompt para seguir en una conversación nueva (inclúyelo en tu mensaje final):\n   ${prompt}`);
