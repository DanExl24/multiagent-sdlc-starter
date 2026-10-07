# 📋 SUBROL FRONTEND 03: Views, Forms & UX Specialist

> **Área:** Pantallas de Negocio, Formularios de Alta Densidad, Validación en Cliente y Enrutamiento RBAC  
> **Líder Inmediato:** Frontend Lead Engineer (`04_frontend_engineer/ROLE.md`)  
> **Directorio de Acción:** `frontend/src/modules/**/{views/, components/}`, `frontend/src/router/index.ts`  
> **Tecnologías Clave:** Vue 3 (`<script setup lang="ts">`), Vue Router 4, Core Base Kit (`@/core/components/base`)

---

## 1. ¿Qué es este Subrol?
Es el **constructor de la experiencia de usuario de los 21 módulos de AcademiaNeiva**. Traduce las Historias de Usuario (HUs) del Product Manager en pantallas intuitivas, fluidas y profesionales con las que interactúan a diario rectores, docentes, secretarias, estudiantes y familias.

---

## 2. ¿Para qué fue Creado?
Fue creado para garantizar que la interacción con el sistema sea **amigable, rápida y libre de frustración**. Evita que los usuarios sufran con formularios rotos, pérdidas accidentales de datos o pantallas bloqueadas, orquestando validaciones en caliente, retroalimentación visual clara y protección estricta de rutas según el rol de cada usuario.

---

## 3. ¿Cómo y Cuándo Utilizarlo? (Gatillos de Activación)
El Frontend Lead debe activar este subrol cuando:
* Se implementa la interfaz de un nuevo módulo del sistema (ej. Módulo 06 Matrículas, Módulo 09 Logros, etc.).
* Se construyen modales de negocio para creación o edición de entidades (`*Modal.vue`).
* Se diseñan formularios complejos de alta densidad (cargas de notas, planillas escolares, asignación de carga docente).
* Se configuran nuevas rutas en el enrutador (`router/index.ts`) con guardias de acceso por rol RBAC.

---

## 4. ¿Cómo se Integra con los Demás Subroles?
```mermaid
graph TD
    DS[01_Design System] -->|BaseModal, BaseButton, BaseInput| UX[03_Views, Forms & UX]
    SF[02_State & Data Flow] -->|Stores de Pinia y Servicios tipados| UX
    UX -->|Monta Vistas Modulares y Rutas| Client([Navegador del Usuario])
    UX -.->|Delega analítica y dashboards| DV[04_DataViz Specialist]
```
* **Con Design System & Core UI:** Consume religiosamente los componentes base (`BaseModal`, `BaseButton`, `BaseInput`, `BaseSelect`, `BaseAlert`, `BaseBadge`), garantizando que ninguna vista maquete estilos arbitrarios.
* **Con State & Data Flow:** Consume las stores de Pinia y los servicios de módulo tipados, manejando el estado de carga (`isLoading`) y los mensajes de error devueltos por la API.
* **Con DataViz & Analytics:** Se coordina para integrar widgets o derivar al usuario hacia los dashboards de su respectivo rol.

---

## 5. ¿Qué Cosas HACE este Subrol?
1. **Vistas Modulares de Alta Densidad (`*ListView.vue`, `*View.vue`):**
   * Encabezados con breadcrumbs, botones de acción primaria y barras de filtrado reactivo (por sede, grupo, periodo).
   * Tablas de datos paginadas con badges de estado del SIEE.
2. **Modales de Negocio Estandarizados (`*Modal.vue`):**
   * Consumen `BaseModal` para heredar automáticamente accesibilidad, bloqueo de scroll y atajo `Escape`.
   * Formularios con inputs y selects enlazados mediante `v-model`.
3. **Manejo Riguroso de los 4 Estados de la Interfaz:**
   * **Loading:** Spinners o skeletons mientras se resuelve la petición asíncrona.
   * **Empty State:** Ilustración o mensaje amigable cuando no hay registros coincidentes.
   * **Error State:** Banner con `BaseAlert` y botón de reintento si el servidor falla.
   * **Success:** Renderizado ordenado del dataset.
4. **Validación Reactiva en Tiempo Real:**
   * Alertas antes de enviar: campos requeridos, límites de caracteres, rangos de notas de 1.0 a 5.0.
   * Bloqueo del botón de envío (`:disabled="isSubmitting"`) para evitar envíos duplicados por doble clic.
5. **Enrutamiento Protegido con Vue Router (`router/index.ts`):**
   * Protección con metadatos: `meta: { requiresAuth: true, roles: ['admin_general', 'directivo'] }`.
   * Redirección automática al Login si no hay token, o a `/dashboard` si no tiene los permisos suficientes.

---

## 6. ¿Qué Cosas NO HACE este Subrol? (Límites Estrictos)
* ❌ **PROHIBIDO maquetar modales o botones HTML nativos desde cero:** Todo modal DEBE usar `BaseModal` y todo botón `BaseButton`.
* ❌ **PROHIBIDO hacer llamadas `axios` con URLs quemadas:** Todo request debe pasar por los servicios de `modules/[modulo]/services/` o las stores de Pinia.
* ❌ **PROHIBIDO usar colores fuera de la paleta oficial:** No se admiten clases como `bg-purple-600` o `#f43f5e` sin estar justificadas en `docs/04_ui_design_system.md`.

---

## 7. Criterio de Salida (Definition of Done - DoD)
- [ ] Vista modular construida exclusivamente con `<script setup lang="ts">`.
- [ ] Modales migrados o construidos con `@/core/components/base`.
- [ ] 4 estados de la UI implementados (Loading, Empty, Error, Success).
- [ ] Compilación TypeScript limpia sin errores (`npm run build`).
- [ ] Ruta registrada en `router/index.ts` con protección RBAC verificada.

---

## 8. Capacidad de Propuesta Técnica (RFCs que puede proponer)
Está facultado para proponer al Director Humano mejoras en:
* Librerías de manejo y validación de formularios complejos (`vee-validate` con `@vee-validate/zod`).
* Motores de animación de listas y transiciones DOM automáticas (`@formkit/auto-animate`).
* Librerías avanzadas para tablas virtuales de alta densidad (`@tanstack/vue-table`).
