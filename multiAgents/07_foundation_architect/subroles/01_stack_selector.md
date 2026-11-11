# 🧱 SUBROL 01: STACK SELECTOR
## Especialista en Selección de Stack Justificada por la Idea de Negocio

> **Agente Padre:** `07_foundation_architect` (Arquitecto de Fundación)  
> **Momento:** Después de la lectura de la idea; antes del diseño de estructura  
> **Artefactos Clave:** ADR del stack en `docs/adrs/`, capas activas y bloque `fundacion` en `.workflow/project.json`

---

## 0. Contrato del Subrol

> **Este bloque es vinculante.** Las secciones siguientes describen la **técnica de referencia** del starter: una skill externa puede reemplazarla si cumple este contrato ([`SKILLS_INTEGRATION_PROTOCOL.md`](../../protocols/SKILLS_INTEGRATION_PROTOCOL.md)). Los IDs entre acentos graves son entregables del catálogo de `.workflow/STAGE_GATES.md` §7.

| Campo | Contrato |
| :--- | :--- |
| **Responsabilidad** | Recomendar un único stack, justificado por la idea de negocio y sus requisitos no funcionales, y obtener la conformidad del desarrollador. |
| **Se activa cuando** | Tras la lectura de la idea del Líder (con la línea base de G1 firmada), al añadir una capa nueva o al cambiar una pieza del stack. |
| **Entradas** | `docs/project/prd.md`, `docs/project/glossary.md`, mapa preliminar de módulos y capas necesarias del Líder, y restricciones del desarrollador (experiencia del equipo, hosting, presupuesto). |
| **Salidas** | ADR del stack en estado ACEPTADO (`adr_stack`), enlazado en `project.json` → `fundacion.adr_stack`, con la descripción por capa en `fundacion.stack` y las capas activas en `capas`. |
| **Límites** | No presenta un menú de opciones: recomienda una y documenta las descartadas. No instala dependencias ni escribe configuración, y no diseña la estructura de carpetas (Subrol 02). |
| **Criterio de salida** | §4 cumplido y conformidad explícita del desarrollador registrada en el ADR. |

---

## 1. ¿Qué es este Subrol?

Es el especialista que responde **"¿con qué lo construimos?"** una vez que se sabe qué se quiere construir. Su valor es que la elección del stack se derive de la idea (módulos, volumen, tiempo real, cumplimiento, equipo) y no de la costumbre o de una pregunta suelta en el asistente de inicialización.

---

## 2. Técnica de referencia: cómo decide

1. **Lista de factores que deciden**, sacada del PRD y de la lectura del Líder. Por ejemplo: ¿hay tiempo real?, ¿qué volumen se espera?, ¿hay datos sensibles o normativa?, ¿dónde se despliega?, ¿qué conoce el equipo?, ¿cuánto dura el proyecto (perfil `sprint`, `standard` o `enterprise`)?
2. **Una pieza por capa:** lenguaje y framework del backend, framework del frontend, base de datos, capa de acceso a datos (un QueryBuilder tipado, para cumplir la regla de oro de no usar SQL crudo), pruebas y despliegue.
3. **Compatibilidad con el repositorio:** el stack debe permitir contratos tipados compartidos entre backend y frontend (la regla del contrato previo) y la verificación de cero `any` si es TypeScript. Si se elige otro lenguaje, el ADR explica cómo se cumplen esas reglas de oro.
4. **Recomendación única:** el stack propuesto, por qué encaja con cada factor y qué alternativas principales se descartaron y por qué.
5. **Conformidad:** se presenta en pocas líneas y se pregunta "¿estás de acuerdo con este stack?". Si el desarrollador objeta una pieza, se reconsidera esa pieza, no todo el stack.

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

## 3. Alternativas descartadas
- [Alternativa]: [motivo]

## 4. Cumplimiento de las Reglas de Oro
- Contratos tipados compartidos: [cómo]
- Cero `any` / tipado estricto: [cómo]
- Sin SQL crudo: [QueryBuilder o capa elegida]

## 5. Consecuencias
- Positivas / Compromisos
```

---

## 4. Definition of Done (DoD) del Subrol
- [ ] Factores que deciden extraídos del PRD y de la lectura del Líder.
- [ ] Una recomendación por capa, con alternativas descartadas.
- [ ] Cumplimiento de las Reglas de Oro explicado para el stack elegido.
- [ ] Conformidad del desarrollador registrada y ADR en estado ACEPTADO.
- [ ] `project.json` actualizado: `capas`, `fundacion.stack` y `fundacion.adr_stack`.
