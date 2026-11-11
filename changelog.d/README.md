# 🧩 Fragmentos de Changelog

En una rama de trabajo **no se edita `CHANGELOG.md`**. Cada módulo (o cambio transversal) deja aquí su propio archivo, de modo que varias ramas nunca editan el mismo archivo. En G5, `npm run release:changelog -- X.Y.Z` consolida todos los fragmentos en una versión de `CHANGELOG.md` y los borra.

## Nombre del archivo

| Caso | Nombre |
| :--- | :--- |
| Cambio de un módulo | `[XX_nombre].md` (ej. `04_pagos.md`), o `04_pagos-reintentos.md` si el módulo deja varios |
| Cambio transversal (gobernanza, tooling, línea base) | `proyecto-[descripcion].md` (ej. `proyecto-ci-cache.md`) |

## Formato

Solo encabezados de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y viñetas:

```markdown
### Added
- Cobro con tarjeta y reintentos idempotentes (`POST /api/pagos`).

### Security
- Los tokens de pago no se registran en los logs.
```

Secciones válidas: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Al consolidar, cada viñeta de un módulo se antepone con su ID (`**04_pagos:**`). `npm run check:docs` valida el nombre y el formato, y que el módulo exista.

Las reglas completas de versionado están en [`SEMVER_CHANGELOG_PROTOCOL.md`](../multiAgents/protocols/SEMVER_CHANGELOG_PROTOCOL.md).
