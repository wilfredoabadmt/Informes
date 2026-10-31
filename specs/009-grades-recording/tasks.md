# Tareas de Implementación — Feature 009: Registro de Calificaciones Cuantitativas y Cualitativas

**Feature:** `009-grades-recording`  
**Estado:** COMPLETADO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidad 14; Sección 6 - RBAC Contextual; Sección 7 - Módulo 13)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL con RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-GRAD-PRISMA`   | Base de Datos | Agregar modelo `Calificacion` y relaciones en `schema.prisma` | Ninguna | COMPLETADO Y VERIFICADO |
| `T02-GRAD-MIGRATION`| Base de Datos | Generar migración y aplicar PostgreSQL RLS a `calificaciones` | T01-GRAD-PRISMA | COMPLETADO Y VERIFICADO |
| `T03-GRAD-DTO`      | Contratos | Implementar DTOs de carga en bloque, planilla y modificación de notas | Ninguna | COMPLETADO Y VERIFICADO |
| `T04-GRAD-SVC`      | Backend Core | Implementar `GradesService` (carga ágil en bloque, consolidación trimestral y auditoría) | T02-GRAD-MIGRATION, T03-GRAD-DTO | COMPLETADO Y VERIFICADO |
| `T05-GRAD-CTRL`     | Endpoints | Implementar `GradesController` y registrar en `GradesModule` y `AppModule` | T04-GRAD-SVC | COMPLETADO Y VERIFICADO |
| `T06-GRAD-UNIT`     | Verificación | Pruebas unitarias en `grades.service.spec.ts` | T04-GRAD-SVC | COMPLETADO Y VERIFICADO |
| `T07-GRAD-E2E`      | Verificación | Pruebas E2E en `test/grades.e2e-spec.ts` con carga de notas, consolidación y RLS | T05-GRAD-CTRL | COMPLETADO Y VERIFICADO |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Persistencia

#### `T01-GRAD-PRISMA`: Modelado Prisma
- Modelo `Calificacion`: `institucionId`, `evaluacionId`, `estudianteId`, `nota` (Int), `observacion` (VarChar 255).
- Restricción única: `@@unique([evaluacionId, estudianteId])`.
- Relaciones con `UnidadEducativa`, `Evaluacion` y `Estudiante`.

#### `T02-GRAD-MIGRATION`: Migración y RLS
- Generar script de migración y habilitar directivas RLS `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` sobre `calificaciones`.

---

### Fase 2: Backend Core y Endpoints

#### `T03-GRAD-DTO`: DTOs de Calificaciones
- `RecordGradesBatchDto`: `evaluacionId`, array de `{ estudianteId, nota, observacion }`.
- `UpdateGradeDto`: `nota`, `observacion`, `motivoRectificacion`.

#### `T04-GRAD-SVC`: Lógica de Negocio
- `recordGradesBatch`: valida titularidad de asignación, trimestre `ABIERTO`, pertenencia al aula con matrícula `EFECTIVO`, nota $\in [0, \text{puntajeMaximo}]$ y ejecuta `upsert` transaccional con auditoría.
- `getGradesByEvaluation`: planilla de notas de un instrumento específico.
- `getTrimesterGradesSheet`: agrega notas por dimensión (Ser, Saber, Hacer, Decidir, Autoevaluación), calcula nota final sobre 100 y estado `APROBADO` / `EN_DESARROLLO`.
- `updateGrade`: actualiza nota individual registrando traza previa en auditoría.

#### `T05-GRAD-CTRL`: Endpoints y Módulo
- Endpoints bajo `/api/v1/grades` protegidos con `TenantContextGuard`.

---

### Fase 3: Verificación (DoD)

#### `T06-GRAD-UNIT`: Pruebas Unitarias
- Validación de límites de nota, trimestre no abierto, docente ajeno, cálculos consolidados y auditoría.

#### `T07-GRAD-E2E`: Pruebas de Integración E2E
- Escenario completo de carga en bloque, consolidación trimestral, rechazo a docente ajeno, bloqueo tras cierre de trimestre y aislamiento RLS.
