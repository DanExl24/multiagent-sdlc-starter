# 🗂️ Estructura del Repositorio

> **Proyecto:** `{{PROJECT_NAME}}`  
> **Responsable:** Arquitecto de Fundación (`07_foundation_architect`)  
> **Estado:** PENDIENTE DE FUNDACIÓN (se completa tras aprobar la idea de negocio y el stack)  
> **Naturaleza:** Vivo (cambia solo con un ADR nuevo de estructura)  
> **Última revisión:** {{INIT_DATE}}

Responde a la pregunta **"¿dónde va cada cosa?"** para cualquier persona o agente. Lo completa el Subrol 02 del rol de fundación ([`02_repo_structure_designer.md`](../../multiAgents/07_foundation_architect/subroles/02_repo_structure_designer.md)) y lo ratifica la firma del G2 de línea base.

---

## 1. Mapa preliminar de módulos

| ID | Propósito | Depende de | Capas |
| :--- | :--- | :--- | :--- |
| `[XX_nombre]` | [Qué resuelve, en una frase] | [IDs] | [backend, frontend…] |

> El Arquitecto de Software refina este mapa en el C4. Cada módulo se crea con `npm run new:module -- [XX_nombre]`.

## 2. Árbol

```text
[Árbol comentado hasta el nivel de módulo]
```

## 3. Tabla de ubicación

| Si vas a crear… | Va en… |
| :--- | :--- |
| [Ruta / controlador / servicio / componente / store / prueba / migración / contrato] | [Ruta] |

## 4. Reglas de nombres

- **Módulos:** la carpeta de cada módulo usa su ID (`04_pagos`) o su nombre sin número (`pagos`).
- [Archivos, carpetas y otras convenciones del stack]

## 5. Decisiones

- **Stack:** [ADR del stack]
- **Estructura:** [ADR de la estructura]
