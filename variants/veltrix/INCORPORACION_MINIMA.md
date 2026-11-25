# Ensayo de incorporación del SDLC a VELTRIX

El 24 de noviembre de 2026 se probó la consulta del flujo en una copia
aislada de VELTRIX, usando `3b2efae05a6e7653bd0147d1f70f9812da32556f` como
referencia. Esa revisión incluye el refinamiento local de `HU-BUZ-004`.
La prueba representa la incorporación de un módulo existente y conserva
la ficha actual como punto de entrada.

## Alcance probado

- Copia de la revisión indicada, con la
  [configuración de ejemplo](project.example.json), catálogo de compuertas,
  perfiles y herramientas de lectura y validación del starter.
- Pistas de ensayo para el proyecto y `buzon` en G1, ambas bloqueadas y con
  historial de transiciones vacío. El perfil y el modo secuencial figuran
  sin confirmar.
- La prueba usó el modo secuencial. El catálogo de ejecución orquestada
  quedó fuera porque requiere incorporar los subroles que referencia.

## Resultados

| Comprobación | Resultado |
| --- | --- |
| `node tooling/validate-state.mjs` | Estado válido con un módulo y avisos de carpetas. |
| `node tooling/status.mjs` | Muestra `buzon` en G1, su estado bloqueado y el motivo. |
| `node tooling/status.mjs buzon` | Presenta el plan de compuertas. En G1 todavía usa las descripciones de plantilla. |
| Comprobación de rutas de G1 con `missingDeliverables` | Reconoce las historias y reglas existentes. Señala que faltan la SRS de caducidad y el documento de flujo y estados en la copia. |

La SRS de caducidad sigue en el borrador local de Producto. Antes de
incorporar el flujo hay que decidir si participa en el alcance formal de
G1 o si la adopción de Buzón se limita al comportamiento ya implementado.
También queda revisar la especificación ATDD según el perfil elegido.
La validación estructural de las pistas no equivale a aprobar G1.

## Hallazgos del primer ensayo

1. Hacer que el resumen de G1 muestre las rutas canónicas y sus faltantes.
   Hoy la validación de rutas resuelve los archivos de VELTRIX y el resumen
   todavía nombra `01_SPEC_FUNCIONAL.md` y `02_HISTORIAS_USUARIO.md`.
2. Resolver el mapeo de código para distinguir el ID `buzon` de las
   carpetas `hub/src/modules/echo/` y `web/src/features/notes/`. Los
   avisos del ensayo también incluyen las otras funciones aún por adoptar.
3. Delimitar la incorporación de los comandos y los documentos de gobierno.
   Mantener la configuración de producto en VELTRIX. Registrar las
   decisiones de perfil y de línea base antes de habilitar transiciones.

## Ajustes al alcance de G1

El resumen de `buzon` muestra ahora las rutas canónicas y su presencia.
La configuración asocia `echo` al backend y `notes` al frontend de Buzón.
Las demás carpetas siguen apareciendo como funciones por adoptar.

La incorporación de G1 se limita al Buzón implementado. El nuevo
`flujo_estados.md` documenta ese alcance. La SRS de caducidad no forma
parte de este grupo de entregables. Queda la revisión de Producto y de
ATDD que exige el perfil, además de configurar la línea base y la activación.

En la segunda ejecución, la validación reconoció `echo` y `notes` y el
resumen mostró reglas, historias y flujo como presentes. La pista siguió
bloqueada en G1.

El ensayo no escribió archivos del flujo en el checkout de VELTRIX.
Las pruebas de la aplicación y la aprobación del corte de ECHO están
documentadas en la ficha del módulo. Las compuertas del SDLC conservan
su revisión propia.

## Incorporación de consulta en VELTRIX

Después del ensayo, se incorporaron los comandos `status` y
`validate:state` en la rama local `codex/sdlc-pilot` de VELTRIX.
El estado de proyecto y módulo queda en G1 bloqueada. Se comprobó que el
resumen de Buzón encuentra sus tres documentos canónicos y la validación
acepta ambos estados. El producto conserva un registro de procedencia
con las huellas de los archivos copiados. Los avisos restantes
corresponden a otras funciones de VELTRIX aún por incorporar.
