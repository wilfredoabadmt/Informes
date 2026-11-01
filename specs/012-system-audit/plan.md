# Plan de Implementación — Feature 012: Auditoría del Sistema

## 1. Arquitectura Técnica

El módulo `AuditModule` expandirá sus capacidades para exponer una API de inspección segura:
- `AuditController`: Endpoints de consulta (`/audit/logs`, `/audit/logs/:id`, `/audit/stats`).
- `AuditService`:
  - `log(entry)`: Método existente de inserción inmutable.
  - `findLogs(query, actor)`: Búsqueda paginada con filtrado dinámico respetando el contexto Nivel 1 vs Nivel 2.
  - `findLogById(id, actor)`: Consulta de detalle con verificación de aislamiento institucional.
  - `getStats(query, actor)`: Agregación de eventos por tipo y top de acciones.
- Seguridad y RBAC:
  - Solo roles autorizados pueden acceder a auditoría: `SUPERADMIN`, `ADMIN_CENTRAL`, `DIRECTOR`, `ADMIN_INSTITUCIONAL`.
  - Los roles Nivel 2 solo pueden consultar registros donde `institucion_id` coincida con su institución activa.
  - El Principio 7 genera automáticamente una traza cuando un Superadmin consulta registros transversales (`GLOBAL_AUDIT_INSPECTED`).

---

## 2. Fases de Ejecución

1. **Fase 1: Especificación y Contratos** ✅
2. **Fase 2: DTOs de Auditoría**
   - Crear `query-audit-logs.dto.ts` y `query-audit-stats.dto.ts`.
3. **Fase 3: Expansión de AuditService y Creación de AuditController**
   - Implementar `findLogs`, `findLogById`, `getStats` en `AuditService`.
   - Implementar `AuditController`.
   - Actualizar `AuditModule`.
4. **Fase 4: Pruebas Unitarias**
   - Probar `AuditService` (filtrado Nivel 1 vs Nivel 2, excepciones, paginación, cálculo de estadísticas).
5. **Fase 5: Pruebas de Integración E2E**
   - Verificación de consulta de logs de Superadmin (global) y Director (local).
   - Verificación de rechazo cruzado de institución (403/404).
   - Verificación de generación de evento de auditoría de consulta transversal (Principio 7).
6. **Fase 6: Merge a Main**
