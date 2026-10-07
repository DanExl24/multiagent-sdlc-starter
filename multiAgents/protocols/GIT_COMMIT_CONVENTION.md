# 📌 PROTOCOLO DE CONVENCIÓN DE COMMITS GIT (CANONICAL COMMIT NOMENCLATURE)

> **Documento Rector:** `multiAgents/protocols/GIT_COMMIT_CONVENTION.md`  
> **Ámbito de Aplicación:** Obligatorio para **TODOS** los agentes de IA (Orquestador, PM, Arquitecto, Backend, Frontend, QA, DevOps) y desarrolladores humanos.  
> **Estatus:** Regla de Gobernanza Activa — Inviolable.

---

## 1. La Regla de Oro de Nomenclatura

Todo commit realizado en el repositorio de **AcademiaNeiva** DEBE seguir estricta y obligatoriamente la siguiente estructura canónica:

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

---

## 2. Anatomía del Mensaje de Commit

| Componente | Obligatorio | Formato / Valores Permitidos | Descripción / Ejemplo |
| :--- | :---: | :--- | :--- |
| **`[vX.Y.Z]`** | **SÍ** | `[v0.1.0]`, `[v0.9.2]`, `[v0.10.0]` | Versión SemVer actual bajo la cual se realiza la entrega o corrección. Debe coincidir con `PROJECT_STATUS.md` y `docs/VERSION_MATRIX.md`. |
| **`tipo`** | **SÍ** | `feat`, `fix`, `docs`, `test`, `style`, `refactor`, `chore` | Intención técnica del commit según el estándar Conventional Commits. |
| **`(scope)`** | **SÍ** | `(m01-auth)`, `(ui)`, `(governance)`, etc. | Módulo funcional específico (del catálogo 01 a 21) o subsistema transversal impactado. |
| **`: descripción`** | **SÍ** | Texto en minúsculas, claro y directo | Explicación en imperativo o pasado de lo que introduce el commit. |

---

## 3. Catálogo de Tipos de Commit (`tipo`)

- **`feat`**: Incorporación de nueva funcionalidad, endpoint, vista SPA, componente o tabla de base de datos.
- **`fix`**: Corrección de un defecto, bug, regresión, error de validación Zod o vulnerabilidad reportada por QA.
- **`docs`**: Documentación técnica, artefactos de ingeniería (PRD, Arquitectura, HUs, ADRs, Walkthroughs, Reportes QA, Matriz de versiones).
- **`test`**: Creación, actualización o refactorización de suites de prueba automatizadas (Vitest, Bruno CLI, Supertest, Playwright, k6).
- **`style`**: Ajustes de espaciado, maquetación, paleta oficial de colores o microanimaciones visuales que no alteran la lógica de negocio (respetando la Regla de Oro #7).
- **`refactor`**: Reorganización de código, tipados internos o extracción de métodos sin alterar el comportamiento observable ni los contratos API.
- **`chore`**: Tareas de mantenimiento, dependencias npm, migraciones DDL, seeders, Docker o pipelines de despliegue.

---

## 4. Catálogo Canónico de Scopes por Módulo y Transversales

### A. Scopes por Módulo Funcional (21 Módulos de AcademiaNeiva)

| Código | Módulo Funcional | Scope Canónico Recomendado |
| :---: | :--- | :--- |
| **01** | Autenticación y Seguridad | `m01-auth` |
| **02** | Gestión de Colegios | `m02-colegios` |
| **03** | Usuarios y Directivos | `m03-usuarios` |
| **04** | Estructura Escolar | `m04-estructura` |
| **05** | Gestión y Asignación Docente | `m05-asignacion` |
| **06** | Matrículas y Documentos | `m06-matriculas` (o `m06-admisiones`) |
| **07** | Estudiantes y Estados | `m07-estudiantes` |
| **08** | Configuración Académica y Calendario | `m08-configuracion` |
| **09** | Competencias y Logros Académicos | `m09-competencias` |
| **10** | Catálogo DBA (MEN) | `m10-dba` |
| **11** | Calificaciones y Evaluación SIEE | `m11-calificaciones` |
| **12** | Observador del Alumno | `m12-observador` |
| **13** | Control de Asistencia | `m13-asistencia` |
| **14** | Cierre y Boletines PDF | `m14-boletines` |
| **15** | Supervisión y Auditoría Forense | `m15-auditoria` |
| **16** | Mesa de Soporte y Tickets | `m16-soporte` |
| **17** | Gestión de Padres de Familia | `m17-padres` |
| **18** | Gestión de Traslados | `m18-traslados` |
| **19** | Promoción y Cierre Anual | `m19-promocion` |
| **20** | Seguimiento Directivo | `m20-directivo` |
| **21** | Correos y Verificaciones OTP | `m21-otp` |

### B. Scopes Transversales

- `ui`: Mejoras globales a la experiencia de usuario, diseño widescreen, componentes transversales del layout (Sidebar, Navbar, Clock).
- `governance`: Actualizaciones a manuales rectores (`AGENTS.md`), protocolos multiagente o matrices de versionamiento.
- `qa`: Estrategia maestra de calidad, RTM, reportes consolidados o frameworks de prueba.
- `devops`: Pipelines de base de datos, scripts `seed.ts`, Docker o variables de entorno.
- `core`: Middleware global de Express, cliente HTTP Axios base o pools de Kysely.

---

## 5. Ejemplos de Comparación: Buenas Prácticas vs Antipatrones

### ✅ Ejemplos Correctos (Cumplen con el Estándar):
- `[v0.5.0] feat(m04-estructura): complete school structure, campuses, shifts and grade management`
- `[v0.4.0] feat(m03-usuarios): complete user management, institutional RBAC and executive governance`
- `[v0.4.0] docs(qa): transform 03_qa_report into QA Master Orchestrator and consolidated traceability dashboard`
- `[v0.6.0] feat(m05-asignacion): matriz interactiva de horario semanal docente por colores y slots`
- `[v0.8.0] feat(m07-estudiantes): implementacion integral y certificacion de estudiantes, acudientes y estados`
- `[v0.9.1] feat(m06-admisiones): portal publico de admisiones y prematricula con verificacion otp`
- `[v0.9.2] feat(ui): panel de usuario widescreen con sidebar por dominios y reloj en tiempo real`
- `[v0.9.2] docs(governance): formalizar protocolo oficial de commits y actualizar AGENTS.md`

### ❌ Ejemplos Incorrectos (Antipatrones Rechazados):
- ❌ `feat(modulo-07): implementacion integral de estudiantes...`  
  *(Falta el prefijo de versión `[vX.Y.Z]` al inicio).*
- ❌ `feat(ui): panel de usuario widescreen con reloj v0.9.2`  
  *(La versión está colocada al final en vez de abrir con `[v0.9.2]` al inicio).*
- ❌ `[v0.9.0] feat: configuracion de calendario`  
  *(Falta el scope o módulo entre paréntesis).*
- ❌ `[v0.9.1] fix bug`  
  *(Falta el tipo convencional y el scope formal).*
- ❌ `WIP: avanzando con modulo 09`  
  *(Totalmente inaceptable bajo estándares de ingeniería).*

---

## 6. Lista de Chequeo Pre-Commit para Agentes

Antes de proponer o ejecutar un comando `git commit`, el agente DEBE validar:

1. [ ] ¿El mensaje comienza con `[vX.Y.Z]` correspondiente a la versión activa del proyecto?
2. [ ] ¿El tipo (`feat`, `fix`, `docs`, `test`, `style`, `refactor`, `chore`) refleja con exactitud la naturaleza del cambio?
3. [ ] ¿El scope entre paréntesis `(scope)` identifica el módulo (ej. `m08-configuracion`) o subsistema transversal (ej. `ui`, `governance`)?
4. [ ] ¿La descripción explica concisamente la modificación realizada?
5. [ ] ¿Se actualizaron previamente las bitácoras `WORKLOG.md` y `PROJECT_STATUS.md`?

> Si todas las respuestas son afirmativas, proceda con el commit.
