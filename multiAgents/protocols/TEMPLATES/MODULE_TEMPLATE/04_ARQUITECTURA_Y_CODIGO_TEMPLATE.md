# 🛠️ PLANTILLA: 04_ARQUITECTURA_Y_CODIGO — [Nombre del Módulo]

> **Módulo:** [XX. Nombre del Módulo]  
> **Responsable:** Software Architect Lead  
> **Consumidores:** Backend Lead Engineer & Frontend Lead Engineer  
> **Estado:** [BORRADOR / REVISIÓN / APROBADO]  
> **Naturaleza:** Vivo (cambios estructurales tras G2 requieren ADR)  
> **Última revisión:** [AAAA-MM-DD]  

---

## 1. Modelo de Datos y Tablas SQL Afectadas

### Tablas Principales:
- `tabla_principal`: [Descripción y propósito]
- `tabla_detalle`: [Descripción y propósito]

### Fragmento DDL / Relaciones:
```sql
-- Definición referencial de tablas para este módulo (PostgreSQL 16+)
CREATE TABLE IF NOT EXISTS modulo_entidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modulo_entidad_tenant ON modulo_entidad(tenant_id, estado);
```

---

## 2. Contratos de API REST y Validaciones Zod

- **Contrato Principal:** `docs/contracts/XX_[modulo].contract.ts`
- **Endpoints Expuestos:**
  - `GET /api/v1/[modulo]`: Lista de elementos con paginación y filtro por tenant.
  - `POST /api/v1/[modulo]`: Creación validada con esquema Zod (Envelope `{ success, data }`).
  - `PUT /api/v1/[modulo]/:id`: Actualización de estado validada.

---

## 3. 🗺️ Mapa de Trazabilidad e Implementación de Código (Rutas Canónicas)

> **⚠️ Guía para Backend y Frontend:** Los siguientes archivos son la ubicación oficial de cada artefacto de código para este módulo. **NO crear archivos en rutas dispersas ni usar `any`.**

### A. Capa de Contratos y Tipos Compartidos
- **Contrato Zod:** `docs/contracts/XX_[modulo].contract.ts`
- **Tipos de Base de Datos:** `backend/src/core/db/types.ts`
- **Interfaces TypeScript del Módulo:** `backend/src/modules/XX_[modulo]/types.ts`

### B. Capa Backend (Node.js + Express + Kysely / ORM)
- **Enrutador:** `backend/src/modules/XX_[modulo]/[modulo].routes.ts`
- **Controlador:** `backend/src/modules/XX_[modulo]/[modulo].controller.ts`
- **Servicio de Dominio:** `backend/src/modules/XX_[modulo]/[modulo].service.ts`
- **Validadores de Entrada:** `backend/src/modules/XX_[modulo]/[modulo].schema.ts`

### C. Capa Frontend (SPA Vue 3 / React + Pinia / Redux + Tailwind)
- **Vista Principal:** `frontend/src/modules/XX_[modulo]/views/[Modulo]View.vue`
- **Componentes Específicos:**
  - `frontend/src/modules/XX_[modulo]/components/[Modulo]Table.vue`
  - `frontend/src/modules/XX_[modulo]/components/[Modulo]Modal.vue`
- **Store Reactivo:** `frontend/src/modules/XX_[modulo]/stores/[modulo]Store.ts`
- **Cliente HTTP (Service):** `frontend/src/modules/XX_[modulo]/services/[modulo]Service.ts`

### D. Pruebas
- **Rutas reales de las pruebas:** en la tabla "Pruebas del módulo" del índice del módulo (`README.md`), que cada rol completa al crear sus suites. La ubicación general la fija `docs/project/repo-structure.md`; este documento no las repite.
- **Guía de Verificación Interactiva:** `docs/walkthroughs/XX_[modulo]/[vX.Y.Z]/WALKTHROUGH.md`
