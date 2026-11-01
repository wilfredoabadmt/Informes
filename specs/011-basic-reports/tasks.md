# Lista de Tareas — Feature 011: Reportes Básicos

## Tareas

- [ ] **Fase 1: Especificación y Contratos**
  - [x] Crear `spec.md` con requerimientos del SEP para listas, boletines y libretas.
  - [x] Crear `data-model.md` con DTOs e interfaces de reportes.
  - [x] Crear `contracts/openapi.yaml` con especificación de endpoints JSON y PDF.
  - [x] Crear `plan.md` y `tasks.md`.

- [ ] **Fase 2: Dependencias y DTOs**
  - [x] Instalar `pdfkit` y `@types/pdfkit`.
  - [ ] Crear `QueryCourseRosterDto` (`paraleloId`).
  - [ ] Crear `QueryTrimesterBulletinDto` (`inscripcionId`, `periodoId`).
  - [ ] Crear `QuerySchoolReportCardDto` (`inscripcionId`).

- [ ] **Fase 3: Servicios y Controladores**
  - [ ] Implementar `PdfGeneratorService` con soporte para lista de curso, boletín trimestral y libreta escolar en PDF.
  - [ ] Implementar `ReportsService` con agregación de datos bajo RLS multi-tenant y auditoría.
  - [ ] Implementar `ReportsController` con endpoints JSON y streaming de PDFs.
  - [ ] Implementar `ReportsModule` y registrar en `AppModule`.

- [ ] **Fase 4: Verificación y Pruebas**
  - [ ] Compilación TypeScript (`npm run build`).
  - [ ] Pruebas unitarias de `ReportsService` (`npm test -- reports.service.spec.ts`).
  - [ ] Pruebas E2E completas con PostgreSQL y RLS (`npm run test:e2e`).
  - [ ] Suite completa de pruebas unitarias y E2E sin regresiones.

- [ ] **Fase 5: Documentación y Merge**
  - [ ] Actualizar `tasks.md` a COMPLETADO.
  - [ ] Commit en `feature/011-basic-reports`.
  - [ ] Merge a `main` con `--no-ff`.
