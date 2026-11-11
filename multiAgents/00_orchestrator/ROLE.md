# 🧭 00_ORCHESTRATOR — Protocolo Maestro de Orquestación y Gobernanza Multiagente

> **Propósito:** Definir el ciclo de vida, la máquina de estados, los puntos de control ("Stage-Gates") y las reglas de interacción entre los agentes especializados del SDLC.  
> **Rol del Orquestador:** Garantizar el cumplimiento del proceso, evitar el *context drift*, validar los artefactos generados y coordinar la intervención del Director/Stakeholder Humano.

---

## 1. Principios Rectores del Sistema Multiagente

1. **Principio de Especialización Estricta:**  
   Ningún agente asume responsabilidades fuera de su dominio. Un *Frontend Engineer* no define contratos de base de datos; un *Product Manager* no escribe código de producción.

2. **Principio del Disco como Fuente Única de Verdad (Single Source of Truth):**  
   La memoria conversacional de un chat es efímera. La comunicación entre agentes se realiza **exclusivamente mediante artefactos versionados** en el repositorio (`docs/`, `src/`, `tests/`).

3. **Inmutabilidad de Fases Previas sin Aprobación:**  
   Un agente posterior no puede contradecir los artefactos de un agente anterior. Si durante el desarrollo se descubre un vacío en los requerimientos o en la arquitectura, se dispara un **Ciclo de Retroalimentación Formal (Feedback Loop)** hacia el agente responsable.

4. **Human-in-the-Loop en Stage-Gates:**  
   El Director Humano es la máxima autoridad. Ningún paso entre fases principales se ejecuta sin su aprobación explícita.

---

## 2. Máquina de Estados del SDLC Multiagente (6 Fases de Madurez)

```mermaid
stateDiagram-v2
    [*] --> FASE_1_REQUERIMIENTOS: G0 Bootstrap completado (init:project)
    
    state FASE_1_REQUERIMIENTOS {
        PM_Discovery --> BDD_Gherkin: HUs INVEST
        BDD_Gherkin --> Rito_ATDD: Convoca a Arquitecto y QA Lead (Three Amigos)
        Rito_ATDD --> [*]: Criterios de Aceptación y Testability Congelados
    }
    
    FASE_1_REQUERIMIENTOS --> GATE_1: PRD + HUs INVEST + Criterios ATDD Listos
    GATE_1 --> FASE_1_REQUERIMIENTOS: Rechazado / Ajustes solicitados
    GATE_1 --> FASE_2_ARQUITECTURA: Aprobado por Humano
    
    FASE_2_ARQUITECTURA --> GATE_2: DDL + Contratos Zod API-First Listos
    GATE_2 --> FASE_2_ARQUITECTURA: Observaciones técnicas
    GATE_2 --> FASE_3A_BACKEND: Aprobado por Humano

    state FASE_3A_BACKEND {
        [*] --> Backend_TDD: Ciclo Red-Green-Refactor (Vitest)
        Backend_TDD --> Contratos_Sincronizados: Contratos Zod compartidos
        Contratos_Sincronizados --> [*]
    }

    FASE_3A_BACKEND --> GATE_3A: Vitest 100% + check:no-any + build en verde
    GATE_3A --> FASE_3B_FRONTEND: Checkpoint automatico del Orquestador (sin halt)

    state FASE_3B_FRONTEND {
        [*] --> Frontend_TDD: Component TDD (Testing Library)
        Frontend_TDD --> Walkthrough_Emitido: Walkthrough Versionado Emitido
        Walkthrough_Emitido --> [*]
    }

    FASE_3B_FRONTEND --> GATE_3B: Vistas y Walkthrough listos
    GATE_3B --> FASE_3B_FRONTEND: Rechazado / Ajustes de UI
    GATE_3B --> FASE_4_QA_VALIDACION: Aprobado por Humano
    
    state FASE_4_QA_VALIDACION {
        Q1_Q2_SDET: Tests API & Lógica (Vitest / Bruno)
        Q2_Q3_E2E: Flujos de Usuario & A11y (Playwright)
        Q3_Exploratorio: Testing Exploratorio Heurístico & UX
        Q4_Seguridad_Carga: OWASP ZAP & k6 (SLA y Hardening)
        
        Q1_Q2_SDET --> Auditoria_AST: npm run check:no-any
        Q2_Q3_E2E --> Auditoria_AST
        Auditoria_AST --> Evaluacion_Defectos
        
        state Evaluacion_Defectos {
            [*] --> Sin_Bugs: Cero Bloqueantes (S1/S2)
            [*] --> Con_Bugs: Detección de Defectos
            Con_Bugs --> Sub_Bucle_Incidencias: Ficha de 10 Campos (Stop-the-Line)
        }
    }
    
    FASE_4_QA_VALIDACION --> FASE_3A_BACKEND: Veto QA (defecto de backend)
    FASE_4_QA_VALIDACION --> FASE_3B_FRONTEND: Veto QA (defecto de frontend)
    FASE_4_QA_VALIDACION --> GATE_4: Suite Verde + Zero ANY + Reporte QA Emitido
    
    GATE_4 --> FASE_5_DEVOPS_RELEASE: Aprobado por Humano
    FASE_5_DEVOPS_RELEASE --> GATE_5: Despliegue, Seeders y Tag SemVer

    GATE_5 --> FASE_6_MEJORA_CONTINUA: Release Aprobado
    
    state FASE_6_MEJORA_CONTINUA {
        Extraccion_Bugs --> Analisis_Causa_Raiz: Diagrama de Ishikawa (Espina de Pescado)
        Analisis_Causa_Raiz --> Analisis_Pareto: Principio 80/20 de Incidencias
        Analisis_Pareto --> Matriz_Priorizacion: Dificultad vs Plazo vs Impacto
        Matriz_Priorizacion --> [*]: Plan de Mejora (Insumo para siguiente ciclo)
    }

    FASE_6_MEJORA_CONTINUA --> GATE_6: Plan Kaizen Emitido
    GATE_6 --> [*]: Ciclo Culminado Exitosamente
```

---

## 3. Matriz de Agentes, Responsabilidades y Artefactos

| Fase | Agente Responsable | Carpeta del Agente | Artefacto de Entrada (Inputs) | Artefacto de Salida (Outputs) |
| :--- | :--- | :--- | :--- | :--- |
| **00** | **Orquestador Central** | `multiAgents/00_orchestrator/` | Petición del Humano | Estado del proyecto, asignación de tareas, gobierno HITL |
| **01** | **Product Manager (PM)** | `multiAgents/01_product_manager/` | Visión del Humano, Normativa | `docs/project/prd.md`, HUs INVEST, Criterios ATDD (`docs/modules/XX/01_ATDD_SPEC.md`) |
| **02** | **Software Architect** | `multiAgents/02_software_architect/` | `docs/project/prd.md`, Criterios ATDD | `docs/project/architecture.md`, DDL 3FN, Contratos Zod API-First (`docs/contracts/`) |
| **03A** | **Backend Engineer** | `multiAgents/03_backend_engineer/` | `docs/contracts/*.contract.ts` | `backend/src/` (Kysely, Zod), Tests TDD unitarios y de integración (`Vitest`) |
| **03B** | **Frontend Engineer** | `multiAgents/04_frontend_engineer/` | `docs/contracts/`, Design System | `frontend/src/` (SPA), Tests Component TDD (`@testing-library`), Walkthrough |
| **04** | **QA & Security Tester** | `multiAgents/05_qa_security_tester/` | Código en `src/`, Walkthroughs | `tests/`, Fichas de Bugs (10 campos), `docs/qa/index.md` (Cuadrantes Q1-Q4) |
| **05** | **DevOps & Release** | `multiAgents/06_devops_release/` | Código probado, Esquema DB | Seeders, Docker/Config, Changelog SemVer, `README.md` final |
| **06** | **Comité de Calidad (Kaizen)** | `multiAgents/06_devops_release/` & QA | Historial de bugs cerrados | `docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md` (Ishikawa, Pareto, Matriz Mejora) |

---

## 4. Checklists del Orquestador por Compuerta

> 📌 La definición canónica de cada compuerta (tipo, entregables, aprobador y valores de `current_state.json`) vive **únicamente** en [`.workflow/STAGE_GATES.md`](../../.workflow/STAGE_GATES.md). Esta sección contiene solo el **checklist que el Orquestador verifica** por ID de compuerta. G0 (Bootstrap) es automático y no requiere checklist.

> 🔀 **Pistas paralelas.** El Orquestador es dueño de `.workflow/current_state.json` (línea base del proyecto y releases) y supervisa los archivos de `.workflow/modules/`, uno por módulo, cada uno con su responsable y su rama. Antes de cada release ejecuta `npm run status` para ver qué módulos superaron G4, y `npm run validate:state` para confirmar que ningún módulo se adelantó a la línea base ni a sus dependencias. Los checklists de G1 y G2 se aplican tanto a la línea base como a cada módulo.

> 🏗️ **Fundación.** Al aprobarse la línea base de G1, el Orquestador asigna el turno a `07_foundation_architect` (`rol_en_turno` en `current_state.json`, fase `FASE_2_ARQUITECTURA`). Cuando `project.json` → `fundacion.estado` es `COMPLETADA`, el turno pasa al Arquitecto de Software. `npm run validate:state` impide pedir la firma del G2 de línea base sin los ADRs de stack y estructura.

> 🎚️ **Perfil del proyecto.** El tipo de cada compuerta (Halt o Checkpoint) y los entregables exigidos dependen del perfil (`.workflow/PROFILES.md`). Antes de verificar una compuerta, el Orquestador consulta `npm run status -- [XX_nombre]` y usa ese plan como checklist de entregables. Un Halt convertido en Checkpoint no se firma por separado: sus entregables se presentan en el siguiente Halt.

### 🛑 Gate 1: Validación de Requerimientos y Rito ATDD (PM -> Arquitecto)
- **Checklist del Orquestador:**
  - [ ] ¿Está cubierto el alcance acordado con historias bajo estándar INVEST?
  - [ ] ¿Se especificaron las reglas normativas y de negocio del dominio (`RN-DOM-XX`)?
  - [ ] ¿Se realizó la mesa de alineación ATDD (*Three Amigos*: PM + Arquitecto + QA Lead)?
  - [ ] ¿Cada Historia de Usuario tiene criterios de aceptación en formato BDD Gherkin (`Dado-Cuando-Entonces`) con casos límite (BVA) y firma de *Testability* por QA?
- **Acción:** Solicitar firma al Director Humano.

### 🛑 Gate 2: Validación de Arquitectura (Arquitecto -> Desarrolladores)
- **Checklist del Orquestador:**
  - [ ] ¿El modelo relacional DDL está completamente tipado y normalizado en 3FN?
  - [ ] ¿Se definieron los contratos de endpoints compartidos con validaciones Zod?
  - [ ] ¿Está definida la matriz de seguridad RBAC, aislamiento multi-tenant y manejo transaccional ACID?
- **Acción:** Solicitar firma al Director Humano.

### ⚡ G3A: Checkpoint de Backend (Backend -> Frontend)
- **Checklist del Orquestador:**
  - [ ] ¿Backend implementó el ciclo Red-Green-Refactor con suite Vitest al 100% en verde?
  - [ ] ¿`npm run build` (`check:no-any && tsc`) pasa con 0 incidencias?
  - [ ] ¿Los contratos Zod del backend están sincronizados con `docs/contracts/`?
- **Acción:** Transferencia automática al Frontend Engineer, **sin halt**. Registrar la transición en `historial_transiciones`.

### 🛑 Gate 3B: Validación de Frontend y UI/UX (Frontend -> QA Lead)
- **Checklist del Orquestador:**
  - [ ] ¿Frontend implementó pruebas unitarias de componentes base y stores con `@testing-library`?
  - [ ] ¿Se cumple el Design System (`docs/project/design-system.md`) sin colores hardcodeados?
  - [ ] ¿Se emitió el Walkthrough versionado y reproducible en `docs/walkthroughs/[XX]/[vX.Y.Z]/WALKTHROUGH.md`?
- **Acción:** Solicitar firma al Director Humano (revisión UI/UX) antes de pasar a Fase 4 (Auditoría Forense de QA).

### 🛑 Gate 4: Validación de Calidad y Seguridad en 4 Cuadrantes (QA -> DevOps)
- **Checklist del Orquestador:**
  - [ ] ¿El 100% de las pruebas automatizadas pasan en verde (Vitest, Bruno, Playwright)?
  - [ ] ¿La auditoría AST `npm run check:no-any` arrojó 0 violaciones en Backend y Frontend?
  - [ ] ¿Se ejecutó escaneo dinámico DAST (OWASP ZAP) sin vulnerabilidades críticas ni IDOR?
  - [ ] ¿Se ejecutaron pruebas de testing exploratorio y accesibilidad WCAG 2.1 AA (axe-core)?
  - [ ] ¿Se resolvieron y verificaron todos los defectos S1 (Blocker) y S2 (Critical) en el sub-bucle de incidencias?
- **Acción:** Solicitar firma Go / No-Go al Director Humano. Su aprobación autoriza el commit canónico y el merge a `main`; el paso a producción se decide en Gate 5.

### 🛑 Gate 5: Validación de Despliegue y Release (DevOps -> Operaciones)
- **Checklist del Orquestador:**
  - [ ] ¿Los seeders y migraciones se ejecutan de forma limpia e idempotente?
  - [ ] ¿Los contenedores Docker levantan sin advertencias de configuración?
  - [ ] ¿Se generó el changelog formal bajo SemVer y el tag de Git correspondiente?
- **Acción:** Solicitar firma al Director Humano para paso a producción.

### 🛑 Gate 6: Aprobación del Plan de Mejora Continua Kaizen (Comité -> Siguiente Sprint)
- **Checklist del Orquestador:**
  - [ ] ¿Se extrajo la totalidad de incidentes y lecciones aprendidas del ciclo?
  - [ ] ¿Se estructuró el Diagrama de Causa-Efecto (Ishikawa) y el Diagrama de Pareto (80/20)?
  - [ ] ¿Se redactó la matriz de priorización clasificando acciones por Dificultad, Plazo e Impacto?
  - [ ] ¿El documento `docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md` asigna responsables claros y KPIs verificables para alimentar el backlog del siguiente módulo?
- **Acción:** Firma del Director Humano para incorporar las mejoras al nuevo Sprint.

