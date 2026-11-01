# Lista de Tareas — Feature 012: Auditoría del Sistema

## Tareas

- [x] **Fase 1: Especificación y Contratos**
  - [x] Crear `spec.md` con requerimientos de trazabilidad y Principios 7 y 10.
  - [x] Crear `data-model.md` con DTOs e interfaces de auditoría.
  - [x] Crear `contracts/openapi.yaml` con especificación de endpoints.
  - [x] Crear `plan.md` y `tasks.md`.

- [x] **Fase 2: DTOs**
  - [x] Crear `query-audit-logs.dto.ts`.
  - [x] Crear `query-audit-stats.dto.ts`.
  - [x] Crear exportador `index.ts`.

- [x] **Fase 3: Servicios y Controladores**
  - [x] Expandir `AuditService` con `findLogs`, `findLogById` y `getStats`.
  - [x] Crear `AuditController` con endpoints protegidos por RBAC y contexto institucional.
  - [x] Actualizar `AuditModule`.

- [x] **Fase 4: Verificación y Pruebas**
  - [x] Compilación TypeScript (`npm run build`).
  - [x] Pruebas unitarias de `AuditService` (`npm test -- audit.service.spec.ts`).
  - [x] Pruebas E2E completas con PostgreSQL y RLS (`npm run test:e2e`).
  - [x] Suite completa sin regresiones (119 unitarias, 156 E2E).

- [x] **Fase 5: Documentación y Merge**
  - [x] Actualizar `tasks.md` a COMPLETADO.
  - [x] Commit en `feature/012-system-audit`.
  - [x] Merge a `main` con `--no-ff`.
