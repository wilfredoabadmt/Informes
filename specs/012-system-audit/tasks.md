# Lista de Tareas — Feature 012: Auditoría del Sistema

## Tareas

- [ ] **Fase 1: Especificación y Contratos**
  - [x] Crear `spec.md` con requerimientos de trazabilidad y Principios 7 y 10.
  - [x] Crear `data-model.md` con DTOs e interfaces de auditoría.
  - [x] Crear `contracts/openapi.yaml` con especificación de endpoints.
  - [x] Crear `plan.md` y `tasks.md`.

- [ ] **Fase 2: DTOs**
  - [ ] Crear `query-audit-logs.dto.ts`.
  - [ ] Crear `query-audit-stats.dto.ts`.
  - [ ] Crear exportador `index.ts`.

- [ ] **Fase 3: Servicios y Controladores**
  - [ ] Expandir `AuditService` con `findLogs`, `findLogById` y `getStats`.
  - [ ] Crear `AuditController` con endpoints protegidos por RBAC y contexto institucional.
  - [ ] Actualizar `AuditModule`.

- [ ] **Fase 4: Verificación y Pruebas**
  - [ ] Compilación TypeScript (`npm run build`).
  - [ ] Pruebas unitarias de `AuditService` (`npm test -- audit.service.spec.ts`).
  - [ ] Pruebas E2E completas con PostgreSQL y RLS (`npm run test:e2e`).
  - [ ] Suite completa sin regresiones.

- [ ] **Fase 5: Documentación y Merge**
  - [ ] Actualizar `tasks.md` a COMPLETADO.
  - [ ] Commit en `feature/012-system-audit`.
  - [ ] Merge a `main` con `--no-ff`.
