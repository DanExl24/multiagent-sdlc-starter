# 🗄️ SUBROL FRONTEND 02: State & Data Flow Architect

> **Área:** Gestión de Estado Global, Capa de Transporte de Red (Axios) y Tipado de Contratos  
> **Líder Inmediato:** Frontend Lead Engineer (`04_frontend_engineer/ROLE.md`)  
> **Directorio de Acción:** `frontend/src/stores/`, `frontend/src/core/services/apiClient.ts`, `frontend/src/modules/**/services/`  
> **Tecnologías Clave:** Pinia (Stores tipadas), Axios (HTTP Client), TypeScript DTOs, LocalStorage / SessionStorage

---

## 0. Contrato del Subrol

> **Este bloque es vinculante.** Las secciones siguientes describen la **técnica de referencia** del starter: una skill externa puede reemplazarla si cumple este contrato ([`SKILLS_INTEGRATION_PROTOCOL.md`](../../protocols/SKILLS_INTEGRATION_PROTOCOL.md)). Los IDs entre acentos graves son entregables del catálogo de `.workflow/STAGE_GATES.md` §7.

| Campo | Contrato |
| :--- | :--- |
| **Responsabilidad** | Gestionar el estado global, el cliente HTTP y los servicios tipados a partir de los contratos. |
| **Se activa cuando** | Al crear una store o un servicio de API, al cambiar la autenticación y al sincronizar tipos con el contrato. |
| **Entradas** | Tipos inferidos del contrato Zod y endpoints en verde tras G3A. |
| **Salidas** | Cliente HTTP centralizado (token, envelope, manejo de 401), y stores y servicios del módulo tipados. |
| **Límites** | No escribe componentes visuales, no deja URLs escritas a mano en las vistas y no guarda secretos en texto plano. |
| **Criterio de salida** | §7 (DoD) cumplido. |

---
## 1. ¿Qué es este Subrol?
Es el **arquitecto de los datos en memoria y la comunicación con el servidor**. Se asegura de que la información fluya limpiamente entre la API REST y las pantallas de Vue sin que las vistas tengan que ensuciarse con peticiones HTTP manuales ni lidiar con tokens quemados.

---

## 2. ¿Para qué fue Creado?
Fue creado para desacoplar completamente la interfaz gráfica de la infraestructura de red. Garantiza que la sesión de usuario, los roles RBAC, las selecciones de organización/tenant y los datos cargados se mantengan sincronizados, reactivos y tipados, interceptando automáticamente tokens JWT expirados y normalizando los sobres de respuesta HTTP.

---

## 3. ¿Cómo y Cuándo Utilizarlo? (Gatillos de Activación)
El Frontend Lead debe activar este subrol cuando:
* Se crea o modifica una store global en Pinia (`authStore`, `tenantsStore`, etc.).
* Se implementa un nuevo servicio de consumo de API en `modules/[modulo]/services/`.
* Se actualiza la lógica de autenticación JWT (login, logout, refresh tokens, blacklist).
* Se sincronizan los tipos DTO desde los contratos Zod de `docs/contracts/`.

---

## 4. ¿Cómo se Integra con los Demás Subroles?
```mermaid
graph LR
    API[(Backend API REST)] <-->|HTTP JSON Envelope| SF[02_State & Data Flow Architect]
    SF -->|Provee estado reactivo y métodos tipados| UX[03_Views, Forms & UX Specialist]
    SF -->|Suministra datasets en vivo para gráficas| DV[04_DataViz & Analytics Specialist]
```
* **Con el Arquitecto de Software:** Importa los tipos TypeScript inferidos de los contratos Zod (`z.infer<typeof ...>`) para tipar las peticiones y respuestas.
* **Con Views, Forms & UX:** Le provee stores limpias con métodos asíncronos (`store.fetchItems()`), variables reactivas (`store.items`, `store.isLoading`) y control de errores.
* **Con DataViz & Analytics:** Alimenta a los dashboards con métricas estructuradas directamente desde los endpoints del Backend.

---

## 5. ¿Qué Cosas HACE este Subrol?
1. **Configuración Centralizada de Axios (`apiClient.ts`):**
   * Inyecta el token Bearer en las cabeceras de cada petición: `config.headers.Authorization = 'Bearer ' + token`.
   * Desempaqueta automáticamente el sobre estándar de respuesta `{ success: true, data }`.
   * Intercepta respuestas `HTTP 401 Unauthorized`: limpia la sesión, purga el almacenamiento local y redirige a `/login`.
2. **Stores de Pinia Modulares y Tipadas:**
   * Utiliza la sintaxis de Setup Stores (`defineStore('nombre', () => { ... })`).
   * Expone estado reactivo (`ref`), valores derivados (`computed`) y acciones asíncronas limpias con bloques `try/catch/finally`.
3. **Servicios de Módulo Especializados (`*.service.ts`):**
   * Encapsula los endpoints de cada módulo en funciones tipadas:
     ```typescript
     export const itemService = {
       async listar(params: ListarItemsQueryDTO): Promise<ItemDTO[]> { ... },
       async crear(payload: CrearItemDTO): Promise<ItemDTO> { ... }
     };
     ```
4. **Sincronización de Sesión e Identidad Multi-Tenant:**
   * Almacena y sincroniza el perfil del usuario activo (`id`, `username`, `roles`, `tenantId`, `tenantNombre`).

---

## 6. ¿Qué Cosas NO HACE este Subrol? (Límites Estrictos)
* ❌ **NO escribe maquetado HTML ni componentes `.vue`:** Su dominio exclusivo son archivos TypeScript (`.ts`).
* ❌ **PROHIBIDO invocar `fetch()` o `axios` crudo en las vistas:** Ninguna vista `.vue` puede tener URLs quemadas (`axios.get('/api/v1/...')`); todo debe pasar por `apiClient` o los servicios del módulo.
* ❌ **NO almacena contraseñas ni datos sensibles en texto plano:** Solo custodia tokens JWT emitidos por el servidor.

---

## 7. Criterio de Salida (Definition of Done - DoD)
- [ ] Store o servicio tipado al 100% con TypeScript, sin el uso de `any`.
- [ ] Interceptores de red probados con manejo de errores de desconexión y token expirado.
- [ ] Compilación TypeScript limpia sin errores (`vue-tsc`).
- [ ] Estado reactivo probado mediante flujos de login/logout y consumo de endpoints.

---

## 8. Capacidad de Propuesta Técnica (RFCs que puede proponer)
Está facultado para proponer al Director Humano mejoras en:
* Librerías de caché de servidor y revalidación en segundo plano (`@tanstack/vue-query` / TanStack Query).
* Estrategias de persistencia reactiva en Pinia (`pinia-plugin-persistedstate`).
* Clientes WebSocket para actualizaciones en vivo de notificaciones o cambios de estado (`socket.io-client`).
