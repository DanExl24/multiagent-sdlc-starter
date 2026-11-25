/** Inspección de fuentes del piloto VELTRIX. Solo lee; no acredita compuertas. */
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './stage-gates.mjs';

export const VARIANT_PATH = path.join(rootDir, 'variants', 'veltrix', 'variant.json');

export function inspectVeltrix(projectRoot, kitRoot) {
  const variant = JSON.parse(fs.readFileSync(VARIANT_PATH, 'utf-8'));
  const project = path.resolve(projectRoot);
  const exists = (base, relative, directory = false) => {
    try {
      const stat = fs.statSync(path.join(base, relative));
      return directory ? stat.isDirectory() : stat.isFile();
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return false;
      throw err;
    }
  };
  const componentes = Object.entries(variant.componentes).map(([nombre, ruta]) => ({
    nombre, ruta, existe: exists(project, ruta, true),
  }));
  const artefactos = Object.entries(variant.modulo.artefactos_existentes).map(([nombre, ruta]) => ({
    nombre, ruta, existe: exists(project, ruta),
  }));
  const integration = variant.integracion_skill;
  const kitPaths = [integration.ruta_en_kit, ...integration.estandares_en_kit];
  const kitDisponible = Boolean(kitRoot) && kitPaths.every((ruta) => exists(path.resolve(kitRoot), ruta));
  const alternativa = exists(rootDir, integration.tecnica_alternativa);
  return {
    estado: variant.estado,
    instalable: false,
    alcance: 'Existencia de fuentes; sin validación semántica ni aprobación de compuertas.',
    origen: variant.origen,
    proyecto: project,
    componentes,
    artefactos,
    ficha: { ruta: variant.modulo.ficha, existe: exists(project, variant.modulo.ficha) },
    skill: {
      nombre: integration.skill,
      habilitada: integration.habilitada,
      fuentes_disponibles: kitDisponible,
      alternativa_disponible: alternativa,
      tecnica_efectiva: integration.habilitada && kitDisponible ? integration.skill : integration.tecnica_alternativa,
      revision_instalada: 'NO_COMPROBADA',
    },
    fuentes_obligatorias_presentes: [...componentes, ...artefactos].every((entry) => entry.existe) && alternativa,
    pendientes: variant.pendientes_incorporacion,
  };
}
