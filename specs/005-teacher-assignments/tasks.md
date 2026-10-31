# Tareas de Implementación — Feature 005: Asignaciones Académicas Docentes y Carga Horaria

**Feature:** `005-teacher-assignments`  
**Estado:** COMPLETADO Y VERIFICADO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-A, 002-B, 004, 005; Sección 4 - Modelo de Datos; Sección 6 - RBAC Contextual)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL con RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-ASG-PRISMA`   | Base de Datos | Agregar `AsignacionAcademica` y `EstadoAsignacion` a `schema.prisma` | Ninguna | COMPLETADO |
| `T02-ASG-MIGRATION`| Base de Datos | Generar migración y aplicar políticas PostgreSQL RLS a `asignaciones_academicas` | T01-ASG-PRISMA | COMPLETADO |
| `T03-ASG-DTO`      | Contratos | Implementar DTOs (`create-assignment`, `update-status`, `query-assignments`) | Ninguna | COMPLETADO |
| `T04-ASG-SVC`      | Backend Core | Implementar lógica de asignación y validaciones pedagógicas en `AcademicService` | T02-ASG-MIGRATION, T03-ASG-DTO | COMPLETADO |
| `T05-ASG-CTRL`     | Endpoints | Exponer endpoints REST en `AcademicController` con seguridad de tenant y roles | T04-ASG-SVC | COMPLETADO |
| `T06-ASG-UNIT`     | Verificación | Pruebas unitarias de validación y reglas de negocio en `academic.service.spec.ts` | T04-ASG-SVC | COMPLETADO |
| `T07-ASG-E2E`      | Verificación | Pruebas de integración E2E demostrando asignación y multi-tenancy del docente | T05-ASG-CTRL | COMPLETADO |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Persistencia

#### `T01-ASG-PRISMA`: Modelado Prisma
- Agregar enum `EstadoAsignacion` (`ACTIVA`, `SUSPENDIDA`, `FINALIZADA`).
- Agregar modelo `AsignacionAcademica` con relaciones a `UnidadEducativa`, `GestionEscolar`, `VinculacionInstitucional`, `Paralelo` y `Materia`.
- Definir restricción única `@@unique([gestionId, paraleloId, materiaId, vinculacionId])`.

#### `T02-ASG-MIGRATION`: Migración y RLS
- Ejecutar migración controlada.
- Aplicar políticas DDL de PostgreSQL Row Level Security:
  - `ALTER TABLE "asignaciones_academicas" ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;`
  - Política de aislamiento con `institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid`.

---

### Fase 2: Backend Core y Endpoints

#### `T03-ASG-DTO`: DTOs de Asignación Académica
- `CreateAssignmentDto`: `gestionId`, `vinculacionId`, `paraleloId`, `materiaId`, `horasSemanales`, `esTitular`, `esTutor`.
- `UpdateAssignmentStatusDto`: `estado` (`ACTIVA`, `SUSPENDIDA`, `FINALIZADA`), `motivo`.
- `QueryAssignmentsDto`: `gestionId`, `paraleloId`, `maestroId`.

#### `T04-ASG-SVC`: Lógica de Asignación en Service
- Validación de que `vinculacionId` pertenezca al colegio y esté activa.
- Validación de que `gestionId` esté abierta o en planificación.
- Validación de que `paraleloId` pertenezca a la misma gestión e institución.
- Validación curricular: nivel educativo de la materia compatible con el curso del paralelo.
- Validación de titularidad: impedir dos titulares activos para la misma materia y paralelo.
- Registro en `RegistroAuditoria`.

#### `T05-ASG-CTRL`: Endpoints y Decoradores
- `POST /api/v1/academic/assignments`: Creación por Director/Admin Institucional (Nivel 2).
- `GET /api/v1/academic/assignments`: Matriz institucional con filtros (Nivel 2).
- `GET /api/v1/academic/assignments/my-assignments`: Consulta de asignaciones del docente autenticado (Nivel 3).
- `PATCH /api/v1/academic/assignments/:id/status`: Cambio de estado (Nivel 2).
- `DELETE /api/v1/academic/assignments/:id`: Revocación (Nivel 2).

---

### Fase 3: Verificación (DoD)

#### `T06-ASG-UNIT`: Pruebas Unitarias
- Cobertura de todas las excepciones y reglas de negocio (vinculación ajena, gestión cerrada, nivel incompatible, duplicidad de titular).

#### `T07-ASG-E2E`: Pruebas de Integración E2E
- Escenario completo con Directora Elena, Superadmin y Maestro Raúl Condori operando en Franz Tamayo y Mariscal Sucre.
