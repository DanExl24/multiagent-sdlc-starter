# 📖 Manual de la Plantilla Maestra de Módulo

> Este directorio define el índice y los 4 documentos oficiales que DEBE contener la carpeta de cada módulo del sistema dentro de `docs/modules/[XX_nombre_modulo]/`.

---

## Estructura de un Módulo
```text
docs/modules/[XX_nombre_modulo]/
├── README.md                    # Índice: estado, enlaces a contrato/ADRs/QA y qué leer por rol
├── 01_SPEC_FUNCIONAL.md        # Propósito, dependencias, actores y reglas inmutables
├── 02_HISTORIAS_USUARIO.md      # RF, RNF, Catálogo de HUs y criterios Given-When-Then
├── 03_FLUJO_Y_ESTADOS.md        # Diagramas Mermaid, máquina de estados y casos de uso
└── 04_ARQUITECTURA_Y_CODIGO.md  # Tablas DDL, contratos Zod y Mapa Canónico de Rutas
```

---

## Cómo crear un módulo

```bash
npm run new:module -- 04_pagos --responsable "Ana" --depende-de 01_auth
```

Copia estas plantillas a `docs/modules/<modulo>/` (aquí, `04_pagos`) y crea su archivo de estado `.workflow/modules/<modulo>.json`, con el módulo en G1. No crees los archivos a mano: el validador exige que el ID coincida en ambos sitios.

## Archivos de Plantilla:
- [`00_README_TEMPLATE.md`](00_README_TEMPLATE.md) → se copia como `README.md`
- [`01_SPEC_FUNCIONAL_TEMPLATE.md`](01_SPEC_FUNCIONAL_TEMPLATE.md)
- [`02_HISTORIAS_USUARIO_TEMPLATE.md`](02_HISTORIAS_USUARIO_TEMPLATE.md)
- [`03_FLUJO_Y_ESTADOS_TEMPLATE.md`](03_FLUJO_Y_ESTADOS_TEMPLATE.md)
- [`04_ARQUITECTURA_Y_CODIGO_TEMPLATE.md`](04_ARQUITECTURA_Y_CODIGO_TEMPLATE.md)
