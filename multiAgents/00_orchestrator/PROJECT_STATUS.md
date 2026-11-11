# 🚦 PROJECT STATUS — Tablero del Proyecto

> **Proyecto:** {{PROJECT_NAME}}  
> **Dominio:** {{PROJECT_DOMAIN}}  
> **Versión Actual:** `v0.1.0` (Gobernanza Inicializada)  
> **Versión Objetivo:** `v0.2.0` (primer release con los módulos iniciales)  
> **Última Actualización:** {{INIT_DATE}}  
> **Responsable:** Orquestador (`00_orchestrator`)

---

## 1. Estado en vivo: se genera, no se edita

El estado de la pista de proyecto y el de cada módulo **no se copian aquí**. Viven en sus archivos de estado y se consultan con:

```bash
npm run status          # Semáforo consolidado: proyecto, módulos, bloqueos y listos para release
npm run validate:state  # Coherencia de todas las pistas contra .workflow/STAGE_GATES.md
```

| Pista | Archivo | Quién lo actualiza |
| :--- | :--- | :--- |
| Proyecto (línea base) y release | `.workflow/current_state.json` | Orquestador y rol en turno de la línea base |
| Cada módulo | `.workflow/modules/[XX_nombre].json` | Rol en turno de ese módulo, en su rama |

> Este tablero no repite el estado a propósito. Si cada avance de un módulo exigiera editar este archivo, dos personas trabajando en módulos distintos chocarían aquí al fusionar sus ramas.

---

## 2. Plan de releases

Lo que **sí** se mantiene a mano: qué módulos se esperan en cada versión. El estado real de cada uno se ve con `npm run status`.

| Versión | Módulos previstos | Objetivo |
| :--- | :--- | :--- |
| `v0.2.0` | [01_nombre, 02_nombre] | [Resultado de negocio esperado] |

---

## 3. Historial de Decisiones de Versión (SemVer)
- **v0.1.0 ({{INIT_DATE}}):** Inicialización de la arquitectura multiagente, máquina de estados en `.workflow/current_state.json`, manual rector en `AGENTS.md`, Reglas de Oro inviolables, compuertas mecánicas AST contra el tipo `any` y protocolos de colaboración entre agentes.
