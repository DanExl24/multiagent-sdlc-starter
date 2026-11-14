# 🗂️ SUBROL 02: REPO STRUCTURE DESIGNER
## Especialista en Estructura de Carpetas Fullstack Legible y Coherente con el Stack

> **Agente Padre:** `07_foundation_architect` (Arquitecto de Fundación)  
> **Momento:** Después de aceptar el ADR del stack; antes del traspaso al Arquitecto de Software  
> **Artefactos Clave:** `docs/project/repo-structure.md`, ADR de la estructura, rutas en `.workflow/project.json`, esqueleto de carpetas

---

## 0. Contrato del Subrol

> **Este bloque es vinculante.** Las secciones siguientes describen la **técnica de referencia** del starter: una skill externa puede reemplazarla si cumple este contrato ([`SKILLS_INTEGRATION_PROTOCOL.md`](../../protocols/SKILLS_INTEGRATION_PROTOCOL.md)). Los IDs entre acentos graves son entregables del catálogo de `.workflow/STAGE_GATES.md` §7.

| Campo | Contrato |
| :--- | :--- |
| **Responsabilidad** | Diseñar una única estructura de carpetas, legible y coherente con el stack aceptado y con las reglas del repositorio, y obtener la conformidad del desarrollador. |
| **Se activa cuando** | Con el ADR del stack aceptado, al añadir una capa, al adoptar el starter en un repositorio existente o cuando un módulo no encaja en la estructura. |
| **Entradas** | ADR del stack, mapa preliminar de módulos y capas del Líder, convenciones oficiales del stack elegido y `.workflow/project.json`. |
| **Salidas** | `docs/project/repo-structure.md` completo (`estructura_repo`), ADR de la estructura en estado ACEPTADO enlazado en `project.json` → `fundacion.adr_estructura`, rutas de capas y contratos y `verificaciones` por compuerta en `project.json`, y el esqueleto de carpetas vacío. |
| **Límites** | No presenta un menú de opciones. No escribe código, configuración ni dependencias. No crea los módulos (eso lo hace `npm run new:module`), y respeta los artefactos de `docs/` y la ruta de contratos. |
| **Criterio de salida** | §4 cumplido, conformidad del desarrollador registrada y `npm run validate:state` en verde. |

---

## 1. ¿Qué es este Subrol?

Es el especialista que responde **"¿dónde va cada cosa?"**. Una buena estructura permite que cualquier persona o agente que llegue después encuentre lo que busca sin preguntar, y que varios desarrolladores trabajen en módulos distintos sin pisarse.

---

## 2. Técnica de referencia: cómo diseña

1. **Partir de las convenciones del stack**, no inventarlas: la estructura recomendada por la documentación oficial del framework elegido (o las convenciones de su comunidad), y estructuras de referencia fullstack conocidas (monorepo con `apps/` y `packages/`, carpetas separadas por capa, monolito modular, organización por funcionalidad). Una skill externa de patrones del stack puede aportar esta parte.
2. **Adaptarla a las reglas del repositorio:**
   - **Un módulo, un ID:** la carpeta del módulo en cada capa usa el ID (`04_pagos`) o el nombre sin número (`pagos`) si el lenguaje no admite nombres que empiecen por dígito. `validate:state` avisa de carpetas que no correspondan a ningún módulo.
   - **Contratos compartidos:** en `docs/contracts/` por defecto, o en un paquete compartido del monorepo. La ruta se declara en `project.json` → `rutas.contratos`.
   - **Separar lo transversal de lo modular:** núcleo compartido (configuración, autenticación, utilidades) separado de los módulos de negocio.
   - **Pruebas junto a lo que prueban o en una carpeta paralela**, según la convención del stack, pero de forma consistente en todo el repositorio.
3. **Decidir con el mapa de módulos:** cuántos módulos hay y cuánto comparten determina si conviene un monorepo, carpetas por capa o un monolito modular. La decisión se justifica en el ADR.
4. **Recomendación única:** el árbol propuesto, la tabla de ubicación y por qué encaja con el stack y los módulos.
5. **Conformidad:** se pregunta "¿estás de acuerdo con esta estructura?". Si el desarrollador objeta una parte, se ajusta esa parte.
6. **Materializar:** crear las carpetas vacías (con un `README.md` breve donde ayude), completar `docs/project/repo-structure.md` y actualizar `project.json` (capas, `raiz`, `modulos`, `rutas.contratos`, el bloque `fundacion` y `verificaciones`: los comandos de pruebas, build y `check:no-any` que `npm run gate` ejecutará en G3A y G3B, según el stack; `.workflow/STAGE_GATES.md` §2.5).

**Repositorio existente:** en lugar de diseñar, documenta la estructura real, la mapea en `project.json` y propone solo los ajustes mínimos necesarios para cumplir las reglas del repositorio.

---

## 3. Qué debe contener `docs/project/repo-structure.md`

| Sección | Contenido |
| :--- | :--- |
| Mapa preliminar de módulos | ID, propósito, dependencias y capas de cada módulo candidato |
| Árbol | Estructura de carpetas comentada, hasta el nivel de módulo |
| Tabla de ubicación | "Si vas a crear un… → va en…" para cada tipo de archivo (rutas, servicios, componentes, stores, pruebas, migraciones, contratos) |
| Reglas de nombres | Archivos, carpetas y módulos |
| Decisiones | Enlace a los ADR del stack y de la estructura |

---

## 4. Definition of Done (DoD) del Subrol
- [ ] Estructura basada en las convenciones del stack y adaptada a las reglas del repositorio.
- [ ] Conformidad del desarrollador registrada y ADR de la estructura en estado ACEPTADO.
- [ ] `docs/project/repo-structure.md` con mapa de módulos, árbol, tabla de ubicación y reglas de nombres.
- [ ] `project.json` actualizado (capas, rutas y `fundacion` con `estado: "COMPLETADA"`) y `npm run validate:state` en verde.
- [ ] Esqueleto de carpetas creado, sin código ni configuración.
