#!/usr/bin/env node
/** Uso: npm run inspect:veltrix -- --project-root <VELTRIX> [--kit-root <kit>] */
import { inspectVeltrix } from './lib/veltrix-adoption.mjs';

const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  const option = args[i];
  if (!['--project-root', '--kit-root'].includes(option) || !args[i + 1] || args[i + 1].startsWith('--') || options[option]) {
    console.error('Uso: npm run inspect:veltrix -- --project-root <VELTRIX> [--kit-root <kit>]');
    process.exit(1);
  }
  options[option] = args[i + 1];
}
if (!options['--project-root']) {
  console.error('Falta --project-root. La inspección no modifica el proyecto.');
  process.exit(1);
}

try {
  const report = inspectVeltrix(options['--project-root'], options['--kit-root']);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.fuentes_obligatorias_presentes ? 0 : 1;
} catch (err) {
  console.error(`No se pudo inspeccionar VELTRIX: ${err.message}`);
  process.exitCode = 1;
}
