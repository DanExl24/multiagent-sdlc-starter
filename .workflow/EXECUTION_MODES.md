# 🧩 Modos de Ejecución: Secuencial u Orquestado

> **Qué resuelve:** el mismo flujo puede ejecutarlo un solo agente que aplica cada subrol en su turno (**secuencial**, por defecto) o un orquestador que reparte el trabajo independiente entre subagentes (**orquestado**). El modo cambia **cómo se reparte el trabajo**, no las compuertas ni las firmas: eso lo decide el perfil ([`PROFILES.md`](PROFILES.md)).  
> **Dónde se declara:** `.workflow/project.json` → `ejecucion` (`modo` y `max_subagentes`). Este documento es el dueño de las reglas y de la tabla de paquetes de trabajo.

---

## 1. Cuándo usar cada modo

| Modo | Para qué | Costo |
| :--- | :--- | :--- |
| `secuencial` | La opción por defecto. Proyectos de un solo módulo a la vez o con límites de uso ajustados | El menor en tokens. Un subrol no es un subagente (`AGENTS.md` §5.1) |
| `orquestado` | Varios módulos independientes, o módulos grandes donde backend, frontend y la preparación de las pruebas de QA pueden avanzar en paralelo | Más tokens (cada subagente paga un piso fijo al arrancar) a cambio de menos tiempo. En tareas largas puede compensarse, porque el trabajo del subagente no se acumula en el contexto del orquestador |

---

## 2. Reglas del modo orquestado

1. **Un único escritor del estado.** Solo el orquestador ejecuta `npm run gate`. Los subagentes no solicitan ni aprueban firmas ni editan `.workflow/`.
2. **Los Halt detienen todo.** Mientras una compuerta espera la firma del Director Humano, no se lanzan subagentes para esa pista.
3. **Encargo en disco, no gobernanza completa.** `npm run plan:agentes -- [XX_nombre]` genera en `.workflow/encargos/` un encargo por subagente con el objetivo, el Contrato de sus subroles, las rutas exactas de sus insumos, dónde puede escribir, la verificación que debe pasar y el formato de su respuesta. El subagente lee solo su encargo: no hace el protocolo de aterrizaje.
4. **Respuesta corta.** Cada subagente deja un resumen de 15 líneas como máximo en `.workflow/encargos/[id].resultado.md`. El orquestador lee esos resúmenes, nunca el trabajo completo.
5. **Memoria temporal.** Los encargos no se versionan y `npm run gate` los borra al cerrar la compuerta de su pista. La evidencia permanente es la bitácora, los commits y las verificaciones del historial.
6. **Gasto controlado.** Como máximo `max_subagentes` a la vez. Solo se lanzan los paquetes de la tabla (trabajo grande e independiente); el resto lo hace el orquestador. Si una verificación falla, se reintenta solo ese paquete, añadiendo la salida del fallo a su encargo.
7. **Integración antes de la transición.** Cada subagente trabaja en su propia rama o worktree cuando el entorno lo permite. El orquestador integra los cambios y la verificación previa de la compuerta (`STAGE_GATES.md` §2.5) se ejecuta sobre el resultado integrado.

---

## 3. Paquetes de trabajo

Un paquete se recomienda cuando un módulo está `EN_PROCESO` en una de sus compuertas y su capa (si la tiene) está activa. En las rutas, `{modulo}` es el ID del módulo, `{contratos}` la ruta de contratos y `{modulos_backend}` / `{modulos_frontend}` las carpetas de módulos de cada capa en `project.json`. La columna **Verificación** indica qué `verificaciones` de `project.json` debe pasar el subagente antes de responder.

<!-- paquetes:start -->

| ID | Compuertas | Capa | Rol | Subroles | Objetivo | Insumos | Escribe en | Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend` | G3A | `backend` | `03_backend_engineer` | `01_api_gateway_security`, `02_domain_business_rules`, `03_data_layer_optimizer`, `04_developer_tdd_tester` | Implementar el backend del módulo contra su contrato, con pruebas en verde y la integración con la persistencia real | `{contratos}/{modulo}.contract.ts`, `docs/modules/{modulo}/01_SPEC_FUNCIONAL.md`, `docs/modules/{modulo}/02_HISTORIAS_USUARIO.md`, `docs/modules/{modulo}/04_ARQUITECTURA_Y_CODIGO.md` | `{modulos_backend}/{modulo}/` y sus pruebas | G3A |
| `frontend` | G3A, G3B | `frontend` | `04_frontend_engineer` | `01_design_system_core`, `02_state_data_flow`, `03_views_forms_ux`, `05_developer_component_tdd` | Implementar las vistas del módulo contra el contrato (en paralelo con el backend si G3A está en curso), con pruebas de componentes en verde | `{contratos}/{modulo}.contract.ts`, `docs/modules/{modulo}/01_SPEC_FUNCIONAL.md`, `docs/modules/{modulo}/02_HISTORIAS_USUARIO.md`, `docs/project/design-system.md` | `{modulos_frontend}/{modulo}/` y sus pruebas | G3B |
| `qa_preparacion` | G3A, G3B | — | `05_qa_security_tester` | `01_sdet_api_contracts`, `02_e2e_a11y_specialist` | Escribir, en paralelo con backend y frontend y sin leer su implementación, las pruebas de aceptación que G4 ejecutará: una por criterio Gherkin, de API contra el contrato y E2E del flujo principal. Los elementos de la interfaz se localizan por rol y nombre accesible, nunca por clases o IDs internos. No se ejecutan contra código a medio hacer: cada prueba queda lista y trazada a su criterio | `docs/modules/{modulo}/02_HISTORIAS_USUARIO.md`, `docs/modules/{modulo}/01_SPEC_FUNCIONAL.md`, `{contratos}/{modulo}.contract.ts` | carpetas de pruebas E2E y de API de QA (nunca código de producción ni las pruebas de los desarrolladores) | — |
| `qa_logica` | G4 | — | `05_qa_security_tester` | `01_sdet_api_contracts` | Pilar 1: pruebas de lógica, contratos e integración del módulo (ejecutando y completando las de API que dejó `qa_preparacion`, si existen), con el registro de cada defecto y su causa raíz | `{contratos}/{modulo}.contract.ts`, `docs/modules/{modulo}/01_SPEC_FUNCIONAL.md`, `docs/modules/{modulo}/02_HISTORIAS_USUARIO.md` | carpetas de pruebas y `docs/qa/{modulo}/` (nunca código de producción) | — |
| `qa_e2e` | G4 | `frontend` | `05_qa_security_tester` | `02_e2e_a11y_specialist` | Pilar 2: E2E del flujo principal (ejecutando y completando los que dejó `qa_preparacion`, si existen) y accesibilidad con axe-core | `docs/modules/{modulo}/02_HISTORIAS_USUARIO.md`, `docs/walkthroughs/{modulo}/` | carpetas de pruebas E2E y `docs/qa/{modulo}/` (nunca código de producción) | — |
| `qa_rendimiento` | G4 | — | `05_qa_security_tester` | `03_performance_security_auditor` | Pilar 3: rendimiento y seguridad según los requisitos no funcionales aprobados, con evidencia medida | `docs/modules/{modulo}/01_SPEC_FUNCIONAL.md`, `{contratos}/{modulo}.contract.ts` | `docs/qa/{modulo}/` y scripts de prueba (nunca código de producción) | — |

<!-- paquetes:end -->

`qa_preparacion` adelanta el trabajo de QA sin adelantar su veredicto: escribe las pruebas desde la especificación mientras se construye, y G4 las ejecuta sobre el resultado integrado. Al no leer la implementación, sus pruebas comprueban lo que se pidió y no lo que se hizo. Las compuertas siguen cerrándose en orden (G3A, G3B, G4): lo que corre en paralelo es el trabajo, no las firmas.

El pilar 4 (cero `any`) es un solo comando y lo ejecuta el orquestador. El reporte de QA (`QA_REPORT.md`) lo consolida el orquestador con el rol de QA a partir de los resúmenes de los pilares.

---

## 4. Medir el modo

Cada transición del historial registra `marca` (fecha y hora) y `modo`. Para comparar ambos modos con el mismo proyecto: haz la línea base y el G1/G2 de los módulos una sola vez, crea dos ramas desde ese commit y recorre la construcción en cada una con un modo distinto, con el mismo modelo. Compara el tiempo entre transiciones, el consumo de uso del modelo y cuántas verificaciones fallaron.
