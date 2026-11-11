# 📖 Glosario del Dominio (Lenguaje Ubicuo)

> **Proyecto:** `{{PROJECT_NAME}}`  
> **Dominio:** `{{PROJECT_DOMAIN}}`  
> **Responsable:** Product Manager Lead (Fase 1), con aportes de Arquitectura  
> **Naturaleza:** Vivo. Se amplía en cada módulo; un término no se redefine sin avisar a los roles que lo usan.

Un término de negocio significa **lo mismo** en el PRD, en las historias, en los contratos Zod, en la base de datos y en la interfaz. Si dos personas o agentes usan palabras distintas para lo mismo, o la misma palabra para cosas distintas, el término se fija aquí antes de seguir.

---

## Cómo usar este glosario

1. **Antes de nombrar** una entidad, campo, estado o endpoint, busca el término aquí.
2. **Si no existe**, añádelo en la misma tarea en que lo introduces.
3. **El nombre técnico es obligatorio:** contratos, tablas y código usan exactamente el identificador de la columna "Nombre técnico".
4. **Un término por fila.** Los sinónimos prohibidos se listan para que nadie los reintroduzca.

---

## Términos

| Término | Nombre técnico | Definición | Sinónimos prohibidos | Módulo dueño |
| :--- | :--- | :--- | :--- | :--- |
| [Término de negocio] | `[nombreEnCodigo]` / `[nombre_en_tabla]` | [Qué es, en una o dos frases, sin usar el propio término] | [Palabras que no deben usarse para esto] | [XX_modulo] |

---

## Estados de negocio

Los estados que aparecen en máquinas de estado (`03_FLUJO_Y_ESTADOS.md`) se registran aquí con su significado y si son terminales. Un estado terminal no admite transiciones de salida y se protege con HTTP 403 / 409 (ver `AGENTS.md` §6).

| Estado | Entidad | Significado | ¿Terminal? |
| :--- | :--- | :--- | :---: |
| `[ESTADO]` | [Entidad] | [Qué implica para el negocio] | [Sí/No] |
