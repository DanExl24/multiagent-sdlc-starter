# 🔌 PROTOCOLO DE INTEGRACIÓN DE SKILLS EXTERNAS

> **Propósito:** permitir que un agente con skills de otros repositorios cargadas (por ejemplo, ECC) las use para **hacer mejor el trabajo de un subrol**, sin que esas skills cambien el proceso, salten compuertas ni contradigan las reglas del repositorio.  
> **Principio:** el repositorio funciona igual **sin ninguna skill externa**. Las skills son una mejora opcional de la técnica, nunca un requisito.

---

## 1. Contrato y técnica

Cada subrol (`multiAgents/[rol]/subroles/*.md`) abre con una sección **"0. Contrato del Subrol"**. Todo lo demás del documento es la **técnica de referencia**.

| Parte | Qué fija | ¿Se puede sustituir? |
| :--- | :--- | :--- |
| **Contrato** | Responsabilidad, cuándo se activa, entradas, salidas, límites y criterio de salida | **No.** Es vinculante para cualquier agente, use o no skills |
| **Técnica** | Cómo se hace el trabajo: métodos, herramientas, plantillas, recetas | **Sí.** Una skill externa puede reemplazarla si produce las mismas salidas dentro de los mismos límites |

Ejemplo: el subrol de TDD del backend exige como salida una suite Vitest del módulo en verde, con casos negativos 400/401/403/404/409/422. Si el agente tiene una skill de TDD más completa, puede seguirla; lo que no puede es entregar algo distinto de esa salida ni saltarse sus límites (por ejemplo, silenciar tests).

---

## 2. Orden de precedencia

Ante cualquier conflicto, gana el nivel más alto:

1. **Invariantes:** las Reglas de Oro (`AGENTS.md` §6) y las compuertas de `.workflow/STAGE_GATES.md`.
2. **Perfil del proyecto:** tipo efectivo de cada compuerta y entregables exigidos (`.workflow/PROFILES.md`).
3. **Contrato del subrol.**
4. **Técnica:** la del documento del subrol o la de una skill externa.

Si una skill indica algo que contradice un nivel superior (por ejemplo, "haz commit al terminar" o "usa `any` temporalmente"), **se ignora esa parte de la skill** y se registra la desviación en la bitácora. Si la contradicción impide cumplir el contrato, el agente se detiene y abre un ticket en su bitácora, en lugar de improvisar.

---

## 3. Qué puede hacer una skill y qué no

**Permitido (skills de técnica).** Una skill puede usarse dentro de un subrol si:
- produce las **salidas del contrato** en las rutas del repositorio (las de `.workflow/project.json`, `docs/`, `changelog.d/`, etc.);
- respeta los **límites** del subrol: un subrol de QA sigue sin corregir código de producción aunque la skill ofrezca un modo de autocorrección;
- no toca los archivos de estado ni las compuertas.

**Prohibido (skills de orquestación).** No se usa dentro del flujo ninguna skill que haga al menos una de estas cosas:

| Criterio de exclusión | Por qué |
| :--- | :--- |
| Define sus propias fases, compuertas o aprobaciones | Duplica o reemplaza `STAGE_GATES.md` |
| Hace commit, merge, push, tags o PRs por su cuenta | El commit se autoriza en G4, el release en G5 y la convención de commits es obligatoria |
| Ejecuta bucles autónomos que encadenan fases sin detenerse | Rompe el alto mecánico obligatorio |
| Escribe en `.workflow/` (estado, perfiles) o edita `CHANGELOG.md` directamente | El estado lo llevan los roles; el changelog se consolida en G5 |
| Crea equipos de agentes que reasignan roles o responsabilidades | Los roles y subroles de este repositorio son los únicos responsables |

**Ejemplos con ECC** (a la fecha de redacción; los nombres pueden cambiar, así que verifica tu instalación con estos criterios): `orch-*` (`orch-add-feature`, `orch-build-mvp`, `orch-change-feature`, `orch-fix-defect`, `orch-refine-code`, `orch-pipeline`, `orch-review`), `dev-team`, `gateguard`, `delivery-gate`, `plan-orchestrate`, `team-agent-orchestration`, `team-builder`, `continuous-agent-loop`, `autonomous-loops`, `loop-start`, `santa-loop`, `gan-build`, `gan-design`, `multi-execute`, `multi-workflow`, `prp-commit`, `prp-pr` y `pr`.

El Director Humano puede invocar cualquiera de estas skills fuera del flujo, por su cuenta. Sus resultados no cuentan como entregable de ninguna compuerta hasta que el subrol responsable los revise y los entregue según su contrato.

---

## 4. Revisores como asesores

Los agentes o skills de revisión (de código, de seguridad, de un lenguaje concreto) se pueden usar desde cualquier rol **como asesoría**:
- En construcción (Backend, Frontend), sus hallazgos los corrige el propio rol.
- En QA, sus hallazgos se incorporan al `QA_REPORT.md` con severidad y RCA. **QA no aplica correcciones** aunque la herramienta ofrezca un modo `--fix`, y el veto sigue siendo del QA Lead y del Director Humano.

---

## 5. Registro obligatorio

Cuando un subrol usa una skill externa como técnica, lo anota en su bitácora (la del módulo, `multiAgents/[rol]/worklog/[XX_nombre].md`, o `WORKLOG.md` si es transversal):

```markdown
- **[Técnica externa]:** Subrol 04 (TDD Backend) usó la skill `tdd-workflow` (ECC) para el módulo 04_pagos. Salidas del contrato entregadas; sin desviaciones.
```

Así QA puede auditar con qué técnica se produjo cada entregable y reproducirlo.

---

## 6. Sección opcional "Skills opcionales" en un subrol

Un proyecto puede añadir al final de un subrol una sección que recomiende skills concretas para su técnica:

```markdown
## Skills opcionales
| Skill | Origen | Sustituye o complementa |
| :--- | :--- | :--- |
| `postgres-patterns` | ECC | Indexación y tipos de datos (§3) |
```

Es opcional y orientativa: no obliga a instalar nada, y el contrato del subrol no cambia.

---

## 7. Correspondencias de ejemplo con ECC

Orientativas, para proyectos que tengan ECC instalado. Verifica que existan en tu instalación.

| Rol / subrol | Skills de técnica sugeridas |
| :--- | :--- |
| Arquitectura · Topología y ADRs | `architecture-decision-records`, `hexagonal-architecture` |
| Arquitectura · Modelado DDL | `postgres-patterns`, `database-migrations` |
| Arquitectura · Contratos | `api-design`, `contract-first` |
| Arquitectura · Seguridad | `security-review` |
| Backend · Dominio y datos | `backend-patterns`, `error-handling` |
| Backend · TDD | `tdd-workflow` |
| Frontend · Design System | `design-system`, `frontend-a11y` |
| Frontend · Vistas y estado | `frontend-patterns`, `vue-patterns` o `react-patterns` |
| QA · E2E y accesibilidad | `e2e-testing`, `accessibility` |
| QA · Rendimiento y seguridad | `benchmark`, `security-review` |
| DevOps · Entornos y despliegue | `docker-patterns`, `deployment-patterns` |
