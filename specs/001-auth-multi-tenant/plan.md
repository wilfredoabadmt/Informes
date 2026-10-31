# Technical Plan: 001-auth-multi-tenant
## Plan de Implementación de Autenticación Multi-Tenant y Contexto Institucional

**Feature:** `001-auth-multi-tenant`  
**Fecha:** 2026-10-31  
**Estado:** Plan Técnico Aprobado  
**Documentos Relacionados:** [spec.md](spec.md) | [data-model.md](data-model.md) | [ADR-001](../adrs/ADR-001-prisma-postgresql-rls.md) | [ADR-002](../adrs/ADR-002-multi-tenant-auth-context.md)

---

## 1. Constitution Check (Evaluación de Conformidad Constitucional)

Antes de autorizar las tareas de implementación, se valida el cumplimiento de los principios de la Constitución V1.1.0:

| Principio Constitucional | Estado | Evidencia de Cumplimiento en este Plan |
| :--- | :---: | :--- |
| **I. Seguridad y Aislamiento Multi-Tenant** | **PASS** | El backend jamás confía en el cliente. El `TenantContextGuard` valida en BD que el usuario tenga vinculación activa con la institución antes de permitir el acceso. |
| **II. Multi-Tenancy Real con RLS** | **PASS** | Toda tabla transaccional implementa políticas RLS. El cliente Prisma inyecta `SET LOCAL app.current_institution_id` en transacciones interactivas (ADR-001). |
| **III. Identidad Única vs. Vinculación** | **PASS** | `Persona` y `Usuario` son entidades globales; la vinculación es una entidad M:N separada que habilita acceso contextual (ADR-002). |
| **IV. Soberanía y Despliegue Local** | **PASS** | Cero dependencias de servicios SaaS propietarios; PostgreSQL, Argon2 y NestJS corren 100% sobre Docker local. |
| **V. Calidad Verificable (DoD)** | **PASS** | Tipos estrictos en TypeScript, DTOs validados con `class-validator` y tests automatizados de aislamiento multi-tenant. |
| **VII. Trazabilidad y Auditoría** | **PASS** | Todo intento de acceso bloqueado o cambio de contexto se registra en la tabla `auditoria`. |

---

## 2. Arquitectura de Componentes (Backend NestJS)

```
[ HTTP Request: Bearer JWT + X-Institution-Id ]
                     │
                     ▼
             [ JwtAuthGuard ] ──► Valida token de identidad global (sub, email)
                     │
                     ▼
           [ TenantContextGuard ] ──► Consulta vinculación activa en BD / Cache
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   [ No Vinculado ]        [ Vinculado y Activo ]
         │                       │
   403 Forbidden                 ▼
                       Inyecta TenantContext en Request
                                 │
                                 ▼
                     [ Controller / Service ]
                                 │
                                 ▼
                 [ Prisma Tenant Extension ]
                                 │
                     SET LOCAL app.current_institution_id = ...
                                 │
                                 ▼
                    [ PostgreSQL Engine + RLS ]
```

### Componentes Clave:
1. **`JwtStrategy` (Passport):** Valida la firma del token JWT y extrae `userId`.
2. **`TenantContextGuard`:** Extrae el header `X-Institution-Id`, verifica que exista un registro activo en `vinculaciones_institucionales` para el par `(usuario_id, institucion_id)`, y adjunta el rol institucional correspondiente en `request.tenantContext`.
3. **`TenantPrismaService`:** Provee clientes de Prisma extendidos que configuran la variable de sesión `app.current_institution_id` dentro de transacciones aisladas.
4. **`AuthService`:** Orquesta la verificación de contraseñas con Argon2id, generación de tokens y consulta de instituciones disponibles.
5. **`AuthController`:** Expone los endpoints REST bajo el prefijo `/api/v1/auth`.

---

## 3. Endpoints de la API (Contratos REST)

| Método | Ruta | Descripción | Headers Requeridos | Respuesta Exitosa |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Iniciar sesión y obtener JWT + lista de colegios vinculados. | Ninguno | `200 OK` (Tokens + Instituciones) |
| `GET` | `/api/v1/auth/me` | Obtener perfil del usuario autenticado. | `Authorization: Bearer <JWT>` | `200 OK` (Datos de Persona y Usuario) |
| `GET` | `/api/v1/auth/me/institutions` | Listar unidades educativas donde el usuario tiene vinculación. | `Authorization: Bearer <JWT>` | `200 OK` (Array de Instituciones y Roles) |
| `GET` | `/api/v1/auth/me/context` | Obtener el contexto y permisos del colegio activo. | `Bearer <JWT>` + `X-Institution-Id` | `200 OK` (Detalle de Institución y Permisos) |
| `POST` | `/api/v1/auth/refresh` | Renovar Access Token utilizando Refresh Token rotativo. | Ninguno (body: refreshToken) | `200 OK` (Nuevo par de tokens) |
| `POST` | `/api/v1/auth/logout` | Revocar Refresh Token y cerrar sesión activa. | `Authorization: Bearer <JWT>` | `204 No Content` |

---

## 4. Estrategia de Pruebas y Verificación

1. **Prueba Unitaria de Hashing:** Comprobar que Argon2id genera hashes deterministas en seguridad y valida contraseñas correctamente.
2. **Prueba de Integración de `TenantContextGuard`:**
   - Usuario A intenta acceder a su institución asignada ➔ Permite acceso `200 OK`.
   - Usuario A intenta acceder a una institución existente pero no asignada ➔ Bloquea con `403 Forbidden`.
   - Usuario envía UUID malformado o cabecera vacía ➔ Responde `400 Bad Request`.
3. **Prueba de Aislamiento PostgreSQL RLS:**
   - Comprobar mediante consulta directa que `SET LOCAL app.current_institution_id = 'A'` impide ver registros con `institution_id = 'B'`.

