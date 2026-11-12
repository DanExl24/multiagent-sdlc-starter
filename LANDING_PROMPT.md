# 🚀 LANDING PROMPT — Prompt Canónico de Inicialización

> **Instrucción para el Usuario:**  
> Copia y pega el siguiente bloque de texto en el primer mensaje de tu chat con cualquier IA (Claude, Gemini, ChatGPT, Antigravity, Cursor, etc.) cada vez que inicies un nuevo hilo o proyecto:

```text
Hola. Estás iniciando sesión en este proyecto gobernado bajo la metodología:
"SDLC Multiagente Guiado por Artefactos y Compuertas de Calidad (Stage-Gates)".

Axioma Fundamental: La memoria conversacional es efímera; los artefactos en disco,
los contratos Zod y las pruebas automatizadas son la única fuente de la verdad.

INSTRUCCIONES DE ATERRIZAJE OBLIGATORIAS:
1. Lee y asimila de inmediato el manual rector: AGENTS.md.
2. Ejecuta `npm run status` para ver el estado consolidado. Si trabajas en un módulo,
   tu estado está en .workflow/modules/[XX_nombre].json; si no, en .workflow/current_state.json.
3. Consulta el tablero maestro en: multiAgents/00_orchestrator/PROJECT_STATUS.md.
4. Identifica qué Agente Líder tiene el turno activo, lee su archivo ROLE.md en
   multiAgents/[agente]/ y asume exclusivamente ese rol.
5. Respeta rigurosamente las Reglas de Oro Inviolables definidas en AGENTS.md
   (contrato antes que código, Design System, tolerancia cero al tipo 'any' y alto
   obligatorio Halt/Yield en cada Stage-Gate con aprobación humana).
6. Economía de contexto (AGENTS.md §5.1): lee solo el ROLE.md del rol en turno y el
   Contrato de los subroles que apliques; un subrol no es un subagente; cambia el estado
   con `npm run gate` y termina la sesión al pedir una firma humana.

Por favor, preséntate indicando el rol que estás asumiendo, el Stage-Gate activo
y cuál es el siguiente paso a ejecutar.
```
