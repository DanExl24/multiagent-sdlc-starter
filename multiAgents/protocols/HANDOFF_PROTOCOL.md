# 🤝 PROTOCOLO DE TRASPASO ENTRE AGENTES (HANDOFF PROTOCOL)

> **Propósito:** Regular el intercambio formal de responsabilidades entre agentes al completar cada fase del SDLC, evitando vacíos de comunicación y garantizando la trazabilidad.

---

## 1. El Formato de Acta de Traspaso (Handoff Certificate)
Cada vez que un agente completa su labor, debe anexar al final de su artefacto o presentar al Orquestador un **Certificado de Traspaso**:

```markdown
### 📋 Certificado de Traspaso de Fase
- **Fase Emisora:** [Ej. Fase 1: Requerimientos]
- **Agente Emisor:** [Ej. Product Manager Agent]
- **Fase Receptora:** [Ej. Fase 2: Arquitectura de Software]
- **Agente Receptor:** [Ej. Software Architect Agent]
- **Artefactos Entregados:**
  - `docs/01_prd.md` (Versión 1.0)
- **Checklist de Calidad:**
  - [x] Historias de Usuario en formato INVEST y BDD (Given-When-Then).
  - [x] Reglas normativas colombianas integradas (Ley 115, Dec 1290).
  - [x] Sin mención a código o librerías de implementación.
- **Aprobación del Director Humano:** [PENDIENTE / APROBADO por Usuario el AAAA-MM-DD]
```

### 1.1. 📢 Tabla Obligatoria de Pase de Lista del Consejo Multiagente (Roll Call de Relevo)
Cada vez que un **Rol Líder culmina su labor en cualquier compuerta o entrega de fase (Gate 1, Gate 2, Gate 3A, Gate 3B, Gate 4 o Gate 5)**, es **MANDATORIO E INELUDIBLE** incluir en su comunicación al Director Humano la **Tabla de Pase de Lista del Consejo Multiagente**. 

Esta tabla debe actualizar en tiempo real el estado de los 7 roles líderes, los subroles que actuaron o están convocados, y el estado vivo de sus compromisos en el ciclo:

```markdown
### 📢 Pase de Lista del Consejo Multiagente (`multiAgents/`)

| Rol Líder | Estado Operativo | Kit de Subroles Activado | Compromiso Técnico / Estado de Entrega |
| :--- | :---: | :--- | :--- |
| 🤖 **[00_orchestrator](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/00_orchestrator/)** | 🟢 **ACTIVO** | Gobernanza HITL, Máquina de Estados, Semáforo | Supervisión de compuertas y transición de estados. |
| 📋 **[01_product_manager](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/01_product_manager/)** | 🟢 **CULMINADO** | `01_discovery`, `02_legal`, `03_bdd`, `04_uat` | PRD, HUs INVEST y reglas normativas completadas. |
| 🏛️ **[02_software_architect](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/02_software_architect/)** | 🟢 **CULMINADO** | `system_modular`, `relational_ddl`, `api_contracts`, `security` | DDL relacional y contratos Zod API-First entregados. |
| ⚙️ **[03_backend_engineer](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/03_backend_engineer/)** | 🟢 **CULMINADO** | `api_gateway`, `domain_siee`, `data_kysely`, `developer_tdd` | API REST Kysely, validaciones perimetrales y tests PASS. |
| 🎨 **[04_frontend_engineer](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/04_frontend_engineer/)** | 🟡 **EN TURNO** | `design_system`, `state_flow`, `views_ux`, `dataviz` | Vistas SPA en Modo Blanco Institucional y walkthrough. |
| 🧪 **[05_qa_security_tester](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/05_qa_security_tester/)** | ⚪ **LISTO (Espera)** | `sdet_api`, `e2e_a11y`, `perf_security` | Preparado para auditar con el Arsenal de los 4 Pilares. |
| 🚀 **[06_devops_release](file:///c:/Users/alejo/Downloads/tryIt/multiAgents/06_devops_release/)** | ⚪ **LISTO (Espera)** | `env_container`, `seeder_lifecycle`, `cicd`, `release_ops` | Preparado para seeders, changelog y release SemVer. |
```

*Estados Operativos Válidos:*
- 🟢 **CULMINADO / ENTREGADO:** Rol que completó su labor y validaciones con éxito.
- 🟡 **EN TURNO / ACTIVO:** Rol que actualmente asume la posta y ejecuta su fase.
- ⚪ **LISTO / EN ESPERA:** Rol a la expectativa de insumos en la cola del SDLC.
- 🔴 **BLOQUEADO (STOP-THE-LINE):** Rol detenido por veto de QA o feedback loop.

---

## 2. Reglas del Feedback Loop (Devolución de Tarea)
Si el agente receptor encuentra inconsistencias al procesar los insumos del agente anterior:

1. **NO modificar el artefacto del agente emisor directamente.**
2. Crear un bloque de devolución:
   ```markdown
   > ⚠️ **SOLICITUD DE CORRECCIÓN (FEEDBACK LOOP)**
   > **De:** Software Architect Agent
   > **Para:** Product Manager Agent
   > **Motivo:** En la Historia de Usuario HU-11-04 (Cierre de Periodo) no se especifica qué ocurre con los estudiantes que tienen actividades pendientes de recuperación.
   > **Acción requerida:** Aclarar la regla de negocio antes de definir la transacción DDL.
   ```
3. El Orquestador reactiva temporalmente al agente emisor para resolver la aclaración.

---

## 3. Matriz de Firmas de Aprobación (Stage-Gates)

| Gate | Fase Origen -> Destino | Aprobador Requerido | Condición de Desbloqueo |
| :--- | :--- | :--- | :--- |
| **Gate 1** | Requerimientos -> Arquitectura | **Director Humano** | PRD completo con todas las HUs y reglas de negocio firmadas. Detención obligatoria del agente. |
| **Gate 2** | Arquitectura -> Backend | **Director Humano** | DDL de tablas, contratos de API Zod y matriz RBAC revisados. Detención obligatoria del agente. |
| **Fase 3A**| Backend -> Frontend | **Orquestador** | Endpoints implementados con Kysely y contratos Zod. Pase continuo sin detención. |
| **Gate 3B**| Frontend -> QA | **Director Humano** | Vistas y componentes SPA listos en Core Base Kit. Revisión obligatoria del diseño web UI/UX. Detención del agente. |
| **Gate 4** | QA -> Release / Despliegue | **Director Humano** | Dictamen `PASS` del QA Lead en `docs/qa/[XX_modulo]/[vX.Y.Z]/QA_REPORT.md` (0 defectos S1/S2) y actualización en `docs/VERSION_MATRIX.md`. Detención obligatoria del agente. |


> 📌 **Implementación y Estado Operativo:**  
> Consulta el protocolo vinculante en [`.workflow/STAGE_GATES.md`](file:///c:/Users/alejo/Downloads/tryIt/.workflow/STAGE_GATES.md) y la máquina de estados en tiempo real en [`.workflow/current_state.json`](file:///c:/Users/alejo/Downloads/tryIt/.workflow/current_state.json).

