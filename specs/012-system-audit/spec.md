# Especificación de Requerimientos — Feature 012: Auditoría del Sistema e Inspección de Seguridad

**Feature:** `012-system-audit`  
**Módulo:** Auditoría del Sistema e Inspección de Trazas Inmutables (Nivel 1 y Nivel 2)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Sección 2 - Niveles 1 y 2; Sección 3 - Principios 7 y 10; Sección 4 - Entidad 16; Sección 6 - RBAC Contextual; Sección 7 - Módulo 16)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

Conforme a las directivas de seguridad e integridad del Ministerio de Educación de Bolivia y la Constitución del Sistema:
1. **Inmutabilidad y Trazabilidad Estricta (Principio 10):**
   - Todos los eventos sensibles del sistema (inicios de sesión, cambios de contexto institucional, altas/bajas de docentes, modificaciones y rectificaciones de notas, emisiones de centralizadores y boletines oficiales) generan registros de auditoría obligatorios e inmutables.
   - Queda estrictamente prohibida la eliminación física (*hard-delete*) o modificación de registros de auditoría por cualquier rol de usuario.
2. **Auditoría Nivel 1 (Administración Central y Superadministrador):**
   - Monitoreo global de la plataforma para detectar incidentes de seguridad, intentos de acceso fallidos y trazas interinstitucionales.
   - Puede filtrar por cualquier unidad educativa (`institucionId`), tipo de evento, usuario o rango temporal.
   - **Principio 7 (Privilegio Central Auditado):** Cuando un usuario de Nivel 1 realiza consultas agregadas o transversales entre múltiples unidades educativas, el propio sistema genera automáticamente una traza de auditoría de dicha consulta.
3. **Auditoría Nivel 2 (Administración Institucional y Directores):**
   - Supervisión interna de la Unidad Educativa para verificar acciones docentes y administrativas locales.
   - Acceso estrictamente restringido a los eventos correspondientes a su institución activa (`institucionId`). El sistema bloqueará cualquier intento de consultar logs de otros colegios.
4. **Protección de Datos Sensibles:**
   - La API expone endpoints únicamente de lectura (`GET`). No existen rutas públicas de modificación (`PUT`/`PATCH`/`DELETE`/`POST` manual de auditoría) para clientes externos; los registros se generan exclusivamente desde los servicios del backend.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Consulta Paginada de Bitácora de Auditoría
**Como** Director o Administrador Central  
**Quiero** consultar los registros de auditoría con filtros por tipo, acción, usuario y rango de fechas  
**Para** supervisar la actividad operativa y detectar oportunamente anomalías o manipulaciones de notas.

#### Criterios de Aceptación:
- Permite filtrar por:
  - `tipo` (Enum `TipoAuditoria`: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `CONTEXT_SWITCH`, `SECURITY_VIOLATION`, `USER_CREATE`, `USER_UPDATE`, `TEACHER_LINK`, `TEACHER_UNLINK`).
  - `accion` (búsqueda parcial o exacta de texto).
  - `usuarioId` (UUID).
  - `fechaDesde` y `fechaHasta` (rango de fechas ISO).
  - `page` (default 1) y `limit` (default 20, máx 100).
- Para Nivel 2: La consulta se restringe forzosamente a la institución activa del token (`tenant.institutionId`).
- Para Nivel 1: Puede consultar globalmente o filtrar por una `institucionId` específica.
- Retorna metadatos de paginación (`total`, `page`, `limit`, `totalPages`) y lista de eventos ordenada cronológicamente de forma descendente (`timestamp desc`).

---

### US-002: Detalle de Evento de Auditoría
**Como** Auditor o Director Institucional  
**Quiero** consultar el detalle completo de un registro de auditoría por su ID  
**Para** inspeccionar el payload JSON (`detalle`), dirección IP, agente de usuario y actor responsable.

#### Criterios de Aceptación:
- Endpoint: `GET /audit/logs/:id`.
- Si el usuario es de Nivel 2, valida que el registro pertenezca a su institución. Si pertenece a otra institución, responde con `404 Not Found` (aislamiento multi-tenant).
- Retorna el registro íntegro con los datos del usuario asociado (nombre, email).

---

### US-003: Resumen Estadístico de Actividad y Seguridad
**Como** Administrador Central o Director de Unidad Educativa  
**Quiero** obtener métricas consolidadas de auditoría para un rango temporal  
**Para** visualizar el volumen de accesos, intentos fallidos, violaciones de seguridad y modificaciones de notas.

#### Criterios de Aceptación:
- Endpoint: `GET /audit/stats`.
- Parámetros opcionales: `fechaDesde`, `fechaHasta`.
- Retorna:
  - `totalEventos`: cantidad total de registros en el periodo.
  - `porTipo`: conteo discriminado por cada valor de `TipoAuditoria`.
  - `topAcciones`: las 5 acciones más frecuentes con su conteo.
- Aplica restricción multi-tenant por institución para usuarios de Nivel 2.

---

### US-004: Inmutabilidad y Cumplimiento del Principio 7
**Como** Oficial de Seguridad de la Información  
**Quiero** asegurar que las consultas globales de Nivel 1 queden auditadas y que nadie pueda alterar la bitácora  
**Para** garantizar la inalterabilidad legal de la información del SEP.

#### Criterios de Aceptación:
- Consultas globales ejecutadas por Nivel 1 generan evento `GLOBAL_AUDIT_INSPECTED`.
- No existe ningún endpoint de mutación o borrado de auditoría.
