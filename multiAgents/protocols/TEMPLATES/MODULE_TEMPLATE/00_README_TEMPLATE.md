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

| Artefacto | Ruta |
| :--- | :--- |
| Contrato Zod | `docs/contracts/[XX_nombre_modulo].contract.ts` |
| ADRs que afectan al módulo | `docs/adrs/[NNN-titulo].md` (los que declaren este módulo en su `alcance`) |
| Reportes de QA | `docs/qa/[XX_nombre_modulo]/[vX.Y.Z]/` |
| Walkthroughs | `docs/walkthroughs/[XX_nombre_modulo]/[vX.Y.Z]/WALKTHROUGH.md` |
| Términos del dominio | [`docs/project/glossary.md`](../../project/glossary.md) |

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
