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
  return { config: errors.length ? DEFAULT_CONFIG : config, exists: true, errors };
}

export const activeLayers = (config) => LAYERS.filter((name) => config.capas[name]?.activa);
export const layerRoot = (config, name) => path.join(rootDir, config.capas[name].raiz);
export const layerModulesDir = (config, name) => path.join(rootDir, config.capas[name].modulos);
export const contractsDir = (config) => path.join(rootDir, config.rutas.contratos);
