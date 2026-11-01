# Lista de Tareas — Feature 013: Importación y Exportación Masiva

## Tareas

- [x] **Fase 1: Especificación y Contratos**
  - [x] Crear `spec.md` con requerimientos de carga masiva y exportación de planillas.
  - [x] Crear `data-model.md` con mapeo de columnas y DTOs.
  - [x] Crear `contracts/openapi.yaml` con especificación de endpoints.
  - [x] Crear `plan.md` y `tasks.md`.

- [x] **Fase 2: Dependencias y DTOs**
  - [x] Instalar `xlsx` y `@types/multer`.
  - [x] Crear DTOs de importación y exportación.

- [x] **Fase 3: Servicios y Controlador**
  - [x] Implementar `SpreadsheetParserService` con soporte para lectura/escritura de XLSX y CSV.
  - [x] Implementar `DataExchangeService` con lógica transaccional de importación y exportación bajo RLS.
  - [x] Implementar `DataExchangeController` con endpoints multipart y descargas.
  - [x] Crear `DataExchangeModule` y registrar en `AppModule`.

- [x] **Fase 4: Verificación y Pruebas**
  - [x] Compilación TypeScript (`npm run build`).
  - [x] Pruebas unitarias de `DataExchangeService` (`npm test -- data-exchange.service.spec.ts`).
  - [x] Pruebas E2E completas con PostgreSQL y RLS (`npm run test:e2e`).
  - [x] Suite completa sin regresiones (127 unitarias, 166 E2E).

- [x] **Fase 5: Documentación y Merge**
  - [x] Actualizar `tasks.md` a COMPLETADO.
  - [x] Commit en `feature/013-bulk-import-export`.
  - [x] Merge a `main` con `--no-ff`.
