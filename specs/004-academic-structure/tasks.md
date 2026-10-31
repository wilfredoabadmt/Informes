# Tareas de Implementación — Feature 004: Estructura Académica Institucional

**Feature:** `004-academic-structure`  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Modelado de Datos)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-ACA-PRISMA`   | Base de Datos | Actualizar `schema.prisma` con `GestionEscolar`, `Curso`, `Materia`, `Paralelo` | Ninguna | PENDIENTE |
| `T02-ACA-MIGRATION`| Base de Datos | Generar migración y aplicar DDL de PostgreSQL RLS en `gestiones_escolares` y `paralelos` | T01-ACA-PRISMA | PENDIENTE |
| `T03-ACA-SEED`     | Base de Datos | Seed de catálogo nacional del SEP (materias y grados de Primaria y Secundaria) | T02-ACA-MIGRATION | PENDIENTE |
| `T04-ACA-DTO`      | Contratos | Implementar DTOs (`school-year`, `status`, `section`, `query`) | Ninguna | PENDIENTE |
| `T05-ACA-SVC`      | Backend Core | Implementar `AcademicService` (gestiones, paralelos, árbol académico, catálogo SEP) | T02-ACA-MIGRATION, T04-ACA-DTO | PENDIENTE |
| `T06-ACA-CTRL`     | Endpoints | Implementar `AcademicController` con decoradores de seguridad multi-tenant | T05-ACA-SVC | PENDIENTE |
| `T07-ACA-MOD`      | Integración | Configurar `AcademicModule` y registrar en `AppModule` | T06-ACA-CTRL | PENDIENTE |
| `T08-ACA-AUDIT`    | Seguridad | Registrar auditoría en apertura y cierre de gestiones escolares | T05-ACA-SVC | PENDIENTE |
| `T09-ACA-UNIT`     | Verificación | Pruebas unitarias en `academic.service.spec.ts` | T05-ACA-SVC | PENDIENTE |
| `T10-ACA-E2E`      | Verificación | Pruebas E2E en `test/academic.e2e-spec.ts` demostrando aislamiento por colegio y gestión | T07-ACA-MOD, T03-ACA-SEED | PENDIENTE |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Catálogos Nacionales

#### `T01-ACA-PRISMA`: Modelado Prisma
- **Descripción:** Agregar al `schema.prisma` los modelos `GestionEscolar`, `Curso`, `Materia`, `Paralelo` y los enums `EstadoGestion`, `Turno`, `CampoSaberes`.

#### `T02-ACA-MIGRATION`: Migración y Políticas RLS
- **Descripción:** Ejecutar `prisma migrate dev` y aplicar DDL complementario:
  - `ALTER TABLE "gestiones_escolares" ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;`
  - `ALTER TABLE "paralelos" ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;`
  - Políticas de aislamiento por `institucion_id`.

#### `T03-ACA-SEED`: Catálogo Base del SEP
- **Descripción:** Actualizar `prisma/seed.ts` para cargar:
  - Cursos oficiales: 1º a 6º de Primaria Comunitaria Vocacional y 1º a 6º de Secundaria Comunitaria Productiva.
  - Materias oficiales del SEP distribuidas en los 4 Campos de Saberes (*Matemática, Comunicación y Lenguajes, Ciencias Naturales: Biología/Geografía, Ciencias Sociales, Física, Química, etc.*).

---

### Fase 2: Backend Core y Endpoints

#### `T04-ACA-DTO`: DTOs de Estructura Académica
- **Descripción:** Clases DTO en `backend/src/modules/academic/dto/`:
  - `CreateSchoolYearDto`: `anio` (2020 a 2035), `fechaInicio`, `fechaFin`, `estado`.
  - `UpdateSchoolYearStatusDto`: `estado` (`EN_PLANIFICACION`, `ABIERTA`, `CERRADA`).
  - `CreateSectionDto`: `gestionId`, `cursoId`, `letra`, `turno`, `cupoMaximo`.

#### `T05-ACA-SVC`: AcademicService
- **Descripción:** Lógica en `academic.service.ts`:
  - `createSchoolYear`: Garantiza un solo año abierto por colegio y previene duplicidad.
  - `createSection`: Valida que la gestión esté abierta y no exista el paralelo duplicado.
  - `getAcademicTree`: Retorna la jerarquía completa con paralelos y cupos.

#### `T06-ACA-CTRL`: AcademicController
- **Descripción:** Controlador NestJS bajo `/api/v1/academic`:
  - Endpoints de colegio protegidos con `TenantContextGuard`.
  - Catálogos públicos protegidos con `JwtAuthGuard`.

---

### Fase 3: Verificación (DoD)

#### `T09-ACA-UNIT`: Pruebas Unitarias
- **Descripción:** Validar en `academic.service.spec.ts`:
  - Rechazo de duplicidad de año lectivo en el mismo colegio.
  - Bloqueo de creación de aulas en gestiones cerradas.
  - Detección de paralelos duplicados en el mismo grado y turno.

#### `T10-ACA-E2E`: Pruebas de Integración E2E
- **Descripción:** Validar en `test/academic.e2e-spec.ts`:
  - Apertura de gestión 2026 en Franz Tamayo y en Mariscal Sucre sin interferencia.
  - Creación de Paralelo "1º A - Turno Mañana" en ambas instituciones de forma independiente.
  - Consulta del árbol académico institucional.
  - Cierre de gestión escolar y comprobación de inmutabilidad ante intentos de modificación posterior.
