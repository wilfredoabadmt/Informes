# Especificación de Requerimientos — Feature 010: Centralizadores de Calificaciones y Promedios Anuales

**Feature:** `010-grades-centralizers`  
**Módulo:** Centralizadores de Calificaciones Trimestrales y Anuales por Paralelo (Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidad 14; Sección 6 - RBAC Contextual; Sección 7 - Módulo 14; Sección 10 - Resolución ADR-001)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el Sistema Educativo Plurinacional (SEP) de Bolivia, conforme a las Resoluciones Ministeriales del Ministerio de Educación y la reglamentación del SIGED/SIE:
1. **Centralizador Trimestral de Paralelo:**
   - Instrumento oficial de consolidación académica que cruza la nómina de estudiantes con matrícula en estado `EFECTIVO` de un curso/paralelo contra todas las asignaturas de la malla curricular del grado.
   - Refleja la nota final de cada materia en la escala de **1 a 100 puntos** (agregando las dimensiones Ser, Saber, Hacer, Decidir y Autoevaluación).
   - Calcula el promedio general trimestral del estudiante, contabiliza las asignaturas reprobadas ($< 51$) y genera estadísticas globales del aula (tasa de aprobación, reprobación y promedio grupal por asignatura).
2. **Centralizador Anual de Gestión:**
   - Cuadro final de rendimiento que promedia las notas obtenidas en los tres trimestres escolares (1T, 2T y 3T):
     $$\text{Promedio Anual por Asignatura} = \text{round}\left(\frac{\text{Nota 1T} + \text{Nota 2T} + \text{Nota 3T}}{3}\right)$$
   - Calcula el promedio general anual del estudiante en la gestión escolar.
   - Determina la **Situación Final Oficial** del estudiante:
     - `PROMOVIDO`: El estudiante aprobó todas las áreas y campos de saberes con nota $\ge 51$. Promueve al año de escolaridad inmediato superior.
     - `RETENIDO`: El estudiante reprueba una o más materias de la malla curricular obligatoria, reteniendo el curso actual conforme a la normativa vigente.
3. **Supervisión y Gobernanza Institucional (Nivel 2):**
   - El Director, la Secretaría y la Comisión Técnico-Pedagógica son los responsables de supervisar el centralizador, verificar que todas las materias cuenten con notas completas y emitir las actas consolidadas para las autoridades distritales.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Consulta del Centralizador Trimestral de Paralelo (Nivel 2 y Nivel 3)
**Como** Director o Maestro Asesor/Tutor de un paralelo  
**Quiero** consultar la matriz consolidada de notas de todas las materias para un trimestre específico  
**Para** supervisar el rendimiento integral del curso, identificar estudiantes rezagados y evaluar el desempeño por asignatura.

#### Criterios de Aceptación:
- Permite filtrar por `paraleloId` y `periodoId`.
- Retorna la matriz bidireccional Estudiantes $\times$ Materias ordenada alfabéticamente por apellidos y nombres.
- Cada celda refleja la nota final de la materia en el trimestre (0 si aún no ha sido asentada) y si está aprobada ($\ge 51$) o reprobada ($< 51$).
- Para cada estudiante, calcula:
  - `promedioTrimestral`: Promedio aritmético de sus notas en todas las materias.
  - `materiasReprobadas`: Cantidad de materias con puntaje menor a 51.
- Calcula métricas globales del aula:
  - Total estudiantes inscritos efectivos.
  - Total estudiantes sin materias reprobadas (aprobados en todo).
  - Total estudiantes con al menos una materia reprobada.
  - Promedio general del paralelo.
  - Promedio grupal por materia.

---

### US-002: Consolidación del Centralizador Anual y Situación Final (Nivel 2)
**Como** Director de la Unidad Educativa  
**Quiero** generar y consultar el centralizador anual de un paralelo consolidando los 3 trimestres de la gestión escolar  
**Para** determinar oficialmente los promedios finales y la situación de promoción o retención de cada estudiante.

#### Criterios de Aceptación:
- Permite filtrar por `paraleloId`.
- Consolida las notas de los 3 trimestres escolares (1T, 2T, 3T) para cada materia y estudiante.
- Calcula el promedio anual por materia: $\text{round}((\text{1T} + \text{2T} + \text{3T}) / 3)$.
- Calcula el promedio general anual del estudiante en la gestión.
- Asigna la **Situación Final Oficial**:
  - `PROMOVIDO`: Si el promedio anual en todas las materias es $\ge 51$.
  - `RETENIDO`: Si reprueba una o más materias ($< 51$).
- Persiste la situación final y promedio anual en el registro de matrícula (`Inscripcion`) del estudiante bajo contexto RLS.

---

## 3. Requerimientos No Funcionales

1. **Aislamiento Multi-Tenant (PostgreSQL RLS):** Las consultas y actualizaciones de centralizadores deben ejecutarse bajo `app.current_institution_id`, garantizando que ninguna autoridad escolar acceda a notas o centralizadores de otra unidad educativa.
2. **Determinismo y Rendimiento:** La agregación matricial para cursos de hasta 45 alumnos y 12 asignaturas debe procesarse y responder en menos de 100 ms.
3. **Compatibilidad SEP Bolivia:** Preservar la escala vigesimal/centesimal oficial boliviana (1-100, umbral de aprobación 51).

