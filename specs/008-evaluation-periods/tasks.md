# Tareas de Implementación — Feature 008: Periodos de Evaluación y Configuración de Dimensiones SEP

**Feature:** `008-evaluation-periods`  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidades 7 y 13; Sección 6 - RBAC Contextual; Sección 7 - Módulo 12)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL con RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-EVAL-PRISMA`   | Base de Datos | Agregar `TipoPeriodo`, `EstadoPeriodo`, `DimensionEvaluacion`, `PeriodoEvaluacion` y `Evaluacion` a `schema.prisma` | Ninguna | PENDIENTE |
| `T02-EVAL-MIGRATION`| Base de Datos | Generar migración y aplicar PostgreSQL RLS a `periodos_evaluacion` y `evaluaciones` | T01-EVAL-PRISMA | PENDIENTE |
| `T03-EVAL-DTO`      | Contratos | Implementar DTOs de periodos y evaluaciones con validación de dimensiones | Ninguna | PENDIENTE |
| `T04-EVAL-SVC`      | Backend Core | Implementar `EvaluationsService` (gestión de trimestres, apertura/cierre, instrumentos y topes SEP) | T02-EVAL-MIGRATION, T03-EVAL-DTO | PENDIENTE |
| `T05-EVAL-CTRL`     | Endpoints | Implementar `EvaluationsController` y registrar en `EvaluationsModule` y `AppModule` | T04-EVAL-SVC | PENDIENTE |
| `T06-EVAL-UNIT`     | Verificación | Pruebas unitarias en `evaluations.service.spec.ts` | T04-EVAL-SVC | PENDIENTE |
| `T07-EVAL-E2E`      | Verificación | Pruebas E2E en `test/evaluations.e2e-spec.ts` con ciclo de trimestres, topes de dimensión y RLS | T05-EVAL-CTRL | PENDIENTE |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Persistencia

#### `T01-EVAL-PRISMA`: Modelado Prisma
- Enums: `TipoPeriodo` (`PRIMER_TRIMESTRE`, `SEGUNDO_TRIMESTRE`, `TERCER_TRIMESTRE`), `EstadoPeriodo` (`PROGRAMADO`, `ABIERTO`, `CERRADO`), `DimensionEvaluacion` (`SER`, `SABER`, `HACER`, `DECIDIR`, `AUTOEVALUACION`).
- Modelo `PeriodoEvaluacion`: `institucionId`, `gestionId`, `periodo`, `fechaInicio`, `fechaFin`, `fechaLimiteNotas`, `estado`. Restricción única `@@unique([gestionId, periodo])`.
- Modelo `Evaluacion`: `institucionId`, `asignacionId`, `periodoId`, `dimension`, `nombre`, `descripcion`, `puntajeMaximo`, `fechaEvaluacion`.

#### `T02-EVAL-MIGRATION`: Migración y RLS
- Generar script de migración y habilitar directivas RLS `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` sobre `periodos_evaluacion` y `evaluaciones`.

---

### Fase 2: Backend Core y Endpoints

#### `T03-EVAL-DTO`: DTOs de Periodos y Evaluaciones
- `CreateEvaluationPeriodDto`: `gestionId`, `periodo`, `fechaInicio`, `fechaFin`, `fechaLimiteNotas`.
- `UpdatePeriodStatusDto`: `estado`.
- `CreateEvaluationDto`: `asignacionId`, `periodoId`, `dimension`, `nombre`, `descripcion`, `puntajeMaximo`, `fechaEvaluacion`.
- `UpdateEvaluationDto`: campos opcionales para edición.

#### `T04-EVAL-SVC`: Lógica de Negocio
- `createEvaluationPeriod`: valida gestión activa y orden cronológico.
- `updatePeriodStatus`: conmuta estado asegurando que solo un trimestre esté `ABIERTO`.
- `createEvaluation`: valida asignación pedagógica activa del maestro, trimestre abierto, fecha dentro del trimestre y que no se superen los topes estatutarios (SER 10, SABER 35, HACER 35, DECIDIR 10, AUTO 10).
- `updateEvaluation` & `deleteEvaluation`: valida pertenencia y que el trimestre no esté cerrado.

#### `T05-EVAL-CTRL`: Endpoints y Módulo
- Endpoints bajo `/api/v1/evaluation-periods` y `/api/v1/evaluations` protegidos con `TenantContextGuard`.

---

### Fase 3: Verificación (DoD)

#### `T06-EVAL-UNIT`: Pruebas Unitarias
- Validación cronológica, restricción de único trimestre abierto, autorización docente, topes de dimensiones y bloqueo post-cierre.

#### `T07-EVAL-E2E`: Pruebas de Integración E2E
- Escenario integral: calendarización de trimestres, apertura, creación de evaluaciones en SABER/HACER/SER/DECIDIR, rechazo de excesos, cierre de trimestre y bloqueo de mutaciones bajo RLS.
