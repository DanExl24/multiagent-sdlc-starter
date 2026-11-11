#!/usr/bin/env node
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * orquestador, el historial de la matriz de versiones y los metadatos de package.json
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

  const matrixPath = path.join(rootDir, 'docs', 'project', 'version-matrix.md');
  if (fs.existsSync(matrixPath)) {
    const matrix = fs.readFileSync(matrixPath, 'utf-8');
    const marker = matrix.search(/^## 3\. Registro Histórico/m);
    if (marker !== -1) {
      const head = matrix.slice(0, marker);
      fs.writeFileSync(matrixPath, `${head}## 3. Registro Histórico de Entregas por Versión\n- **v0.1.0** (${date}): ${origin}\n`);
    }
  }

  for (const fragment of fs.existsSync(path.join(rootDir, 'changelog.d')) ? fs.readdirSync(path.join(rootDir, 'changelog.d')) : []) {
    if (fragment.endsWith('.md') && fragment !== 'README.md') fs.unlinkSync(path.join(rootDir, 'changelog.d', fragment));
  }
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
  const backendStack = await ask('4. Stack Backend preferido', 'Express + TypeScript + Kysely + PostgreSQL');
  const frontendStack = await ask('5. Stack Frontend preferido', 'Vue 3 + Pinia + TailwindCSS + Vite');
  const author = await ask('6. Autor u Organización', 'Equipo de Desarrollo');
  const capasText = await ask('7. Capas del proyecto (backend, frontend o ambas, separadas por coma)', 'backend,frontend');
  const capas = capasText.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  const backendRoot = capas.includes('backend') ? await ask('8. Carpeta raíz del backend', 'backend') : 'backend';
  const frontendRoot = capas.includes('frontend') ? await ask('9. Carpeta raíz del frontend', 'frontend') : 'frontend';

  console.log('\n⚙️  Configurando archivos y artefactos de gobernanza...');

  const replacements = {
    PROJECT_NAME: projectName,
    PROJECT_SLUG: projectSlug,
    PROJECT_DESC: projectDesc,
    PROJECT_DOMAIN: projectDomain,
    BACKEND_STACK: backendStack,
    FRONTEND_STACK: frontendStack,
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
    path.join(rootDir, 'docs', 'project', 'version-matrix.md'),
    path.join(rootDir, 'docs', 'project', 'glossary.md'),
    path.join(rootDir, 'docs', 'qa', 'index.md'),
    path.join(rootDir, 'multiAgents', '01_product_manager', 'subroles', '02_legal_domain_compliance.md'),
  ];

  for (const file of filesToProcess) {
    replaceInFile(file, replacements);
  }

  resetStarterHistory({ projectSlug, projectDesc, author, date: replacements.INIT_DATE });

  // Estructura de carpetas del proyecto: la leen el validador y el tooling (.workflow/project.json)
  const projectConfig = {
    capas: {
      backend: { activa: capas.includes('backend'), raiz: backendRoot, modulos: `${backendRoot}/src/modules` },
      frontend: { activa: capas.includes('frontend'), raiz: frontendRoot, modulos: `${frontendRoot}/src/modules` },
    },
    rutas: { contratos: 'docs/contracts' },
  };
  if (!projectConfig.capas.backend.activa && !projectConfig.capas.frontend.activa) {
    console.warn('⚠️  No se declaró ninguna capa válida; se activan backend y frontend por defecto.');
    projectConfig.capas.backend.activa = true;
    projectConfig.capas.frontend.activa = true;
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
    ...['backend', 'frontend'].filter((c) => projectConfig.capas[c].activa).map((c) => path.join(rootDir, projectConfig.capas[c].raiz)),
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
  console.log('📦  Cuando la línea base esté aprobada, crea cada módulo con: npm run new:module -- 01_nombre\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error al inicializar el proyecto:', err);
  rl.close();
  process.exit(1);
});
