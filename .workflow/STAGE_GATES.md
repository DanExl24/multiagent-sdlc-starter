# 🚦 PROTOCOLO DE COMPUERTAS DE CALIDAD Y CONTROL HUMANO (STAGE-GATES HITL)

> **Documento Rector del Ciclo de Vida Multiagente.**  
> Este protocolo rige de forma obligatoria para **TODOS los agentes de Inteligencia Artificial** que operen en este repositorio.  
> Su objetivo es garantizar la soberanía, supervisión y control del **Director Humano (Tech Lead / Product Owner)** en los momentos críticos e irreversibles del desarrollo, erradicando la sobre-autonomía no autorizada.

> 📌 **FUENTE DE LOS DATOS DE LAS COMPUERTAS (delegada por [`AGENTS.md`](../AGENTS.md)).**  
> [`AGENTS.md`](../AGENTS.md) es la fuente de verdad del repositorio y **delega en este archivo** la definición de las compuertas: qué gates existen, de qué tipo son, quién las aprueba, qué se entrega en cada una y los valores permitidos de `current_state.json`.  
> Cualquier otro documento (`README.md`, `HANDOFF_PROTOCOL.md`, ROLE.md, etc.) **solo puede citarlas por su ID** (`G1`, `G3A`, …) o resumirlas, nunca redefinirlas. Ante cualquier contradicción en un punto que no sea un dato de compuerta, prevalece `AGENTS.md`.

---

## 1. Principio Fundamental: Alto Mecánico Obligatorio (Yield/Halt)

Ningún agente de IA puede encadenar fases de forma autónoma más allá de una compuerta que requiera aprobación humana.  
**Cuando un agente completa los entregables de un Gate con aprobación humana obligatoria (tipo 🛑 Halt), TIENE LA OBLIGACIÓN ABSOLUTA DE DETENER SU TURNO (NO LLAMAR MÁS HERRAMIENTAS DE CÓDIGO NI AVANZAR DE ROL) y esperar la confirmación explícita del usuario.**

---

## 2. Tabla Maestra de Compuertas

Existen **tres tipos** de compuerta:

| Tipo | Significado |
| :--- | :--- |
| 🛑 **Halt** | Requiere firma explícita del Director Humano. El agente se detiene. |
| ⚡ **Checkpoint** | Verificación automática del Orquestador (tests, build, contratos). **No** detiene el flujo: si todo está en verde, transfiere al siguiente rol y lo registra en `historial_transiciones`. |
| 🔧 **Bootstrap** | Se satisface automáticamente al ejecutar `npm run init:project`. El humano que corre el asistente es quien lo aprueba. |

<!-- gates:start -->

| ID | Transición | Tipo | Nivel | Rol en turno | Aprueba | `fase_activa` | `gate_activo` |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **G0** | Bootstrap → Requerimientos | 🔧 Bootstrap | Proyecto | — | Director Humano (al ejecutar `init:project`) | — *(no persiste en el JSON)* | — |
| **G1** | Requerimientos → Arquitectura | 🛑 Halt | Proyecto · Módulo | `01_product_manager` | Director Humano | `FASE_1_REQUERIMIENTOS` | `GATE_1_PRD_APPROVAL` |
| **G2** | Arquitectura → Construcción | 🛑 Halt | Proyecto · Módulo | `02_software_architect` | Director Humano | `FASE_2_ARQUITECTURA` | `GATE_2_ARCHITECTURE_APPROVAL` |
| **G3A** | Backend → Frontend | ⚡ Checkpoint | Módulo | `03_backend_engineer` | Orquestador | `FASE_3A_BACKEND` | `GATE_3A_BACKEND_CHECKPOINT` |
| **G3B** | Frontend → QA | 🛑 Halt | Módulo | `04_frontend_engineer` | Director Humano | `FASE_3B_FRONTEND` | `GATE_3B_FRONTEND_UI_APPROVAL` |
| **G4** | QA → Release (autoriza el merge a `main`) | 🛑 Halt | Módulo | `05_qa_security_tester` | Director Humano | `FASE_4_QA_VALIDACION` | `GATE_4_QA_APPROVAL` |
| **G5** | Release → Producción (tag, seeders, despliegue) | 🛑 Halt | Release | `06_devops_release` | Director Humano | `FASE_5_DEVOPS_RELEASE` | `GATE_5_RELEASE_APPROVAL` |
| **G6** | Kaizen → Siguiente ciclo | 🛑 Halt | Release | `06_devops_release` | Director Humano | `FASE_6_MEJORA_CONTINUA` | `GATE_6_KAIZEN_APPROVAL` |

<!-- gates:end -->

> **Semántica de `gate_activo`:** es siempre **la compuerta hacia la que se está trabajando** (la que se debe superar para salir de `fase_activa`). Por eso cada `fase_activa` tiene exactamente un `gate_activo`.

> **Columna Nivel:** indica en qué pista se recorre cada compuerta (ver §2.1). Una compuerta con nivel "Proyecto · Módulo" se recorre una vez en la línea base del proyecto y otra en cada módulo.

### 2.1. Pistas de trabajo: proyecto, módulos y release

El ciclo de vida se recorre en **pistas independientes**, para que varias personas o agentes trabajen a la vez sin pisarse:

| Pista | Archivo de estado | Compuertas | Qué cubre |
| :--- | :--- | :--- | :--- |
| **Proyecto** (línea base) | `.workflow/current_state.json` | G0, G1, G2 (una sola vez, al inicio) | PRD global y glosario (G1); stack, estructura del repositorio, arquitectura C4 y design system (G2) |
| **Módulo** | `.workflow/modules/[XX_nombre].json`, uno por módulo | G1 → G2 → G3A → G3B → G4 | Especificación, contrato, backend, UI y QA del módulo. G4 autoriza su merge a `main` |
| **Release** | `.workflow/current_state.json` (tras la línea base) | G5 → G6 | Agrupa los módulos que superaron G4 en una versión, la despliega y la retrospecta. Se repite en cada release |

- La pista de proyecto pasa a la de release al superar G2: desde entonces `current_state.json` trabaja hacia G5.
- Cada módulo avanza a su propio ritmo. El módulo `04` puede estar en G3A mientras el `08` está en G1.
- `current_state.json` **no** guarda el estado de los módulos: si lo hiciera, cada avance de cualquier módulo tocaría ese archivo y habría conflictos de Git. La vista consolidada se genera con `npm run status`.
- Los módulos se crean con `npm run new:module -- [XX_nombre]`, que genera su carpeta en `docs/modules/` y su archivo de estado.

### 2.2. Compuertas que dependen de una capa

Algunas compuertas solo existen si el proyecto tiene la capa correspondiente. Las capas activas y sus rutas se declaran en `.workflow/project.json`. Si una capa está inactiva, su compuerta desaparece de la pista de módulo y el flujo pasa directamente a la siguiente.

<!-- capas:start -->

| Compuerta | Capa requerida | Si la capa está inactiva |
| :--- | :--- | :--- |
| **G3A** | `backend` | El módulo pasa de G2 a G3B (frontend que consume una API existente). |
| **G3B** | `frontend` | El módulo pasa de G3A a G4 (API, servicio o librería sin interfaz). |

<!-- capas:end -->

### 2.3. Perfiles: el tipo efectivo de cada compuerta

El **Tipo** de la Tabla Maestra es el del perfil `standard`. El perfil del proyecto (escala `spike`, `sprint`, `standard` o `enterprise`, más modificadores de riesgo) puede convertir un Halt en Checkpoint o al revés, y ajustar los entregables (§7). Las reglas están en [`PROFILES.md`](PROFILES.md); los datos, en `.workflow/profiles/`. Para ver el tipo efectivo de cada compuerta: `npm run status -- [XX_nombre]` o `npm run status -- proyecto`.

Ningún perfil puede romper estos invariantes:

<!-- invariantes:start -->

| Compuertas | Regla | Motivo |
| :--- | :--- | :--- |
| **G4** | `halt_si_produccion` | Nada que vaya a producción entra a `main` sin firma humana. Solo una escala con `"produccion": false` (`spike`) puede volverla Checkpoint, y entonces exige verificaciones ejecutables (§2.5); sus módulos no entran en un release sin reabrirse desde G4. |
| **G5** | `halt` | Nada llega a producción sin firma humana. |
| **G1+G2** | `al_menos_un_halt` | Siempre hay una firma humana antes de construir. |

<!-- invariantes:end -->

### 2.4. Reapertura de un módulo ya cerrado

Un módulo `COMPLETADO` (fusionado a `main`, liberado o no) puede **rehacerse** cuando aparecen inconsistencias que no deben esperar al siguiente módulo. Las mejoras del Kaizen (G6) se aplican normalmente a los módulos futuros; esta sección cubre lo que obliga a volver atrás.

**Cuándo es obligatorio reabrir:**
- Un defecto **S1 o S2** en un módulo ya liberado.
- Una violación de las Reglas de Oro (`AGENTS.md` §6) en código ya fusionado.
- Una acción del plan Kaizen clasificada con alcance "reabrir" (ver `CONTINUOUS_IMPROVEMENT_PROTOCOL.md`).

Los defectos **S3 y S4** van al backlog del siguiente módulo o a un release de parche, sin reabrir.

**Desde qué compuerta y qué rol retoma**, según dónde está el origen del problema:

| Origen | Se reabre desde | Rol que retoma |
| :--- | :--- | :--- |
| Requisito ausente o mal especificado | G1 | `01_product_manager` |
| Contrato, datos o seguridad estructural | G2 | `02_software_architect` |
| Código de backend | G3A | `03_backend_engineer` |
| Código o accesibilidad de la interfaz | G3B | `04_frontend_engineer` |
| Solo evidencia de QA incompleta | G4 | `05_qa_security_tester` |

**Cómo:** con la firma del Director Humano, `npm run gate -- [XX_nombre] reabrir --desde [Gx] --motivo "hallazgo, severidad y origen" --cita "..."`. El módulo vuelve a `EN_PROCESO` en esa compuerta, su versión liberada pasa a `releases_previos` y recorre de nuevo hasta G4. La corrección entra en un nuevo release (parche si no cambia el comportamiento esperado). Si otros módulos dependen del reabierto, `npm run validate:state` avisa para revisar si también deben reabrirse.

### 2.5. Verificación previa: el agente no declara, la herramienta comprueba

Antes de `avanzar` un Checkpoint o `solicitar` la firma de un Halt, `npm run gate` ejecuta la verificación previa de la compuerta en curso. Si algo falla, la transición no se aplica y el mensaje dice qué corregir:

1. **Entregables con ruta fija:** los del plan efectivo con valor en la columna "Ruta comprobada" del catálogo (§7) deben existir.
2. **Comandos de verificación:** los que `.workflow/project.json` declara para esa compuerta en `verificaciones`, por ejemplo `{"G3A": ["npm test --prefix backend", "npm run check:no-any"], "G3B": ["npm run build --prefix frontend"]}`. Se ejecutan en orden; el primero que termina con un código distinto de 0 bloquea la transición. `{modulo}` se sustituye por el ID del módulo.
3. **Evidencia:** el resultado de cada comando queda en el `historial_transiciones` de la pista.

Las compuertas que dependen de una capa (§2.2) y las que un perfil sin producción vuelve Checkpoint (G4 en `spike`) **exigen** al menos un comando: sin ellos, ni G3A avanza ni G3B se solicita. El rol de fundación los declara junto con el stack; si faltan, los añade el rol en turno. Las demás compuertas los admiten de forma opcional.

> ⚠️ **Esta tabla es la única copia de los datos.** `tooling/validate-state.mjs` la lee directamente entre los marcadores `gates:start` y `gates:end`; no existe otra lista que mantener. Si cambias el formato de las columnas o quitas un marcador, el validador falla en CI a propósito.

---

## 3. Mapa Canónico del Flujo

```text
        🔧 G0  Bootstrap (npm run init:project)
             │
┌────────────▼────────────┐
│ Fase 1: Product Manager │
│  (PRD + HUs BDD + ATDD) │
└────────────┬────────────┘
             │
      🛑 G1: Aprobación Humana de Requerimientos y Reglas de Negocio
             │
┌────────────▼─────────────┐
│ Fase 2: Software Arch.   │
│  (DDL BD + Zod API)      │
└────────────┬─────────────┘
             │
      🛑 G2: Aprobación Humana de Arquitectura y Contratos de Datos
             │
┌────────────▼─────────────┐
│ Fase 3A: Backend Eng.    │
│  (Endpoints REST + TDD)  │
└────────────┬─────────────┘
             │
      ⚡ G3A: Checkpoint del Orquestador (pase continuo, sin halt)
             │
┌────────────▼─────────────┐
│ Fase 3B: Frontend Eng.   │
│  (Vistas SPA + UI/UX)    │
└────────────┬─────────────┘
             │
      🛑 G3B: Aprobación Humana de Diseño Web y Experiencia UI/UX
             │
┌────────────▼─────────────┐
│ Fase 4: QA Lead Tester   │◄──── Veto QA: vuelve a Fase 3A o 3B
│  (QA_REPORT.md + RCA)    │
└────────────┬─────────────┘
             │
      🛑 G4: Certificación de Calidad y Go/No-Go (autoriza el merge a main)
             │
┌────────────▼─────────────┐
│ Fase 5: DevOps & Release │
│  (Seeders, Docker, Tag)  │
└────────────┬─────────────┘
             │
      🛑 G5: Aprobación Humana de Release y Paso a Producción
             │
┌────────────▼─────────────┐
│ Fase 6: Mejora Continua  │
│  (Kaizen: Ishikawa/Pareto)│
└────────────┬─────────────┘
             │
      🛑 G6: Aprobación Humana del Plan de Mejora
             │
        Siguiente release (vuelve a G5)
```

> El mapa muestra el recorrido completo de **un** módulo de punta a punta. En la práctica, G1 y G2 se recorren primero en la línea base del proyecto; luego cada módulo recorre G1 → G4 en su propia pista, en paralelo con otros, y G5/G6 agrupan en un release los módulos que superaron G4 (ver §2.1).

---

## 4. Matriz de Detalle por Compuerta

### 🔧 G0: Bootstrap
- **Disparador:** `npm run init:project`.
- **Resultado:** documentos rectores personalizados y `current_state.json` inicializado directamente en `FASE_1_REQUERIMIENTOS` / `GATE_1_PRD_APPROVAL` / `EN_PROCESO`, con el Product Manager como rol en turno. Comienza la línea base del proyecto; todavía no hay módulos.
- **Sin halt:** G0 no genera una pausa adicional; el humano ya dio su aprobación al ejecutar el asistente.

---

### 🛑 G1: Aprobación de Requerimientos y Reglas de Negocio
- **Agente Emisor:** `01_product_manager`
- **Agente Receptor:** `02_software_architect`
- **Aprobador Requerido:** **Director Humano**
- **Entregables de la línea base (pista de proyecto, una vez):**
  - `docs/project/prd.md`: Documento rector de requerimientos de producto.
  - `docs/project/glossary.md`: Términos del dominio con su nombre técnico.
- **Entregables por módulo (pista de módulo):**
  - `docs/modules/[XX_modulo]/README.md`: Índice del módulo.
  - `docs/modules/[XX_modulo]/01_SPEC_FUNCIONAL.md`: Reglas funcionales del dominio y casos de uso.
  - `docs/modules/[XX_modulo]/02_HISTORIAS_USUARIO.md`: Historias bajo estándar **INVEST** y criterios en formato **BDD (Given-When-Then)**, con casos límite (BVA).
  - `docs/modules/[XX_modulo]/03_FLUJO_Y_ESTADOS.md`: Diagramas de flujo y ciclo de vida en Mermaid.
  - Especificación ATDD (`ATDD_SPEC_TEMPLATE.md`) con la firma de *Testability* de QA (rito *Three Amigos*: PM + Arquitecto + QA Lead).
- **Acción del Agente al Terminar:**
  1. Ejecutar `npm run gate -- [pista] solicitar` (deja la pista en `ESPERANDO_APROBACION_HUMANA`). Tras la firma: `npm run gate -- [pista] aprobar --cita "..."`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el resumen ejecutivo al Director Humano.
  3. **NO proceder** a diseñar tablas ni contratos hasta recibir la confirmación explícita del humano.
  4. En la línea base, tras la aprobación, el turno pasa al rol de fundación (`rol_en_turno: "07_foundation_architect"`) en `FASE_2_ARQUITECTURA`, antes que al Arquitecto de Software.

---

### 🛑 G2: Aprobación de Arquitectura Relacional y Contratos de Datos
- **Agente Emisor:** `02_software_architect`. En la línea base trabaja primero el rol transversal `07_foundation_architect` (stack y estructura) y después el Arquitecto.
- **Agente Receptor:** `03_backend_engineer`
- **Aprobador Requerido:** **Director Humano**
- **Entregables de la línea base (pista de proyecto, una vez):**
  - ADR del stack y ADR de la estructura en estado ACEPTADO, enlazados en `.workflow/project.json` → `fundacion` (rol `07_foundation_architect`). `npm run validate:state` impide pedir la firma de G2 sin ellos.
  - `docs/project/repo-structure.md`: mapa preliminar de módulos, árbol, tabla de ubicación y reglas de nombres.
  - `docs/project/architecture.md`: Topología técnica (C4), estrategia de aislamiento y convenciones transversales, sobre el stack y la estructura aceptados.
- **Entregables por módulo (pista de módulo):**
  - `docs/modules/[XX_modulo]/04_ARQUITECTURA_Y_CODIGO.md`: Modelo relacional y sentencias DDL (3FN).
  - `docs/contracts/[modulo].contract.ts`: Contratos de entrada y salida tipados estrictamente con schemas de **Zod**.
  - Matriz de permisos RBAC para los roles del sistema, aislamiento multi-tenant y manejo transaccional ACID.
- **Acción del Agente al Terminar:**
  1. Ejecutar `npm run gate -- [pista] solicitar` (deja la pista en `ESPERANDO_APROBACION_HUMANA`). Tras la firma: `npm run gate -- [pista] aprobar --cita "..."`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el modelo DDL y los contratos para revisión humana.
  3. **NO escribir código backend ni frontend** hasta recibir la confirmación explícita del humano. Un módulo no entra en construcción mientras la línea base del proyecto no haya superado G2.

---

### ⚡ G3A: Checkpoint de Backend (Pase Continuo)
- **Agente Emisor:** `03_backend_engineer`
- **Agente Receptor:** `04_frontend_engineer`
- **Aprobador:** **Orquestador** (verificación automática; **no** requiere firma humana).
- **Condiciones de Paso (todas obligatorias):**
  - Ciclo TDD Red-Green-Refactor completado y suite **Vitest al 100% en verde**.
  - Compilación estricta `npm run build` (`check:no-any && tsc`) en verde con **Tolerancia Cero al tipo `any`**.
  - Rutas protegidas con autenticación, RBAC y aislamiento de tenant, según el contrato de G2.
  - Contratos Zod sincronizados entre backend y `docs/contracts/`.
  - Bitácora del backend para el módulo (`multiAgents/03_backend_engineer/worklog/[XX_modulo].md`) actualizada.
- **Acción del Agente al Terminar:**
  1. Registrar el paso con `npm run gate -- [XX_modulo] avanzar`, que mueve el módulo a G3B, asigna `rol_en_turno: "04_frontend_engineer"` y escribe el historial.
  2. **Transferir directamente al Frontend Engineer.** Este checkpoint **no** detiene el turno.
  3. Si alguna condición falla, el pase **no** ocurre: el backend corrige antes de transferir.

---

### 🛑 G3B: Aprobación de Diseño Web y Experiencia de Usuario (UI/UX)
- **Agente Emisor:** `04_frontend_engineer`
- **Agente Receptor:** `05_qa_security_tester`
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - Vistas y componentes en `frontend/src/modules/[XX_modulo]/` consumiendo el **Design System** (`docs/project/design-system.md`).
  - Cero estilos o colores hardcodeados fuera del Design System oficial.
  - Formularios, modales interactivos y tablas reactivas con feedback visual (estados Loading, Empty, Error, Success).
  - Pruebas de componentes y stores en verde (`@testing-library`).
  - `docs/walkthroughs/[XX_modulo]/[vX.Y.Z]/WALKTHROUGH.md` reproducible.
  - Compilación limpia con `npm run build` (`check:no-any && typecheck && build`) con 0 errores y **0 usos de `any`**.
- **Acción del Agente al Terminar:**
  1. Ejecutar `npm run gate -- [pista] solicitar` (deja la pista en `ESPERANDO_APROBACION_HUMANA`). Tras la firma: `npm run gate -- [pista] aprobar --cita "..."`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Invitar al Director Humano a revisar y explorar el diseño visual, la usabilidad y los modales en su navegador.
  3. **NO avanzar a pruebas de QA** hasta que el Director Humano apruebe el diseño visual de la interfaz.

---

### 🛑 G4: Certificación de Calidad y Commit Canónico
- **Agente Emisor:** `05_qa_security_tester`
- **Agente Receptor:** `06_devops_release`
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - `docs/qa/[XX_modulo]/[vX.Y.Z]/QA_REPORT.md`: Auditoría forense con análisis RCA de cualquier defecto encontrado. Su **sección 0** es obligatoria aunque esté vacía: el resumen verificable (S1 y S2 abiertos, requisitos aprobados no cumplidos y pruebas omitidas sin evidencia), los requisitos incumplidos y las limitaciones de entorno con evidencia. `npm run gate -- [XX_modulo] solicitar` no pide la firma de G4 sin ella, ni si algún indicador del resumen es mayor que 0. En `spike`, que reduce el reporte a esta sección (`qa_resumen`) y cierra G4 sin firma, `avanzar` aplica la misma comprobación. Un resultado `NOT_RUN` de las herramientas (`audit:dast`, `test:load`) es una prueba omitida, nunca un PASS.
  - Suite de pruebas automatizadas 100% en verde y 0 defectos S1/S2 abiertos.
  - **Certificación AST de Cero ANY:** Verificación de `npm run check:no-any` en `backend/` y `frontend/` con 0 incidencias. Si se detecta un solo `any`, el QA Lead aplica **Veto Inmediato (Stop-the-Line)**.
  - Fragmento del módulo en `changelog.d/[XX_modulo].md` (formato Keep a Changelog), validado por `npm run check:docs`. En una rama de módulo no se edita `CHANGELOG.md`.
- **Veto QA:** si QA rechaza, `estado: "BLOQUEADO"` con el motivo en `bloqueos`, y el flujo regresa a `FASE_3A_BACKEND` o `FASE_3B_FRONTEND` según el defecto. QA **no** corrige código de producción. Son motivo de veto: cualquier defecto S1 o S2 abierto, y en particular **todo requisito aprobado en G1 que no se cumple** (S2 como mínimo, nunca "riesgo residual"), y las pruebas omitidas por una supuesta limitación de entorno sin evidencia.
- **Acción del Agente al Terminar:**
  1. Ejecutar `npm run gate -- [pista] solicitar` (deja la pista en `ESPERANDO_APROBACION_HUMANA`). Tras la firma: `npm run gate -- [pista] aprobar --cita "..."`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el veredicto final solicitando la firma Go / No-Go.
  3. Tras la aprobación humana, registrar la firma con `npm run gate -- [XX_modulo] aprobar --cita "..."` (marca el módulo `COMPLETADO`) y fusionar la rama del módulo en `main`. Los commits en la rama ya se hicieron al cerrar cada compuerta (`GIT_COMMIT_CONVENTION.md` §1.1). **Esto no es un despliegue:** el paso a producción se decide en G5.

---

### 🛑 G5: Aprobación de Release y Paso a Producción
- **Agente Emisor:** `06_devops_release`
- **Agente Receptor:** `00_orchestrator` (Operaciones)
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - Lista de módulos incluidos (todos `COMPLETADO` en G4). Al aprobarse, cada uno registra la versión en `incluido_en_release`.
  - Seeders y migraciones idempotentes, ejecutables de forma limpia.
  - Contenedores Docker que levantan sin advertencias y `/api/health` en OK.
  - `CHANGELOG.md` consolidado con `npm run release:changelog -- X.Y.Z` (une los fragmentos de `changelog.d/`, marca `incluido_en_release` en los módulos incluidos y fija la versión en `package.json`) y **tag de Git** `vX.Y.Z` creado.
  - Runbooks y documentación de entrega listos para firma.
- **Acción del Agente al Terminar:**
  1. Ejecutar `npm run gate -- [pista] solicitar` (deja la pista en `ESPERANDO_APROBACION_HUMANA`). Tras la firma: `npm run gate -- [pista] aprobar --cita "..."`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Solicitar la firma humana para el paso a producción.
  3. **NO desplegar** hasta recibir la confirmación explícita del humano.

---

### 🛑 G6: Aprobación del Plan de Mejora Continua (Kaizen)
- **Agente Emisor:** `06_devops_release` + `05_qa_security_tester` (Comité de Calidad)
- **Agente Receptor:** `00_orchestrator` (backlog del siguiente ciclo)
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - `docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md` con Diagrama de Ishikawa, análisis de Pareto 80/20 y matriz de priorización (dificultad, plazo, impacto), con responsables y KPIs verificables.
  - Detalle del proceso en `multiAgents/protocols/CONTINUOUS_IMPROVEMENT_PROTOCOL.md`.
- **Acción del Agente al Terminar:**
  1. Ejecutar `npm run gate -- [pista] solicitar` (deja la pista en `ESPERANDO_APROBACION_HUMANA`). Tras la firma: `npm run gate -- [pista] aprobar --cita "..."`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el plan de mejora.
  3. Tras la aprobación humana, el Orquestador devuelve `current_state.json` a `FASE_5_DEVOPS_RELEASE` / `GATE_5_RELEASE_APPROVAL` / `EN_PROCESO` para el siguiente release, o lo marca `COMPLETADO` si el proyecto se cierra. Los módulos nuevos se crean con `npm run new:module`.
  4. Las acciones del plan no se ejecutan en esta sesión. Las de alcance `futuro` las incorpora el PM al G1 del siguiente módulo o, si no hay uno previsto, a un **módulo de mantenimiento** (`CONTINUOUS_IMPROVEMENT_PROTOCOL.md`); las de alcance `reabrir` siguen §2.4.

---

## 5. Archivos de Estado y Valores Permitidos

**Cómo se cambia el estado.** Siempre con `npm run gate -- [pista] [acción]` (`solicitar`, `aprobar --cita "..."`, `avanzar`, `bloquear --motivo "..."`, `desbloquear`, `volver [Gx] --motivo "..."`), nunca editando los JSON a mano. El comando aplica el tipo efectivo del perfil, asigna el rol en turno de la Tabla Maestra, escribe `historial_transiciones` y rechaza cualquier transición que deje el flujo inválido.

**Qué archivo cambia.** El de la pista en la que se trabaja (§2.1):
- Línea base (G1/G2 de proyecto), G5 y G6: `.workflow/current_state.json`.
- G1 a G4 de un módulo: `.workflow/modules/[XX_nombre].json`.

Además de los campos comunes, cada archivo de módulo declara `modulo` (igual al nombre del archivo), `nombre`, `responsable`, `rama`, `depende_de` (IDs de otros módulos), `origen` (opcional: el plan Kaizen del que sale un módulo de mantenimiento) e `incluido_en_release` (`null` hasta que un release lo incluye).

**`fase_activa` y `gate_activo`** toman siempre sus valores de la **Tabla Maestra** (§2), ambos de la misma fila, y la compuerta debe pertenecer a la pista del archivo (columna Nivel).

**`estado`** admite estos valores:

<!-- estados:start -->

| `estado` | Significado |
| :--- | :--- |
| `EN_PROCESO` | El rol en turno está trabajando hacia el `gate_activo`. |
| `ESPERANDO_APROBACION_HUMANA` | Entregables listos; el agente se detuvo y espera la firma del Director Humano. |
| `BLOQUEADO` | Veto de QA, rechazo o impedimento; el motivo consta en `bloqueos`. |
| `COMPLETADO` | La pista se cerró con la aprobación de su última compuerta: G4 en un módulo (fusionado a `main`), G6 en el proyecto (proyecto cerrado). |

<!-- estados:end -->

**Reglas de coherencia** (verificadas por `npm run validate:state`):
- `fase_activa` y `gate_activo` deben corresponder a la **misma fila** de la Tabla Maestra y a una compuerta de la pista del archivo.
- `ESPERANDO_APROBACION_HUMANA` solo es válido en compuertas de tipo 🛑 Halt (nunca en un ⚡ Checkpoint).
- `BLOQUEADO` exige al menos un elemento en `bloqueos`.
- `COMPLETADO` solo es válido en la **última** compuerta de su pista (G4 en módulos, G6 en el proyecto).

**Reglas entre pistas:**
- Un módulo no puede superar una compuerta de línea base (G1, G2) que el proyecto aún no haya superado.
- Un módulo no entra en construcción (más allá de G2) mientras alguna de sus dependencias no tenga su contrato aprobado en G2.
- Un módulo no puede quedar `COMPLETADO` (fusionado a `main`) antes que sus dependencias.
- No hay dependencias circulares, cada número de módulo es único y cada archivo de estado tiene su carpeta en `docs/modules/`.
- `incluido_en_release` solo tiene valor en módulos `COMPLETADO`.

---

## 6. Mandato Técnico para Modelos de Lenguaje (LLMs)

> ⚠️ **REGLA DIRECTA AL AGENTE:**  
> Al culminar los entregables de una compuerta que sea **🛑 Halt en el perfil activo**, ejecuta `npm run gate -- [pista] solicitar` y **DEBES DETENER EL LLAMADO DE HERRAMIENTAS**. Tras la firma, regístrala con `npm run gate -- [pista] aprobar --cita "..."`; la compuerta siguiente puede seguir en la misma conversación (`AGENTS.md` §5.1), pero nunca antes de la firma: no encadenes la siguiente fase. Cierra tu mensaje con el prompt de continuación que imprime el comando. Explica lo realizado, señala los aspectos visuales o arquitecturales a evaluar y espera la respuesta del usuario.  
> Con el perfil `standard` son Halt **G1**, **G2**, **G3B**, **G4**, **G5** y **G6**, y **G3A** es un checkpoint automático. Otros perfiles cambian esa lista (§2.3); consulta la tuya con `npm run status -- [XX_nombre]` antes de seguir. **G5 es Halt en cualquier perfil, y G4 también en todo perfil que llegue a producción** (en `spike`, G4 pasa con verificaciones obligatorias y nada llega a producción).

---

## 7. Catálogo de Entregables

Cada entregable tiene un ID que citan los perfiles de `.workflow/profiles/`. La columna **En standard** indica si es obligatorio con el perfil por defecto; los perfiles y modificadores lo vuelven opcional o lo añaden. La columna **Capa** indica si solo aplica cuando esa capa está activa en `.workflow/project.json` (por ejemplo, Bruno, k6 o DAST sobre HTTP no aplican a un proyecto sin backend); "—" aplica siempre. La columna **Ruta comprobada** es el archivo que `npm run gate` exige antes de `avanzar` o `solicitar` esa compuerta (`{modulo}` es el ID del módulo, `{version}` la `version_actual` y `*` cualquier nombre en ese nivel); "—" significa que el entregable no tiene ruta fija y lo verifica el rol o el Director Humano. El detalle de cada compuerta (§4) sigue siendo la descripción completa.

<!-- entregables:start -->

| ID | Compuerta | Pista | Capa | En standard | Entregable | Ruta comprobada |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| `prd` | G1 | proyecto | — | Sí | `docs/project/prd.md` | `docs/project/prd.md` |
| `glosario` | G1 | proyecto | — | Sí | `docs/project/glossary.md` con los términos del dominio | `docs/project/glossary.md` |
| `spec_funcional` | G1 | modulo | — | Sí | `01_SPEC_FUNCIONAL.md` del módulo | `docs/modules/{modulo}/01_SPEC_FUNCIONAL.md` |
| `historias_bdd` | G1 | modulo | — | Sí | `02_HISTORIAS_USUARIO.md`: historias INVEST con criterios Gherkin | `docs/modules/{modulo}/02_HISTORIAS_USUARIO.md` |
| `flujo_estados` | G1 | modulo | — | Sí | `03_FLUJO_Y_ESTADOS.md` con diagramas Mermaid | `docs/modules/{modulo}/03_FLUJO_Y_ESTADOS.md` |
| `atdd_spec` | G1 | modulo | — | Sí | Especificación ATDD firmada por los Three Amigos | — |
| `matriz_normativa` | G1 | modulo | — | No | Matriz normativa del subrol legal (`RN-DOM-XX`) | — |
| `arquitectura_c4` | G2 | proyecto | — | Sí | `docs/project/architecture.md` con el modelo C4 completo | `docs/project/architecture.md` |
| `arquitectura_c4_reducida` | G2 | proyecto | — | No | Un único diagrama de contexto y contenedores en `architecture.md` | `docs/project/architecture.md` |
| `adr_stack` | G2 | proyecto | — | Sí | ADR del stack aceptado por el desarrollador (rol de fundación) | — |
| `estructura_repo` | G2 | proyecto | — | Sí | `docs/project/repo-structure.md` y su ADR aceptado (rol de fundación) | `docs/project/repo-structure.md` |
| `ddl` | G2 | modulo | `backend` | Sí | DDL relacional en `04_ARQUITECTURA_Y_CODIGO.md`, con los estados como `ENUM` o `CHECK` | `docs/modules/{modulo}/04_ARQUITECTURA_Y_CODIGO.md` |
| `contrato_zod` | G2 | modulo | — | Sí | Contrato Zod del módulo en la ruta de contratos, con los estados como `z.enum` | — |
| `rbac` | G2 | modulo | — | Sí | Matriz de permisos RBAC del módulo | — |
| `adr_decisiones` | G2 | modulo | — | No | Un ADR por cada decisión estructural del módulo | — |
| `modelo_amenazas` | G2 | modulo | — | No | Modelo de amenazas (STRIDE o equivalente) | — |
| `mapa_datos_personales` | G2 | modulo | — | No | Mapa de datos personales: qué se guarda, dónde y durante cuánto tiempo | — |
| `contrato_idempotencia` | G2 | modulo | — | No | Claves de idempotencia declaradas en el contrato | — |
| `adr_aislamiento_tenant` | G2 | modulo | — | No | ADR con la estrategia de aislamiento entre tenants | — |
| `contrato_eventos` | G2 | modulo | — | No | Contrato de eventos en tiempo real: canales y payloads tipados con Zod | — |
| `estrategia_reconexion` | G2 | modulo | — | No | Estrategia de reconexión, reenvío y orden de eventos | — |
| `vitest_backend` | G3A | modulo | `backend` | Sí | Suite Vitest del backend al 100 % y ciclo TDD completo | — |
| `no_any_backend` | G3A | modulo | `backend` | Sí | `check:no-any` en verde en el backend | — |
| `rutas_protegidas` | G3A | modulo | `backend` | Sí | Rutas con autenticación, RBAC y aislamiento según el contrato | — |
| `integracion_persistencia_backend` | G3A | modulo | `backend` | Sí | Prueba de integración contra la base de datos real (sin mocks) por cada ruta que guarda o lee datos | — |
| `vistas_design_system` | G3B | modulo | `frontend` | Sí | Vistas sobre el Design System con estados Loading, Empty, Error y Success | — |
| `tests_componentes` | G3B | modulo | `frontend` | Sí | Pruebas de componentes y stores en verde | — |
| `walkthrough` | G3B | modulo | — | Sí | `WALKTHROUGH.md` versionado y reproducible | `docs/walkthroughs/{modulo}/*/WALKTHROUGH.md` |
| `no_any_frontend` | G3B | modulo | `frontend` | Sí | `check:no-any` en verde en el frontend | — |
| `integracion_persistencia_frontend` | G3B | modulo | `frontend` | Sí | Si el frontend persiste datos: prueba de integración contra el almacenamiento real (sin mocks) por cada ruta de guardado o lectura | — |
| `qa_report` | G4 | modulo | — | Sí | `QA_REPORT.md` con RCA de cada defecto | `docs/qa/{modulo}/*/QA_REPORT.md` |
| `qa_resumen` | G4 | modulo | — | No | `QA_REPORT.md` reducido a su sección 0: resumen verificable, requisitos incumplidos y limitaciones de entorno | `docs/qa/{modulo}/*/QA_REPORT.md` |
| `no_any_cert` | G4 | modulo | — | Sí | Certificación AST de cero `any` (pilar 4) | — |
| `vitest_suite` | G4 | modulo | — | Sí | Suite automatizada al 100 % y 0 defectos S1/S2 abiertos (pilar 1) | — |
| `api_bruno` | G4 | modulo | `backend` | Sí | Colección de contratos de API con Bruno (pilar 1) | — |
| `e2e_smoke` | G4 | modulo | `frontend` | No | E2E de humo del flujo principal | — |
| `e2e_a11y` | G4 | modulo | `frontend` | Sí | E2E completos con Playwright y accesibilidad con axe-core (pilar 2) | — |
| `carga_k6` | G4 | modulo | `backend` | Sí | Prueba de carga con k6 (pilar 3) | — |
| `rendimiento_cliente` | G4 | modulo | `frontend` | Sí | Medición de rendimiento en cliente (tiempos de interacción o render en dispositivo real o emulado) | — |
| `changelog_fragmento` | G4 | modulo | — | Sí | Fragmento del módulo en `changelog.d/` | `changelog.d/{modulo}*.md` |
| `auditoria_dependencias` | G4 | modulo | — | Sí | Auditoría de vulnerabilidades de dependencias (`npm audit` o equivalente) sin altas ni críticas | — |
| `dast` | G4 | modulo | `backend` | No | Escaneo DAST en runtime (`npm run audit:dast`) | — |
| `presupuesto_rendimiento` | G4 | modulo | — | No | Presupuesto de rendimiento verificado (p95, tamaño de bundle) | — |
| `logs_sin_pii` | G4 | modulo | `backend` | No | Verificación de que los logs no contienen datos personales | — |
| `pruebas_doble_cobro` | G4 | modulo | — | No | Pruebas de doble cobro, reintentos e idempotencia | — |
| `pruebas_fuga_tenant` | G4 | modulo | `backend` | No | Pruebas de fuga de datos entre tenants | — |
| `rtm_trazabilidad` | G4 | modulo | — | No | Matriz de trazabilidad RTM completa (requisito, prueba, evidencia) | — |
| `pruebas_concurrencia_eventos` | G4 | modulo | — | No | Pruebas de concurrencia, orden de eventos y desconexión | — |
| `carga_websocket` | G4 | modulo | `backend` | No | Carga con conexiones simultáneas (k6 WebSocket) | — |
| `seeders` | G5 | release | `backend` | Sí | Seeders y migraciones idempotentes | — |
| `docker_health` | G5 | release | `backend` | Sí | Contenedores sin advertencias y `/api/health` en OK | — |
| `changelog_release` | G5 | release | — | Sí | `CHANGELOG.md` consolidado con `npm run release:changelog` y tag `vX.Y.Z` | — |
| `runbook` | G5 | release | — | Sí | Runbooks de operación completos | — |
| `runbook_minimo` | G5 | release | — | No | Runbook mínimo: arranque, parada y restauración | — |
| `rollback_probado` | G5 | release | — | No | Plan de rollback ensayado | — |
| `plan_kaizen` | G6 | release | — | Sí | `docs/quality/IMPROVEMENT_PLAN_vX.Y.Z.md` con Ishikawa y Pareto | `docs/quality/IMPROVEMENT_PLAN_{version}.md` |
| `retro_breve` | G6 | release | — | No | Retrospectiva de una página: qué mantener, qué cambiar | — |
| `revision_cumplimiento` | G6 | release | — | No | Revisión de cumplimiento normativo del release | — |

<!-- entregables:end -->
