# Especificación de Requerimientos — Feature 005: Asignaciones Académicas Docentes y Carga Horaria

**Feature:** `005-teacher-assignments`  
**Módulo:** Gestión Académica y Asignaciones Docentes (Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-A, 002-B, 004, 005; Sección 4 - Entidad Asignación Académica; Sección 6 - RBAC Contextual)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el Sistema Educativo Plurinacional (SEP) del Estado Plurinacional de Bolivia, una vez que la Unidad Educativa apertura una gestión escolar y formaliza los cursos y paralelos (Feature 004), y habiendo vinculado a los maestros mediante su RDA y Cédula de Identidad (Feature 003), la Dirección Institucional procede a la **Asignación de Carga Horaria y Materias**.

La Asignación Académica es el enlace operativo entre:
1. La **Vinculación Institucional** de un maestro activo en el colegio.
2. La **Gestión Escolar** activa (`ABIERTA` o `EN_PLANIFICACION`).
3. El **Paralelo / Aula** (Grado, Letra y Turno).
4. La **Materia / Área Curricular** del catálogo nacional oficial del SEP.

Este módulo formaliza quién enseña qué materia en qué aula, con cuántas horas pedagógicas semanales, qué rol pedagógico asume (Titular, Co-titular, Reemplazo) y si ejerce la función de **Asesor de Curso / Tutor de Aula**.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Asignación Académica de Materia y Aula a Docente Vinculado (Nivel 2)
**Como** Director o Administrador Institucional de la Unidad Educativa  
**Quiero** asignar a un maestro vinculado una materia específica en un curso y paralelo para la gestión escolar activa  
**Para** definir la responsabilidad pedagógica del aula y habilitar el registro posterior de calificaciones y asistencia.

#### Criterios de Aceptación:
- Solo se puede asignar a maestros con vinculación institucional en estado `ACTIVO` en el colegio en sesión (`X-Institution-Id`).
- La gestión escolar asociada no puede estar en estado `CERRADA`.
- El paralelo debe pertenecer a la misma Unidad Educativa y a la gestión escolar indicada.
- El nivel educativo de la materia (`NivelEducativo`: `PRIMARIA` o `SECUNDARIA`) debe coincidir exactamente con el nivel educativo del curso al que pertenece el paralelo.
- No se puede asignar al mismo docente dos veces a la misma materia en el mismo paralelo y gestión (`ConflictException`).
- Si se marca al docente como `esTitular: true`, el sistema debe validar que no exista ya otro docente titular activo en esa misma materia y paralelo (a menos que se designe como co-titular `esTitular: false`).
- Se registra la carga horaria semanal en horas pedagógicas (por defecto 4 horas, configurable de 1 a 20 horas por materia/paralelo).
- Opcionalmente se puede designar al docente como **Asesor de Curso** (`esTutor: true`). Solo puede existir un asesor principal por paralelo.

---

### US-002: Matriz Institucional de Asignaciones Docentes (Nivel 2)
**Como** Director de la Unidad Educativa  
**Quiero** consultar la matriz completa de asignaciones académicas por gestión escolar  
**Para** supervisar la cobertura curricular, detectar materias sin docente asignado y balancear la carga horaria semanal del plantel.

#### Criterios de Aceptación:
- Permite filtrar por gestión escolar (`gestionId`), por paralelo (`paraleloId`) o por docente (`maestroId`).
- Retorna el detalle completo: datos del maestro (CI, RDA, Nombres y Apellidos), curso y paralelo (Grado, Letra, Turno), materia (Código, Nombre, Campo de Saberes), horas pedagógicas semanales y rol (Titular/Tutor).
- La consulta se ejecuta bajo aislamiento multi-tenant estricto (`SET LOCAL app.current_institution_id`).

---

### US-003: Consulta de "Mis Asignaciones" para el Maestro (Nivel 3)
**Como** Maestro con sesión activa en una Unidad Educativa  
**Quiero** consultar la lista de asignaciones académicas que tengo en el colegio activo  
**Para** conocer mis cursos, materias, turnos y carga horaria asignada.

#### Criterios de Aceptación:
- El maestro autenticado accede a `GET /api/v1/academic/assignments/my-assignments`.
- El sistema resuelve la vinculación activa del maestro para el tenant actual (`X-Institution-Id`).
- Retorna únicamente las asignaciones académicas vigentes del docente en dicha institución para la gestión solicitada (o la gestión actualmente `ABIERTA`).
- Aislamiento estricto: el maestro no ve asignaciones de otros maestros ni sus propias asignaciones en otros colegios en esta vista.

---

### US-004: Modificación de Estado y Cese de Asignación Docente (Nivel 2)
**Como** Director de la Unidad Educativa  
**Quiero** modificar el estado de una asignación (`ACTIVA`, `SUSPENDIDA`, `FINALIZADA`) o revocar la asignación  
**Para** gestionar reemplazos por licencias médicas o reestructuración de la carga horaria.

#### Criterios de Aceptación:
- Al suspender o finalizar una asignación, se preserva el histórico de la vinculación para salvaguardar las calificaciones y asistencias previas (borrado lógico / soft-delete).
- Cada modificación genera un registro en `RegistroAuditoria` con el usuario que efectuó el cambio, los valores previos y la justificación.

---

## 3. Requerimientos No Funcionales

1. **Aislamiento Multi-Tenant (RLS):** La tabla `asignaciones_academicas` debe contar con `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` y política de pertenencia a `institucion_id`.
2. **Integridad Referencial Cruzada:** El backend debe validar que `vinculacion_id`, `paralelo_id` y `gestion_id` pertenezcan todos a la misma `institucion_id` antes de persistir.
3. **Auditoría Obligatoria:** Las operaciones de creación, modificación de carga horaria, reasignación y revocación se auditan inmutablemente.
4. **Rendimiento:** Tiempos de respuesta inferiores a 100 ms para consultas de la matriz académica por colegio.
