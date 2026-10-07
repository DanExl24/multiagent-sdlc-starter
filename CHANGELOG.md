# 📝 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] - 2026-10-07

### Added
- **Gobernanza y Orquestación Multiagente:**
  - Manual rector [`AGENTS.md`](file:///AGENTS.md) con las 11 Reglas de Oro, arquitectura de roles y protocolo de Stage-Gates.
  - Máquina de estados en [`.workflow/current_state.json`](file:///.workflow/current_state.json) y compuertas en [`.workflow/STAGE_GATES.md`](file:///.workflow/STAGE_GATES.md).
  - Kit completo de 7 Roles Líderes y 26 Subroles especializados en `multiAgents/`.
  - Protocolos de colaboración técnica (`HANDOFF_PROTOCOL`, `COLLABORATION_PROTOCOL_TECH_TRIO`, `GIT_COMMIT_CONVENTION`, `SEMVER_CHANGELOG_PROTOCOL`).
- **Tooling y Compuertas Mecánicas AST:**
  - Asistente interactivo de personalización de proyectos [`tooling/init-project.mjs`](file:///tooling/init-project.mjs) (`npm run init:project`).
  - Auditor AST de TypeScript para Backend [`tooling/check-no-any-backend.ts`](file:///tooling/check-no-any-backend.ts).
  - Auditor AST de TypeScript y Vue para Frontend [`tooling/check-no-any-frontend.mjs`](file:///tooling/check-no-any-frontend.mjs) (`npm run check:no-any`).
- **Artefactos y Plantillas de Ingeniería:**
  - Plantillas rectoras en `docs/`: PRD (`01_prd.md`), Arquitectura (`02_architecture.md`), Reporte QA (`03_qa_report.md`), Design System (`04_ui_design_system.md`), y Matriz de Versiones (`VERSION_MATRIX.md`).
  - Plantillas modulares en `multiAgents/protocols/TEMPLATES/` y catálogo de ADRs.
  - Prompt canónico de bienvenida para agentes de IA en [`LANDING_PROMPT.md`](file:///LANDING_PROMPT.md).
