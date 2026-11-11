# 🗺️ Matriz Bidireccional de Versiones y Trazabilidad del Ciclo de Vida

> **Proyecto:** `{{PROJECT_NAME}}`  
> **Estándar Semántico:** SemVer 2.0.0 (`MAJOR.MINOR.PATCH`)  
> **Convención Git:** `[vX.Y.Z] tipo(scope): descripcion`  
> **Última Actualización:** 2026-10-07  

---

## 1. Estado Consolidado de Módulos y Versiones

| Módulo ID | Nombre del Módulo | Versión Activa | Stage-Gate Actual | Estado de QA | Walkthrough Asociado |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `00_starter` | Plantilla Base de Gobernanza | `v1.0.0` | **Gate 5 (Release)** | ✅ PASS | [WALKTHROUGH.md](file:///walkthroughs/00_starter/v1.0.0/WALKTHROUGH.md) |
| `01_auth` | Autenticación y Sesiones | `v0.1.0` | **Gate 1 (PRD)** | ⏳ PENDIENTE | `walkthroughs/01_auth/v0.1.0/` |

---

## 2. Definición del Ciclo de Vida por Módulo

```mermaid
stateDiagram-v2
    [*] --> G0_Bootstrap: Kickoff / init:project
    G0_Bootstrap --> G1_PRD: Turno Product Manager
    G1_PRD --> G2_Arquitectura: Aprobación DoR
    G2_Arquitectura --> G3A_Backend: Contratos Zod Listos
    G3A_Backend --> G3B_Frontend: Checkpoint Vitest PASS
    G3B_Frontend --> G4_QA: Vistas & Walkthrough Listos
    G4_QA --> G5_Release: QA Lead Veto Superado
    G5_Release --> G6_Kaizen: Deploy & Seeders
    G6_Kaizen --> [*]: Plan de Mejora Aprobado
```

---

## 3. Registro Histórico de Entregas por Versión
- **v1.0.0** (2026-10-07): Lanzamiento inicial de la plantilla rectora universal de desarrollo multiagente.
