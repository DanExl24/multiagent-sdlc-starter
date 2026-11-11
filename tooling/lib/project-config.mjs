/**
 * Configuración estructural del proyecto (.workflow/project.json): capas activas y rutas.
 * Permite que el repositorio que adopta el starter use su propia estructura de carpetas
 * (monorepo, sin frontend, rutas distintas) sin editar el tooling.
 *
 * Si el archivo no existe, se usan los valores por defecto del starter.
 */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './stage-gates.mjs';

export const PROJECT_CONFIG_PATH = path.join(rootDir, '.workflow', 'project.json');
export const LAYERS = ['backend', 'frontend'];

export const DEFAULT_CONFIG = {
  capas: {
    backend: { activa: true, raiz: 'backend', modulos: 'backend/src/modules' },
    frontend: { activa: true, raiz: 'frontend', modulos: 'frontend/src/modules' },
  },
  rutas: { contratos: 'docs/contracts' },
  perfil: { escala: 'standard', modificadores: [], adr: null },
  fundacion: { estado: 'PENDIENTE', stack: {}, adr_stack: null, adr_estructura: null },
};

const isRelativeInside = (p) => typeof p === 'string' && p.length > 0 && !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..');

/** @returns {{config: typeof DEFAULT_CONFIG, exists: boolean, errors: string[]}} */
export function loadProjectConfig() {
  if (!fs.existsSync(PROJECT_CONFIG_PATH)) return { config: DEFAULT_CONFIG, exists: false, errors: [] };
  let config;
  try {
    config = JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf-8'));
  } catch (err) {
    return { config: DEFAULT_CONFIG, exists: true, errors: [`project.json: JSON inválido (${err.message}).`] };
  }
  const errors = [];
  const capas = config.capas ?? {};
  for (const name of Object.keys(capas)) {
    if (!LAYERS.includes(name)) errors.push(`project.json: capa desconocida "${name}". Capas posibles: ${LAYERS.join(', ')}.`);
  }
  for (const name of LAYERS) {
    const layer = capas[name];
    if (!layer) { errors.push(`project.json: falta la capa "${name}" (decláralo con "activa": false si el proyecto no la tiene).`); continue; }
    if (typeof layer.activa !== 'boolean') errors.push(`project.json: capas.${name}.activa debe ser true o false.`);
    for (const key of ['raiz', 'modulos']) {
      if (!isRelativeInside(layer[key])) errors.push(`project.json: capas.${name}.${key} debe ser una ruta relativa dentro del repositorio.`);
    }
  }
  if (LAYERS.every((name) => capas[name]?.activa === false)) errors.push('project.json: al menos una capa debe estar activa.');
  if (!isRelativeInside(config.rutas?.contratos)) errors.push('project.json: rutas.contratos debe ser una ruta relativa dentro del repositorio.');

  // Perfil (opcional): escala, modificadores del proyecto y ADR que lo justifica.
  config.perfil = { ...DEFAULT_CONFIG.perfil, ...(config.perfil ?? {}) };
  const { escala, modificadores, adr } = config.perfil;
  if (typeof escala !== 'string' || !escala) errors.push('project.json: perfil.escala debe ser el nombre de una escala (sprint, standard, enterprise...).');
  if (!Array.isArray(modificadores) || modificadores.some((m) => typeof m !== 'string')) errors.push('project.json: perfil.modificadores debe ser una lista de nombres.');
  if (adr !== null && !isRelativeInside(adr)) errors.push('project.json: perfil.adr debe ser null o una ruta relativa al ADR que justifica el perfil.');

  // Fundación (opcional): stack y estructura definidos por 07_foundation_architect.
  config.fundacion = { ...DEFAULT_CONFIG.fundacion, ...(config.fundacion ?? {}) };
  const fundacion = config.fundacion;
  if (!['PENDIENTE', 'COMPLETADA'].includes(fundacion.estado)) errors.push('project.json: fundacion.estado debe ser PENDIENTE o COMPLETADA.');
  if (typeof fundacion.stack !== 'object' || fundacion.stack === null || Array.isArray(fundacion.stack)) errors.push('project.json: fundacion.stack debe ser un objeto (capa → tecnologías).');
  for (const key of ['adr_stack', 'adr_estructura']) {
    if (fundacion[key] !== null && !isRelativeInside(fundacion[key])) errors.push(`project.json: fundacion.${key} debe ser null o una ruta relativa a un ADR.`);
  }
  return { config: errors.length ? DEFAULT_CONFIG : config, exists: true, errors };
}

export const activeLayers = (config) => LAYERS.filter((name) => config.capas[name]?.activa);
export const layerRoot = (config, name) => path.join(rootDir, config.capas[name].raiz);
export const layerModulesDir = (config, name) => path.join(rootDir, config.capas[name].modulos);
export const contractsDir = (config) => path.join(rootDir, config.rutas.contratos);
