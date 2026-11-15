/**
 * Paquetes de trabajo del modo orquestado (ver .workflow/EXECUTION_MODES.md §3) y generación de encargos.
 *
 * Un encargo es la memoria temporal de un subagente: objetivo, Contrato de sus subroles, rutas exactas de
 * sus insumos, dónde puede escribir, verificación y formato de respuesta. Lo arma la herramienta a partir
 * de los datos del starter, así que redactarlo no cuesta tokens al orquestador.
 */
import fs from 'node:fs';
import path from 'node:path';
import { backticked, extractBlock, rootDir, tableRows } from './stage-gates.mjs';

export const EXECUTION_MODES_PATH = path.join(rootDir, '.workflow', 'EXECUTION_MODES.md');
export const ENCARGOS_DIR = path.join(rootDir, '.workflow', 'encargos');
export const MODOS = ['secuencial', 'orquestado'];

const allBackticked = (cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** @returns {Array<{id, compuertas: string[], capa: string|null, rol, subroles: string[], objetivo, insumos: string[], escribe, verificacion: string|null}>} */
export function loadWorkPackages(table, file = EXECUTION_MODES_PATH) {
  const markdown = fs.readFileSync(file, 'utf-8');
  let block;
  try {
    block = extractBlock(markdown, 'paquetes');
  } catch {
    throw new Error('No se encontraron los marcadores <!-- paquetes:start --> / <!-- paquetes:end --> en .workflow/EXECUTION_MODES.md');
  }
  return tableRows(block, 'paquetes').map((cells, i) => {
    if (cells.length < 9) throw new Error(`paquetes: la fila ${i + 1} tiene ${cells.length} columnas (se esperaban 9).`);
    const id = backticked(cells[0]);
    if (!id) throw new Error(`paquetes: la fila ${i + 1} no declara el ID entre acentos graves.`);
    const compuertas = cells[1].split(',').map((c) => c.trim()).filter(Boolean);
    for (const g of compuertas) if (!table.gates.some((x) => x.id === g)) throw new Error(`paquetes: "${id}" cita la compuerta "${g}", que no existe.`);
    const capa = backticked(cells[2]);
    if (capa && !['backend', 'frontend'].includes(capa)) throw new Error(`paquetes: "${id}" tiene una capa desconocida "${capa}".`);
    const rol = backticked(cells[3]);
    const subroles = allBackticked(cells[4]);
    for (const s of subroles) {
      if (!fs.existsSync(path.join(rootDir, 'multiAgents', rol, 'subroles', `${s}.md`))) throw new Error(`paquetes: "${id}" cita el subrol "${rol}/subroles/${s}.md", que no existe.`);
    }
    const verificacion = /^G\d[A-Z]?$/.test(cells[8].trim()) ? cells[8].trim() : null;
    return { id, compuertas, capa, rol, subroles, objetivo: cells[5], insumos: allBackticked(cells[6]), escribe: cells[7], verificacion };
  });
}

/** Solo la tabla del bloque "Contrato del Subrol" (sin la técnica de referencia). */
export function subroleContract(rol, subrol) {
  const text = fs.readFileSync(path.join(rootDir, 'multiAgents', rol, 'subroles', `${subrol}.md`), 'utf-8');
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^#{2,3}\s.*Contrato del Subrol/i.test(l));
  if (start < 0) return '(Este subrol no declara su Contrato.)';
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,3}\s/.test(line) || /^---\s*$/.test(line)) { if (rows.length) break; continue; }
    if (line.trim().startsWith('|')) rows.push(line.trim());
  }
  return rows.join('\n');
}

export function fillPaths(text, { modulo, config }) {
  return text
    .replace(/\{modulo\}/g, modulo)
    .replace(/\{contratos\}/g, config.rutas.contratos)
    .replace(/\{modulos_backend\}/g, config.capas.backend.modulos)
    .replace(/\{modulos_frontend\}/g, config.capas.frontend.modulos);
}

export const encargoId = (modulo, paquete) => `${modulo}-${paquete}`;

/** Texto del encargo de un paquete para un módulo. */
// Usos de herramienta (project.json → herramientas) que interesan a cada rol en su encargo.
const USOS_POR_ROL = {
  '03_backend_engineer': ['backend', 'datos'],
  '04_frontend_engineer': ['frontend'],
  '05_qa_security_tester': ['qa_api', 'qa_e2e', 'qa_carga', 'qa_seguridad'],
};

export function renderEncargo(pkg, { modulo, gateId, config, today }) {
  const id = encargoId(modulo, pkg.id);
  const usos = USOS_POR_ROL[pkg.rol] ?? [];
  const herramientas = (config.herramientas ?? []).filter((h) => usos.includes(h.uso));
  const insumos = pkg.insumos.map((p) => {
    const ruta = fillPaths(p, { modulo, config });
    return `- \`${ruta}\`${fs.existsSync(path.join(rootDir, ruta)) ? '' : ' (⚠️ no existe: avisa en tu respuesta, no lo inventes)'}`;
  });
  const comandos = pkg.verificacion ? (config.verificaciones?.[pkg.verificacion] ?? []) : [];
  const reglas = [
    'Contrato previo: no implementes nada que no esté en el contrato Zod; si falta algo, dilo en tu respuesta.',
    'Cero `any` en TypeScript: usa los tipos del contrato o `unknown` con narrowing.',
    ...(pkg.capa === 'backend' ? ['Sin SQL crudo: QueryBuilders u ORM tipados; los estados terminales rechazan mutaciones con 409.'] : []),
    ...(pkg.capa === 'frontend' ? ['Solo estilos del Design System (`docs/project/design-system.md`).'] : []),
    ...(pkg.rol === '05_qa_security_tester' ? ['QA no corrige código de producción: registra cada defecto con su severidad (S1 a S4) y su causa raíz.'] : []),
  ];
  return `# Encargo ${id}

> Generado por \`npm run plan:agentes\` el ${today} para la compuerta ${gateId} del módulo \`${modulo}\`.
> Memoria temporal: \`npm run gate\` lo borra al cerrar la compuerta. No lo edites ni lo versiones.

## Objetivo
${pkg.objetivo}.

## Cómo trabajar
- Sigue **solo** este encargo. No hagas el protocolo de aterrizaje de \`AGENTS.md\` ni leas otros documentos de gobernanza.
- No ejecutes \`npm run gate\` ni edites \`.workflow/\`: las transiciones las hace el orquestador.
- Escribe solo en: ${fillPaths(pkg.escribe, { modulo, config })}.
- Registra lo hecho en \`multiAgents/${pkg.rol}/worklog/${modulo}.md\` (una entrada breve).

## Reglas que aplican
${reglas.map((r) => `- ${r}`).join('\n')}

## Insumos (lee solo estos)
${insumos.join('\n')}

## Herramientas del stack
${herramientas.length
    ? `Usa estas (ADR del stack); \`npm run doctor\` comprueba que están instaladas:\n${herramientas.map((h) => `- **${h.nombre}** (${h.uso}): comprueba con \`${h.comprobar}\``).join('\n')}`
    : 'El stack no declara herramientas para tu rol. Usa las que ya trae el proyecto; si necesitas otra, dilo en tu respuesta en lugar de instalarla por tu cuenta.'}

## Contrato de tus subroles
${pkg.subroles.map((s) => `### ${s}\n${subroleContract(pkg.rol, s)}`).join('\n\n')}

## Antes de responder
${comandos.length ? `Ejecuta y deja en verde:\n${comandos.map((c) => `- \`${c.replace(/\{modulo\}/g, modulo)}\``).join('\n')}` : 'No hay comandos de verificación para este paquete: describe en tu respuesta cómo comprobaste el resultado.'}

## Tu respuesta (15 líneas como máximo)
Escríbela en \`.workflow/encargos/${id}.resultado.md\` y devuélvela al orquestador:
- **Resultado:** COMPLETO o INCOMPLETO
- **Archivos** creados o modificados
- **Verificación:** comando y resultado
- **Pruebas creadas:** ruta real y uso de cada suite (\`backend\`, \`datos\`, \`frontend\`, \`qa_api\`, \`qa_e2e\`, \`qa_carga\`, \`qa_seguridad\`); el orquestador las registra en el índice del módulo, tú no lo edites
- **Problemas abiertos** o dudas sobre el contrato (sin improvisar)
`;
}
