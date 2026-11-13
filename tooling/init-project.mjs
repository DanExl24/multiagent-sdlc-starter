#!/usr/bin/env node
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncPackageVersion } from './lib/package-version.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, defaultValue) {
  return new Promise((resolve) => {
    const promptText = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(promptText, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo no encontrado, no se personalizó: ${path.relative(rootDir, filePath)}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf-8');
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(regex, value);
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * El proyecto nuevo no hereda la historia del starter: su CHANGELOG, la bitácora del
 * orquestador, los fragmentos pendientes y los metadatos de package.json y package-lock.json
 * empiezan en v0.1.0. La versión del starter queda registrada como origen.
 */
function resetStarterHistory({ projectSlug, projectDesc, author, date }) {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const starter = `${pkg.name}@${pkg.version}`;
  Object.assign(pkg, { name: projectSlug, version: '0.1.0', description: projectDesc, author });
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const origin = `Proyecto inicializado con \`npm run init:project\` a partir de ${starter} (G0 Bootstrap).`;
  fs.writeFileSync(path.join(rootDir, 'CHANGELOG.md'), [
    '# 📝 Changelog',
    '',
    'Todos los cambios notables en este proyecto serán documentados en este archivo.',
    'El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y se adhiere a [Semantic Versioning](https://semver.org/lang/es/).',
    'Durante el desarrollo, los cambios se registran como fragmentos en `changelog.d/` y se consolidan en cada release con `npm run release:changelog`.',
    '',
    `## [0.1.0] - ${date}`,
    '',
    '### Added',
    `- ${origin}`,
    '',
  ].join('\n'));

  fs.writeFileSync(path.join(rootDir, 'multiAgents', '00_orchestrator', 'WORKLOG.md'), [
    '# 📝 WORKLOG — 00_ORCHESTRATOR',
    '',
    '## Bitácora de Acciones',
    `- **[Inicialización] (${date}):** ${origin} Línea base del proyecto en G1; sin módulos todavía.`,
    '',
  ].join('\n'));

  syncPackageVersion({ name: projectSlug, version: '0.1.0' });

  // La pista de proyecto también arranca en v0.1.0, sea cual sea la versión del starter.
  const statePath = path.join(rootDir, '.workflow', 'current_state.json');
  const projectState = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  projectState.version_actual = 'v0.1.0';
  fs.writeFileSync(statePath, `${JSON.stringify(projectState, null, 2)}\n`);

  for (const fragment of fs.existsSync(path.join(rootDir, 'changelog.d')) ? fs.readdirSync(path.join(rootDir, 'changelog.d')) : []) {
    if (fragment.endsWith('.md') && fragment !== 'README.md') fs.unlinkSync(path.join(rootDir, 'changelog.d', fragment));
  }
}

function listProfiles(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.json')).map((n) => n.replace(/\.json$/, '')).sort() : [];
}

/** ADR que justifica un perfil distinto de `standard` (exigido por validate:state). Devuelve su ruta relativa. */
function writeProfileAdr({ escala, modificadores, author, date }) {
  const adrDir = path.join(rootDir, 'docs', 'adrs');
  fs.mkdirSync(adrDir, { recursive: true });
  const numbers = fs.readdirSync(adrDir).map((n) => n.match(/^ADR-(\d+)/)?.[1]).filter(Boolean).map(Number);
  const num = String(Math.max(0, ...numbers) + 1).padStart(3, '0');
  const rel = `docs/adrs/ADR-${num}-perfil-del-proyecto.md`;
  const perfil = [escala, ...modificadores].join(' + ');
  fs.writeFileSync(path.join(rootDir, rel), [
    `# 🎚️ ADR-${num}: Perfil del proyecto (${perfil})`,
    '',
    '> **Estado:** PROPUESTO (lo firma el Director Humano junto con la línea base del proyecto)  ',
    `> **Fecha:** ${date}  `,
    `> **Autores:** ${author}  `,
    '> **Alcance:** proyecto',
    '',
    '---',
    '',
    '## 1. Contexto',
    '[Duración prevista, tamaño del equipo, criticidad y riesgos del dominio que motivan este perfil].',
    '',
    '## 2. Decisión',
    `- **Escala:** \`${escala}\`.`,
    `- **Modificadores de todo el proyecto:** ${modificadores.length ? modificadores.map((m) => `\`${m}\``).join(', ') : 'ninguno'}.`,
    '- El plan resultante (tipo de cada compuerta y entregables) se consulta con `npm run status -- proyecto` y `npm run status -- [XX_nombre]`.',
    '',
    '## 3. Consecuencias',
    '- **Positivas:** [Qué se gana: velocidad, menos firmas, más evidencia, etc.].',
    '- **Compromisos:** [Qué se acepta a cambio y cómo se mitiga].',
    '',
    '## 4. Revisión',
    'Cambiar la escala o los modificadores del proyecto requiere un ADR nuevo firmado por el Director Humano (ver `.workflow/PROFILES.md`).',
    '',
  ].join('\n'));
  return rel;
}

async function main() {
  console.log('\n================================================================');
  console.log('🤖  INICIALIZADOR DE PROYECTO MULTIAGENTE (SDLC STAGE-GATES)   ');
  console.log('================================================================\n');
  console.log('Este asistente configurará los documentos rectores y gobernanza');
  console.log('para tu nuevo proyecto.\n');

  const projectName = await ask('1. Nombre del Proyecto', 'MiNuevoProyecto');
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const projectDesc = await ask('2. Descripción breve', 'Aplicación empresarial construida con ingeniería multiagente');
  const projectDomain = await ask('3. Dominio de negocio (ej. Fintech, Salud, E-commerce, Educación)', 'SaaS General');
  const author = await ask('4. Autor u Organización', 'Equipo de Desarrollo');
  // El stack y la estructura de carpetas NO se preguntan aquí: los define el rol de fundación
  // (07_foundation_architect) cuando la idea de negocio ya está aprobada.
  const escalas = listProfiles(path.join(rootDir, '.workflow', 'profiles'));
  const disponibles = listProfiles(path.join(rootDir, '.workflow', 'profiles', 'modifiers'));
  // El perfil solo queda confirmado si la persona escribe la escala; con Enter se usa standard sin confirmar,
  // y el agente deberá confirmarlo con el Director Humano antes de superar G1 (validate:state lo exige).
  const escalaRaw = await ask(`5. Escala del proyecto (${escalas.join(', ')}; sprint para proyectos de unas 2 semanas). Escríbela para confirmarla`, '');
  let escala = escalaRaw || 'standard';
  let confirmado = Boolean(escalaRaw);
  if (!escalas.includes(escala)) {
    console.warn(`⚠️  La escala "${escala}" no existe; se usa "standard".`);
    escala = 'standard';
    confirmado = false;
  }
  const modsText = await ask(`6. Modificadores de riesgo de TODO el proyecto (${disponibles.join(', ')}); vacío si ninguno`, '');
  const modificadores = modsText.split(',').map((m) => m.trim()).filter(Boolean).filter((m) => {
    if (disponibles.includes(m)) return true;
    console.warn(`⚠️  El modificador "${m}" no existe y se omite.`);
    return false;
  });

  console.log('\n⚙️  Configurando archivos y artefactos de gobernanza...');

  const replacements = {
    PROJECT_NAME: projectName,
    PROJECT_SLUG: projectSlug,
    PROJECT_DESC: projectDesc,
    PROJECT_DOMAIN: projectDomain,
    AUTHOR: author,
    INIT_DATE: new Date().toLocaleDateString('sv-SE'),
  };

  // Reemplazar en archivos clave
  const filesToProcess = [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'AGENTS.md'),
    path.join(rootDir, 'README.md'),
    path.join(rootDir, 'LANDING_PROMPT.md'),
    path.join(rootDir, '.workflow', 'current_state.json'),
    path.join(rootDir, '.workflow', 'STAGE_GATES.md'),
    path.join(rootDir, 'multiAgents', '00_orchestrator', 'PROJECT_STATUS.md'),
    path.join(rootDir, 'docs', 'project', 'prd.md'),
    path.join(rootDir, 'docs', 'project', 'architecture.md'),
    path.join(rootDir, 'docs', 'project', 'design-system.md'),
    path.join(rootDir, 'docs', 'project', 'glossary.md'),
    path.join(rootDir, 'docs', 'project', 'repo-structure.md'),
    path.join(rootDir, 'docs', 'qa', 'index.md'),
    path.join(rootDir, 'multiAgents', '01_product_manager', 'subroles', '02_legal_domain_compliance.md'),
  ];

  for (const file of filesToProcess) {
    replaceInFile(file, replacements);
  }

  resetStarterHistory({ projectSlug, projectDesc, author, date: replacements.INIT_DATE });

  // Configuración del proyecto (.workflow/project.json). Las capas y rutas quedan con los valores
  // por defecto hasta que el rol de fundación defina el stack y la estructura.
  const projectConfig = {
    capas: {
      backend: { activa: true, raiz: 'backend', modulos: 'backend/src/modules' },
      frontend: { activa: true, raiz: 'frontend', modulos: 'frontend/src/modules' },
    },
    rutas: { contratos: 'docs/contracts' },
    perfil: { escala, modificadores, adr: null, confirmado },
    fundacion: { estado: 'PENDIENTE', stack: {}, adr_stack: null, adr_estructura: null },
  };
  if (escala !== 'standard' || modificadores.length > 0) {
    projectConfig.perfil.adr = writeProfileAdr({ escala, modificadores, author, date: replacements.INIT_DATE });
  }
  fs.writeFileSync(path.join(rootDir, '.workflow', 'project.json'), `${JSON.stringify(projectConfig, null, 2)}\n`);

  // Asegurar directorios requeridos
  const dirsToEnsure = [
    path.join(rootDir, 'docs', 'contracts'),
    path.join(rootDir, 'docs', 'adrs'),
    path.join(rootDir, 'docs', 'modules'),
    path.join(rootDir, 'docs', 'qa'),
    path.join(rootDir, 'docs', 'walkthroughs'),
    path.join(rootDir, '.workflow', 'modules'),
    path.join(rootDir, 'changelog.d'),
  ];

  for (const dir of dirsToEnsure) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log('✅ Archivos configurados con éxito.');
  console.log('\n================================================================');
  console.log('🚀  PROYECTO INICIALIZADO: ' + projectName);
  console.log('================================================================\n');
  console.log('📋  PROMPT DE ATERRIZAJE PARA TU PRIMERA IA (Copia y Pega):');
  console.log('----------------------------------------------------------------');
  console.log(`Hola. Estás iniciando sesión en el proyecto "${projectName}" (${projectDomain}).`);
  console.log('Este repositorio se rige bajo la metodología estricta de:');
  console.log('"SDLC Multiagente Guiado por Artefactos y Compuertas de Calidad (Stage-Gates)".');
  console.log('Tu lectura obligatoria e inmutable de aterrizaje es AGENTS.md.');
  console.log('Ejecuta npm run status y consulta .workflow/current_state.json para conocer la fase activa,');
  console.log('asume el rol correspondiente y preséntate como el Agente en turno.');
  console.log('----------------------------------------------------------------\n');
  console.log('💡  Próximo paso: Inicia tu primer chat con tu IA favorita pegando el prompt anterior.');
  console.log('🏗️  Cuando el PRD esté aprobado, el rol de fundación (multiAgents/07_foundation_architect/) definirá el stack y la estructura de carpetas.');
  console.log('📦  Con la línea base aprobada, crea cada módulo con: npm run new:module -- 01_nombre\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error al inicializar el proyecto:', err);
  rl.close();
  process.exit(1);
});
