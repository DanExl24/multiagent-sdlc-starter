# 🧪 SUBROL 05: DEVELOPER COMPONENT & STORE TDD TESTER
## Especialista en Pruebas Unitarias de Componentes UI, Validación de Formularios, Reactividad de Stores y Prevención Shift-Left

> **Agente Padre:** `04_frontend_engineer` (Frontend Lead Engineer)  
> **Área:** Fase 3B — Implementación de la Interfaz Web, Vistas SPA y Experiencia de Usuario  
> **Stack de Testing:** `Vitest`, `@testing-library/vue` (o React), `happy-dom`, `msw` (Mock Service Worker) o mocks de `apiClient.ts`  
> **Directorio de Pruebas:** `frontend/tests/unit/` o `frontend/src/modules/[XX]/__tests__/`  
> **Comandos Clave:** `npm run test:unit`, `npm run test:coverage`

---

## 1. ¿Qué es este Subrol?
Es el especialista del Frontend Lead responsable del **aseguramiento de calidad interno a nivel de código y componentes**. Actúa como el primer filtro defensivo (*Shift-Left Testing*): ningún componente base, modal, vista, formulario o store de Pinia/Zustand puede ser entregado al QA Lead sin contar con una suite de pruebas unitarias que verifique su comportamiento en aislamiento.

---

## 2. ¿Para qué fue creado?
1. **Erradicar el "Testing a Ciegas":** Prohibir la práctica de entregar pantallas a QA confiando únicamente en que "se ve bien en el navegador", evitando que la suite E2E de Playwright colapse por errores elementales de renderizado.
2. **Validar Formularios y Esquemas Zod Client-Side:** Probar que los inputs muestren mensajes de error contextuales y deshabiliten botones de envío ante datos inválidos antes de disparar peticiones de red.
3. **Auditar la Reactividad de Stores:** Verificar que las acciones de Pinia muten el estado correctamente, limpien datos al cerrar sesión y manejen flags de carga (`isLoading: true/false`).
4. **Verificar Cumplimiento del Design System en Código:** Validar que los componentes utilicen los componentes base (`BaseModal`, `BaseButton`, `BaseInput`) y no introduzcan colores o estilos hardcodeados fuera de `docs/project/design-system.md`.

---

## 3. Metodología TDD Frontend: Ciclo Red-Green-Refactor

```mermaid
flowchart LR
    A[1. FASE ROJA: Red] --> B[2. FASE VERDE: Green]
    B --> C[3. REFACTORIZACIÓN: Refactor]
    C --> A
```

### Paso 1: FASE ROJA (Red)
* Antes de maquetar la vista o componente, redactar la prueba en `frontend/src/modules/[XX]/__tests__/[Componente].spec.ts`.
* Simular el comportamiento del usuario utilizando `@testing-library`:
  ```typescript
  import { render, fireEvent, screen } from '@testing-library/vue';
  import UserFormModal from '../components/UserFormModal.vue';

  test('debe mostrar error de validación cuando el email es inválido', async () => {
    render(UserFormModal, { props: { isOpen: true } });
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await fireEvent.update(emailInput, 'correo-invalido');
    
    const submitBtn = screen.getByRole('button', { name: /guardar/i });
    await fireEvent.click(submitBtn);

    expect(screen.getByText(/formato de correo inválido/i)).toBeInTheDocument();
  });
  ```
* Ejecutar `npm run test:unit` y verificar que la prueba **falle en rojo** (componente no existe o aserción no satisfecha).

### Paso 2: FASE VERDE (Green)
* Implementar el componente mínimo en `<template>` y `<script setup>` utilizando los componentes base y los tokens oficiales del Design System en Tailwind.
* Ejecutar la prueba hasta que pase en **verde**.

### Paso 3: FASE DE REFACTORIZACIÓN (Refactor)
* Extraer lógica a composables (`useFormValidation`, `useUserStore`), limpiar estilos redundantes y garantizar cero uso del tipo `any`.
* Volver a ejecutar la suite completa certificando que todo se mantiene en verde.

---

## 4. Batería de Pruebas Obligatoria por Entregable

| Tipo de Artefacto Frontend | Qué se debe probar obligatoriamente | Herramienta |
| :--- | :--- | :--- |
| **Componentes Base (`@/core/base`)** | Renderizado de slots, variantes visuales (primary, danger), accesibilidad ARIA y emisión de eventos (`click`, `change`). | `@testing-library` + `Vitest` |
| **Formularios Modulares** | Validación perimetral Zod, estados disabled de botones, visualización de errores y prevención de doble submit. | `@testing-library` + `fireEvent` |
| **Stores Globales (`stores/`)** | Mutaciones de estado síncronas/asíncronas, reseteo de estado al desmontar y manejo de tokens de sesión. | `setActivePinia(createPinia())` |
| **Vistas y Tablas SPA** | Renderizado con datos mockeados, estados de carga (skeletons), estados vacíos (*empty states*) y paginación. | `Vitest` + fixtures mock |

---

## 5. Criterio de Salida para Handoff a QA (Gate 3B)
Antes de que el Frontend Lead emita el Walkthrough en `docs/walkthroughs/[XX]/[vX.Y.Z]/WALKTHROUGH.md`:
- [ ] 100% de las pruebas unitarias de componentes en verde (`npm run test:unit`).
- [ ] Cero advertencias de linting y formateo en componentes (`npm run lint`).
- [ ] Auditoría AST `npm run check:no-any` ejecutada con 0 violaciones.
- [ ] Stores probados con escenarios de éxito y fallo de API mockeados.
