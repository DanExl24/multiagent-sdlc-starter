# Contrato de integración: historias de Buzón

Estado: preparado para el piloto; integración desactivada.

Este contrato delimita la técnica opcional. Se aplicará tras adaptar las rutas
del subrol y las compuertas al producto. No sustituye las reglas del
[protocolo de skills externas](../../multiAgents/protocols/SKILLS_INTEGRATION_PROTOCOL.md).

| Campo | Contrato para VELTRIX |
| --- | --- |
| Responsable | Producto, subrol de requisitos e historias. |
| Activación | Tarea documental acotada, con alcance y fuentes identificados. |
| Fuentes | Ficha de Buzón, historias, reglas, decisiones, código y pruebas de la misma revisión. Consultar especificación y trazabilidad cuando correspondan al alcance. |
| Técnica opcional | `product:user-stories`, con sus estándares y referencias del plugin completo. |
| Alternativa | Técnica de historias INVEST y criterios BDD del subrol del starter. |
| Salida | El archivo existente de historias indicado por `artefacto_salida` en el manifiesto; no un backlog paralelo. |
| Identidad | Conservar IDs `HU-BUZ`, `CA`, `RN`, `PRE`, `SUP` y enlaces existentes. |
| Criterio de salida | Historias del corte con actor, capacidad, beneficio, criterios observables Given/When/Then, reglas, dependencias y preparación respaldada por evidencia. |
| Límites | No implementar código, resolver decisiones pendientes por suposición, alterar estados formales ni conceder aprobaciones. |

## Uso con skill

1. Resolver el archivo canónico desde el manifiesto y leer sus fuentes vigentes.
2. Verificar disponibilidad del plugin completo y registrar versión y commit.
3. Aplicar la skill al corte acordado conservando las convenciones del producto.
4. Revisar el entregable contra este contrato y el contrato adaptado del subrol.
5. Registrar técnica, fuentes, salida, limitaciones y desviaciones en la bitácora.

El agente responsable usa la skill como técnica dentro de su turno. Sus handoffs
son recomendaciones: no invoca automáticamente `fullstack:feature` u otras
etapas. El flujo determina el relevo y sus aprobaciones.

## Uso sin skill

Aplicar la técnica propia del subrol a las mismas fuentes y al mismo corte.
Entregar en el mismo archivo, preservando IDs y cumpliendo el mismo criterio
de salida. La falta del kit no bloquea por sí sola la tarea.

## Contexto y bloqueos

Las anotaciones de la skill en `.sdlc/context.md` deben enlazar el estado formal
cuando exista. No pueden declarar una aprobación que el flujo no registra.
Las preguntas y supuestos pendientes conservan sus IDs, fuentes y estado.

La auditoría registrada de caducidad de notas mantiene el incremento bloqueado.
El ejercicio puede revisar sus historias, pero no habilita su implementación.

## Comparación de las dos técnicas

Usar la misma revisión de VELTRIX y el mismo encargo en dos chats independientes.
Cada pasada entrega la sección refinada completa e identifica el archivo canónico,
las fuentes y la técnica usada. En modo de solo lectura, ambos chats pueden
consultar el mismo checkout usando `git show <SHA>:<ruta>`. Si el ejercicio
requiere escribir archivos, usar copias limpias e independientes.

### Reglas de revisión para las dos pasadas

- Fijar el SHA de referencia y registrar qué archivos se consultaron en esa
  revisión. Antes de escribir, comprobar que la carpeta está limpia y que
  corresponde a la pasada asignada.
- Contrastar la redacción con las reglas canónicas y el comportamiento de esa
  revisión. Documentar el comportamiento acreditado como vigente. Registrar
  como pendiente una decisión nueva, una discrepancia entre fuentes o una
  comprobación que falte. Diferenciar cada caso y citar su origen.
- Escribir precondiciones suficientes para que cada resultado sea cierto.
  Distinguir el éxito de una operación, el resultado visible y su persistencia.
  Cuando el resultado depende de una condición, cubrir la condición aplicable.
- Para auditar, colocar la sección recibida en una copia de la revisión base
  y generar el diff con Git. Comprobar que solo cambia la historia asignada
  y que conserva los IDs y enlaces vigentes. Registrar por separado el nivel
  de verificación de almacén, API e interfaz.

Para `HU-BUZ-004`, `RN-BUZ-002` y `RN-BUZ-005` ya fijan el orden
`pinned DESC, id DESC` y un máximo de 30 resultados. Con más de 30 ancladas,
el listado devuelve las 30 de mayor ID. Un cambio en ese orden corresponde a
una decisión de Producto. Describir la migración solo para el esquema legado
que la requiere y comprobar por separado la conservación de `pinned` al
reabrir la base. Distinguir también el éxito del anclaje del éxito de la
recarga de la interfaz.

### Resultado del ejercicio de HU-BUZ-004

El 24 de noviembre de 2026, Gemini refinó la misma historia en dos sesiones
de solo lectura sobre `5948ba8`. Ambas técnicas conservaron el ID y los enlaces
y produjeron criterios comprobables. El diff entregado con `product:user-stories`
pasó `git apply --check`. El diff entregado con la técnica propia falló por
cabecera y contexto, incluso al recalcular la cabecera. Su contenido aportó un
borrador útil y confundió algunos supuestos al describir la migración.

Se eligió la pasada con skill para este caso. Se corrigió la visibilidad de la
nota dentro del límite del listado y el resultado quedó en el commit local
`3b2efae05a6e7653bd0147d1f70f9812da32556f` de VELTRIX
(`codex/echo-historias-a`). La comparación valida el uso opcional de la skill
para este ejercicio. El resultado corresponde a una historia y la incorporación
del SDLC sigue pendiente.
