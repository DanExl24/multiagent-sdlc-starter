# 📝 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.18.0] - 2026-11-14

### Added
- **Verificación previa en `npm run gate`** (`STAGE_GATES.md` §2.5): antes de `avanzar` o `solicitar`, comprueba que existan los entregables con ruta fija y ejecuta los comandos de `verificaciones` que `.workflow/project.json` declara para esa compuerta. Si un comando falla, la transición no se aplica y se muestran sus últimas líneas; si pasan, el resultado queda como evidencia en el historial. G3A y G3B exigen al menos un comando: un checkpoint ya no avanza con las pruebas fallando.
- Columna **Ruta comprobada** en el Catálogo de Entregables (`{modulo}`, `{version}` y `*` por segmento): es el dato que usa la verificación previa, sin una segunda lista.
- `npm run status -- [XX_nombre]` muestra las verificaciones de cada compuerta y avisa cuando faltan en una compuerta de capa.
- **Pruebas de comportamiento del tooling** (`npm run test:tooling`, incluido en `npm test`): repositorios temporales con Git que comprueban, entre otros casos, que G3A no avanza con una verificación fallida, que G4 no se solicita con un S2 declarado, que `aprobar` rechaza entregables cambiados tras la solicitud y que un commit fallido deshace la transición.

### Changed
- El rol de fundación declara las `verificaciones` de G3A y G3B junto con el stack (`07_foundation_architect` y su subrol de estructura). `init:project` crea el campo vacío y `validate:state` rechaza compuertas inexistentes.

---

## [1.17.0] - 2026-11-13

### Added
- **Resumen verificable en el reporte de QA:** la sección 0 de `QA_REPORT_TEMPLATE.md` abre con cuatro indicadores (S1 y S2 abiertos, requisitos aprobados no cumplidos, pruebas omitidas sin evidencia). `npm run gate` los lee al solicitar G4 y rechaza la solicitud si falta alguno o si alguno es mayor que 0. Antes bastaba con que existieran los encabezados, aunque el reporte declarara un S2 abierto.
- **La firma cubre lo revisado:** `solicitar` guarda el commit de los entregables y `aprobar` se niega si cambiaron desde entonces. Se puede volver a `solicitar` desde `ESPERANDO_APROBACION_HUMANA`.

### Changed
- **Las herramientas de QA ya no certifican lo que no comprobaron.** `audit:dast` y `test:load` marcan `NOT_RUN` sin servidor o con `--offline` (antes registraban `PASS` simulados) y salen con código 2 si no pudieron ejecutarse. `audit:a11y` se presenta como lint estático preliminar (`SIN_HALLAZGOS_ESTATICOS` en lugar de `CONFORME_WCAG_2.1_AA`). `test:contracts` distingue `NOT_APPLICABLE`, `PASS`, `PASS_CON_ADVERTENCIAS` y `FAIL`. Cada reporte declara su alcance; el benchmark sin k6 aclara que no equivale a una prueba de carga.
- **Commit de la transición transaccional:** si el commit del archivo de estado falla, `gate` deshace la transición en lugar de dejar el estado modificado sin registrar.
- README y `AGENTS.md` §1.2 sin promesas absolutas ("erradica", "HITL Guaranteed"); el README ya no dice que `init:project` pregunta el stack.

### Fixed
- `audit:dast -- --offline` y `test:load -- --offline` tomaban `--offline` como URL objetivo.

---

## [1.16.0] - 2026-11-13

### Added
- **`npm run gate` exige la sección 0 del reporte de QA en G4:** `solicitar` no pide la firma si el `QA_REPORT.md` más reciente del módulo no tiene las secciones "Requisitos aprobados no cumplidos" y "Limitaciones de entorno", o conserva la fila de ejemplo de la plantilla. Detectado en Digitaline: el módulo de mantenimiento omitió esa sección aunque la plantilla ya la traía.
- **`npm run new:module -- XX_nombre --origen docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md`:** marca un módulo de mantenimiento con el plan Kaizen del que sale. `npm run status` lo muestra y `validate:state` comprueba que el plan exista.

### Changed
- `CONTINUOUS_IMPROVEMENT_PROTOCOL.md` (paso 6), `STAGE_GATES.md` (G4 y campos del módulo) y `QA_REPORT_TEMPLATE.md` documentan lo anterior. El módulo de mantenimiento conserva las plantillas completas: en la prueba de campo, flujos y estados aportaron contenido real.

---

## [1.15.0] - 2026-11-13

### Added
- **Requisito aprobado incumplido = S2 como mínimo:** QA no puede aceptarlo como "riesgo residual"; veta y devuelve el módulo con `npm run gate -- [XX_nombre] volver`, salvo que el Director Humano cambie el requisito de forma explícita. Detectado en Digitaline: un RNF de ≤ 32 ms medido en 595 ms pasó G4 como S3.
- **Limitaciones de entorno con evidencia:** una prueba solo se omite si el reporte muestra el comando que demuestra que el entorno no está disponible (por ejemplo, `adb devices`). Con Android u otra plataforma móvil en el stack, la verificación en dispositivo físico es obligatoria en G4.
- `QA_REPORT_TEMPLATE.md` abre con una sección obligatoria para el Director Humano: requisitos aprobados no cumplidos y limitaciones de entorno con su evidencia.
- **Módulo de mantenimiento:** si no hay un módulo siguiente previsto, las acciones de alcance `futuro` del Kaizen se ejecutan en un módulo creado con `npm run new:module -- XX_mejoras_vX_Y`, que recorre G1 a G4 (paso 6 de `CONTINUOUS_IMPROVEMENT_PROTOCOL.md`). Nunca en la sesión de G6.

### Changed
- Condiciones de veto de G4 y acción de G6 en `STAGE_GATES.md`, plantilla de incidencias y ROLE del orquestador alineados con lo anterior.

---

## [1.14.0] - 2026-11-12

### Added
- **Commits garantizados por `npm run gate`:** `solicitar` se niega si hay cambios sin commit (salvo archivos sueltos sin seguimiento en la raíz) y cada transición hace commit de su propio archivo de estado. Tras aprobar G4 y G5 recuerda el merge y el push pendientes; el push nunca es automático.
- `npm run status` muestra la rama, los cambios sin commit y los commits sin publicar.
- **Reapertura de módulos ya cerrados:** `npm run gate -- [XX_nombre] reabrir --desde [Gx] --motivo "..." --cita "..."`. `STAGE_GATES.md` §2.4 define cuándo es obligatoria (S1/S2 o violación de las Reglas de Oro en un módulo liberado), desde qué compuerta y qué rol retoma según el origen. La versión liberada pasa a `releases_previos`, y `validate:state` avisa a los módulos que dependen del reabierto.
- Columna **Capa** en el Catálogo de Entregables: lo que solo aplica con backend (Bruno, k6, DAST, seeders, `/api/health`…) desaparece del plan cuando esa capa está inactiva. Nuevos entregables `rendimiento_cliente` (frontend) y `auditoria_dependencias` (siempre).
- Reglas del rol de QA: leer resúmenes de los reportes generados, reutilizar scripts de `tests/` y registrar toda prueba intermitente como defecto con su ficha.

### Changed
- El plan Kaizen clasifica cada acción con un **alcance**: `futuro` o `reabrir [XX_nombre] desde [Gx]`.
- `release:changelog` actualiza también `version_actual` en `current_state.json`.
- `AGENTS.md` §5.1 y `GIT_COMMIT_CONVENTION.md` documentan los commits automáticos y que el push requiere autorización explícita.

---

## [1.13.1] - 2026-11-12

### Fixed
- La regla E de `check:docs` daba por inexistentes los imports de TypeScript sin extensión (por ejemplo, `from "../../docs/contracts/02_editor.contract"`). Ahora acepta la ruta si existe con `.ts`, `.js`, `.mjs` o como `index.ts`. Detectado en la prueba de campo de Digitaline.

---

## [1.13.0] - 2026-11-12

### Added
- **`npm run gate -- [pista] [acción]`:** cambia el estado de una pista sin editar JSON a mano (`estado`, `solicitar`, `aprobar --cita`, `avanzar`, `bloquear`, `desbloquear`, `volver`). Aplica el tipo efectivo del perfil, asigna el rol en turno, escribe el historial y deshace cualquier transición que deje el flujo inválido. Al pasar de la línea base de G2 a G5 registra que no es un salto de fases (en la prueba de campo, Codex lo había interpretado así).
- Columna **Rol en turno** en la Tabla Maestra de `STAGE_GATES.md`, que usa `gate` para asignar el rol de cada compuerta.
- **Economía de contexto** (`AGENTS.md` §5.1, obligatoria): una sesión por compuerta (cada Halt cierra la sesión), un subrol no es un subagente, lectura mínima al aterrizar y estado solo mediante `npm run gate`. `LANDING_PROMPT.md` y el protocolo de aterrizaje la incorporan.
- **Confirmación del perfil:** `perfil.confirmado` en `project.json`. `validate:state` y `gate` impiden superar el G1 de línea base sin confirmarlo, y `status` lo marca como "SIN CONFIRMAR". `init-project` solo lo confirma si se escribe la escala.
- `test:contracts` rechaza los campos `estado`, `status` o `state` declarados como `z.string()`: deben ser `z.enum` con los valores del glosario.
- Entregables `integracion_persistencia_backend` (G3A) e `integracion_persistencia_frontend` (G3B): al menos una prueba contra la persistencia real, sin mocks, por cada ruta de guardado o lectura.

### Changed
- El Stack Selector exige elegir y justificar las librerías clave por cada necesidad del dominio, no solo lenguaje y framework, y su ADR incluye una tabla de librerías.
- Los subroles de DDL y de contratos exigen declarar los estados como `ENUM`/`CHECK` y `z.enum`; el glosario y el catálogo lo recogen.
- G4 autoriza el **merge** a `main`, no el primer commit: `GIT_COMMIT_CONVENTION.md` §1.1 define que se hace commit en la rama del módulo al cerrar cada compuerta y al terminar cada unidad de trabajo. Ajustados `STAGE_GATES.md`, `AGENTS.md`, `HANDOFF_PROTOCOL.md` y el ROLE del orquestador.
- Las acciones de cada compuerta en `STAGE_GATES.md` y los pasos de `new:module` indican el comando `gate` que corresponde.

---

## [1.12.0] - 2026-11-10

### Added
- `npm run check:tooling` (incluido en `npm test`): comprueba la sintaxis de todos los scripts de `tooling/`, también los que `npm test` no ejecuta (`status`, `new:module`, `release:changelog`, `init:project`).
- `npm run status` muestra qué módulos entraron en cada release, a partir de `incluido_en_release`.
- `check:docs` rechaza usar "Regla(s) de Oro" como nombre propio de otra regla (por ejemplo, "Regla de Oro de X" o "Reglas de Oro Legales"), salvo en las bitácoras históricas.

### Changed
- `release:changelog` fija la versión del release en `package.json` y `package-lock.json`; ya no hay que subirla a mano.
- `init-project` alinea también el nombre y la versión de `package-lock.json` con el proyecto nuevo.
- `check:docs` trata los fragmentos de `changelog.d/` como registro histórico, igual que `CHANGELOG.md`: pueden mencionar rutas eliminadas. Su formato lo sigue validando la regla I.
- Renombradas las expresiones que sonaban a Reglas de Oro sin serlo: "Reglas Legales Innegociables" (subrol legal y ROLE del PM), "Principio del Tipado Compartido" (protocolo del trío técnico) y "Nomenclatura Canónica" (convención de commits). Las dos últimas enlazan a su regla en `AGENTS.md` §6.

### Removed
- `docs/project/version-matrix.md`: sus tres secciones repetían otras fuentes (estado de módulos → `npm run status`; ciclo de vida → `STAGE_GATES.md`; historial → `CHANGELOG.md` y `PROJECT_STATUS.md`) y la tabla de módulos era otro punto de conflicto entre ramas. Las referencias del manual de QA, el subrol de tablero y `init-project` se actualizaron.

### Fixed
- `package-lock.json` seguía en la versión 1.0.0 del starter.

---

## [1.11.0] - 2026-11-10

### Added
- **Rol transversal `07_foundation_architect` (Arquitecto de Fundación):** actúa tras aprobar la idea de negocio (G1 de línea base) y antes que el Arquitecto de Software, en el orden idea → stack → estructura de carpetas. En cada paso hace una recomendación justificada, no un menú de opciones, y pide la conformidad explícita del desarrollador. Tiene dos subroles con su contrato: Stack Selector y Repo Structure Designer.
- `docs/project/repo-structure.md`: mapa preliminar de módulos, árbol, tabla de "qué tipo de archivo va dónde" y reglas de nombres.
- Bloque `fundacion` en `.workflow/project.json` (estado, stack por capa y ADRs de stack y estructura) y entregables `adr_stack` y `estructura_repo` en el catálogo de G2.
- `validate:state` impide pedir la firma del G2 de línea base, o superarlo, sin la fundación completada y sus dos ADRs existentes.

### Changed
- `init-project` deja de preguntar el stack, las capas y las carpetas raíz (las preguntas de stack ni siquiera se usaban en ningún documento). Ahora solo pide nombre, descripción, dominio, autor y perfil, y deja la fundación pendiente.
- El subrol de topología del Arquitecto ya no define los límites de carpetas: respeta la estructura aceptada por el rol de fundación y la cambia solo mediante un ADR nuevo con ese rol.
- `AGENTS.md` (catálogo de roles, matriz de relevo y árbol), `README.md`, `docs/README.md`, `STAGE_GATES.md` (G1, G2 y pistas) y el ROLE del orquestador incorporan el rol de fundación.

---

## [1.10.0] - 2026-11-10

### Added
- **Contrato del Subrol:** los 26 subroles abren con un bloque vinculante (responsabilidad, cuándo se activa, entradas, salidas, límites y criterio de salida). Las salidas citan los IDs del Catálogo de Entregables, así que encajan con los perfiles. El resto de cada documento pasa a ser la técnica de referencia.
- `multiAgents/protocols/SKILLS_INTEGRATION_PROTOCOL.md`: cómo usar skills externas (por ejemplo, ECC) como técnica de un subrol sin alterar el proceso. Define la precedencia (invariantes > perfil > contrato > técnica), los criterios que excluyen una skill (fases o compuertas propias, commits o merges autónomos, bucles sin alto, escritura en `.workflow/` o en `CHANGELOG.md`, equipos que reasignan roles), la lista de skills de orquestación de ECC excluidas, el uso de revisores como asesores, el registro obligatorio en la bitácora y una tabla orientativa de correspondencias.
- Regla K de `check:docs`: todo subrol debe tener su contrato con los seis campos declarados.

### Fixed
- El subrol de modelado DDL indicaba que el DDL vive en `docs/project/architecture.md`; desde la reorganización de `docs/` vive en el `04_ARQUITECTURA_Y_CODIGO.md` de cada módulo.

---

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
