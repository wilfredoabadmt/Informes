# Especificación de Requerimientos — Feature 009: Registro de Calificaciones Cuantitativas y Cualitativas

**Feature:** `009-grades-recording`  
**Módulo:** Registro de Calificaciones Cuantitativas y Cualitativas por Trimestre (Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidad 14; Sección 6 - RBAC Contextual; Sección 7 - Módulo 13)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el Sistema Educativo Plurinacional (SEP) de Bolivia (Ley 070 y Resoluciones Ministeriales de Evaluación):
1. **Asentamiento de Notas por Evaluación:** Para cada instrumento de evaluación planificado en una dimensión (`SER`, `SABER`, `HACER`, `DECIDIR`, `AUTOEVALUACION`), el maestro asienta la calificación obtenida por cada estudiante del curso.
2. **Escala y Validación de Puntaje:** La calificación de cada estudiante debe ser un número entero comprendido entre **0 y el puntaje máximo asignado al instrumento** ($0 \le \text{nota} \le \text{puntajeMaximo}$).
3. **Padrón Efectivo:** Solo pueden recibir calificaciones aquellos estudiantes con matrícula activa en estado `EFECTIVO` en el paralelo y gestión de la materia.
4. **Condición de Trimestre Abierto:** Las notas únicamente pueden registrarse o modificarse mientras el trimestre escolar (`PeriodoEvaluacion`) permanezca en estado `ABIERTO`. Una vez `CERRADO` por Dirección, las notas quedan congeladas e inmutables.
5. **Cálculo Consolidado Trimestral:**
   - La planilla centralizadora del maestro agrega las calificaciones por estudiante en cada dimensión evaluativa:
     - $\text{Puntaje SER} \le 10$
     - $\text{Puntaje SABER} \le 35$
     - $\text{Puntaje HACER} \le 35$
     - $\text{Puntaje DECIDIR} \le 10$
     - $\text{Puntaje AUTOEVALUACIÓN} \le 10$
     - **Nota Trimestral:** $\text{NotaFinal} = \text{SER} + \text{SABER} + \text{HACER} + \text{DECIDIR} + \text{AUTOEVALUACIÓN} \in [0, 100]$.
   - Criterio de Aprobación: **51 puntos o superior** es aprobado; menor a 51 requiere apoyo y seguimiento técnico-pedagógico.
6. **Apreciación Cualitativa:** Además del puntaje cuantitativo, el docente puede registrar observaciones cualitativas que fundamenten el desempeño o las dificultades del educando.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Asentamiento de Calificaciones en Bloque por Evaluación (Nivel 3)
**Como** Maestro con asignación académica en una materia y paralelo  
**Quiero** asentar las calificaciones de toda mi nómina de estudiantes para un instrumento de evaluación en una sola operación  
**Para** agilizar el ingreso de notas después de corregir exámenes o prácticas.

#### Criterios de Aceptación:
- El maestro debe tener asignación académica activa en la materia y paralelo de la evaluación.
- El trimestre correspondiente debe encontrarse en estado `ABIERTO`.
- Valida que todos los estudiantes pertenezcan al paralelo con matrícula `EFECTIVO`.
- Para cada estudiante, $0 \le \text{nota} \le \text{evaluacion.puntajeMaximo}$. Si algún puntaje supera el máximo, se rechaza todo el bloque con `BadRequestException`.
- La operación es atómica (transaccional) y realiza `upsert`: si ya existía nota previa para el estudiante en esa evaluación, se actualiza y se registra la traza de auditoría.

---

### US-002: Planilla Trimestral Consolidada de Aula (Nivel 2 y Nivel 3)
**Como** Maestro o Director de la Unidad Educativa  
**Quiero** consultar la planilla consolidada de calificaciones de un paralelo y materia para un trimestre determinado  
**Para** visualizar el desglose acumulado por dimensiones (Ser, Saber, Hacer, Decidir, Autoevaluación), la nota final sobre 100 puntos y el estado de aprobación de cada alumno.

#### Criterios de Aceptación:
- Permite filtrar por `asignacionId` y `periodoId`.
- Retorna la nómina completa de estudiantes ordenada alfabéticamente (apellidos y nombres).
- Calcula automáticamente los subtotales por dimensión y la nota final trimestral (0-100).
- Señala si el estudiante se encuentra `APROBADO` ($\ge 51$) o `EN_DESARROLLO` ($< 51$).
- Aislamiento estricto multi-tenant por PostgreSQL RLS.

---

### US-003: Modificación Individual de Nota con Auditoría (Nivel 2 y Nivel 3)
**Como** Maestro (o Director de la Unidad Educativa)  
**Quiero** corregir la nota de un estudiante específico en una evaluación con su motivo de rectificación  
**Para** enmendar errores de transcripción o recalificaciones debidamente justificadas.

#### Criterios de Aceptación:
- Solo permitido si el trimestre escolar está `ABIERTO`.
- Valida que el nuevo puntaje esté entre $0$ y el `puntajeMaximo` de la evaluación.
- Guarda inmutablemente en la bitácora de auditoría: usuario responsable, evaluación, estudiante, nota anterior y nueva nota.

---

## 3. Requerimientos No Funcionales

1. **Aislamiento Multi-Tenant (PostgreSQL RLS):** La tabla `calificaciones` debe implementar `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` vinculada a `institucion_id`.
2. **Inmutabilidad Post-Cierre:** Bajo ninguna circunstancia un maestro puede asentar o alterar notas en un trimestre con estado `CERRADO`.
3. **Atomicidad:** La carga en bloque de calificaciones para 35-45 estudiantes se ejecuta dentro de `$transaction`.

