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

| ID | Transición | Tipo | Aprueba | `fase_activa` | `gate_activo` |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **G0** | Bootstrap → Requerimientos | 🔧 Bootstrap | Director Humano (al ejecutar `init:project`) | — *(no persiste en el JSON)* | — |
| **G1** | Requerimientos → Arquitectura | 🛑 Halt | Director Humano | `FASE_1_REQUERIMIENTOS` | `GATE_1_PRD_APPROVAL` |
| **G2** | Arquitectura → Construcción | 🛑 Halt | Director Humano | `FASE_2_ARQUITECTURA` | `GATE_2_ARCHITECTURE_APPROVAL` |
| **G3A** | Backend → Frontend | ⚡ Checkpoint | Orquestador | `FASE_3A_BACKEND` | `GATE_3A_BACKEND_CHECKPOINT` |
| **G3B** | Frontend → QA | 🛑 Halt | Director Humano | `FASE_3B_FRONTEND` | `GATE_3B_FRONTEND_UI_APPROVAL` |
| **G4** | QA → Release (autoriza commit y merge a `main`) | 🛑 Halt | Director Humano | `FASE_4_QA_VALIDACION` | `GATE_4_QA_APPROVAL` |
| **G5** | Release → Producción (tag, seeders, despliegue) | 🛑 Halt | Director Humano | `FASE_5_DEVOPS_RELEASE` | `GATE_5_RELEASE_APPROVAL` |
| **G6** | Kaizen → Siguiente ciclo | 🛑 Halt | Director Humano | `FASE_6_MEJORA_CONTINUA` | `GATE_6_KAIZEN_APPROVAL` |

<!-- gates:end -->

> **Semántica de `gate_activo`:** es siempre **la compuerta hacia la que se está trabajando** (la que se debe superar para salir de `fase_activa`). Por eso cada `fase_activa` tiene exactamente un `gate_activo`.

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
      🛑 G4: Certificación de Calidad y Go/No-Go (autoriza commit y merge a main)
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
        Ciclo del módulo cerrado
```

---

## 4. Matriz de Detalle por Compuerta

### 🔧 G0: Bootstrap
- **Disparador:** `npm run init:project`.
- **Resultado:** documentos rectores personalizados y `current_state.json` inicializado directamente en `FASE_1_REQUERIMIENTOS` / `GATE_1_PRD_APPROVAL` / `EN_PROCESO`, con el Product Manager como rol en turno.
- **Sin halt:** G0 no genera una pausa adicional; el humano ya dio su aprobación al ejecutar el asistente.

---

### 🛑 G1: Aprobación de Requerimientos y Reglas de Negocio
- **Agente Emisor:** `01_product_manager`
- **Agente Receptor:** `02_software_architect`
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - `docs/project/prd.md`: Documento rector de requerimientos de producto.
  - `docs/modules/[XX_modulo]/01_SPEC_FUNCIONAL.md`: Reglas funcionales del dominio y casos de uso.
  - `docs/modules/[XX_modulo]/02_HISTORIAS_USUARIO.md`: Historias bajo estándar **INVEST** y criterios en formato **BDD (Given-When-Then)**, con casos límite (BVA).
  - `docs/modules/[XX_modulo]/03_FLUJO_Y_ESTADOS.md`: Diagramas de flujo y ciclo de vida en Mermaid.
  - Especificación ATDD (`ATDD_SPEC_TEMPLATE.md`) con la firma de *Testability* de QA (rito *Three Amigos*: PM + Arquitecto + QA Lead).
- **Acción del Agente al Terminar:**
  1. Actualizar `.workflow/current_state.json` con `gate_activo: "GATE_1_PRD_APPROVAL"`, `estado: "ESPERANDO_APROBACION_HUMANA"`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el resumen ejecutivo al Director Humano.
  3. **NO proceder** a diseñar tablas ni contratos hasta recibir la confirmación explícita del humano.

---

### 🛑 G2: Aprobación de Arquitectura Relacional y Contratos de Datos
- **Agente Emisor:** `02_software_architect`
- **Agente Receptor:** `03_backend_engineer`
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - `docs/project/architecture.md`: Topología técnica (C4).
  - `docs/modules/[XX_modulo]/04_ARQUITECTURA_Y_CODIGO.md`: Modelo relacional y sentencias DDL (3FN).
  - `docs/contracts/[modulo].contract.ts`: Contratos de entrada y salida tipados estrictamente con schemas de **Zod**.
  - Matriz de permisos RBAC para los roles del sistema, aislamiento multi-tenant y manejo transaccional ACID.
- **Acción del Agente al Terminar:**
  1. Actualizar `.workflow/current_state.json` con `gate_activo: "GATE_2_ARCHITECTURE_APPROVAL"`, `estado: "ESPERANDO_APROBACION_HUMANA"`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el modelo DDL y los contratos para revisión humana.
  3. **NO escribir código backend ni frontend** hasta recibir la confirmación explícita del humano.

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
  - `WORKLOG.md` del backend actualizado.
- **Acción del Agente al Terminar:**
  1. Registrar la transición en `historial_transiciones` y actualizar `.workflow/current_state.json` a `fase_activa: "FASE_3B_FRONTEND"`, `gate_activo: "GATE_3B_FRONTEND_UI_APPROVAL"`, `estado: "EN_PROCESO"`, `rol_en_turno: "04_frontend_engineer"`.
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
  1. Actualizar `.workflow/current_state.json` con `gate_activo: "GATE_3B_FRONTEND_UI_APPROVAL"`, `estado: "ESPERANDO_APROBACION_HUMANA"`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Invitar al Director Humano a revisar y explorar el diseño visual, la usabilidad y los modales en su navegador.
  3. **NO avanzar a pruebas de QA** hasta que el Director Humano apruebe el diseño visual de la interfaz.

---

### 🛑 G4: Certificación de Calidad y Commit Canónico
- **Agente Emisor:** `05_qa_security_tester`
- **Agente Receptor:** `06_devops_release`
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - `docs/qa/[XX_modulo]/[vX.Y.Z]/QA_REPORT.md`: Auditoría forense con análisis RCA de cualquier defecto encontrado.
  - Suite de pruebas automatizadas 100% en verde y 0 defectos S1/S2 abiertos.
  - **Certificación AST de Cero ANY:** Verificación de `npm run check:no-any` en `backend/` y `frontend/` con 0 incidencias. Si se detecta un solo `any`, el QA Lead aplica **Veto Inmediato (Stop-the-Line)**.
  - Entrada de la versión candidata preparada en `CHANGELOG.md` (SemVer) y `docs/project/version-matrix.md`, necesaria para el commit canónico.
- **Veto QA:** si QA rechaza, `estado: "BLOQUEADO"` con el motivo en `bloqueos`, y el flujo regresa a `FASE_3A_BACKEND` o `FASE_3B_FRONTEND` según el defecto. QA **no** corrige código de producción.
- **Acción del Agente al Terminar:**
  1. Actualizar `.workflow/current_state.json` con `gate_activo: "GATE_4_QA_APPROVAL"`, `estado: "ESPERANDO_APROBACION_HUMANA"`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el veredicto final solicitando la firma Go / No-Go.
  3. Tras la aprobación humana, persistir en Git con la nomenclatura canónica `[vX.Y.Z] tipo(scope): descripcion` y sincronizar en `origin/main`. **Esto no es un despliegue:** el paso a producción se decide en G5.

---

### 🛑 G5: Aprobación de Release y Paso a Producción
- **Agente Emisor:** `06_devops_release`
- **Agente Receptor:** `00_orchestrator` (Operaciones)
- **Aprobador Requerido:** **Director Humano**
- **Entregables Obligatorios:**
  - Seeders y migraciones idempotentes, ejecutables de forma limpia.
  - Contenedores Docker que levantan sin advertencias y `/api/health` en OK.
  - `CHANGELOG.md` finalizado bajo SemVer y **tag de Git** `vX.Y.Z` creado.
  - Runbooks y documentación de entrega listos para firma.
- **Acción del Agente al Terminar:**
  1. Actualizar `.workflow/current_state.json` con `gate_activo: "GATE_5_RELEASE_APPROVAL"`, `estado: "ESPERANDO_APROBACION_HUMANA"`.
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
  1. Actualizar `.workflow/current_state.json` con `gate_activo: "GATE_6_KAIZEN_APPROVAL"`, `estado: "ESPERANDO_APROBACION_HUMANA"`.
  2. **DETENERSE INMEDIATAMENTE (Halt).** Presentar el plan de mejora.
  3. Tras la aprobación humana, el Orquestador marca `estado: "COMPLETADO"`. Para iniciar otro módulo, reinicia el estado en `FASE_1_REQUERIMIENTOS` / `GATE_1_PRD_APPROVAL` / `EN_PROCESO` con un nuevo `modulo_en_curso`.

---

## 5. Valores Permitidos en `.workflow/current_state.json`

**`fase_activa` y `gate_activo`** toman siempre sus valores de la **Tabla Maestra** (§2), ambos de la misma fila.

**`estado`** admite estos valores:

<!-- estados:start -->

| `estado` | Significado |
| :--- | :--- |
| `EN_PROCESO` | El rol en turno está trabajando hacia el `gate_activo`. |
| `ESPERANDO_APROBACION_HUMANA` | Entregables listos; el agente se detuvo y espera la firma del Director Humano. |
| `BLOQUEADO` | Veto de QA, rechazo o impedimento; el motivo consta en `bloqueos`. |
| `COMPLETADO` | El ciclo del módulo se cerró con la aprobación de la última compuerta. |

<!-- estados:end -->

**Reglas de coherencia** (verificadas por `npm run validate:state`):
- `fase_activa` y `gate_activo` deben corresponder a la **misma fila** de la Tabla Maestra.
- `ESPERANDO_APROBACION_HUMANA` solo es válido en compuertas de tipo 🛑 Halt (nunca en un ⚡ Checkpoint).
- `BLOQUEADO` exige al menos un elemento en `bloqueos`.
- `COMPLETADO` solo es válido en la **última** compuerta de la Tabla Maestra (G6).

---

## 6. Mandato Técnico para Modelos de Lenguaje (LLMs)

> ⚠️ **REGLA DIRECTA AL AGENTE:**  
> Al culminar los entregables de **G1** (PRD), **G2** (Arquitectura/DDL/Zod), **G3B** (Frontend UI/UX), **G4** (QA), **G5** (Release) o **G6** (Kaizen), **DEBES DETENER EL LLAMADO DE HERRAMIENTAS**. No encadenes la siguiente fase. Explica lo realizado, señala los aspectos visuales o arquitecturales a evaluar y espera la respuesta del usuario.  
> **G3A** es la única compuerta que **no** se detiene: es un checkpoint automático.
