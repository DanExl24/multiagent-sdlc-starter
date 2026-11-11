> **Proyecto:** {{PROJECT_NAME}}  
> **Dominio:** {{PROJECT_DOMAIN}}  
> **Versión Actual:** `v0.1.0` (Gobernanza Inicializada)  
> **Versión Objetivo:** `v0.2.0` (Módulo 01: Core / Autenticación o Módulo Inicial)  
> **Última Actualización:** {{INIT_DATE}}  
> **Fase Activa:** STAGE-GATE 1 — Definición de Requerimientos y PRD de Módulo  
> **Agente en Turno:** Product Manager Lead (`01_product_manager`)  

---

## 1. Semáforo de Fases (Stage-Gates)

| Fase | Agente Responsable | Entregable Clave | Estado | Gate | Aprobación Humana |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **00. Gobernanza** | Orquestador | Estructura Multiagente, SemVer, Reglas de Oro | 🟢 COMPLETADO | G0 (Bootstrap) | Automática (`init:project`) |
| **M01. PRD & Reglas** | Product Manager Lead | `docs/01_prd.md`, HUs INVEST con BDD Gherkin | 🟡 EN PROCESO | Gate 1 (PRD) | 🛑 Pendiente Firma Humana |
| **Arquitectura M01** | Software Architect | DDL de tablas + Contratos Zod API-First | ⚪ SIGUIENTE | Gate 2 | Pendiente Gate 1 |
| **Backend M01** | Backend Engineer | API REST tipada + Lógica + Tests Vitest | ⚪ EN ESPERA | G3A (Checkpoint) | Automática (Orquestador); pendiente Gate 2 |
| **Frontend M01** | Frontend Engineer | SPA reactiva + Design System + Walkthrough | ⚪ EN ESPERA | Gate 3B | Pendiente checkpoint G3A |
| **QA Forense M01** | QA Lead & Security | Cuadrantes Q1-Q4 + Zero ANY + Fichas Bugs | ⚪ EN ESPERA | Gate 4 | Pendiente Gate 3B |
| **Release M01** | DevOps Engineer | Seeders + Docker + Release SemVer `v0.2.0` | ⚪ EN ESPERA | Gate 5 | Pendiente Gate 4 |
| **Kaizen M01** | Comité de Calidad | Ishikawa + Pareto 80/20 + Matriz Priorización | ⚪ EN ESPERA | Gate 6 | Pendiente Gate 5 |

*Leyenda:* 🟢 Completado | 🟡 En Proceso / En Cola | 🔴 Bloqueado (Veto) | ⚪ No Iniciado

---

## 2. Historial de Decisiones de Versión (SemVer)
- **v0.1.0 ({{INIT_DATE}}):** Inicialización de la arquitectura multiagente, máquina de estados en `.workflow/current_state.json`, manual rector en `AGENTS.md`, 11 Reglas de Oro inviolables, compuertas mecánicas AST contra el tipo `any` y protocolos de colaboración entre agentes.
