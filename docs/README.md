# 📚 Documentación del Proyecto — Índice Maestro

> Punto de entrada a la documentación para **personas y agentes de IA**. La gobernanza (reglas, roles y fuentes de verdad) está en [`AGENTS.md`](../AGENTS.md); esta carpeta contiene los artefactos que el equipo va produciendo.

## Cómo navegar (divulgación progresiva)

1. Empieza aquí y elige el área que necesitas.
2. Si trabajas en un módulo, abre el `README.md` de su carpeta en `modules/` y carga solo los archivos que tu rol necesita. Los módulos se crean con `npm run new:module`.
3. No cargues toda la documentación a la vez: cada archivo cubre una sola responsabilidad.
4. Ante un término de negocio dudoso, consulta [`project/glossary.md`](project/glossary.md) antes de nombrar entidades, campos o estados.

## Mapa de la documentación

| Carpeta | Contenido | Naturaleza | Rol responsable |
| :--- | :--- | :--- | :--- |
| [`project/`](project/) | PRD, arquitectura global, estructura del repositorio, design system, matriz de versiones y glosario del dominio | **Vivo**: se edita; cambia poco | Producto, Arquitectura y Frontend |
| [`modules/`](modules/) | Todo lo específico de un módulo: especificación, historias, flujos y arquitectura | **Vivo** durante el módulo | Producto y Arquitectura |
| [`contracts/`](contracts/) | Contratos de API tipados con Zod (`*.contract.ts`) | **Vivo**; lo consumen las herramientas | Arquitectura |
| [`adrs/`](adrs/) | Decisiones de arquitectura, una por archivo y numeradas | **Inmutable** (se añaden, no se reescriben) | Arquitectura |
| [`qa/`](qa/) | Panel consolidado (`index.md`) y reportes forenses por módulo y versión | **Inmutable** por versión; los reportes generados no se editan | QA |
| [`walkthroughs/`](walkthroughs/) | Guías de verificación reproducibles por módulo y versión | **Inmutable** por versión | Backend y Frontend |
| [`quality/`](quality/) | Planes de mejora continua (Kaizen) | **Inmutable** por versión | DevOps y QA |

## Principios de esta estructura

- **Lo transversal vive aparte de lo de cada módulo.** Los documentos de `project/` no acumulan detalle de módulos: las historias, el DDL y las reglas específicas viven en `modules/`.
- **Una responsabilidad por archivo.** Si un documento empieza a crecer en temas distintos, se divide.
- **Los módulos enlazan, no copian.** El contrato de un módulo vive en `contracts/` y sus decisiones en `adrs/`; la carpeta del módulo los referencia.
- **Rutas verificadas.** `npm run check:docs` falla si un documento menciona una ruta de `docs/` que no existe o si un enlace no es relativo.
- **Tamaño acotado.** `check:docs` avisa cuando un documento de `docs/` supera las 400 líneas (300 en los `ROLE.md` y subroles): es la señal para dividirlo.

## Encabezado estándar

Los documentos de `project/`, `modules/`, el panel `qa/index.md` y las plantillas de módulo abren con un bloque de cita que incluye, como mínimo, estos campos. `check:docs` los exige.

```markdown
> **Responsable:** Rol dueño del documento (Fase N)
> **Estado:** BORRADOR | PENDIENTE DE APROBACIÓN (Stage-Gate GN) | APROBADO | VIGENTE | ...
> **Naturaleza:** Vivo | Inmutable (con una aclaración breve si hace falta)
> **Última revisión:** AAAA-MM-DD
```

- **Vivo:** se edita en el sitio; cada cambio relevante actualiza "Última revisión".
- **Inmutable:** una vez publicado no se reescribe; las correcciones se añaden como un documento o versión nueva.
- Se pueden añadir otros campos (Proyecto, Módulo, Versión...), pero los cuatro anteriores no se renombran.
