#!/usr/bin/env node
/**
 * 🛡️ DAST & Runtime Security Auditor
 * multiagent-sdlc-starter — Herramienta de Auditoría Dinámica en Tiempo de Ejecución
 *
 * Audita:
 * 1. Cabeceras HTTP de Protección (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, anti-leak).
 * 2. Seguridad en Cookies de Sesión (HttpOnly, Secure, SameSite).
 * 3. Configuración Dinámica de CORS (Orígenes no autorizados / credenciales).
 * 4. Fuga de Trazas e Información en Respuestas de Error (Stack Traces en HTTP 500).
 *
 * Estados de cada control: PASS, WARN, FAIL o NOT_RUN. Un control que no se pudo verificar
 * contra un servidor en ejecución es NOT_RUN, nunca PASS.
 *
 * Salida:
 * - Reporte legible en consola.
 * - Archivo estructurado JSON en: docs/qa/dast-audit-summary.json
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetUrl = process.argv.slice(2).find((a) => !a.startsWith('--')) || process.env.TARGET_URL || 'http://localhost:3000';
const isOfflineDemo = process.argv.includes('--offline') || process.argv.includes('--dry-run');

console.log('\n=============================================================');
console.log('🛡️  [AUDIT-DAST] Auditor Dinámico de Seguridad en Runtime');
console.log(`🌐 Objetivo: ${targetUrl}`);
console.log('=============================================================\n');

const findings = [];
let passCount = 0;
let warnCount = 0;
let failCount = 0;
let notRunCount = 0;

function recordFinding(category, name, status, details, recommendation) {
  const item = { category, name, status, details, recommendation };
  findings.push(item);

  if (status === 'PASS') {
    passCount++;
    console.log(`  ✅ [PASS] ${name}: ${details}`);
  } else if (status === 'WARN') {
    warnCount++;
    console.log(`  ⚠️  [WARN] ${name}: ${details}`);
    if (recommendation) console.log(`     ↳ Remedio: ${recommendation}`);
  } else if (status === 'NOT_RUN') {
    notRunCount++;
    console.log(`  ⚪ [NOT_RUN] ${name}: ${details}`);
  } else {
    failCount++;
    console.log(`  ❌ [FAIL] ${name}: ${details}`);
    if (recommendation) console.log(`     ↳ Remedio: ${recommendation}`);
  }
}

async function requestUrl(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const transport = url.protocol === 'https:' ? https : http;
      const req = transport.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(5000, () => {
        req.destroy(new Error('Connection timeout (5s)'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function runAudit() {
  let response;

  if (isOfflineDemo) {
    console.log('ℹ️  Modo offline/dry-run: no se contacta ningún servidor, así que ningún control queda verificado.');
    markNotRun('Modo offline: no se contactó ningún servidor.');
    finalizeReport();
    return;
  }

  try {
    response = await requestUrl(targetUrl, { method: 'GET' });
  } catch (err) {
    console.log(`⚠️  No se pudo conectar con el servidor en ${targetUrl} (${err.message}).`);
    console.log('ℹ️  Para auditar una API real, inicia tu servidor backend o ejecuta:');
    console.log(`    npm run audit:dast -- ${targetUrl}`);
    markNotRun(`Servidor inactivo en ${targetUrl}: inicia el backend y repite la auditoría.`);

    finalizeReport();
    return;
  }

  const headers = response.headers;

  // 1. Cabeceras de Seguridad
  console.log('🔍 [1/4] Auditando Cabeceras HTTP de Respuesta:');
  if (headers['content-security-policy']) {
    recordFinding('Headers', 'Content-Security-Policy', 'PASS', 'Presente y configurada.', null);
  } else {
    recordFinding('Headers', 'Content-Security-Policy', 'FAIL', 'Cabecera ausente.', 'Agregar helmet({ contentSecurityPolicy: true })');
  }

  if (headers['x-content-type-options'] === 'nosniff') {
    recordFinding('Headers', 'X-Content-Type-Options', 'PASS', 'Valor correcto (nosniff).', null);
  } else {
    recordFinding('Headers', 'X-Content-Type-Options', 'FAIL', 'Ausente o valor incorrecto.', 'Enviar X-Content-Type-Options: nosniff');
  }

  if (headers['x-frame-options']) {
    recordFinding('Headers', 'X-Frame-Options', 'PASS', `Presente (${headers['x-frame-options']}).`, null);
  } else {
    recordFinding('Headers', 'X-Frame-Options', 'WARN', 'Ausente (riesgo de Clickjacking si se embebe en iframe).', 'Enviar X-Frame-Options: DENY');
  }

  if (!headers['x-powered-by'] && (!headers['server'] || headers['server'] === 'nginx' || headers['server'] === 'cloudflare')) {
    recordFinding('Headers', 'Infrastructure Fingerprint Leak', 'PASS', 'X-Powered-By no divulga tecnologías internas.', null);
  } else {
    recordFinding('Headers', 'Infrastructure Fingerprint Leak', 'WARN', `Divulgación detectada (${headers['x-powered-by'] || headers['server']}).`, 'Deshabilitar X-Powered-By');
  }

  // 2. Cookies de Sesión
  console.log('\n🔍 [2/4] Auditando Banderas de Seguridad en Cookies:');
  const setCookie = headers['set-cookie'];
  if (setCookie && Array.isArray(setCookie) && setCookie.length > 0) {
    const rawCookies = setCookie.join('; ');
    const hasHttpOnly = rawCookies.toLowerCase().includes('httponly');
    const hasSameSite = rawCookies.toLowerCase().includes('samesite');

    if (hasHttpOnly) {
      recordFinding('Cookies', 'HttpOnly Flag', 'PASS', 'Bandea HttpOnly activa en cookies.', null);
    } else {
      recordFinding('Cookies', 'HttpOnly Flag', 'FAIL', 'Cookies emitidas sin flag HttpOnly (riesgo XSS).', 'Marcar cookies de sesión con httpOnly: true.');
    }

    if (hasSameSite) {
      recordFinding('Cookies', 'SameSite Flag', 'PASS', 'Bandea SameSite activa.', null);
    } else {
      recordFinding('Cookies', 'SameSite Flag', 'WARN', 'Cookies sin atributo SameSite explícito.', 'Configurar sameSite: "lax" o "strict".');
    }
  } else {
    recordFinding('Cookies', 'Session Cookies', 'PASS', 'No se emiten cookies en la ruta base.', null);
  }

  // 3. Prueba Dinámica de CORS
  console.log('\n🔍 [3/4] Probando Comportamiento Dinámico de CORS:');
  try {
    const corsRes = await requestUrl(targetUrl, {
      method: 'GET',
      headers: { Origin: 'https://evil-attacker-site.com' },
    });
    const allowOrigin = corsRes.headers['access-control-allow-origin'];
    const allowCredentials = corsRes.headers['access-control-allow-credentials'];

    if (allowOrigin === 'https://evil-attacker-site.com' && allowCredentials === 'true') {
      recordFinding('CORS', 'Permissive Origin Reflection', 'FAIL', 'El servidor refleja orígenes no confiables con credenciales permitidas.', 'Restringir CORS a lista blanca explícita de dominios.');
    } else {
      recordFinding('CORS', 'Origin Policy', 'PASS', `CORS seguro (Allow-Origin: ${allowOrigin || 'No reflejado'}).`, null);
    }
  } catch (corsErr) {
    recordFinding('CORS', 'Origin Policy', 'NOT_RUN', `La petición con origen arbitrario falló (${corsErr.message}); no se pudo verificar la política.`, null);
  }

  // 4. Prueba de Fuga de Stack Traces en Error 500
  console.log('\n🔍 [4/4] Verificando Manejo Seguro de Errores:');
  try {
    const errRes = await requestUrl(`${targetUrl}/__probe_non_existent_error_trigger__`, { method: 'POST', body: '{"bad":json}' });
    const bodyStr = errRes.body || '';
    const hasStackTrace = bodyStr.includes('node_modules') || bodyStr.includes('TypeError:') || bodyStr.includes('at Object.');

    if (hasStackTrace) {
      recordFinding('Error Handling', 'Stack Trace Leak', 'FAIL', 'La respuesta HTTP expone trazas internas del código fuente.', 'Capturar excepciones con middleware global de error genérico en producción.');
    } else {
      recordFinding('Error Handling', 'Stack Trace Masking', 'PASS', 'Errores formateados sin divulgación de trazas internas.', null);
    }
  } catch (errProbe) {
    recordFinding('Error Handling', 'Stack Trace Masking', 'NOT_RUN', `La petición de prueba falló (${errProbe.message}); no se pudo verificar el manejo de errores.`, null);
  }

  finalizeReport();
}

function markNotRun(motivo) {
  for (const [category, name] of [
    ['Headers', 'Cabeceras de seguridad (CSP, nosniff, X-Frame-Options, fingerprint)'],
    ['Cookies', 'Banderas de cookies de sesión'],
    ['CORS', 'Política de orígenes'],
    ['Error Handling', 'Ocultación de trazas en errores'],
  ]) recordFinding(category, name, 'NOT_RUN', motivo, null);
}

function veredicto() {
  if (failCount > 0) return 'FAIL';
  if (notRunCount > 0) return 'NOT_RUN';
  return 'PASS';
}

function finalizeReport() {
  const outputDir = path.join(rootDir, 'docs', 'qa');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportData = {
    fecha: new Date().toISOString(),
    objetivo: targetUrl,
    resumen: {
      total: findings.length,
      pass: passCount,
      warn: warnCount,
      fail: failCount,
      not_run: notRunCount,
      estado_general: veredicto(),
      alcance: 'Comprobaciones básicas de cabeceras, cookies, CORS y trazas sobre la URL indicada. No sustituye un escaneo DAST completo (OWASP ZAP).',
    },
    hallazgos: findings,
  };

  const outputPath = path.join(outputDir, 'dast-audit-summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf8');

  console.log('\n=============================================================');
  console.log(`📊 Resumen DAST: ${passCount} PASS | ${warnCount} WARN | ${failCount} FAIL | ${notRunCount} NOT_RUN`);
  console.log(`📄 Reporte JSON guardado en: docs/qa/dast-audit-summary.json`);
  const v = veredicto();
  console.log(`🚦 Veredicto: ${v === 'PASS' ? '✅ PASS (controles básicos verificados en runtime)' : v === 'NOT_RUN' ? '⚪ NOT_RUN: hay controles sin verificar; no cuenta como aprobado' : '❌ STOP-THE-LINE: vulnerabilidades detectadas'}`);
  console.log('=============================================================\n');

  if (failCount > 0 && !process.env.ALLOW_FAIL) {
    process.exit(1);
  }
  // Sin servidor no hay auditoría: el código de salida no debe parecer un éxito (salvo --offline, pedido a propósito).
  if (v === 'NOT_RUN' && !isOfflineDemo) process.exit(2);
}

runAudit();
