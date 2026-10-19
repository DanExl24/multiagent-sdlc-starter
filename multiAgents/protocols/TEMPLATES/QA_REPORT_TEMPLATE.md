# 📊 PLANTILLA: Reporte de Calidad, Pruebas y Seguridad (QA Report)

> **Documento:** `docs/03_qa_report.md`  
> **Versión:** 1.0.0  
> **Autor:** QA Lead & Security Compliance Director  
> **Resultado Global:** [APROBADO (PASS) / BLOQUEADO (FAIL)]  
> **Enfoque Metodológico:** Auditoría Integral en los 4 Cuadrantes Ágiles de Testing

---

## 1. Resumen Ejecutivo de la Evaluación
- **Total Casos de Prueba Ejecutados:** [X]
- **Casos Exitosos (Pass):** [X]
- **Casos Fallidos (Fail):** 0
- **Casos Bloqueados:** 0
- **Auditoría AST (Zero ANY):** 0 violaciones detectadas
- **Defectos Críticos Abiertos (S1/S2):** 0
- **Cobertura de Código (Coverage):**
  - Backend: XX%
  - Frontend: XX%

---

## 2. Herramientas de QA Empleadas y Desglose por Cuadrante

### 2.1 Criterio de Selección Crítica (Proporcionalidad del Cambio)
- **Tamaño del Cambio Evaluado:** [Small (Parche) / Medium (Feature/Endpoint) / Large (Módulo Completo)]
- **Herramientas Convocadas:** [Detallar herramientas activadas de los 4 cuadrantes y su justificación técnica].
- **Herramientas Omitidas y Justificación de Eficiencia:** [Detallar herramientas no requeridas para optimizar ciclos].

### 2.2 Desglose de Pruebas Ejecutadas por Cuadrante
| Cuadrante | Herramienta | Sub-Rol Responsable | Suites / Archivos Ejecutados | Casos Probados | Resultado |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **Q1** | **AST Parser (`check:no-any`)** | SDET / Architecture Guard | `tooling/check-no-any-*.{ts,mjs}` | Backend + Frontend | ✅ 0 ANY detectados |
| **Q1** | **Vitest** | SDET | `backend/tests/modules/XX_*.test.ts` | X tests | ✅ PASS (X ms) |
| **Q2** | **Bruno CLI** | SDET | `tests/bruno/XX_*/` | X endpoints | ✅ PASS |
| **Q2/Q3** | **Playwright** | E2E Specialist | `frontend/tests/e2e/XX_*.spec.ts` | X suites | ✅ PASS (X s) |
| **Q3** | **axe-core** | A11y Specialist | Integrado en Playwright (`wcag2aa`) | Vistas y Modales | ✅ 0 violaciones |
| **Q3** | **Test Charters (Heurísticas)** | Exploratory Specialist | `tests/exploratory/CHARTER-*.md` | X charters | ✅ PASS |
| **Q4** | **k6 Load Stress** | Performance Auditor | `tests/load/k6_*.js` | X VUs / p95 | [✅ PASS / Omitido] |
| **Q4** | **OWASP ZAP DAST** | Security Auditor | Reporte dinámico OWASP | Endpoints API | ✅ 0 Altas/Críticas |

---

## 3. Matriz de Ejecución de Pruebas Automatizadas

| ID Caso | Cuadrante | Herramienta | Escenario Evaluado | Tipo | Resultado | Tiempo |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **TC-XX-01** | Q1 | Vitest | Happy Path nominal según contrato Zod | Funcional | ✅ PASS | XXms |
| **TC-XX-02** | Q1 | Vitest | Boundary Value Analysis (BVA) & Payload inválido | Límite / Zod | ✅ PASS | XXms |
| **TC-XX-03** | Q2 | Bruno | Códigos HTTP semánticos y Envelope `{ success, data }` | Contrato | ✅ PASS | XXms |
| **TC-XX-04** | Q2/Q3 | Playwright | Flujo interactivo de usuario en navegador real | E2E | ✅ PASS | XXs |
| **TC-XX-05** | Q3 | axe-core | Accesibilidad WCAG 2.1 AA en interfaz de usuario | A11y | ✅ PASS | XXs |
| **TC-XX-06** | Q3 | Test Charter | Resistencia a cancelaciones y dobles clics | Heurístico UX | ✅ PASS | XX min |
| **TC-XX-07** | Q4 | OWASP ZAP | Inyección SQL, XSS, headers HSTS y CSP | Seguridad DAST | ✅ PASS | XXs |
| **TC-XX-08** | Q4 | k6 | Carga concurrente y latencia p95 < 500ms | SLA Performance| ✅ PASS | XXs |

---

## 4. Auditoría de Seguridad (OWASP & Multi-Tenant)
- [ ] Aislamiento Multi-Tenant estricto (Anti-IDOR verificado por token JWT): **[CONFORME]**
- [ ] Validación perimetral Zod en 100% de los endpoints (Rechazo 400 ante campos extra o tipos incorrectos): **[CONFORME]**
- [ ] Sanitización contra inyección SQL / XSS: **[CONFORME]**
- [ ] Gestión segura de credenciales y expiración de sesión: **[CONFORME]**
- [ ] Escaneo dinámico OWASP ZAP sin alertas de nivel Alto o Crítico: **[CONFORME]**

---

## 5. Registro de Defectos y Ciclo de Incidencias (Estándar 10 Campos)
*(Si se identificaron fallos durante el ciclo, cada uno debe contar con su ficha individual en `docs/qa/incidents/BUG-[MOD]-[NUM].md` siguiendo `protocols/TEMPLATES/INCIDENT_DEFECT_TEMPLATE.md`)*

| ID Defecto | Título Conciso | Severidad | Agente Asignado | Estado en Máquina (7 Estados) | Test en Rojo Asociado |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **BUG-XX-01** | [Descripción breve del fallo] | S1 Blocker | Backend Lead | VERIFICADO | `tests/modules/XX_bug_01.test.ts` |
| **BUG-XX-02** | [Descripción breve del fallo] | S3 Major | Frontend Lead | CERRADO | `frontend/src/.../__tests__/bug_02.spec.ts` |

---

## 6. Dictamen de Aprobación para Despliegue (Stage-Gate 4)
- **Dictamen del QA Lead:** [APROBADO PARA DESPLIEGUE (PASS)]
- **Cero Defectos S1/S2 Abiertos:** [CERTIFICADO]
- **Auditoría AST Cero ANY:** [0 VIOLACIONES]
- **Fecha de Certificación:** AAAA-MM-DD
