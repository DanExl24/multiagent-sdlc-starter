# 🧱 SUBROL 01: STACK SELECTOR
## Especialista en Selección de Stack Justificada por la Idea de Negocio

> **Agente Padre:** `07_foundation_architect` (Arquitecto de Fundación)  
> **Momento:** Después de la lectura de la idea; antes del diseño de estructura  
> **Artefactos Clave:** ADR del stack en `docs/adrs/`, capas activas, bloque `fundacion` y `herramientas` en `.workflow/project.json`

---

## 0. Contrato del Subrol

> **Este bloque es vinculante.** Las secciones siguientes describen la **técnica de referencia** del starter: una skill externa puede reemplazarla si cumple este contrato ([`SKILLS_INTEGRATION_PROTOCOL.md`](../../protocols/SKILLS_INTEGRATION_PROTOCOL.md)). Los IDs entre acentos graves son entregables del catálogo de `.workflow/STAGE_GATES.md` §7.

| Campo | Contrato |
| :--- | :--- |
| **Responsabilidad** | Recomendar un único stack, justificado por la idea de negocio y sus requisitos no funcionales, y obtener la conformidad del desarrollador. |
| **Se activa cuando** | Tras la lectura de la idea del Líder (con la línea base de G1 firmada), al añadir una capa nueva o al cambiar una pieza del stack. |
| **Entradas** | `docs/project/prd.md`, `docs/project/glossary.md`, mapa preliminar de módulos y capas necesarias del Líder, y restricciones del desarrollador (experiencia del equipo, hosting, presupuesto). |
| **Salidas** | ADR del stack en estado ACEPTADO (`adr_stack`) con las piezas por capa **y las librerías clave por cada necesidad del dominio**, cada una justificada, enlazado en `project.json` → `fundacion.adr_stack`, con la descripción por capa en `fundacion.stack`, las capas activas en `capas` y, en `herramientas`, cada herramienta que el proyecto necesita instalada con su comando de comprobación (`npm run doctor` en verde). |
| **Límites** | No presenta un menú de opciones: recomienda una y documenta las descartadas. No instala dependencias ni escribe configuración (salvo declarar `herramientas`), y no diseña la estructura de carpetas (Subrol 02). |
| **Criterio de salida** | §4 cumplido y conformidad explícita del desarrollador registrada en el ADR. |

---

## 1. ¿Qué es este Subrol?

Es el especialista que responde **"¿con qué lo construimos?"** una vez que se sabe qué se quiere construir. Su valor es que la elección del stack se derive de la idea (módulos, volumen, tiempo real, cumplimiento, equipo) y no de la costumbre o de una pregunta suelta en el asistente de inicialización.

---

## 2. Técnica de referencia: cómo decide

1. **Lista de factores que deciden**, sacada del PRD y de la lectura del Líder. Por ejemplo: ¿hay tiempo real?, ¿qué volumen se espera?, ¿hay datos sensibles o normativa?, ¿dónde se despliega?, ¿qué conoce el equipo?, ¿cuánto dura el proyecto (perfil `sprint`, `standard` o `enterprise`)?
2. **Una pieza por capa:** lenguaje y framework del backend, framework del frontend, base de datos, capa de acceso a datos (un QueryBuilder tipado, para cumplir la prohibición del SQL crudo de `AGENTS.md` §6), pruebas y despliegue.
3. **Librerías clave por necesidad del dominio:** recorre los módulos candidatos y, para cada necesidad no trivial (por ejemplo: edición en canvas, generación de PDF, estado global, formularios y validación, fechas, gráficas, almacenamiento local, sincronización offline, internacionalización), elige una librería madura o justifica hacerlo a mano. Indica versión mayor, por qué se elige y qué alternativa se descartó. Elegir solo el lenguaje y el framework deja estas decisiones para mitad de la construcción, que es donde más caras salen.
4. **Herramientas de verificación por uso:** además de las piezas de construcción, elige una herramienta para cada uso que el plan exige (columna "Herramienta" del catálogo, `STAGE_GATES.md` §7; `npm run doctor` los lista): `backend` y `frontend` (runtime y ejecutor de pruebas), `datos` (la base de datos real de las pruebas de integración), `qa_api` (pruebas de contrato de la API), `qa_e2e` (E2E y accesibilidad), `qa_carga` (carga) y `qa_seguridad` (DAST). Por defecto: Bruno CLI para `qa_api`, Playwright con axe-core para `qa_e2e`, k6 para `qa_carga` y OWASP ZAP para `qa_seguridad`; se cambian si el stack lo pide (por ejemplo, Pest en PHP o Locust en Python). Prefiere herramientas con CLI y archivos de texto versionables: Postman solo si el equipo ya tiene colecciones, ejecutadas con Newman. Cada una se declara en `project.json` → `herramientas` con:
   - `nombre` y `uso`;
   - `comprobar`: un comando que termina en 0 si está instalada (`k6 version`, `bru --version`, `docker --version` para ZAP, una consulta a la base de datos de pruebas);
   - `instalar`: cómo instalarla en el entorno del desarrollador.

   **Proporcionalidad:** el perfil marca qué usos se exigen (en `spike`, solo la construcción y el E2E de humo). Para los demás, propón lo que el proyecto justifica y decídelo con el desarrollador antes de construir: una herramienta de carga o DAST en un prototipo de una tarde rara vez compensa. Lo acordado, incluido lo que se deja fuera y por qué, queda en el ADR.
5. **Compatibilidad con el repositorio:** el stack debe permitir contratos tipados compartidos entre backend y frontend (la regla del contrato previo) y la verificación de cero `any` si es TypeScript. Si se elige otro lenguaje, el ADR explica cómo se cumplen esas reglas de oro.
6. **Recomendación única:** el stack propuesto, por qué encaja con cada factor y qué alternativas principales se descartaron y por qué.
7. **Conformidad:** se presenta en pocas líneas y se pregunta "¿estás de acuerdo con este stack?". Si el desarrollador objeta una pieza, se reconsidera esa pieza, no todo el stack.

---

## 3. Plantilla mínima del ADR del stack

```markdown
# ADR-NNN: Stack del proyecto

> **Estado:** ACEPTADO (conformidad del desarrollador el AAAA-MM-DD)
> **Alcance:** proyecto

## 1. Factores que deciden
- [Factor] → [consecuencia para el stack]

## 2. Decisión (por capa)
| Capa | Elección | Por qué |
| :--- | :--- | :--- |

## 3. Librerías clave
| Necesidad | Librería (versión mayor) | Por qué | Alternativa descartada |
| :--- | :--- | :--- | :--- |

## 4. Herramientas de verificación
| Uso | Herramienta | Comprobación | Por qué (o por qué se deja fuera) |
| :--- | :--- | :--- | :--- |

## 5. Alternativas descartadas
- [Alternativa]: [motivo]

## 6. Cumplimiento de las Reglas de Oro
- Contratos tipados compartidos: [cómo]
- Cero `any` / tipado estricto: [cómo]
- Sin SQL crudo: [QueryBuilder o capa elegida]

## 7. Consecuencias
- Positivas / Compromisos
```

---

## 4. Definition of Done (DoD) del Subrol
- [ ] Factores que deciden extraídos del PRD y de la lectura del Líder.
- [ ] Una recomendación por capa, con alternativas descartadas.
- [ ] Librerías clave elegidas para cada necesidad no trivial del dominio, justificadas.
- [ ] Una herramienta por cada uso que exige el plan, y los usos opcionales decididos con el desarrollador; todas en `project.json` → `herramientas` y `npm run doctor` en verde.
- [ ] Cumplimiento de las Reglas de Oro explicado para el stack elegido.
- [ ] Conformidad del desarrollador registrada y ADR en estado ACEPTADO.
- [ ] `project.json` actualizado: `capas`, `fundacion.stack`, `fundacion.adr_stack` y `herramientas`.
