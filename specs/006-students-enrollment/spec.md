# Especificación de Requerimientos — Feature 006: Empadronamiento de Estudiantes (RUDE) y Matriculación Escolar

**Feature:** `006-students-enrollment`  
**Módulo:** Gestión de Estudiantes, Matrícula Escolar y Roster de Aula (Nivel 1, Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 004, 005; Sección 4 - Entidades 11 y 12: Estudiante e Inscripción; Sección 6 - RBAC Contextual)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el Sistema Educativo Plurinacional (SEP) de Bolivia, la gestión de los educandos se fundamenta en el **Registro Único de Estudiantes (RUDE)**:
- Cada estudiante del país cuenta con un código RUDE único e invariable a lo largo de toda su vida escolar (ej. código alfanumérico generado con base en el código SIE, año y número correlativo).
- El estudiante está modelado como una especialización de la entidad universal **Persona** (Cédula de Identidad si la posee, nombres, apellidos, fecha de nacimiento, género y dirección).
- Cada estudiante cuenta con el registro de sus **Tutores Legales / Apoderados** (padre, madre o apoderado con CI, parentesco y datos de contacto).
- La **Matrícula o Inscripción** es el acto administrativo mediante el cual un estudiante queda adscrito a una **Unidad Educativa**, en una **Gestión Escolar** activa, dentro de un curso y **Paralelo / Aula** específico.

### Principios de Negocio y Reglas de Integridad:
1. **Unicidad de Matrícula Nacional Activa:** Un estudiante solo puede tener una inscripción con estado `EFECTIVO` por gestión escolar a nivel nacional. No puede estar inscrito simultáneamente en dos colegios para el mismo año escolar.
2. **Traspasos Escolares Auditados:** El traslado de un colegio a otro requiere formalizar la baja por traslado (`RETIRADO_TRASLADO`) en el colegio de origen antes de admitir la matrícula en el colegio de destino.
3. **Control de Cupos de Aula:** La inscripción debe verificar que el paralelo no supere el `cupoMaximo` establecido por la dirección.
4. **Roster Oficial de Aula para el Maestro:** Los maestros con asignación académica en un paralelo pueden consultar la nómina oficial de sus estudiantes inscritos, habilitando los futuros módulos de asistencia y calificaciones.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Empadronamiento Nacional del Estudiante con RUDE (Nivel 1 y Nivel 2)
**Como** Director o Secretario de la Unidad Educativa  
**Quiero** registrar a un nuevo estudiante en el padrón del sistema con su código RUDE y datos de su apoderado  
**Para** contar con la ficha biográfica oficial antes de matricularlo en un curso.

#### Criterios de Aceptación:
- El código RUDE es obligatorio, alfanumérico único a nivel nacional (`ConflictException` si ya existe).
- Permite vincular o registrar los datos personales del estudiante (`ci`, `complemento`, `nombres`, `primerApellido`, `segundoApellido`, `fechaNacimiento`, `genero`, `direccion`).
- Permite registrar los datos del apoderado/tutor (`nombreTutor`, `ciTutor`, `parentesco`, `telefonoTutor`).
- Búsqueda nacional: la secretaría del colegio puede buscar por RUDE o por CI/nombre para verificar si el estudiante ya existe en la plataforma antes de volver a registrarlo.

---

### US-002: Matriculación del Estudiante en un Paralelo y Gestión (Nivel 2)
**Como** Secretario o Director de la Unidad Educativa  
**Quiero** inscribir a un estudiante registrado en un paralelo institucional para la gestión escolar activa  
**Para** asignarlo formalmente al aula correspondiente.

#### Criterios de Aceptación:
- Valida que la gestión escolar esté en estado `ABIERTA` o `EN_PLANIFICACION`.
- Valida que el paralelo pertenezca a la institución activa (`X-Institution-Id`) y a la gestión escolar indicada.
- Valida que el estudiante no tenga ya una inscripción con estado `EFECTIVO` en esa misma gestión escolar en ningún colegio del sistema (`ConflictException`).
- Valida que el paralelo no exceda el cupo máximo de estudiantes activos (`BadRequestException`).
- Se registra el estado inicial como `EFECTIVO`, con opción de marcar `esRepitente: true/false`.
- Auditoría: se registra la operación con usuario, IP, colegio y detalles del aula.

---

### US-003: Consulta de Estudiantes por Paralelo / Roster de Aula (Nivel 2 y Nivel 3)
**Como** Maestro asignado a un paralelo (o Director del colegio)  
**Quiero** consultar la lista de estudiantes inscritos en un aula específica  
**Para** conocer la nómina oficial, verificar datos de apoderados y preparar listas de asistencia.

#### Criterios de Aceptación:
- Si el solicitante es **Maestro (Nivel 3)**: el sistema valida mediante `TenantContextGuard` que el docente tenga una `AsignacionAcademica` activa en dicho paralelo para esa gestión escolar. De no tenerla, retorna `403 Forbidden`.
- Si el solicitante es **Director / Secretario (Nivel 2)**: puede consultar cualquier paralelo de su colegio.
- Retorna la lista ordenada alfabéticamente por apellido y nombre: `codigoRude`, `ci`, `nombreCompleto`, `genero`, `estadoInscripcion`, datos del tutor.
- El maestro no puede acceder a las listas de estudiantes de colegios donde no trabaja.

---

### US-004: Traspaso, Retiro y Modificación de Matrícula (Nivel 2)
**Como** Director o Secretario de la Unidad Educativa  
**Quiero** registrar el retiro por traslado o cambio de estado de un estudiante matriculado  
**Para** permitir su posterior inscripción en otro colegio o documentar la deserción escolar.

#### Criterios de Aceptación:
- Estados admitidos: `EFECTIVO`, `RETIRADO_TRASLADO`, `RETIRADO_ABANDONO`, `NO_INCORPORADO`.
- Al cambiar a `RETIRADO_TRASLADO`, se libera la restricción de inscripción única para la gestión, permitiendo que la nueva Unidad Educativa formalice su matrícula.
- Toda modificación de matrícula queda registrada en la bitácora inmutable de auditoría.

---

## 3. Requerimientos No Funcionales

1. **Aislamiento Multi-Tenant (PostgreSQL RLS):** La tabla `inscripciones` debe implementar `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` vinculada a `institucion_id = current_setting('app.current_institution_id')`.
2. **Identidad Única Nacional:** La tabla `estudiantes` reside en el ámbito global referenciado por `Persona`, permitiendo trazabilidad de escolaridad histórica a través de distintas instituciones.
3. **Rendimiento:** Listado de aula (hasta 45 estudiantes) en menos de 50 ms.
