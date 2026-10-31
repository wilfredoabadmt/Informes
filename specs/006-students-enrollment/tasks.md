# Tareas de Implementación — Feature 006: Empadronamiento de Estudiantes (RUDE) y Matriculación Escolar

**Feature:** `006-students-enrollment`  
**Estado:** COMPLETADO Y VERIFICADO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 004, 005; Sección 4 - Entidades 11 y 12; Sección 6 - RBAC Contextual)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL con RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-STU-PRISMA`   | Base de Datos | Agregar `Estudiante`, `Inscripcion` y enums a `schema.prisma` | Ninguna | COMPLETADO |
| `T02-STU-MIGRATION`| Base de Datos | Generar migración y aplicar PostgreSQL RLS a `inscripciones` | T01-STU-PRISMA | COMPLETADO |
| `T03-STU-DTO`      | Contratos | Implementar DTOs (`create-student`, `enroll-student`, `update-status`) | Ninguna | COMPLETADO |
| `T04-STU-SVC`      | Backend Core | Implementar `StudentsService` (empadronamiento, matrícula, roster, traspasos) | T02-STU-MIGRATION, T03-STU-DTO | COMPLETADO |
| `T05-STU-CTRL`     | Endpoints | Implementar `StudentsController` y registrar en `StudentsModule` y `AppModule` | T04-STU-SVC | COMPLETADO |
| `T06-STU-UNIT`     | Verificación | Pruebas unitarias en `students.service.spec.ts` | T04-STU-SVC | COMPLETADO |
| `T07-STU-E2E`      | Verificación | Pruebas E2E en `test/students.e2e-spec.ts` con matriculación, roster y traspaso | T05-STU-CTRL | COMPLETADO |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Persistencia

#### `T01-STU-PRISMA`: Modelado Prisma
- Agregar `enum ParentescoTutor` (`PADRE`, `MADRE`, `TUTOR_LEGAL`, `ABUELO`, `HERMANO`, `OTRO`).
- Agregar `enum EstadoInscripcion` (`EFECTIVO`, `RETIRADO_TRASLADO`, `RETIRADO_ABANDONO`, `NO_INCORPORADO`).
- Modelo `Estudiante`: vinculado a `Persona`, con `codigoRude` único, datos de apoderado/tutor.
- Modelo `Inscripcion`: vinculado a `UnidadEducativa`, `Estudiante`, `GestionEscolar` y `Paralelo`.

#### `T02-STU-MIGRATION`: Migración y RLS
- Ejecutar migración y aplicar DDL de Row Level Security en `inscripciones` con política por `institucion_id`.

---

### Fase 2: Backend Core y Endpoints

#### `T03-STU-DTO`: Clases DTO
- `CreateStudentDto`: datos biográficos, RUDE, datos del tutor.
- `EnrollStudentDto`: `estudianteId`, `gestionId`, `paraleloId`, `esRepitente`, `observaciones`.
- `UpdateEnrollmentStatusDto`: `estado`, `motivo`.

#### `T04-STU-SVC`: Lógica de Negocio
- `createStudent`: valida RUDE y CI únicos en `Persona` y crea `Estudiante`.
- `searchStudents`: búsqueda por texto en RUDE, CI o nombres.
- `enrollStudent`: valida que no exista matrícula `EFECTIVO` previa en la gestión y que el paralelo no supere `cupoMaximo`.
- `getSectionRoster`: verifica que si el usuario es maestro, tenga asignación en el aula, retornando la lista alfabética.
- `updateEnrollmentStatus`: permite traspasos y bajas.

#### `T05-STU-CTRL`: Endpoints y Módulo
- Endpoints en `StudentsController` protegidos con `JwtAuthGuard` y `TenantContextGuard`.

---

### Fase 3: Verificación (DoD)

#### `T06-STU-UNIT`: Pruebas Unitarias
- Cobertura completa de todas las reglas de negocio y rechazos de acceso al roster.

#### `T07-STU-E2E`: Pruebas de Integración E2E
- Escenario completo de empadronamiento, matrícula, consulta de nómina por docente y traspaso escolar entre instituciones.
