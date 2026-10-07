# 📊 PLANTILLA: Reporte de Calidad, Pruebas y Seguridad (QA Report)

> **Documento:** `docs/03_qa_report.md`  
> **Versión:** 1.0  
> **Autor:** QA Lead & Security Compliance Director  
> **Resultado Global:** [APROBADO (PASS) / BLOQUEADO (FAIL)]

---

## 1. Resumen Ejecutivo de la Evaluación
- **Total Casos de Prueba Ejecutados:** [X]
- **Casos Exitosos (Pass):** [X]
- **Casos Fallidos (Fail):** 0
- **Auditoría AST (Zero ANY):** 0 violaciones detectadas
- **Cobertura de Código (Coverage):**
  - Backend: XX%
  - Frontend: XX%

---

## 2. Herramientas de QA Empleadas y Desglose por Instrumento

### 2.1 Criterio de Selección Crítica (Proporcionalidad del Cambio)
- **Tamaño del Cambio Evaluado:** [Small (Parche) / Medium (Feature/Endpoint) / Large (Módulo Completo)]
- **Herramientas Convocadas:** [Detallar herramientas activadas del arsenal de 4 pilares y justificación].
- **Herramientas Omitidas y Justificación de Eficiencia:** [Detallar herramientas no requeridas para optimizar ciclos].

### 2.2 Desglose de Pruebas Ejecutadas por Herramienta
| Herramienta | Sub-Rol Responsable | Suites / Archivos Ejecutados | Casos Probados | Resultado |
| :--- | :--- | :--- | :---: | :---: |
| **AST Parser (`check:no-any`)** | SDET / Architecture Guard | `tooling/check-no-any-*.{ts,mjs}` | Backend + Frontend | ✅ 0 ANY detectados |
| **Vitest / Jest** | SDET | `backend/tests/modules/XX_*.test.ts` | X tests | ✅ PASS (X ms) |
| **Playwright / Cypress** | E2E Specialist | `frontend/tests/e2e/XX_*.spec.ts` | X suites | ✅ PASS (X s) |
| **axe-core** | A11y Specialist | Integrado en E2E (`wcag2aa`) | Vistas y Modales | ✅ 0 violaciones |
| **API Collections (Bruno / Postman)** | SDET | `tests/api/XX_*/` | X endpoints | ✅ PASS |
| **k6** | Performance | `tests/load/k6_*.js` | X VUs / p95 | [✅ PASS / Omitido] |

---

## 3. Matriz de Ejecución de Pruebas Automatizadas

| ID Caso | Herramienta | Escenario Evaluado | Tipo | Resultado | Tiempo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-XX-01** | Vitest | Happy Path nominal según contrato Zod | Funcional | ✅ PASS | XXms |
| **TC-XX-02** | Vitest | Boundary Value Analysis (BVA) & Payload inválido | Límite / Zod | ✅ PASS | XXms |
| **TC-XX-03** | API Suite | Códigos HTTP semánticos y Envelope `{ success, data }` | Contrato | ✅ PASS | XXms |
| **TC-XX-04** | Playwright | Flujo interactivo de usuario en navegador real | E2E | ✅ PASS | XXs |
| **TC-XX-05** | axe-core | Accesibilidad WCAG 2.1 AA en interfaz de usuario | A11y | ✅ PASS | XXs |

---

## 4. Auditoría de Seguridad (OWASP & Multi-Tenant)
- [ ] Aislamiento Multi-Tenant estricto (Anti-IDOR verificado por token JWT): **[CONFORME]**
- [ ] Validación perimetral Zod en 100% de los endpoints (Rechazo 400 ante campos extra o tipos incorrectos): **[CONFORME]**
- [ ] Sanitización contra inyección SQL / XSS: **[CONFORME]**
- [ ] Gestión segura de credenciales y expiración de sesión: **[CONFORME]**

---

## 5. Registro de Defectos y Hallazgos (Bug Tracker Interno)
*(En caso de fallos detectados durante el ciclo)*
### 🐛 BUG-[NUM]: [Descripción Breve]
- **Severidad:** [Crítica / Alta / Media / Baja]
- **Módulo Afectado:** 
- **Comportamiento Esperado:** 
- **Comportamiento Obtenido:** 
- **Causa Raíz (RCA):**
- **Agente Asignado para Corrección:** [Backend Lead Engineer / Frontend Lead Engineer]
- **Estado:** [RESUELTO / EN_CURSO]

---

## 6. Dictamen de Aprobación para Despliegue (Stage-Gate 4)
- **Dictamen del QA Lead:** [APROBADO PARA DESPLIEGUE (PASS)]
- **Fecha de Certificación:** AAAA-MM-DD
