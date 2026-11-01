# Lista de Tareas — Feature 013: Importación y Exportación Masiva

## Tareas

- [ ] **Fase 1: Especificación y Contratos**
  - [x] Crear `spec.md` con requerimientos de carga masiva y exportación de planillas.
  - [x] Crear `data-model.md` con mapeo de columnas y DTOs.
  - [x] Crear `contracts/openapi.yaml` con especificación de endpoints.
  - [x] Crear `plan.md` y `tasks.md`.

- [ ] **Fase 2: Dependencias y DTOs**
  - [x] Instalar `xlsx` y `@types/multer`.
  - [ ] Crear DTOs de importación y exportación.

- [ ] **Fase 3: Servicios y Controlador**
  - [ ] Implementar `SpreadsheetParserService` con soporte para lectura/escritura de XLSX y CSV.
  - [ ] Implementar `DataExchangeService` con lógica transaccional de importación y exportación bajo RLS.
  - [ ] Implementar `DataExchangeController` con endpoints multipart y descargas.
  - [ ] Crear `DataExchangeModule` y registrar en `AppModule`.

- [ ] **Fase 4: Verificación y Pruebas**
  - [ ] Compilación TypeScript (`npm run build`).
  - [ ] Pruebas unitarias de `DataExchangeService` (`npm test -- data-exchange.service.spec.ts`).
  - [ ] Pruebas E2E completas con PostgreSQL y RLS (`npm run test:e2e`).
  - [ ] Suite completa sin regresiones.

- [ ] **Fase 5: Documentación y Merge**
  - [ ] Actualizar `tasks.md` a COMPLETADO.
  - [ ] Commit en `feature/013-bulk-import-export`.
  - [ ] Merge a `main` con `--no-ff`.
