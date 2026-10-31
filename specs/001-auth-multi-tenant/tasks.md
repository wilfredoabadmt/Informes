# Tareas de Implementación — Feature 001: Autenticación y Multi-Tenant

**Feature:** `001-auth-multi-tenant`  
**Estado:** PLANIFICADO  
**Constitución Referencia:** V1.1.0 (Decisiones 001 a 005)  
**ADRs Aplicables:** ADR-001 (PostgreSQL RLS), ADR-002 (Auth & Tenant Context), ADR-003 (Monolito Modular)  
**DoD:** Código compilado + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E con PostgreSQL RLS + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-ENV` | Infraestructura | Configurar variables de entorno y conexión a PostgreSQL | Ninguna | PENDIENTE |
| `T02-PRISMA` | Base de Datos | Definir `schema.prisma` completo con modelos de identidad, multi-tenant y auditoría | T01-ENV | PENDIENTE |
| `T03-MIGRATION` | Base de Datos | Generar migración inicial y aplicar DDL de PostgreSQL RLS (`ENABLE ROW LEVEL SECURITY`) | T02-PRISMA | PENDIENTE |
| `T04-SEED` | Base de Datos | Implementar seed con Superadmin, 2 Unidades Educativas y 1 Maestro multi-institución | T03-MIGRATION | PENDIENTE |
| `T05-PRISMA-RLS` | Backend Core | Implementar `PrismaService` con extensión de contexto tenant (`SET LOCAL app.current_institution_id`) | T03-MIGRATION | PENDIENTE |
| `T06-HASH` | Backend Core | Implementar servicio de hashing seguro de contraseñas con Argon2id | Ninguna | PENDIENTE |
| `T07-AUTH-JWT` | Backend Core | Configurar módulo JWT (`JwtModule`, `JwtStrategy`, `JwtAuthGuard`) | T05-PRISMA-RLS | PENDIENTE |
| `T08-TENANT-GUARD`| Backend Core | Implementar `TenantContextGuard` y decorador `@TenantContext()` para validación de acceso institucional | T07-AUTH-JWT | PENDIENTE |
| `T09-AUTH-SERVICE`| Endpoints | Implementar `AuthService` (login, me, institutions, selectContext, refresh, logout) | T06-HASH, T08-TENANT-GUARD | PENDIENTE |
| `T10-AUTH-CTRL`   | Endpoints | Implementar `AuthController` con validación DTO (`class-validator`) según OpenAPI | T09-AUTH-SERVICE | PENDIENTE |
| `T11-AUDIT-LOG`   | Seguridad | Implementar servicio de auditoría para registro de accesos y violaciones de aislamiento | T05-PRISMA-RLS | PENDIENTE |
| `T12-TEST-UNIT`   | Verificación | Pruebas unitarias de Argon2, validación de credenciales y lógica de tokens | T10-AUTH-CTRL | PENDIENTE |
| `T13-TEST-RLS`    | Verificación | Pruebas de integración E2E de PostgreSQL RLS y aislamiento estricto multi-tenant | T10-AUTH-CTRL, T04-SEED | PENDIENTE |

---

## Detalle de Tareas

### Fase 1: Infraestructura y Base de Datos

#### `T01-ENV`: Configurar variables de entorno y conexión a PostgreSQL
- **Descripción:** Actualizar `.env.example` y crear `.env` local con `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/maestros_db?schema=public`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT=3000`.
- **Criterio de Aceptación:** Archivo `.env` cargado y conexión verificada a `maestros_db`.

#### `T02-PRISMA`: Modelado Prisma ORM
- **Descripción:** Crear `backend/prisma/schema.prisma` con las entidades: `Persona`, `Usuario`, `Maestro`, `UnidadEducativa`, `VinculacionInstitucional`, `RefreshToken`, `RegistroAuditoria`.
- **Criterio de Aceptación:** `npx prisma validate` pasa sin advertencias ni errores de sintaxis.

#### `T03-MIGRATION`: Migración PostgreSQL y activación de RLS
- **Descripción:** Generar migración SQL con Prisma y agregar el script SQL complementario de RLS:
  - `ALTER TABLE "VinculacionInstitucional" ENABLE ROW LEVEL SECURITY;`
  - `ALTER TABLE "VinculacionInstitucional" FORCE ROW LEVEL SECURITY;`
  - Políticas de aislamiento por `institucionId` con bypass auditado para administradores centrales.
- **Criterio de Aceptación:** Migración ejecutada exitosamente en `maestros_db`. Comprobación con `psql` de que RLS está activo (`relrowsecurity = true`).

#### `T04-SEED`: Seed de pruebas multi-tenant
- **Descripción:** Crear script de seed `prisma/seed.ts` con datos representativos del Estado Plurinacional de Bolivia:
  - 1 Superadmin central.
  - Institución A: "U.E. Franz Tamayo" (SIE 80730045, La Paz).
  - Institución B: "U.E. Mariscal Sucre" (SIE 80730046, El Alto).
  - 1 Maestro vinculado a ambas instituciones con roles activos.
  - 1 Maestro vinculado únicamente a la Institución A.
- **Criterio de Aceptación:** `npx prisma db seed` inserta los registros sin conflictos de clave única.

---

### Fase 2: Backend Core Multi-Tenant

#### `T05-PRISMA-RLS`: PrismaService con Contexto RLS
- **Descripción:** Implementar en `backend/src/database/prisma.service.ts` el cliente extendido que inyecta en cada transacción `SET LOCAL app.current_institution_id = '${institutionId}'` cuando se ejecuta una operación bajo contexto institucional.
- **Criterio de Aceptación:** El cliente Prisma establece la variable de sesión dentro de `$transaction` sin fuga de estado entre conexiones del pool.

#### `T06-HASH`: Servicio de Password Hashing con Argon2id
- **Descripción:** Crear servicio `Argon2Service` con funciones `hash(password)` y `verify(hash, password)` utilizando parámetros de seguridad OWASP para memoria y tiempo.
- **Criterio de Aceptación:** Pruebas unitarias validando hashes válidos, rechazo de contraseñas erróneas y resistencia a timing attacks.

#### `T07-AUTH-JWT`: Módulo JWT e Identidad Global
- **Descripción:** Configurar `AuthModule` con `PassportModule` y `JwtModule`. Implementar `JwtStrategy` que valida el payload del token (`sub`, `email`, `globalRole`).
- **Criterio de Aceptación:** Tokens firmados y validados correctamente. Rechazo de tokens manipulados o vencidos.

#### `T08-TENANT-GUARD`: TenantContextGuard y Decoradores
- **Descripción:** Implementar guardia NestJS `TenantContextGuard` que:
  1. Extrae el header `X-Institution-Id`.
  2. Verifica que el usuario autenticado posee una vinculación `ACTIVO` con dicha institución.
  3. Si la vinculación no existe o está inactiva, bloquea inmediatamente con `403 Forbidden` y dispara evento de auditoría de seguridad.
  4. Inyecta el objeto `TenantContext` en la petición (`request.tenant`).
- **Criterio de Aceptación:** Bloqueo verificado ante manipulación de header por parte de un usuario no autorizado.

---

### Fase 3: Endpoints y Lógica de Negocio

#### `T09-AUTH-SERVICE`: Servicio de Autenticación
- **Descripción:** Implementar métodos en `AuthService`:
  - `login(identifier, password)`: Soporta búsqueda por email o CI. Retorna access token, refresh token y lista de instituciones.
  - `getProfile(userId)`: Retorna información biográfica (Persona) y profesional (Maestro).
  - `getLinkedInstitutions(userId)`: Lista instituciones asociadas con sus roles respectivos.
  - `selectContext(userId, institutionId)`: Valida vinculación y genera token contextualizado.
  - `refreshToken(token)`: Verifica rotación segura de tokens.
  - `logout(userId)`: Revoca el refresh token.
- **Criterio de Aceptación:** Todos los flujos de casos de uso cumplen con las historias de usuario US-001 a US-005.

#### `T10-AUTH-CTRL`: Controlador y DTOs
- **Descripción:** Crear `AuthController` con las rutas `/api/v1/auth/*` implementando DTOs con validadores estrictos (`class-validator`, `class-transformer`) según la especificación OpenAPI.
- **Criterio de Aceptación:** Respuestas 200/401/403/404 estructuradas y documentadas vía Swagger/OpenAPI.

#### `T11-AUDIT-LOG`: Trazabilidad y Auditoría de Seguridad
- **Descripción:** Registrar en `RegistroAuditoria` los eventos críticos:
  - Inicio de sesión exitoso / fallido.
  - Cambio de contexto institucional.
  - Intento de violación de aislamiento multi-tenant.
- **Criterio de Aceptación:** Registros insertados en la base de datos con IP, user-agent, timestamp y detalles.

---

### Fase 4: Verificación y Criterios de Aceptación (DoD)

#### `T12-TEST-UNIT`: Pruebas Unitarias
- **Descripción:** Pruebas unitarias de:
  - Algoritmo Argon2id.
  - DTOs de autenticación y validación de CI/email.
  - Guardias de autenticación y de contexto.
- **Criterio de Aceptación:** 100% de pruebas unitarias aprobadas.

#### `T13-TEST-RLS`: Pruebas de Integración E2E de Aislamiento Multi-Tenant
- **Descripción:** Pruebas E2E contra la base de datos PostgreSQL real:
  - Caso 1: Maestro vinculado a Franz Tamayo y Mariscal Sucre puede cambiar de contexto sin re-autenticarse.
  - Caso 2: Maestro vinculado solo a Franz Tamayo intenta acceder con header de Mariscal Sucre -> Recibe 403 Forbidden y se genera log de auditoría.
  - Caso 3: Consulta SQL directa bajo RLS con `app.current_institution_id` solo retorna filas correspondientes a esa institución.
- **Criterio de Aceptación:** Todas las pruebas pasan limpiamente demostrando aislamiento estricto.
