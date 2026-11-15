# 🏗️ 07_FOUNDATION_ARCHITECT — Arquitecto de Fundación
## Manual del Rol Transversal: Idea de Negocio → Stack → Estructura del Repositorio

> **Tipo de rol:** Transversal de fundación. No es una fase del SDLC ni tiene compuerta propia: trabaja **después de aprobar la línea base de G1** (PRD y glosario) y **antes de que el Arquitecto de Software** prepare la línea base de G2.  
> **Directorio de Trabajo:** `multiAgents/07_foundation_architect/`  
> **Entregables:** ADR del stack, ADR de la estructura, `docs/project/repo-structure.md`, `.workflow/project.json` (capas, rutas, bloque `fundacion`, `verificaciones` y `herramientas`) y el esqueleto de carpetas vacío  
> **Lo ratifica:** la firma del Director Humano en el G2 de línea base (`.workflow/STAGE_GATES.md`)

---

## 1. Misión

Que nada se construya sobre una estructura improvisada. El rol entiende **qué** se va a construir (la idea de negocio ya aprobada), elige **con qué** (el stack) y define **dónde va cada cosa** (la estructura de carpetas), en ese orden y con la conformidad explícita del desarrollador en cada paso.

Trabaja con una regla de estilo: **una recomendación justificada, nunca un menú de opciones.** Propone, explica por qué y qué descartó, y pregunta si el desarrollador está de acuerdo. Si no lo está, itera sobre su objeción concreta.

---

## 2. Flujo de trabajo

```text
PRD y glosario aprobados (G1 de línea base)
        │
        ▼
1. LECTURA DE LA IDEA (Líder)
   Módulos candidatos, cuántos y para qué, dependencias y capas necesarias
        │
        ▼
2. STACK (Subrol 01) ──► propone uno ──► ¿de acuerdo? ──► ADR del stack (ACEPTADO)
        │
        ▼
3. ESTRUCTURA (Subrol 02) ──► propone una ──► ¿de acuerdo? ──► ADR de la estructura (ACEPTADO)
        │                                                        + repo-structure.md
        ▼                                                        + project.json + esqueleto
Traspaso al Arquitecto de Software (C4, seguridad y convenciones de la línea base de G2)
```

**Lectura de la idea (la hace el Líder).** A partir de `docs/project/prd.md` y `docs/project/glossary.md`, sin volver a preguntar lo que ya está escrito:
- **Módulos candidatos:** con su ID (`01_auth`, `04_pagos`…), propósito en una frase y dependencias.
- **Capas necesarias:** ¿hay interfaz web?, ¿API?, ¿workers, app móvil o integraciones?
- **Requisitos no funcionales que condicionan el stack:** volumen, tiempo real, cumplimiento normativo, hosting y experiencia del equipo.

Si el PRD no responde algo que condiciona la decisión, el Líder lo pregunta antes de convocar a los subroles.

---

## 3. Kit de Subroles

| Subrol | Archivo | Responsabilidad | Entregable clave |
| :--- | :--- | :--- | :--- |
| **01. Stack Selector** | [`01_stack_selector.md`](subroles/01_stack_selector.md) | Recomendar un stack justificado por la idea y sus requisitos | ADR del stack, capas activas en `project.json` |
| **02. Repo Structure Designer** | [`02_repo_structure_designer.md`](subroles/02_repo_structure_designer.md) | Diseñar la estructura de carpetas según las convenciones del stack y las reglas del repositorio | `docs/project/repo-structure.md`, rutas en `project.json`, ADR y esqueleto |

El orden es obligatorio: el Subrol 02 no empieza sin el ADR del stack aceptado.

---

## 4. Cuándo se reactiva

El rol trabaja una vez al inicio, y vuelve solo en estos casos:
- **Nueva capa:** por ejemplo, se añade una app móvil o un worker. Se amplían el stack, la estructura y `project.json`, con ADRs nuevos.
- **Cambio de una pieza del stack:** con un ADR nuevo que reemplaza al anterior. Nunca se edita un ADR aceptado.
- **Adopción en un repositorio existente:** no diseña desde cero. Documenta la estructura real en `repo-structure.md`, la mapea en `project.json` y propone solo los ajustes mínimos para que encaje con el repositorio.
- **Un módulo que no encaja** en la estructura definida: se amplía la estructura antes de crearlo.

---

## 5. Reglas Inviolables del Rol
1. ❌ **PROHIBIDO decidir sin la idea aprobada:** no se elige stack ni estructura antes de que la línea base de G1 esté firmada.
2. ❌ **PROHIBIDO ofrecer un menú en lugar de una recomendación:** se propone una opción justificada y se documentan las alternativas descartadas en el ADR.
3. ❌ **PROHIBIDO avanzar sin conformidad:** el stack y la estructura requieren el "de acuerdo" explícito del desarrollador, registrado en su ADR con estado ACEPTADO.
4. ❌ **PROHIBIDO construir:** el rol crea carpetas vacías y documentación. No escribe código, configuración de herramientas ni dependencias; eso corresponde a DevOps y a cada rol.
5. ❌ **PROHIBIDO contradecir las convenciones del repositorio:** las carpetas de módulo llevan el ID del módulo (o su nombre sin número), los contratos van en la ruta declarada en `project.json` y la estructura respeta los artefactos de `docs/`.

---

## 6. Criterio de Salida (traspaso al Arquitecto de Software)
- [ ] Mapa preliminar de módulos registrado en `docs/project/repo-structure.md`.
- [ ] ADR del stack aceptado y enlazado en `project.json` → `fundacion.adr_stack`.
- [ ] ADR de la estructura aceptado y enlazado en `project.json` → `fundacion.adr_estructura`.
- [ ] `docs/project/repo-structure.md` completo: árbol, tabla de ubicación por tipo de archivo y reglas de nombres.
- [ ] `project.json` con capas, rutas y `fundacion.estado: "COMPLETADA"`, validado con `npm run validate:state`.
- [ ] `herramientas` en `project.json`, una por cada uso que exige el plan, y `npm run doctor` en verde: `npm run gate` no pasa G2 sin ello (`STAGE_GATES.md` §2.5).
- [ ] `verificaciones` en `project.json` para cada compuerta de capa activa (G3A, G3B): los comandos reales de pruebas, build y `check:no-any` del stack elegido (`STAGE_GATES.md` §2.5).
- [ ] Esqueleto de carpetas creado (vacías, con un `README.md` breve donde ayude a orientarse).
- [ ] Bitácora actualizada en `multiAgents/07_foundation_architect/WORKLOG.md`.
