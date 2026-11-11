# 🤖 Multi-Agent SDLC Starter Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero ANY](https://img.shields.io/badge/TypeScript-Zero%20ANY%20Enforced-emerald.svg)](tooling/)
[![Stage Gates](https://img.shields.io/badge/Methodology-Artifact--Driven%20Stage--Gates-003366.svg)](.workflow/)
[![HITL](https://img.shields.io/badge/Governance-HITL%20Guaranteed-amber.svg)](AGENTS.md)

> **Plantilla rectora universal para desarrollo de software de misión crítica guiado por Inteligencias Artificiales concurrentes y especializadas, artefactos inmutables en disco y compuertas de calidad HITL (Human In The Loop).**

---

## 🌟 ¿Qué es y por qué cambia las reglas del juego?

El desarrollo de software asistido por IAs suele fracasar cuando se utiliza un único modelo en modo "generalista" que intenta escribir código a partir de instrucciones dispersas en el chat:
1. **Pérdida de Contexto:** La memoria conversacional es volátil y se degrada rápidamente.
2. **Desacoples Silenciosos:** El frontend inventa campos que el backend no retorna; el backend usa tipos arbitrarios.
3. **Deuda Técnica y `any` descontrolado:** Los modelos colocan `any` para silenciar errores del compilador.
4. **Alucinaciones Funcionales:** Agentes que inventan requisitos o alteran reglas de negocio.

**Este Starter Kit erradica esos problemas** convirtiendo tu repositorio en una **fábrica de software concurrente**, donde cada rol líder y sus subroles operan bajo **Compuertas de Calidad ("Stage-Gates")**, validación estricta por AST (Cero `any`) y contratos Zod API-First compartidos.

> 🧭 **Dónde está la verdad:** este README es solo un puente. El mapa de compuertas, las reglas innegociables y el catálogo de roles están en [`AGENTS.md`](AGENTS.md); los datos de cada compuerta, en [`.workflow/STAGE_GATES.md`](.workflow/STAGE_GATES.md).

---

## 🚀 Inicio Rápido en 3 Pasos

### Paso 1: Clonar o Usar como Plantilla
Haz clic en **"Use this template"** en GitHub o clona este repositorio:
```bash
git clone https://github.com/DanExl24/multiagent-sdlc-starter.git mi-proyecto
cd mi-proyecto
npm install
```

### Paso 2: Ejecutar el Asistente Interactivo de Inicialización
Personaliza automáticamente todos los documentos de gobernanza, nombres de proyecto y dominio:
```bash
npm run init:project
```
El asistente te preguntará:
- Nombre del proyecto (ej. `FintechPay`, `HealthOps`, `StoreFlow`)
- Dominio del negocio (ej. `Banca Digital`, `Salud y Clínicas`, `Logística`)
- Autor u Organización
- Stacks de Backend y Frontend

### Paso 3: Aterrizar tu Agente de IA
Abre el proyecto en tu entorno de IA favorito (**Antigravity IDE**, **Cursor**, **Claude**, **ChatGPT**, **Windsurf**, etc.) y copia el siguiente prompt de aterrizaje:

```text
🤖 He abierto este repositorio. Por favor lee AGENTS.md y .workflow/current_state.json para conocer la metodología y tu rol activo. Confírmame qué rol asumes y cuál es la siguiente tarea según el Stage-Gate activo.
```
*(También disponible en [`LANDING_PROMPT.md`](file:///LANDING_PROMPT.md))*

---

## 👥 Arquitectura de Roles y Subroles Especializados

```mermaid
graph TD
    subgraph "Gobernanza"
        R0["00_orchestrator<br/>Orquestador Central"]
    end
    subgraph "Fase 1: Producto"
        R1["01_product_manager<br/>Product Manager Lead"]
    end
    subgraph "Fase 2: Arquitectura"
        R2["02_software_architect<br/>Software Architect Lead"]
    end
    subgraph "Fase 3: Ingeniería Concurrente"
        R3["03_backend_engineer<br/>Backend Lead Engineer"]
        R4["04_frontend_engineer<br/>Frontend Lead Engineer"]
    end
    subgraph "Fase 4: Certificación"
        R5["05_qa_security_tester<br/>QA Lead & Security Director"]
    end
    subgraph "Fase 5: Operaciones"
        R6["06_devops_release<br/>DevOps Lead & Release Ops"]
    end

    R0 --> R1
    R1 --> R2
    R2 --> R3
    R3 <== "API-First Zod" ==> R4
    R4 --> R5
    R5 --> R6
```

| Rol | Directorio | Misión Principal | Subroles Incluidos |
| :--- | :--- | :--- | :--- |
| **00_orchestrator** | [`multiAgents/00_orchestrator/`](file:///multiAgents/00_orchestrator/) | Gobernanza del semáforo y control de compuertas | Máquina de estados, halts HITL obligatorios |
| **01_product_manager** | [`multiAgents/01_product_manager/`](file:///multiAgents/01_product_manager/) | Descubrimiento funcional y blindaje normativo | Discovery (/grill-me), Legal/Compliance, BDD Gherkin, UAT |
| **02_software_architect** | [`multiAgents/02_software_architect/`](file:///multiAgents/02_software_architect/) | Topología C4, modelo de datos y contratos Zod | C4 Modeler, DDL Modeler, Zod Protocol Designer, Security Multi-tenant |
| **03_backend_engineer** | [`multiAgents/03_backend_engineer/`](file:///multiAgents/03_backend_engineer/) | API REST, transacciones y lógica de dominio | API Gateway, Domain Rules, DB Optimizer, TDD Tester |
| **04_frontend_engineer** | [`multiAgents/04_frontend_engineer/`](file:///multiAgents/04_frontend_engineer/) | SPA Reactiva, Design System y DataViz | Design System Core, State Pinia/Store, Views/UX, DataViz |
| **05_qa_security_tester** | [`multiAgents/05_qa_security_tester/`](file:///multiAgents/05_qa_security_tester/) | Auditoría forense con poder de veto (Stop-the-Line) | SDET Contratos, E2E & A11y axe-core, Performance k6 |
| **06_devops_release** | [`multiAgents/06_devops_release/`](file:///multiAgents/06_devops_release/) | Contenedores, seeders idempotentes y CI/CD | Docker Ops, Seeders Lifecycle, CI/CD Automator, Observability |

---

## 🛡️ Reglas Innegociables

Contrato antes que código, alto obligatorio con aprobación humana, cero `any`, veto de QA y commits canónicos son parte de las reglas innegociables del proyecto. Su texto y su numeración viven **únicamente** en [`AGENTS.md`](AGENTS.md); este README no las repite para evitar discrepancias. Las reglas propias de cada rol (envelope de respuestas, aislamiento multi-tenant, datos reales sin mocks, etc.) están en el `ROLE.md` correspondiente.

---

## 🗂️ Estructura del Repositorio

```text
/ (Raíz del Proyecto)
├── AGENTS.md                            # 📍 Manual Rector Multiagente (Lectura obligatoria)
├── LANDING_PROMPT.md                    # 🚀 Prompt canónico para alimentar a la IA
├── README.md                            # 📖 Este documento de bienvenida y guía rápida
├── CLAUDE.md · GEMINI.md                # 🔗 Puentes que importan AGENTS.md (Claude Code / Gemini CLI)
├── CHANGELOG.md                         # 📝 Historial bajo Keep a Changelog y SemVer
├── package.json                         # ⚙️ Scripts de gobernanza (init:project, check:no-any)
│
├── .workflow/                           # 🚦 Máquina de Estados y Gobernanza HITL
│   ├── STAGE_GATES.md                   # Datos de las compuertas (delegado por AGENTS.md)
│   └── current_state.json               # Estado activo en tiempo real
│
├── tooling/                             # 🛠️ Herramientas de Auditoría y Automatización
│   ├── init-project.mjs                 # Asistente interactivo de personalización
│   ├── check-no-any-backend.ts          # Comprobador AST para Backend TypeScript
│   ├── check-no-any-frontend.mjs        # Comprobador AST para Frontend TypeScript & Vue
│   ├── audit-security-runtime.mjs       # Escáner DAST en runtime (Headers, Cookies, CORS, 500s)
│   ├── run-load-test.mjs                # Orquestador k6 con reportes HTML visuales y JSON
│   ├── audit-a11y.mjs                   # Auditor automatizado de accesibilidad WCAG 2.1 AA
│   ├── validate-contracts.mjs           # Validador canónico de contratos DTO Zod
│   ├── validate-state.mjs               # Validador de current_state.json contra STAGE_GATES.md
│   ├── check-doc-sources.mjs            # Lint de la política de fuentes de verdad (AGENTS.md)
│   └── lib/stage-gates.mjs              # Lector de las tablas de STAGE_GATES.md
│
├── multiAgents/                         # 🧠 Roles Líderes y Protocolos de Trabajo
│   ├── 00_orchestrator/                 # PROJECT_STATUS.md y semáforo global
│   ├── 01_product_manager/              # ROLE.md y subroles de Producto
│   ├── 02_software_architect/           # ROLE.md y subroles de Arquitectura
│   ├── 03_backend_engineer/             # ROLE.md y subroles de Backend
│   ├── 04_frontend_engineer/            # ROLE.md y subroles de Frontend
│   ├── 05_qa_security_tester/           # ROLE.md y arsenal de los 4 pilares
│   ├── 06_devops_release/               # ROLE.md y subroles de Operaciones
│   └── protocols/                       # Handshakes, Tech Trio, Git Commit y Templates
│
├── docs/                                # 📚 Artefactos de Ingeniería (Fuente de la Verdad)
│   ├── 01_prd.md                        # Documento Rector de Requerimientos
│   ├── 02_architecture.md               # Topología técnica y Modelo C4
│   ├── 03_qa_report.md                  # Certificación ejecutiva de calidad
│   ├── 04_ui_design_system.md           # Tokens semánticos y componentes UI
│   ├── VERSION_MATRIX.md                # Trazabilidad de versiones y módulos
│   ├── contracts/                       # Contratos API-First Zod (.contract.ts)
│   ├── adrs/                            # Architectural Decision Records
│   ├── modules/                         # Especificaciones por módulo (01_ a XX_)
│   └── qa/                              # Reportes forenses, DAST, k6 HTML/JSON y A11y
│
└── walkthroughs/                        # 🚶 Guías de Verificación Reproducibles
    └── 00_starter/v1.0.0/               # WALKTHROUGH.md inicial
```

---

## 🛠️ Suite Automatizada de Calidad y Testing (Comandos npm)

El starter incluye herramientas ejecutables de calidad que tanto los agentes de IA como los ingenieros humanos deben disparar para certificar entregables:

```bash
# 1. Auditoría AST de Tipos (Zero ANY):
npm run check:no-any

# 2. Validación de Contratos DTO Zod (Request, Response Envelopes):
npm run test:contracts

# 3. Auditoría de Seguridad Dinámica (DAST en Runtime):
npm run audit:dast -- http://localhost:3000
# Genera: docs/qa/dast-audit-summary.json

# 4. Pruebas de Carga y Concurrencia (k6 con Reporte Visual y JSON):
npm run test:load -- http://localhost:3000
# Genera: docs/qa/load-report.html y docs/qa/load-summary.json

# 5. Escáner Automatizado de Accesibilidad (WCAG 2.1 AA):
npm run audit:a11y
# Genera: docs/qa/a11y-audit-summary.json

# 6. Validación de la Máquina de Estados (current_state.json vs STAGE_GATES.md):
npm run validate:state

# 7. Política de Fuentes de Verdad (sin citas numeradas fuera de AGENTS.md):
npm run check:docs

# 8. Compuerta Rápida Combinada (Pre-Commit / CI Gate: check:no-any + contratos + estado + fuentes):
npm test
```

---

## 📄 Licencia

Distribuido bajo la licencia [MIT](LICENSE). Libre para uso personal, comercial o institucional.
