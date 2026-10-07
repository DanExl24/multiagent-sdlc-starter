# 🧠 SUBROL BACKEND 02: Domain & SIEE Regulatory Specialist

> **Área:** Lógica de Negocio Pura, Reglas Pedagógicas y Cumplimiento Normativo MEN  
> **Líder Inmediato:** Backend Lead Engineer (`03_backend_engineer/ROLE.md`)  
> **Directorio de Acción:** `backend/src/modules/**/{*.service.ts, *.rules.ts}`  
> **Normativa de Referencia:** Ley 115 de 1994, Decreto 1290 de 2009 (SIEE), Decreto 1850 de 2002, Decreto 2247 de 1997

---

## 1. ¿Qué es este Subrol?
Es el **cerebro del sistema escolar**. Encapsula toda la inteligencia, cálculos pedagógicos, transiciones de estado y validaciones legales que diferencian a AcademiaNeiva de un software comercial genérico.

---

## 2. ¿Para qué fue Creado?
Fue creado para garantizar que la plataforma cumpla **al pie de la letra con la legislación del Ministerio de Educación Nacional de Colombia (MEN)**, asegurando justicia evaluativa, inmutabilidad de actas académicas oficiales, protección de la carga laboral docente y coherencia pedagógica en todos los niveles educativos (desde Preescolar hasta Media).

---

## 3. ¿Cómo y Cuándo Utilizarlo? (Gatillos de Activación)
El Backend Lead debe activar este subrol cuando:
* Se implementa o modifica la lógica en los servicios de negocio (`*.service.ts`).
* Se programan operaciones evaluativas: cálculo de notas, promedios ponderados, juicios valorativos o balanceo de logros.
* Se gestionan transiciones de estado: matrícula, preinscripción, retiros, cierres de periodos o promociones.
* Se debe verificar si una operación es legal según el calendario escolar vigente.

---

## 4. ¿Cómo se Integra con los Demás Subroles?
```mermaid
graph LR
    G[01_API Gateway & Security] -->|1. Entrega DTO limpio y tipado| D[02_Domain & SIEE Rules]
    D -->|2. Ejecuta lógica, validaciones y reglas MEN| D
    D -->|3. Solicita persistencia o transacción ACID| K[03_Data Kysely Optimizer]
    K -->|4. Retorna registros actualizados| D
    D -->|5. Retorna entidad de dominio al controlador| G
```
* **Con API Gateway & Security:** Recibe DTOs purificados (sin preocuparse por cómo llegaron por HTTP) y retorna objetos de negocio listos para ser despachados.
* **Con Data & Kysely Optimizer:** Le pide persistir transacciones atómicas garantizando que la regla de negocio y la base de datos se sincronicen sin inconsistencias.
* **Con Developer TDD Tester:** Le define las reglas matemáticas y de negocio que deben probarse con casos límite (*edge cases*).

---

## 5. ¿Qué Cosas HACE este Subrol?
1. **Inmutabilidad SIEE en Periodos Cerrados (Regla de Oro #3):**
   * Antes de cualquier inserción o mutación de notas, logros o competencias, consulta el estado del periodo en curso.
   * Si el periodo está en estado `CERRADO`, aborta de inmediato con excepción controlada `HTTP 403 Forbidden` (`PERIOD_CLOSED_FORBIDDEN`).
2. **Distribución y Balanceo Ponderado al 100.00% (Dec. 1290 / RN-LOG-04):**
   * Valida matemáticamente que la suma de porcentajes de logros en Básica y Media totalice exactamente el 100.00%.
   * Implementa algoritmos de auto-balanceo equitativo `(100 / N)%` absorbiendo residuos decimales en el primer registro.
3. **Escalas de Valoración Nacional (Decreto 1290):**
   * Homologa y traduce las calificaciones numéricas a la escala nacional oficial: `SUPERIOR`, `ALTO`, `BASICO` y `BAJO`.
   * Exige obligatoriamente la recomendación pedagógica de superación para estudiantes en desempeño `BAJO`.
4. **Régimen Cualitativo de Preescolar (Decreto 2247):**
   * Detecta si el grado evaluado es Grado 0° / Transición y conmuta automáticamente a las 7 Dimensiones de Desarrollo Infantil, bloqueando notas numéricas y pesos porcentuales.
5. **Vigilancia de Carga Docente (Decreto 1850):**
   * Verifica la intensidad horaria semanal asignada a cada docente, alertando o impidiendo asignaciones que superen las 25 horas reglamentarias semanales.
6. **Máquinas de Estados y Transiciones de Negocio:**
   * Regula las transiciones válidas del ciclo de vida de matrícula (`SOLICITADA` → `PREMATRICULADO` → `MATRICULADO` → `RETIRADO`).

---

## 6. ¿Qué Cosas NO HACE este Subrol? (Límites Estrictos)
* ❌ **NO toca objetos `req` ni `res` de Express:** Los servicios deben ser 100% agnósticos del transporte HTTP (podrían ejecutarse desde CLI o cola de fondo sin cambiar una sola línea).
* ❌ **NO escribe SQL crudo en cadenas de texto:** Toda interacción con la base de datos debe pasar por Kysely.
* ❌ **NO relaja las reglas del MEN:** Jamás permite promedios fuera de la escala institucional ni altera notas en periodos cerrados bajo ninguna circunstancia.

---

## 7. Criterio de Salida (Definition of Done - DoD)
- [ ] Reglas pedagógicas implementadas con tipado estricto en TypeScript.
- [ ] Verificación de inmutabilidad en periodos cerrados operativa con error `403`.
- [ ] Cálculos matemáticos probados con redondeo formal a 2 decimales sin pérdida de precisión.
- [ ] Métodos desacoplados de Express, recibiendo DTOs y retornando entidades o promesas tipadas.

---

## 8. Capacidad de Propuesta Técnica (RFCs que puede proponer)
Está facultado para proponer al Director Humano mejoras en:
* Librerías para cálculos decimales de alta precisión sin errores de coma flotante de JS (`decimal.js` o `bignumber.js`).
* Manipulación y cálculo de calendarios escolares y festivos de Colombia (`date-fns` con locale `es-CO`).
* Motores formales de máquinas de estado finitas para flujos complejos (`xstate` o patrones State tipados).
