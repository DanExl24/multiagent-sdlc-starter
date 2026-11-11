# 🎨 Sistema de Diseño Institucional y Especificación de UI (Design System)

> **Proyecto:** `{{PROJECT_NAME}}`  
> **Versión:** 1.0.0  
> **Responsable:** Frontend Lead Engineer & UI/UX Specialist (Fase 3B)  
> **Estado:** PENDIENTE DE APROBACIÓN (Stage-Gate G3B)  

---

## 1. Filosofía de Diseño: Modo Blanco Institucional
- **Claridad, Densidad y Pulcritud:** La interfaz prioriza el fondo blanco/gris ultra claro (`bg-slate-50`, `bg-white`) para garantizar alta legibilidad en jornadas operativas prolongadas.
- **Cero Colores Hardcodeados:** Todos los estilos deben emplear tokens semánticos del sistema. Queda prohibido el uso arbitrario de valores hexadecimales aislados.
- **Accesibilidad Innegociable (WCAG 2.1 AA):** Ratios de contraste superiores a 4.5:1 para texto normal y soporte de navegación por teclado.

---

## 2. Paleta Oficial de Tokens Semánticos

| Token Semántico | Clase Tailwind Recomendada | Propósito / Uso |
| :--- | :--- | :--- |
| **Primary (Marca / Acción Principal)** | `bg-blue-600 hover:bg-blue-700 text-white` | Botones de acción primaria, tabs activos, enlaces clave |
| **Secondary (Acción Secundaria)** | `bg-slate-100 hover:bg-slate-200 text-slate-700` | Botones secundarios, filtros, cancelaciones |
| **Success (Éxito / Aprobado)** | `bg-emerald-50 text-emerald-700 border-emerald-200` | Badges de éxito, alertas positivas |
| **Warning (Alerta / En Revisión)** | `bg-amber-50 text-amber-700 border-amber-200` | Estados pendientes o advertencias no bloqueantes |
| **Danger (Error / Bloqueo)** | `bg-rose-50 text-rose-700 border-rose-200` | Errores de validación, acciones destructivas |
| **Neutral Surface (Superficies)** | `bg-white border-slate-200 shadow-sm` | Tarjetas, contenedores, modales |
| **Background (Fondo General)** | `bg-slate-50 text-slate-800` | Fondo general de la aplicación |

---

## 3. Catálogo de Componentes Canónicos
Todos los formularios y vistas deben componerse a partir de componentes base probados:
1. `BaseButton`: Botón accesible con estados `loading`, `disabled` y variantes semánticas.
2. `BaseInput` / `BaseSelect`: Entradas con label, helper text y mensajes de error asociados a accesibilidad (`aria-describedby`).
3. `BaseModal`: Ventana modal con atrapamiento de foco (`focus trap`), cierre con tecla Escape y backdrop desenfocado (`backdrop-blur-sm`).
4. `BaseTable`: Tabla de datos con paginación, ordenamiento y estados vacíos (*Empty States*) ilustrados.
5. `BaseBadge`: Etiquetas de estado con colores estandarizados.

---

## 4. Visualización de Datos y Dashboards
- Las gráficas analíticas se implementan con librerías reactivas profesionales (ej. Apache ECharts).
- Toda gráfica debe ser responsiva (`resize` automático en cambios de viewport) y contar con tooltips interactivos accesibles.
