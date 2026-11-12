# 📌 PROTOCOLO DE CONVENCIÓN DE COMMITS GIT (CANONICAL COMMIT NOMENCLATURE)

> **Documento Rector:** `multiAgents/protocols/GIT_COMMIT_CONVENTION.md`  
> **Ámbito de Aplicación:** Obligatorio para **TODOS** los agentes de IA (Orquestador, PM, Arquitecto, Backend, Frontend, QA, DevOps) y desarrolladores humanos.  
> **Estatus:** Regla de Gobernanza Activa — Inviolable.

---

## 1. Nomenclatura Canónica (regla de commits de `AGENTS.md` §6)

Todo commit realizado en el repositorio DEBE seguir estricta y obligatoriamente la siguiente estructura canónica:

```text
[vX.Y.Z] tipo(scope): descripción concisa del commit
```

o de forma equivalente:

```text
[vX.Y.Z] tipo[scope]: descripción concisa del commit
```

> [!IMPORTANT]
> **El prefijo de versión `[vX.Y.Z]` al inicio es ESTRICTAMENTE OBLIGATORIO.**  
> Queda terminantemente prohibido omitir la versión, colocarla al final del mensaje o enviar commits con formato de Conventional Commits plano sin corchetes de versión.

### 1.1. Cuándo se hace commit

El commit no espera a G4. Cada módulo trabaja en su rama (`rama` en `.workflow/modules/[XX_nombre].json`) y se hace commit en ella:
- **Al cerrar cada compuerta del módulo**, justo después de `npm run gate -- [XX_nombre] solicitar` o de `avanzar`, para que lo entregado en esa compuerta quede guardado aunque la sesión se corte.
- **Al terminar una unidad de trabajo coherente** dentro de una compuerta larga (por ejemplo, una historia de usuario implementada con sus pruebas en verde).

**G4 autoriza el merge de la rama a `main`**, no el primer commit. Lo que nunca se hace sin firma humana es fusionar a `main` (G4), publicar en producción o etiquetar un release (G5). Hacer push de la rama del módulo es una acción hacia el exterior: se hace cuando el Director Humano lo autoriza.

**Versión del prefijo:** en la rama de un módulo se usa la versión del próximo release previsto (plan de releases de `multiAgents/00_orchestrator/PROJECT_STATUS.md`), o la `version_actual` de `current_state.json` si aún no hay plan.

---

## 2. Tipos de Commit Permitidos (`tipo`)

| Tipo | Propósito | Ejemplo |
| :--- | :--- | :--- |
| `feat` | Nueva funcionalidad o módulo entregado | `[v1.1.0] feat(m02-billing): implementar procesamiento de pagos` |
| `fix` | Corrección de un defecto o bug detectado por QA | `[v1.0.1] fix(m01-auth): corregir revocación de jti blacklist` |
| `docs` | Cambios exclusivos en documentación o especificaciones | `[v1.0.0] docs(architecture): actualizar diagramas c4 nivel 2` |
| `test` | Incorporación o mejora de suites de prueba | `[v1.0.0] test(m01-auth): agregar suites de integración vitest` |
| `refactor` | Modificación de código que no altera el comportamiento | `[v1.0.0] refactor(core): extraer middleware de validación zod` |
| `style` | Ajustes cosméticos o apego al Design System | `[v1.0.0] style(ui): aplicar tokens semánticos en modal` |
| `chore` | Tareas de tooling, dependencias o configuración CI | `[v1.0.0] chore(ci): configurar action de auditoría ast` |

---

## 3. Catálogo Canónico de Scopes

### A. Scopes por Módulo Funcional
- `m01-auth`: Autenticación, sesiones y tokens.
- `m[XX]-[nombre]`: Módulo específico del dominio del sistema (ej: `m02-organizaciones`, `m03-operaciones`, `m04-reportes`).

### B. Scopes Transversales
- `ui`: Mejoras globales a la experiencia de usuario, diseño y componentes base.
- `governance`: Actualizaciones a manuales rectores (`AGENTS.md`), protocolos o matrices de versionamiento.
- `qa`: Estrategia maestra de calidad, reportes consolidados o frameworks de prueba.
- `devops`: Pipelines de base de datos, Docker, CI/CD o variables de entorno.
- `core`: Middlewares globales, cliente HTTP base o capas de persistencia.

---

## 4. Ejemplos de Comparación: Buenas Prácticas vs Antipatrones

### ✅ Ejemplos Correctos (Cumplen con el Estándar):
- `[v1.0.0] feat(m01-auth): implementar login con jwt y validacion zod perimetral`
- `[v1.0.0] docs(qa): consolidar reporte ejecutivo de certificacion`
- `[v1.0.1] fix(core): resolver timeout en pool de conexiones de base de datos`
- `[v1.0.0] test(m01-auth): bateria de pruebas de integracion vitest al 100% pass`

### ❌ Ejemplos Incorrectos (Antipatrones Rechazados):
- ❌ `feat(m01-auth): implementacion integral de login...`  
  *(Falta el prefijo de versión `[vX.Y.Z]` al inicio).*
- ❌ `feat(ui): panel de usuario v1.0.0`  
  *(La versión está colocada al final en vez de abrir con `[v1.0.0]` al inicio).*
- ❌ `[v1.0.0] feat: modulo de pagos`  
  *(Falta el scope o módulo entre paréntesis).*
- ❌ `[v1.0.1] fix bug`  
  *(Falta el tipo convencional y el scope formal).*
- ❌ `WIP: avanzando`  
  *(Totalmente inaceptable bajo estándares de ingeniería).*

---

## 5. Lista de Chequeo Pre-Commit para Agentes

Antes de proponer o ejecutar un comando `git commit`, el agente DEBE validar:

1. [ ] ¿El mensaje comienza con `[vX.Y.Z]` correspondiente a la versión activa del proyecto?
2. [ ] ¿El tipo (`feat`, `fix`, `docs`, `test`, `style`, `refactor`, `chore`) refleja con exactitud la naturaleza del cambio?
3. [ ] ¿El scope entre paréntesis `(scope)` identifica el módulo o subsistema transversal?
4. [ ] ¿La descripción explica concisamente la modificación realizada?
5. [ ] ¿Se actualizaron previamente la bitácora del rol, el archivo de estado de la pista y, si hay cambios visibles, el fragmento de `changelog.d/`?
