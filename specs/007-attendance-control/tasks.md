# Tareas de Implementación — Feature 007: Control de Asistencia y Justificaciones

**Feature:** `007-attendance-control`  
**Estado:** COMPLETADO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidad 15; Sección 6 - RBAC Contextual)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL con RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-ATT-PRISMA`   | Base de Datos | Agregar `RegistroAsistencia`, `DetalleAsistencia` y `EstadoAsistencia` a `schema.prisma` | Ninguna | COMPLETADO Y VERIFICADO |
| `T02-ATT-MIGRATION`| Base de Datos | Generar migración y aplicar PostgreSQL RLS a `registros_asistencia` | T01-ATT-PRISMA | COMPLETADO Y VERIFICADO |
| `T03-ATT-DTO`      | Contratos | Implementar DTOs (`record-attendance`, `justify-absence`, `query-stats`) | Ninguna | COMPLETADO Y VERIFICADO |
| `T04-ATT-SVC`      | Backend Core | Implementar `AttendanceService` (toma en bloque, planilla, justificaciones, estadísticas) | T02-ATT-MIGRATION, T03-ATT-DTO | COMPLETADO Y VERIFICADO |
| `T05-ATT-CTRL`     | Endpoints | Implementar `AttendanceController` y registrar en `AttendanceModule` y `AppModule` | T04-ATT-SVC | COMPLETADO Y VERIFICADO |
| `T06-ATT-UNIT`     | Verificación | Pruebas unitarias en `attendance.service.spec.ts` | T04-ATT-SVC | COMPLETADO Y VERIFICADO |
| `T07-ATT-E2E`      | Verificación | Pruebas E2E en `test/attendance.e2e-spec.ts` con toma de lista, justificación y reportes | T05-ATT-CTRL | COMPLETADO Y VERIFICADO |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Persistencia

#### `T01-ATT-PRISMA`: Modelado Prisma
- Agregar `enum EstadoAsistencia` (`PRESENTE`, `FALTA`, `LICENCIA`, `ATRASO`).
- Modelo `RegistroAsistencia`: encabezado de sesión de clase con `institucionId`, `paraleloId`, `asignacionId`, `fecha`, `registradoPorId`. Restricción única `@@unique([paraleloId, fecha, asignacionId])`.
- Modelo `DetalleAsistencia`: filas de estudiantes con `estudianteId`, `estado`, `justificado`, `observacion`.

#### `T02-ATT-MIGRATION`: Migración y RLS
- Ejecutar migración y aplicar directivas RLS a `registros_asistencia` con política por `institucion_id`.

---

### Fase 2: Backend Core y Endpoints

#### `T03-ATT-DTO`: DTOs de Asistencia
- `RecordAttendanceDto`: `paraleloId`, `asignacionId`, `fecha`, `asistencia` (array de `{ estudianteId, estado, observacion }`).
- `JustifyAbsenceDto`: `estado`, `justificado`, `observacion`.

#### `T04-ATT-SVC`: Lógica de Negocio
- `recordAttendance`: valida autorización docente, fecha no futura, no duplicidad y pertenencia de alumnos al aula. Guarda encabezado y detalles atómicamente.
- `getAttendanceByDate`: planilla por aula y fecha.
- `justifyAbsence`: conmutación justificada de inasistencia con auditoría.
- `getAttendanceStats`: consolidados por aula y alumno.

#### `T05-ATT-CTRL`: Endpoints y Módulo
- Registrar endpoints bajo `/api/v1/attendance` protegidos con `TenantContextGuard`.

---

### Fase 3: Verificación (DoD)

#### `T06-ATT-UNIT`: Pruebas Unitarias
- Validación de fecha futura, duplicidad, docente no asignado, alumno ajeno al aula y justificaciones.

#### `T07-ATT-E2E`: Pruebas de Integración E2E
- Escenario completo de toma de lista por docente asignado, rechazo a docente ajeno, justificación médica y estadísticas.
