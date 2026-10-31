# Tareas de Implementación — Feature 010: Centralizadores de Calificaciones y Promedios Anuales

**Feature:** `010-grades-centralizers`  
**Estado:** COMPLETADO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Entidades 8, 9, 12 y 14; Sección 6 - RBAC Contextual; Sección 7 - Módulo 14)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL con RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-CENT-PRISMA`   | Base de Datos | Agregar `SituacionFinalEstudiante` y campos a `Inscripcion` en `schema.prisma` | Ninguna | COMPLETADO |
| `T02-CENT-MIGRATION`| Base de Datos | Generar migración y verificar esquema en PostgreSQL | T01-CENT-PRISMA | COMPLETADO |
| `T03-CENT-DTO`      | Contratos | Implementar DTOs para centralizadores trimestrales, anuales y cierre | Ninguna | COMPLETADO |
| `T04-CENT-SVC`      | Backend Core | Implementar `CentralizersService` (matriz trimestral, promedios anuales y promoción) | T02-CENT-MIGRATION, T03-CENT-DTO | COMPLETADO |
| `T05-CENT-CTRL`     | Endpoints | Implementar `CentralizersController` y registrar en `CentralizersModule` y `AppModule` | T04-CENT-SVC | COMPLETADO |
| `T06-CENT-UNIT`     | Verificación | Pruebas unitarias en `centralizers.service.spec.ts` | T04-CENT-SVC | COMPLETADO |
| `T07-CENT-E2E`      | Verificación | Pruebas E2E en `test/centralizers.e2e-spec.ts` con centralizador trimestral, anual y cierre | T05-CENT-CTRL | COMPLETADO |

---

## Detalle de Tareas

### Fase 1: Base de Datos y Persistencia

#### `T01-CENT-PRISMA`: Modelado Prisma
- Enum `SituacionFinalEstudiante` (`PROMOVIDO`, `RETENIDO`).
- En `model Inscripcion`: agregar `promedioAnual` (`Float?`) y `situacionFinal` (`SituacionFinalEstudiante?`).

#### `T02-CENT-MIGRATION`: Migración
- Ejecutar migración para aplicar los nuevos campos en `inscripciones`.

---

### Fase 2: Backend Core y Endpoints

#### `T03-CENT-DTO`: DTOs de Centralizadores
- `QueryTrimesterCentralizerDto`: `paraleloId`, `periodoId`.
- `QueryAnnualCentralizerDto`: `paraleloId`.
- `FinalizeCentralizerDto`: `paraleloId`.

#### `T04-CENT-SVC`: Lógica de Negocio
- `getTrimesterCentralizer`: construye matriz estudiantes $\times$ materias, notas de 1 a 100, promedios y materias reprobadas.
- `getAnnualCentralizer`: promedia los 3 trimestres por materia, calcula promedio general anual y evalúa situación final.
- `finalizeAnnualCentralizer`: persiste situaciones finales en `inscripciones` bajo RLS y registra auditoría.

#### `T05-CENT-CTRL`: Endpoints y Módulo
- Endpoints bajo `/api/v1/centralizers` protegidos con `TenantContextGuard`.

---

### Fase 3: Verificación (DoD)

#### `T06-CENT-UNIT`: Pruebas Unitarias
- Validación matricial, promedios trimestrales y anuales, regla de promoción ($\ge 51$) y persistencia de cierre.

#### `T07-CENT-E2E`: Pruebas de Integración E2E
- Escenario completo con 3 trimestres, centralizador trimestral, centralizador anual, cierre formal con promovidos/retenidos y aislamiento RLS.

