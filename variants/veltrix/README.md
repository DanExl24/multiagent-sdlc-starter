# Variante VELTRIX: preparación de la adopción

Estado: **preparación local**, 22 de noviembre de 2026.

Esta variante inicia la adaptación del starter a un producto existente. Todavía
no es un flujo instalable. No cambia los estados de la plantilla ni crea estados
en VELTRIX. La aceptación del diseño del piloto no es una firma de sus compuertas.

## Archivos de esta entrega

- [variant.json](variant.json): revisión de origen, componentes, artefactos reales,
  integración opcional y pendientes para incorporar el flujo.
- [project.example.json](project.example.json): configuración propuesta con las
  rutas de VELTRIX y sus comandos existentes. No se copia sobre un proyecto activo.
- [PRODUCT_STORIES.md](PRODUCT_STORIES.md): contrato de la primera integración.

Las rutas del manifiesto son relativas a la raíz de VELTRIX o del kit según el
campo. No son rutas del starter. La especificación de caducidad corresponde a un
incremento de Buzón, no acredita todo el módulo ni la evolución futura de ECHO.

## Comprobar el mapeo sin modificar VELTRIX

Desde la raíz de esta variante del starter:

```powershell
npm run inspect:veltrix -- --project-root C:/ruta/a/VELTRIX --kit-root C:/ruta/al/ai-agentic-audit-kit
```

`--kit-root` es opcional. Si falta, se informa la técnica propia del starter.
El inspector comprueba la existencia y el tipo de las rutas y muestra los
pendientes. No ejecuta las skills ni las pruebas del producto, no interpreta
sus documentos y no certifica compatibilidad o preparación para desarrollo.
Su salida identifica siempre el estado de preparación; un código 0 solo indica
que las fuentes obligatorias existen. No escribe archivos ni cambia estados.

## Decisiones de esta primera variante

1. Conservar los nombres e IDs actuales de Buzón y sus documentos canónicos.
2. Mantener hub y agente como componentes de backend distintos. El ejemplo usa
   `hub` para la capa del starter; el agente se registra en el manifiesto y se
   incluye en las verificaciones generales del proyecto. No se añade una capa
   `agent` que el tooling actual no reconoce.
3. Usar `shared` como ubicación actual de contratos. Esto requiere adaptar la
   comprobación del starter que espera un contrato Zod por módulo.
4. Mantener `standard` y ejecución secuencial como valores provisionales, sin
   confirmar el perfil ni completar fundación o herramientas artificialmente.
5. Empezar con una sola técnica externa, desactivada hasta validar su ejercicio.

El ejemplo conserva `hub/src/modules` como destino futuro, sin crear esa carpeta
ni acreditar que el código actual esté organizado así. Sus verificaciones son
un punto de partida: faltan los controles específicos que se acuerden en la
adaptación de compuertas, incluidos los del agente y las pruebas negativas.

## Incorporación posterior al producto

En VELTRIX, el flujo residirá en `.workflow/`, `multiAgents/` y `tooling/`, con un
`AGENTS.md` de entrada en la raíz. Se registrará la revisión del starter de origen.
El estado formal quedará en `.workflow/`; `.sdlc/context.md` conservará contexto
técnico y enlaces. Esas ubicaciones no se crean en esta entrega.

No ejecutar el inicializador general del starter directamente sobre VELTRIX:
antes hay que preparar una incorporación que preserve su configuración,
documentación, versión e historial. Tampoco ejecutar el generador de módulos
para sustituir Buzón: actualmente exige un ID numérico y genera documentos nuevos.

## Cómo G1 reconoce los documentos de Buzón

El ejemplo declara `buzon` en `modulos_existentes`. G1 cubre el Buzón
implementado y consulta sus reglas, historias, `flujo_estados.md` y
`01_ATDD_SPEC.md`.
`status buzon` muestra cada ruta canónica y si el archivo está presente.
El campo `codigo` vincula las carpetas directas por capa: `echo` en backend
y `notes` en frontend. El incremento de caducidad conserva su revisión
separada en Producto.

Cuando el perfil incluye `atdd_spec`, `gate solicitar` comprueba la ruta
configurada. Si falta, la solicitud se detiene. La revisión de contenido y
las firmas siguen el proceso de G1.

El [manifiesto](variant.json) registra el módulo existente como **ECHO — Buzón**.
`buzon` sigue siendo el ID de la pista propuesta y la ruta de documentación.
ECHO identifica el módulo en el código y Buzón sigue siendo el nombre de la
vista. El registro enlaza los commits y sus evidencias. Está en preparación y
no concede firmas de compuertas. Se comprobó la recuperación de contexto en
un chat nuevo y se compararon las dos técnicas de historias. El siguiente paso
es resolver los ajustes detectados en el
[ensayo de incorporación mínima](INCORPORACION_MINIMA.md). El resultado de
la comparación está en el [contrato de historias](PRODUCT_STORIES.md#resultado-del-ejercicio-de-hu-buz-004).

## Procedencia y publicación

La adaptación se mantiene en la rama `codex/veltrix-sdlc` del starter. El origen
del starter y el del plugin de Producto están fijados por commit en el manifiesto;
son las referencias para reproducir el piloto, no una certificación de versiones
posteriores ni de todas las skills del kit.

## Verificación de esta entrega

Ejecutada el 22 de noviembre de 2026 con Node.js 24.20.0:

- `npm test`: correcto, 38 pruebas del tooling aprobadas; sintaxis, contratos,
  estado de la plantilla y fuentes documentales también correctos.
- Inspector sobre el checkout local de VELTRIX, con y sin ruta al kit: los
  cuatro componentes y los cinco documentos obligatorios están presentes.
- Las cinco pruebas nuevas cubren conservación de archivos, alternativa sin kit,
  integración desactivada aunque el kit exista, errores de rutas y configuración
  de ejemplo válida sin inicializar ni confirmar el proyecto.

La inspección usa los archivos presentes en el checkout, incluidos documentos
locales aún sin commit. En esa primera inspección la ficha de Buzón estaba
pendiente. La inspección del 24 de noviembre confirmó que ya existe.
Estos resultados validan esta preparación y su inspector; no prueban los flujos
de usuario de VELTRIX ni habilitan la incorporación del SDLC.
