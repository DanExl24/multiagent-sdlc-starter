# 🧭 [XX. Nombre del Módulo] — Índice del Módulo

> **Módulo:** [XX_nombre_modulo]  
> **Responsable:** Product Manager Lead (lo crea) · cada rol actualiza su fila  
> **Estado:** [DISCOVERY / ESPECIFICADO / CONTRATADO / EN CONSTRUCCIÓN / EN QA / LIBERADO]  
> **Versión vigente:** [vX.Y.Z]  
> **Naturaleza:** Vivo  
> **Última revisión:** [AAAA-MM-DD]

Punto de entrada del módulo para personas y agentes. **Este archivo enlaza; no copia contenido.** Si algo se explica aquí con detalle, debe moverse a su documento dueño.

---

## 1. Resumen en tres líneas
- **Qué hace:** [Una frase].
- **Para quién:** [Actores principales].
- **Fuera de alcance:** [Lo que explícitamente no hace].

---

## 2. Documentos del módulo

| Documento | Contenido | Dueño |
| :--- | :--- | :--- |
| [`01_SPEC_FUNCIONAL.md`](01_SPEC_FUNCIONAL.md) | Propósito, dependencias, RBAC y reglas de negocio | Product Manager |
| [`02_HISTORIAS_USUARIO.md`](02_HISTORIAS_USUARIO.md) | RF, RNF, historias INVEST y criterios Gherkin | Product Manager |
| [`03_FLUJO_Y_ESTADOS.md`](03_FLUJO_Y_ESTADOS.md) | Diagramas de flujo y máquina de estados | Product Manager / Arquitectura |
| [`04_ARQUITECTURA_Y_CODIGO.md`](04_ARQUITECTURA_Y_CODIGO.md) | DDL, mapa de rutas y decisiones locales | Arquitectura |

## 3. Artefactos externos (enlazados, no copiados)

`<modulo>` es el ID de este módulo (el mismo nombre que su carpeta y que `.workflow/modules/<modulo>.json`). Estos artefactos se crean en su compuerta: el contrato en G2, los reportes de QA en G4.

| Artefacto | Ruta |
| :--- | :--- |
| Contrato Zod | `docs/contracts/<modulo>.contract.ts` |
| ADRs que afectan al módulo | `docs/adrs/[NNN-titulo].md` (los que declaren este módulo en su `alcance`) |
| Reportes de QA | `docs/qa/<modulo>/[vX.Y.Z]/` |
| Walkthroughs | `docs/walkthroughs/<modulo>/[vX.Y.Z]/WALKTHROUGH.md` |
| Términos del dominio | [`docs/project/glossary.md`](../../project/glossary.md) |

### Pruebas del módulo

Cada rol añade una fila por suite cuando la crea: Backend en G3A, Frontend en G3B y QA en G4 (o antes, con `qa_preparacion`). **Ruta** es la real, relativa a la raíz; admite `*` en un segmento (por ejemplo, `backend/src/modules/<modulo>/*.test.ts`). **Herramienta** es el uso que la prueba ejercita, según la columna del mismo nombre del catálogo de entregables (`backend`, `datos`, `frontend`, `qa_api`, `qa_e2e`, `qa_carga`, `qa_seguridad`). Al pasar cada compuerta, `npm run gate` exige una fila por cada uso que el plan pide y que todas las rutas existan.

| Tipo | Ruta | Herramienta | Compuerta |
| :--- | :--- | :--- | :--- |
| [Integración API contra la base de datos real] | `[ruta real]` | `datos` | G3A |

---

## 4. Qué cargar según tu rol (divulgación progresiva)

| Rol | Lee primero | Lee solo si lo necesitas |
| :--- | :--- | :--- |
| Product Manager | 01, 02 | 03 |
| Software Architect | 01, 03, 04 | 02 |
| Backend | Contrato, 04 | 01 (reglas RN), 03 |
| Frontend | Contrato, 02 | 03, `docs/project/design-system.md` |
| QA | 02 (criterios), contrato | Walkthrough vigente, 03 |
| DevOps | 04 | Último reporte de QA |

---

## 5. Historial del módulo

| Versión | Fecha | Cambio | Gate |
| :--- | :--- | :--- | :--- |
| [v0.1.0] | [AAAA-MM-DD] | Creación del módulo | — |
