# Lista de Tareas — Feature 011: Reportes Básicos

## Tareas

- [x] **Fase 1: Especificación y Contratos**
  - [x] Crear `spec.md` con requerimientos del SEP para listas, boletines y libretas.
  - [x] Crear `data-model.md` con DTOs e interfaces de reportes.
  - [x] Crear `contracts/openapi.yaml` con especificación de endpoints JSON y PDF.
  - [x] Crear `plan.md` y `tasks.md`.

- [x] **Fase 2: Dependencias y DTOs**
  - [x] Instalar `pdfkit` y `@types/pdfkit`.
  - [x] Crear `QueryCourseRosterDto` (`paraleloId`).
  - [x] Crear `QueryTrimesterBulletinDto` (`inscripcionId`, `periodoId`).
  - [x] Crear `QuerySchoolReportCardDto` (`inscripcionId`).

- [x] **Fase 3: Servicios y Controladores**
  - [x] Implementar `PdfGeneratorService` con soporte para lista de curso, boletín trimestral y libreta escolar en PDF.
  - [x] Implementar `ReportsService` con agregación de datos bajo RLS multi-tenant y auditoría.
  - [x] Implementar `ReportsController` con endpoints JSON y streaming de PDFs.
  - [x] Implementar `ReportsModule` y registrar en `AppModule`.

- [x] **Fase 4: Verificación y Pruebas**
  - [x] Compilación TypeScript (`npm run build`).
  - [x] Pruebas unitarias de `ReportsService` (`npm test -- reports.service.spec.ts`).
  - [x] Pruebas E2E completas con PostgreSQL y RLS (`npm run test:e2e`).
  - [x] Suite completa de pruebas unitarias y E2E sin regresiones (113 unitarias, 148 E2E).

- [x] **Fase 5: Documentación y Merge**
  - [x] Actualizar `tasks.md` a COMPLETADO.
  - [x] Commit en `feature/011-basic-reports`.
  - [x] Merge a `main` con `--no-ff`.
