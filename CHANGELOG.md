# 📝 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.9.0] - 2026-11-10

### Added
- **Capa de perfiles:** el proyecto declara en `.workflow/project.json` una escala (`sprint`, `standard`, `enterprise`) y modificadores de riesgo. El perfil cambia el tipo efectivo de algunas compuertas (Halt ↔ Checkpoint) y los entregables exigidos, sin crear compuertas nuevas. `sprint` deja tres firmas humanas: especificación y contrato juntos (G2), QA (G4) y release (G5).
- Cinco modificadores (`datos_sensibles`, `pagos`, `multi_tenant`, `regulado`, `tiempo_real`), declarables para todo el proyecto o solo para un módulo. Solo añaden exigencias: un modificador puede convertir un Checkpoint en Halt y sumar entregables, nunca quitarlos.
- `STAGE_GATES.md` incorpora la tabla de invariantes que ningún perfil puede romper (G4 y G5 siempre Halt, al menos un Halt entre G1 y G2) y el Catálogo de Entregables con ID (§7) que citan los perfiles.
- `.workflow/PROFILES.md`: reglas de combinación y precedencia, cómo elegir o cambiar el perfil y cómo crear modificadores propios. Los datos viven en `.workflow/profiles/`.
- `npm run status -- [XX_nombre]` y `npm run status -- proyecto`: plan efectivo con el tipo de cada compuerta y los entregables, indicando qué escala o modificador añadió cada uno.
- `new:module` acepta `--modificadores` e `init-project` pregunta la escala y los modificadores; si el perfil no es `standard` puro, genera el ADR que lo justifica.

### Changed
- `validate:state` calcula el tipo efectivo de cada compuerta por pista (por ejemplo, rechaza esperar firma humana en un G1 que en `sprint` es Checkpoint), valida los perfiles contra el catálogo y los invariantes, y exige un ADR para todo perfil distinto de `standard` sin modificadores.
- La regla de oro del alto mecánico (`AGENTS.md` §6), el protocolo de aterrizaje y el mandato de `STAGE_GATES.md` §6 se refieren ahora a las compuertas Halt del perfil activo; con `standard` la lista sigue siendo la misma.

---

## [1.8.0] - 2026-11-10

### Added
- **`.workflow/project.json`:** declara las capas activas (backend, frontend), la raíz y la carpeta de módulos de cada una, y la ruta de los contratos. El repositorio que adopta el starter puede usar su propia estructura (monorepo, rutas distintas, proyectos sin frontend o sin backend) sin editar el tooling. Si el archivo no existe, se usan las rutas por defecto.
- Tabla de compuertas que dependen de una capa en `STAGE_GATES.md` (§2.2): G3A requiere backend y G3B frontend. Con la capa inactiva, la compuerta desaparece de la pista de módulo.
- `validate:state` exige el contrato (`<contratos>/<id>.contract.ts` o con el nombre sin número) a todo módulo que superó G2, aplicando la regla de oro del contrato previo, y avisa de carpetas de código que no correspondan a ningún módulo.
- `init-project` pregunta las capas y sus carpetas raíz, escribe `project.json` y crea solo las carpetas de las capas activas.
- **Fragmentos de changelog (`changelog.d/`):** cada módulo registra sus cambios en `changelog.d/[XX_nombre].md` y los transversales en `changelog.d/proyecto-[descripcion].md`. Ninguna rama edita `CHANGELOG.md`, así que varios módulos en paralelo no chocan al fusionar.
- `npm run release:changelog -- X.Y.Z [--dry-run]`: consolida los fragmentos por sección de Keep a Changelog anteponiendo el ID del módulo, los borra y registra la versión en `incluido_en_release` de los módulos incluidos. Rechaza fragmentos de módulos que no superaron G4 y versiones ya publicadas.
- **Bitácoras por módulo:** `multiAgents/[rol]/worklog/[XX_nombre].md` para el trabajo de un módulo; el `WORKLOG.md` de cada rol queda para lo transversal.
- Reglas I y J de `check:docs`: formato y nombre de los fragmentos, y que fragmentos y bitácoras correspondan a un módulo existente.

### Changed
- `init-project` reinicia la historia heredada del starter: `CHANGELOG.md`, bitácora del orquestador, historial de la matriz de versiones, fragmentos pendientes y metadatos de `package.json` (nombre, versión 0.1.0, descripción y autor). La versión del starter queda registrada como origen.
- `check:no-any`, `test:contracts` y `audit:a11y` leen sus rutas de `project.json` en lugar de asumir `backend/`, `frontend/` y `docs/contracts/`.
- Las herramientas usan la fecha local (no UTC) al registrar fechas.
- La regla de oro de la bitácora (`AGENTS.md` §6) precisa dónde se registra cada cambio: bitácora del módulo o del rol según corresponda.
- Entregables de G3A, G4 y G5 en `STAGE_GATES.md`, protocolo de aterrizaje de `AGENTS.md`, Definition of Done de los roles, `SEMVER_CHANGELOG_PROTOCOL.md`, protocolos de colaboración, convención de commits, `init-project` y `new:module` alineados con fragmentos y bitácoras por módulo.

---

## [1.7.0] - 2026-11-10

### Added
- **Pistas de trabajo paralelas por módulo:** cada módulo tiene su archivo de estado en `.workflow/modules/[XX_nombre].json` (gate, estado, responsable, rama, dependencias, historial). Varias personas o agentes pueden avanzar módulos distintos a la vez sin editar un archivo común.
- Columna **Nivel** en la Tabla Maestra de `STAGE_GATES.md` (Proyecto, Módulo, Release) y nueva §2.1 que define las pistas: línea base del proyecto (G0, G1, G2 una vez), módulo (G1 a G4) y release (G5, G6, repetible).
- `npm run new:module -- XX_nombre [--nombre] [--responsable] [--depende-de]`: crea `docs/modules/XX_nombre/` desde `MODULE_TEMPLATE` y su archivo de estado en G1. Rechaza IDs mal formados, números repetidos y dependencias inexistentes.
- `npm run status`: semáforo consolidado de proyecto y módulos (gate, estado, responsable, rama, dependencias, bloqueos y módulos listos para release). Es una vista generada: no escribe archivos.
- `tooling/lib/workflow-state.mjs`: lógica de validación compartida por `validate:state` y `status`.

### Changed
- `validate:state` valida todas las pistas y las reglas entre ellas: un módulo no se adelanta a la línea base del proyecto, no entra en construcción sin el contrato de sus dependencias aprobado en G2, no se fusiona a `main` antes que ellas, sin ciclos ni números repetidos, y con su carpeta en `docs/modules/`.
- `current_state.json` pasa a ser solo la pista de proyecto y release; se elimina `modulo_en_curso` (el validador explica la migración si lo encuentra). `COMPLETADO` se interpreta por pista: G4 en módulos, G6 en el proyecto.
- G1 y G2 distinguen entregables de línea base y por módulo; G4 fusiona la rama del módulo y lo marca `COMPLETADO`; G5 lista los módulos incluidos y G6 devuelve el proyecto a G5 para el siguiente release.
- `PROJECT_STATUS.md` ya no copia el semáforo (punto de conflicto entre ramas): remite a `npm run status` y conserva solo el plan de releases y las decisiones de versión.
- `AGENTS.md` (fuentes, árbol y protocolo de aterrizaje), `README.md`, `LANDING_PROMPT.md`, el ROLE del orquestador, `HANDOFF_PROTOCOL.md`, `MODULE_TEMPLATE` e `init-project` alineados con las pistas.

---

## [1.6.0] - 2026-11-10

### Added
- **Encabezado estándar de documentos:** los documentos de `docs/project/`, `docs/modules/`, `docs/qa/index.md` y las plantillas de módulo declaran `Responsable`, `Estado`, `Naturaleza` (Vivo o Inmutable) y `Última revisión`. La convención está en `docs/README.md` y la regla G de `check:docs` la exige.
- Regla H de `check:docs` (solo aviso): señala los documentos que superan 400 líneas en `docs/` o 300 en `ROLE.md` y subroles, para dividirlos antes de que se vuelvan monolitos.

### Changed
- Encabezados normalizados: "Autor Líder" pasa a "Responsable"; "Fecha", "Fecha de Emisión", "Última Actualización" y "Última Auditoría" pasan a "Última revisión", con `{{INIT_DATE}}` en los documentos de proyecto para que `init-project` ponga la fecha real.

---

## [1.5.0] - 2026-11-10

### Added
- `docs/project/glossary.md`: glosario del dominio (lenguaje ubicuo) con nombre técnico obligatorio, sinónimos prohibidos y registro de estados de negocio terminales. Lo personaliza `init-project`.
- `MODULE_TEMPLATE/00_README_TEMPLATE.md`: índice de cada módulo (`docs/modules/[XX]/README.md`) con estado, enlaces al contrato, ADRs, QA y walkthroughs, y una tabla de qué leer según el rol. Hace efectivo el paso de navegación que ya describía `docs/README.md`.

### Changed
- La Definition of Ready del Product Manager exige registrar los términos nuevos en el glosario y crear el índice del módulo. `AGENTS.md` incluye ambos en los entregables del PM.
- Regla F de `check:docs`: en `multiAgents/protocols/TEMPLATES/` solo exige enlaces relativos, porque los destinos existen una vez copiada la plantilla.

---

## [1.4.1] - 2026-11-10

### Changed
- **Enlaces relativos:** los 76 enlaces `file:///…` de 19 documentos pasan a rutas relativas al archivo, de modo que funcionan en GitHub, en el editor y para los agentes, sin depender de la raíz del sistema de archivos.
- **Neutralidad de dominio:** se eliminaron los restos del caso piloto educativo y de Colombia (comunidad escolar, normativa escolar colombiana, marco legal MEN, notas y expedientes, `es-CO`, cédulas, ejemplo de calificación en el envelope, reapertura "por Rector", módulo `06_matriculas`). Se sustituyeron por redacción universal o placeholders. El subrol legal conserva Educación como uno más de sus sectores de ejemplo.

### Added
- Regla F de `check:docs`: los enlaces Markdown deben ser relativos (prohíbe `file://` y rutas absolutas) y apuntar a un destino existente. Ignora URLs externas, anclas, placeholders y bloques de código.

---

## [1.4.0] - 2026-11-10

### Changed
- **Reestructuración de `docs/`:** los documentos transversales pasan de la raíz a `docs/project/` con nombres sin prefijo numérico (`01_prd.md` → `project/prd.md`, `02_architecture.md` → `project/architecture.md`, `04_ui_design_system.md` → `project/design-system.md`, `VERSION_MATRIX.md` → `project/version-matrix.md`). El panel monolítico `03_qa_report.md` pasa a ser el índice `qa/index.md`. `walkthroughs/` se mueve a `docs/walkthroughs/`. `contracts/`, `adrs/`, `modules/` y `qa/` conservan su ubicación. Movimientos con `git mv` (historial preservado) y 32 archivos con rutas actualizadas.
- `QA_REPORT_TEMPLATE.md` y el ROLE de QA ahora apuntan el reporte modular a `docs/qa/[XX_modulo]/[vX.Y.Z]/QA_REPORT.md` (coherente con `STAGE_GATES.md`), y `SEMVER_CHANGELOG_PROTOCOL.md` adopta la ruta canónica de walkthroughs en lugar del esquema `WALKTHROUGH_[MODULO]_[NOMBRE].md`.
- `init-project.mjs` y `audit-a11y.mjs` apuntan a las nuevas rutas.

### Fixed
- `init-project.mjs` omitía en silencio los archivos que no encontraba. Ahora avisa por consola. Además faltaban en su lista `design-system.md`, el panel de QA y el subrol legal, que contienen placeholders y quedaban sin personalizar.

### Added
- `docs/README.md`: índice maestro de la documentación, con el mapa de carpetas, su naturaleza (viva o inmutable) y el rol responsable.
- Regla E de `check:docs`: toda ruta `docs/...` mencionada en un documento debe existir (ignora placeholders, informes generados y los registros históricos CHANGELOG/WORKLOG).
- Carpetas `docs/quality/` y `docs/qa/incidents/` (con `.gitkeep`), referenciadas por los protocolos de mejora continua y QA.

---

## [1.3.0] - 2026-11-10

### Changed
- **Mapa de Stage-Gates unificado:** `.workflow/STAGE_GATES.md` es ahora la única definición de compuertas (G0 a G6) con tres tipos: 🛑 Halt, ⚡ Checkpoint (G3A) y 🔧 Bootstrap (G0). G4 (QA, autoriza commit y merge) queda separado de G5 (release y paso a producción); G6 (Kaizen) pasa a ser halt formal.
- `AGENTS.md` (regla de oro #10 y §5 ahora incluyen G5 y G6), `README.md`, `HANDOFF_PROTOCOL.md` y `00_orchestrator/ROLE.md` (el "Gate 3" automático se divide en checkpoint G3A y Gate 3B con firma humana) alineados con el mapa canónico.
- Estado inicial de `.workflow/current_state.json`: `FASE_1_REQUERIMIENTOS` / `GATE_1_PRD_APPROVAL` / `EN_PROCESO`; valores permitidos documentados. `GATE_4_RELEASE_APPROVAL` renombrado a `GATE_4_QA_APPROVAL`.
- Plantillas `docs/01_prd.md`, `02_architecture.md` y `04_ui_design_system.md` ya no declaran "APROBADO" de fábrica.
- Etapas del pipeline de integración renombradas a `CI-1`, `CI-2`, `CI-3` en el subrol CI/CD para evitar colisión con los Stage-Gates.

- **`AGENTS.md` es la fuente de verdad del repositorio:** nueva sección 0 con el mapa de fuentes (tema → archivo dueño) y la política de citas. `STAGE_GATES.md` pasa a ser la fuente de los datos de compuertas por delegación explícita de `AGENTS.md`.
- `README.md` y `LANDING_PROMPT.md` pasan a ser puentes: se eliminaron la lista de reglas de oro y el diagrama numerado del README. Las reglas que solo estaban en el README (envelope, aislamiento multi-tenant, datos reales sin mocks) ya existen como reglas locales en los `ROLE.md` y subroles de backend, arquitectura y frontend.
- Las citas numeradas de reglas de oro en ROLE.md, subroles, `docs/02_architecture.md` y la plantilla de contrato se reemplazaron por referencias a `AGENTS.md` §6. Varias apuntaban a un número incorrecto (por ejemplo, la regla del `any` figuraba como #6 y #8; la de commits, como #10).

- Encabezados de reglas locales renombrados de "Reglas de Oro" a "Reglas Inviolables" en los ROLE.md (PM, arquitectura, backend, frontend, DevOps) y en dos subroles, para que "Reglas de Oro" designe solo la lista de `AGENTS.md`.
- `MODULE_TEMPLATE/README.md`: enlaces con ruta absoluta a una carpeta personal reemplazados por enlaces relativos.

### Added
- `CLAUDE.md` y `GEMINI.md`: puentes de una línea que importan `AGENTS.md` (`@AGENTS.md`). `check:docs` verifica que existan y que sigan siendo solo puentes.
- `tooling/validate-state.mjs` (`npm run validate:state`): valida `current_state.json` contra las tablas de `STAGE_GATES.md` (fase/gate coherentes, estados permitidos, checkpoint sin firma humana). Lee los datos de `STAGE_GATES.md` en cada ejecución, sin copia propia. Se ejecuta en `npm test` y en el CI, reemplazando la verificación inline anterior.
- `tooling/lib/stage-gates.mjs`: lector de las tablas de `STAGE_GATES.md` (marcadores `gates:start/end` y `estados:start/end`). Falla de forma explícita ante marcadores ausentes o filas mal formadas.
- `tooling/check-doc-sources.mjs` (`npm run check:docs`): lint de la política de fuentes de verdad. Prohíbe citas numeradas de reglas de oro fuera de `AGENTS.md`, prohíbe numerar compuertas o reglas en README y LANDING_PROMPT, y verifica que el diagrama de `AGENTS.md` coincida con la tabla de `STAGE_GATES.md`. Se ejecuta en `npm test` y en el CI.

---

## [1.2.0] - 2026-10-20

### Added
- **Suite Automatizada de Herramientas y Runners de Testing en `tooling/`:**
  - `audit-security-runtime.mjs` (`npm run audit:dast`): Escáner DAST en runtime de cabeceras de protección HTTP (CSP, HSTS, X-Content-Type, X-Frame), cookies de sesión (`HttpOnly`, `SameSite`), verificación CORS y enmascaramiento de errores 500, con reporte `docs/qa/dast-audit-summary.json`.
  - `run-load-test.mjs` (`npm run test:load`) + `tests/load/scenarios.template.js`: Orquestador de pruebas de carga k6 / benchmark concurrente con reporte visual interactivo `docs/qa/load-report.html` y resumen JSON `docs/qa/load-summary.json`.
  - `audit-a11y.mjs` (`npm run audit:a11y`): Auditor automatizado de conformidad WCAG 2.1/2.2 AA (elementos sin nombre accesible, inputs huérfanos, tabindex > 0), con reporte `docs/qa/a11y-audit-summary.json`.
  - `validate-contracts.mjs` (`npm run test:contracts`): Validador canónico de contratos DTO Zod en `docs/contracts/` con verificación de Envelopes y cero tolerancia a `any`.
- **Integración con Subroles de QA Lead y CI/CD:**
  - Actualización de `03_performance_security_auditor.md` y `02_e2e_a11y_specialist.md` con mandatos CLI explícitos.
  - Integración en `01_ci_quality_gates.yml` de validación de contratos y accesibilidad estática.
  - Actualización de `QA_REPORT_TEMPLATE.md` para adjuntar reportes JSON y HTML automatizados.

---

## [1.1.0] - 2026-10-19

### Fixed
- **Validación de la Máquina de Estados en CI/CD (`01_ci_quality_gates.yml`):**
  - Corrección de la lectura del esquema en `.workflow/current_state.json` (`fase_activa` y `gate_activo`) que ocasionaba fallos prematuros en GitHub Actions.

### Added
- **Ecosistema de Calidad Integral en `multiAgents/`:**
  - Rito de especificación previa **ATDD (Three Amigos)** en `01_product_manager` con plantilla `ATDD_SPEC_TEMPLATE.md`.
  - Construcción bilateral con **TDD en dos capas**: subrol `05_developer_component_tdd.md` en Frontend y ciclo Red-Green-Refactor estricto en Backend.
  - Marco de auditoría de pruebas estructurado bajo los **4 Cuadrantes de Calidad Ágil** en `05_qa_security_tester`.
  - Ficha técnica estandarizada de defectos (`INCIDENT_DEFECT_TEMPLATE.md`) con ciclo de vida canónico de bugs.
  - Protocolo de Mejora Continua (**Fase 6: Kaizen**) con Diagrama de Ishikawa en 5 ramas, análisis de Pareto 80/20 y plantilla `CONTINUOUS_IMPROVEMENT_TEMPLATE.md`.

---

## [1.0.1] - 2026-10-07

### Changed
- **Desacople y Generalización Universal de Subroles y Protocolos:**
  - Erradicación total de remanentes del caso piloto (AcademiaNeiva, Decretos 1290/1850/2247, Ley 115, SIMAT, términos escolares).
  - Generalización del C4 Model, DDL relacional 3FN multi-tenant, contratos Zod canónicos y RBAC corporativo en `multiAgents/02_software_architect/`.
  - Renombramiento y generalización de subroles de Backend (`02_domain_business_rules.md` y `03_data_layer_optimizer.md`).
  - Adaptación agnóstica de subroles de Frontend, QA, DevOps, Product Management y protocolos técnicos de sincronización.
  - Corrección de auditorías AST y verificación de cero ocurrencias de dominio específico mediante inspección estática.

---

## [1.0.0] - 2026-10-07

### Added
- **Gobernanza y Orquestación Multiagente:**
  - Manual rector [`AGENTS.md`](AGENTS.md) con las 11 Reglas de Oro, arquitectura de roles y protocolo de Stage-Gates.
  - Máquina de estados en [`.workflow/current_state.json`](.workflow/current_state.json) y compuertas en [`.workflow/STAGE_GATES.md`](.workflow/STAGE_GATES.md).
  - Kit completo de 7 Roles Líderes y 26 Subroles especializados en `multiAgents/`.
  - Protocolos de colaboración técnica (`HANDOFF_PROTOCOL`, `COLLABORATION_PROTOCOL_TECH_TRIO`, `GIT_COMMIT_CONVENTION`, `SEMVER_CHANGELOG_PROTOCOL`).
- **Tooling y Compuertas Mecánicas AST:**
  - Asistente interactivo de personalización de proyectos [`tooling/init-project.mjs`](tooling/init-project.mjs) (`npm run init:project`).
  - Auditor AST de TypeScript para Backend [`tooling/check-no-any-backend.ts`](tooling/check-no-any-backend.ts).
  - Auditor AST de TypeScript y Vue para Frontend [`tooling/check-no-any-frontend.mjs`](tooling/check-no-any-frontend.mjs) (`npm run check:no-any`).
- **Artefactos y Plantillas de Ingeniería:**
  - Plantillas rectoras en `docs/`: PRD (`01_prd.md`), Arquitectura (`02_architecture.md`), Reporte QA (`03_qa_report.md`), Design System (`04_ui_design_system.md`), y Matriz de Versiones (`VERSION_MATRIX.md`).
  - Plantillas modulares en `multiAgents/protocols/TEMPLATES/` y catálogo de ADRs.
  - Prompt canónico de bienvenida para agentes de IA en [`LANDING_PROMPT.md`](LANDING_PROMPT.md).
