# Especificación de Requerimientos — Feature 007: Control de Asistencia y Justificaciones

**Feature:** `007-attendance-control`  
**Módulo:** Control de Asistencia, Licencias y Ausentismo Escolar (Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidad 15: Asistencia; Sección 6 - RBAC Contextual)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el Sistema Educativo Plurinacional (SEP) de Bolivia, el control de asistencia es un deber pedagógico y administrativo fundamental regulado por las Resoluciones Ministeriales anuales (Normas Generales de Gestión Educativa):
- El **Maestro de Aula / Asesor de Curso** es responsable de registrar la presencia diaria o por periodo de clase de los estudiantes inscritos en su paralelo.
- Los estados oficiales de registro son:
  1. `PRESENTE`: El estudiante se encuentra en el aula cumpliendo sus actividades.
  2. `FALTA`: Ausencia no justificada a clases.
  3. `LICENCIA`: Ausencia autorizada por la Dirección o el Maestro (por motivos de salud, calamidad doméstica o comisión oficial).
  4. `ATRASO`: Ingreso al aula con posterioridad a la tolerancia establecida.
- **Justificaciones Médicas y Permisos:** Los apoderados legales pueden presentar justificativos médicos o notas de solicitud de licencia ante la Dirección o Secretaría, lo cual permite conmutar una `FALTA` previa por una `LICENCIA` justificada.
- **Roster de Inscritos Efectivos:** Solo se puede registrar asistencia a estudiantes con matrícula en estado `EFECTIVO` en el paralelo y gestión correspondiente.
- **Seguimiento Institucional del Ausentismo:** La Dirección del colegio requiere monitorear consolidados de asistencia mensual y porcentajes de asistencia por paralelo para alertar oportunamente sobre riesgos de deserción escolar.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Registro de Asistencia de Aula en Bloque (Nivel 3)
**Como** Maestro con asignación académica en un paralelo (o Director / Secretario)  
**Quiero** registrar la asistencia de todos los estudiantes de mi paralelo para una fecha determinada en una sola operación  
**Para** optimizar el tiempo de toma de lista al inicio de la jornada o periodo pedagógico.

#### Criterios de Aceptación:
- El usuario debe autenticarse y operar bajo el contexto institucional activo (`X-Institution-Id`).
- Si es **Maestro**: debe tener una `AsignacionAcademica` activa en el paralelo indicado.
- La fecha de asistencia no puede ser posterior a la fecha actual (`BadRequestException`).
- No se permite duplicar el registro de asistencia para el mismo paralelo, fecha y asignación (`ConflictException`).
- Se validan todos los `estudianteId` de la nómina enviada, asegurando que cuenten con matrícula `EFECTIVO` en ese paralelo.
- Cada estudiante del bloque se guarda con su estado (`PRESENTE`, `FALTA`, `LICENCIA`, `ATRASO`) y observación opcional.
- La operación es atómica y queda registrada en la bitácora de auditoría.

---

### US-002: Consulta de Planilla de Asistencia por Fecha (Nivel 2 y Nivel 3)
**Como** Maestro o Director de la Unidad Educativa  
**Quiero** consultar la planilla de asistencia registrada para un paralelo en una fecha específica  
**Para** revisar quiénes faltaron, quiénes llegaron con atraso o verificar observaciones anotadas.

#### Criterios de Aceptación:
- Retorna el encabezado del registro (fecha, paralelo, materia/asignación, usuario que registró) y el detalle por estudiante.
- La nómina de estudiantes se presenta ordenada alfabéticamente por apellidos y nombres.
- Protegido por PostgreSQL RLS bajo `institucion_id`.

---

### US-003: Justificación de Ausencias y Conmutación a Licencia (Nivel 2)
**Como** Director o Secretario de la Unidad Educativa  
**Quiero** justificar una falta registrada previamente ingresando el motivo o número de certificado médico  
**Para** actualizar el estado del estudiante a `LICENCIA` y registrar el respaldo formal.

#### Criterios de Aceptación:
- Permite actualizar el estado de un detalle de asistencia de `FALTA` a `LICENCIA` (o viceversa) con un campo obligatorio de motivo o justificativo (`justificado: true`, `observacion: ...`).
- Auditoría: registra al usuario institucional que autorizó la justificación y los valores anteriores/nuevos.

---

### US-004: Estadísticas Consolidadas de Asistencia por Paralelo (Nivel 2 y Nivel 3)
**Como** Director o Maestro de la Unidad Educativa  
**Quiero** consultar un reporte estadístico de asistencia del paralelo para un rango de fechas (o un mes)  
**Para** conocer el porcentaje global de asistencia, total de faltas y detectar estudiantes con ausentismo crítico.

#### Criterios de Aceptación:
- Permite filtrar por `paraleloId` y rango de fechas (`fechaInicio`, `fechaFin`).
- Retorna métricas consolidadas:
  - Total de sesiones registradas.
  - Porcentaje de asistencia global del aula.
  - Desglose por estudiante: total asistencias, total faltas (justificadas e injustificadas), total atrasos y porcentaje de asistencia individual.

---

## 3. Requerimientos No Funcionales

1. **Aislamiento Multi-Tenant (PostgreSQL RLS):** La tabla `registros_asistencia` debe contar con `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` asociada a `institucion_id`.
2. **Atomicidad:** El guardado del bloque de asistencia de 35-45 alumnos se ejecuta dentro de una transacción interactiva (`$transaction`).
3. **Rendimiento:** Tiempos de registro en bloque inferiores a 200 ms para aulas completas.
