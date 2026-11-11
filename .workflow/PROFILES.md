# 🎚️ Perfiles de Proyecto: Escala y Modificadores de Riesgo

> **Qué resuelve:** el mismo starter sirve para un proyecto de dos semanas y para uno largo o crítico, sin reescribir el flujo. El perfil ajusta **cuántas firmas humanas** hay y **qué entregables** se exigen; las compuertas (G0 a G6) y las Reglas de Oro son siempre las mismas.  
> **Fuente de los datos:** `.workflow/profiles/*.json` (escalas) y `.workflow/profiles/modifiers/*.json` (modificadores). Este documento explica las reglas y no repite valores. Para ver el resultado combinado: `npm run status -- [XX_nombre]` o `npm run status -- proyecto`.

---

## 1. Las dos piezas

| Pieza | Cuántas | Qué hace | Dónde se declara |
| :--- | :--- | :--- | :--- |
| **Escala** | Una por proyecto | Cambia el tipo de algunas compuertas (Halt ↔ Checkpoint) y vuelve opcionales o añade entregables | `.workflow/project.json` → `perfil.escala` |
| **Modificador** | Cero o varios | Solo **añade** exigencias: convierte un Checkpoint en Halt y suma entregables | `project.json` → `perfil.modificadores` (todo el proyecto) o `.workflow/modules/[XX].json` → `modificadores` (un módulo) |

### Cuándo usar cada escala

| Escala | Pensada para | Idea central |
| :--- | :--- | :--- |
| `sprint` | Proyectos de unas dos semanas, prototipos que van a producción, equipos de una o dos personas | Menos firmas: la especificación se firma junto con el contrato, la UI se revisa dentro de QA y el Kaizen es una retro breve |
| `standard` | La mayoría de proyectos. **Es el perfil por defecto** | El flujo completo tal como lo define la Tabla Maestra de `STAGE_GATES.md` |
| `enterprise` | Proyectos largos, críticos o con varios equipos | Más evidencia: ADR por decisión estructural, matriz normativa, DAST, presupuesto de rendimiento y rollback ensayado |

### Modificadores disponibles

| Modificador | Úsalo cuando el sistema… |
| :--- | :--- |
| `datos_sensibles` | guarda datos personales o sensibles |
| `pagos` | mueve dinero (cobros, reembolsos) |
| `multi_tenant` | sirve a varias organizaciones en la misma instancia |
| `regulado` | está sujeto a normativa obligatoria y auditable |
| `tiempo_real` | usa WebSocket, SSE o eventos en vivo |

**Del proyecto o del módulo:** si el riesgo afecta a todo el sistema (por ejemplo, `multi_tenant` o `regulado`), declara el modificador en `project.json`. Si afecta a una parte (`pagos` en el módulo de cobros, `tiempo_real` en el de chat), decláralo solo en ese módulo, con `npm run new:module -- 04_pagos --modificadores pagos` o editando su archivo de estado. Así el resto de módulos no carga con exigencias que no le tocan.

---

## 2. Cómo se combinan

1. Se parte de la **Tabla Maestra** de `STAGE_GATES.md` (tipos) y de los entregables marcados como obligatorios en `standard` (Catálogo, §7).
2. La **escala** cambia tipos y entregables.
3. Cada **modificador** suma exigencias: los del proyecto y los del módulo. En la pista de proyecto y release cuentan también los modificadores de los módulos que aún no se han liberado.
4. **Precedencia:** invariantes y Reglas de Oro > modificadores > escala. Si la escala vuelve opcional algo que un modificador exige, gana el modificador. Por ejemplo, `sprint` con `pagos` exige el rollback ensayado en G5.
5. Las compuertas cuya capa está inactiva en `project.json` desaparecen del plan (`STAGE_GATES.md` §2.2).

**Invariantes (ningún perfil los rompe):** G4 y G5 son siempre Halt y siempre hay al menos una firma humana entre G1 y G2. Están en la tabla de invariantes de `STAGE_GATES.md` §2.3, y `npm run validate:state` rechaza cualquier perfil que los incumpla.

**Halt convertido en Checkpoint:** el agente no se detiene en esa compuerta. Sus entregables se revisan y firman en el siguiente Halt. Por ejemplo, en `sprint` la especificación de G1 se firma junto con el contrato en G2.

---

## 3. Elegir o cambiar el perfil

- **Al iniciar:** `npm run init:project` pregunta la escala y los modificadores. Si eliges algo distinto de `standard` sin modificadores, genera el ADR que justifica el perfil y lo enlaza en `perfil.adr`.
- **Durante el proyecto:** cambiar la escala o los modificadores del proyecto es una decisión de arquitectura. Requiere un ADR nuevo (`docs/adrs/`) firmado por el Director Humano, y actualizar `perfil` en `project.json` (incluido `perfil.adr`). El cambio rige **desde la siguiente compuerta** de cada pista: lo ya firmado no se reabre.
- **Modificadores de un módulo:** se deciden en la especificación del módulo y quedan firmados con su G1 o G2. No requieren ADR propio.
- `npm run validate:state` exige que todo perfil distinto de `standard` sin modificadores tenga su ADR, y que escalas y modificadores existan.

---

## 4. Crear un modificador propio

Un proyecto puede añadir sus propios modificadores (por ejemplo, `ia_generativa` u `offline_first`):

1. Si necesita entregables nuevos, añádelos al Catálogo de Entregables de `STAGE_GATES.md` (§7) con su ID, compuerta y pista.
2. Crea `.workflow/profiles/modifiers/[nombre].json` con `modificador` (igual al nombre del archivo), `descripcion`, `tipos` (solo puede pedir `halt`) y `entregables.adicionales` (IDs del catálogo).
3. Ejecuta `npm run validate:state`: rechaza IDs inexistentes, tipos no permitidos y nombres que no coincidan.

Las escalas propias siguen las mismas reglas, pueden además volver opcionales entregables (`entregables.opcionales`) y no pueden romper los invariantes.
