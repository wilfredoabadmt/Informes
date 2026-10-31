# Especificación de Requerimientos — Feature 008: Periodos de Evaluación y Configuración de Dimensiones SEP

**Feature:** `008-evaluation-periods`  
**Módulo:** Periodos de Evaluación, Dimensiones Curriculares (Ser, Saber, Hacer, Decidir) e Instrumentos de Evaluación (Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidades 7 y 13; Sección 6 - RBAC Contextual; Sección 7 - Módulo 12)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el Sistema Educativo Plurinacional (SEP) de Bolivia, conforme a la Ley 070 (Avelino Siñani - Elizardo Pérez) y las Normas Generales de Gestión Educativa:
1. **Estructura Trimestral:** La gestión escolar anual se organiza obligatoriamente en tres periodos evaluativos continuos:
   - **1er Trimestre** (`PRIMER_TRIMESTRE`)
   - **2do Trimestre** (`SEGUNDO_TRIMESTRE`)
   - **3er Trimestre** (`TERCER_TRIMESTRE`)
2. **Ciclo de Vida de los Periodos:**
   - `PROGRAMADO`: Periodo configurado en el calendario anual previo a su inicio.
   - `ABIERTO`: Periodo lectivo vigente en el cual los maestros pueden programar evaluaciones y registrar notas. Solo un trimestre puede estar `ABIERTO` simultáneamente por unidad educativa y gestión.
   - `CERRADO`: Periodo concluido con centralizadores bloqueados; no se admiten modificaciones ni creación de instrumentos de evaluación sin desbloqueo formal de Dirección.
3. **Las Cuatro Dimensiones del Modelo Educativo Sociocomunitario Productivo:**
   - La evaluación holística cuantifica el desarrollo integral del estudiante sobre una escala oficial de **100 puntos**:
     - **SER (10 puntos):** Expresión de valores sociocomunitarios, principios ético-morales, respeto, puntualidad y solidaridad.
     - **SABER (35 puntos):** Comprensión teórica, saberes, conocimientos científicos, análisis crítico y razonamiento conceptual.
     - **HACER (35 puntos):** Aplicación práctica de conocimientos, destrezas técnicas, experimentos, producción tangible e intangible y tareas.
     - **DECIDIR (10 puntos):** Capacidad de organización comunitaria, liderazgo, pensamiento propositivo y transformación de la realidad.
     - **AUTOEVALUACIÓN (10 puntos):** Valoración reflexiva cuali-cuantitativa del estudiante (5 puntos asignados a Ser y 5 puntos a Decidir).
   - **Puntaje Total Trimestral:** $10 + 35 + 35 + 10 + 10 = 100$ puntos. Nota mínima de aprobación: **51 puntos**.
4. **Instrumentos de Evaluación Docente (`Evaluacion`):**
   - El maestro planifica diversos instrumentos formativos y sumativos (exámenes escritos, trabajos prácticos, proyectos socioproductivos, ferias, disertaciones) asociados a una dimensión evaluativa específica y a su asignación académica (paralelo y materia).

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Configuración Institucional de Trimestres Escolares (Nivel 2)
**Como** Director o Administrador Institucional de la Unidad Educativa  
**Quiero** registrar y calendarizar los 3 trimestres de la gestión escolar con sus fechas límite de entrega de notas  
**Para** normar el calendario evaluativo institucional del colegio.

#### Criterios de Aceptación:
- Valida que la gestión escolar exista, pertenezca a la institución (`institucion_id`) y esté en estado `ABIERTA` o `EN_PLANIFICACION`.
- Permite configurar los periodos oficiales: `PRIMER_TRIMESTRE`, `SEGUNDO_TRIMESTRE`, `TERCER_TRIMESTRE`.
- Unicidad: No pueden existir dos registros del mismo trimestre para una misma gestión escolar (`@@unique([gestionId, periodo])`).
- Validación cronológica: `fechaInicio < fechaFin` y `fechaLimiteNotas >= fechaFin`.

---

### US-002: Control de Estados del Trimestre (Apertura y Cierre) (Nivel 2)
**Como** Director de la Unidad Educativa  
**Quiero** conmutar el estado de un trimestre (`PROGRAMADO` -> `ABIERTO` -> `CERRADO`)  
**Para** habilitar la programación de actividades docentes o cerrar formalmente la recepción de notas.

#### Criterios de Aceptación:
- Solo un trimestre puede estar en estado `ABIERTO` a la vez en la misma gestión escolar. Si se abre un trimestre, los demás deben estar `PROGRAMADO` o `CERRADO`.
- Cuando un trimestre pasa a `CERRADO`, se bloquea la creación, edición o eliminación de instrumentos de evaluación en ese periodo.
- Queda registrado en la bitácora de auditoría inmutable con usuario, fecha y valores previos/nuevos.

---

### US-003: Creación y Programación de Instrumentos de Evaluación (Nivel 3)
**Como** Maestro con asignación académica en una materia y paralelo  
**Quiero** registrar un instrumento de evaluación (examen, práctica, proyecto) asignándole una dimensión (SER, SABER, HACER, DECIDIR) y puntaje máximo  
**Para** planificar el proceso evaluativo continuo de mis estudiantes en el trimestre.

#### Criterios de Aceptación:
- El maestro debe tener una `AsignacionAcademica` activa en el paralelo y materia.
- El trimestre (`periodoId`) debe encontrarse en estado `ABIERTO`.
- La fecha de la evaluación debe encontrarse dentro del rango de fechas del trimestre (`fechaInicio <= fechaEvaluacion <= fechaFin`).
- El puntaje máximo debe ser un entero positivo y no puede superar el límite estatuario de la dimensión (SER $\le 10$, SABER $\le 35$, HACER $\le 35$, DECIDIR $\le 10$, AUTOEVALUACION $\le 10$).
- La sumatoria de puntajes máximos de los instrumentos en una misma dimensión no debe sobrepasar el tope reglamentario asignado.

---

### US-004: Consulta y Gestión de Evaluaciones Docentes (Nivel 2 y Nivel 3)
**Como** Maestro (o Director / Comisión Pedagógica)  
**Quiero** consultar la lista de evaluaciones programadas para una materia y paralelo en un trimestre determinado  
**Para** visualizar la estructura de evaluación planificada y el desglose de puntajes por dimensión.

#### Criterios de Aceptación:
- Retorna la lista de evaluaciones agrupadas o filtradas por dimensión evaluativa (`SER`, `SABER`, `HACER`, `DECIDIR`, `AUTOEVALUACION`).
- Permite al maestro modificar el nombre, descripción, fecha o desactivar (`activo = false`) un instrumento siempre que el trimestre continúe `ABIERTO`.
- Aislamiento multi-tenant por PostgreSQL RLS bajo `institucion_id`.

---

## 3. Requerimientos No Funcionales

1. **Aislamiento Multi-Tenant (PostgreSQL RLS):** Las tablas `periodos_evaluacion` y `evaluaciones` deben implementar `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` vinculadas al contexto `app.current_institution_id`.
2. **Inmutabilidad Post-Cierre:** Ninguna evaluación puede crearse o mutarse en un periodo `CERRADO`.
3. **Rendimiento:** Respuesta de consulta de instrumentos de evaluación en menos de 50 ms.
