# Tareas de Implementación — Feature 002: Gestión Centralizada de Unidades Educativas

**Feature:** `002-schools-management`  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 003, 005)  
**DoD:** Código TypeScript compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-SCH-DTO` | Contratos | Implementar DTOs (`create`, `query`, `status`, `authority`, `update-my-institution`) con validaciones bolivianas | Ninguna | PENDIENTE |
| `T02-SCH-GUARD` | Seguridad | Implementar `CentralAdminGuard` para restringir endpoints al Nivel 1 (`SUPERADMIN`, `CENTRAL_ADMIN`) | Ninguna | PENDIENTE |
| `T03-SCH-SVC` | Backend Core | Implementar `InstitutionsService` (crear, listar paginado con filtros, buscar por ID, activar/suspender, asignar autoridad) | T01-SCH-DTO | PENDIENTE |
| `T04-SCH-CTRL` | Endpoints | Implementar `InstitutionsController` y registrar en `InstitutionsModule` | T02-SCH-GUARD, T03-SCH-SVC | PENDIENTE |
| `T05-SCH-AUDIT`| Auditoría | Integrar eventos de auditoría (`INSTITUTION_CREATE`, `STATUS_CHANGE`, `TEACHER_LINK`) en `AuditService` | T03-SCH-SVC | PENDIENTE |
| `T06-SCH-TEST-UNIT` | Verificación | Pruebas unitarias de validación de departamentos, filtros y asignación de directores | T03-SCH-SVC | PENDIENTE |
| `T07-SCH-TEST-E2E` | Verificación | Pruebas E2E de ciclo completo: alta central, suspensión y bloqueo en guard, edición local | T04-SCH-CTRL | PENDIENTE |

---

## Detalle de Tareas

### Fase 1: Contratos y Seguridad

#### `T01-SCH-DTO`: DTOs de Unidades Educativas
- **Descripción:** Crear clases DTO en `backend/src/modules/institutions/dto/` con validación estricta:
  - `CreateInstitutionDto`: Validación de SIE (numérico, 6 a 10 dígitos), departamento (uno de los 9 departamentos bolivianos), provincia, municipio, distrito, tipo (`FISCAL`, `CONVENIO`, `PRIVADA`), nivel (`INICIAL`, `PRIMARIA`, `SECUNDARIA`, `INTEGRADO`).
  - `QueryInstitutionsDto`: Paginación (`page`, `limit`), filtros opcionales (`departamento`, `distrito`, `tipo`, `activo`, `q`).
  - `UpdateInstitutionStatusDto`: Booleano `activo`.
  - `AssignAuthorityDto`: Identificador (CI o correo), rol (`DIRECTOR`, `ADMIN_INSTITUCIONAL`), cargo oficial.
  - `UpdateMyInstitutionDto`: Solo `direccion`, `telefono`.

#### `T02-SCH-GUARD`: CentralAdminGuard
- **Descripción:** Crear guardia NestJS en `backend/src/common/guards/central-admin.guard.ts` que valida que `request.user.globalRole` sea `SUPERADMIN` o `CENTRAL_ADMIN`. Deniega con `403 Forbidden` a usuarios con solo rol institucional.

---

### Fase 2: Servicios, Endpoints y Auditoría

#### `T03-SCH-SVC`: InstitutionsService
- **Descripción:** Implementar la lógica de negocio en `backend/src/modules/institutions/institutions.service.ts`:
  - `create`: Valida que no exista colisión de SIE. Inserta en `unidades_educativas`.
  - `findAll`: Aplica filtros combinados en Prisma, paginación con `skip` y `take`, conteo total para metadatos.
  - `findById`: Carga la institución junto a sus autoridades activas (`vinculaciones` filtradas por `DIRECTOR` / `ADMIN_INSTITUCIONAL`).
  - `updateStatus`: Altera `activo` e invalida o audita la suspensión del tenant.
  - `assignAuthority`: Resuelve usuario por correo o CI, verifica si tiene perfil de maestro para asociar `maestroId`, e inserta o actualiza la vinculación institucional.
  - `updateMyInstitution`: Actualiza exclusivamente datos de contacto de la institución identificada por `tenantContext.institutionId`.

#### `T04-SCH-CTRL`: InstitutionsController y Módulo
- **Descripción:** Configurar `InstitutionsController` asociando las rutas a las guardias correspondientes:
  - Rutas centrales: `@UseGuards(JwtAuthGuard, CentralAdminGuard)`
  - Rutas institucionales: `@UseGuards(JwtAuthGuard, TenantContextGuard)`
  - Registrar `InstitutionsModule` en `AppModule`.

#### `T05-SCH-AUDIT`: Trazabilidad
- **Descripción:** Registrar auditoría para:
  - Creación de institución: detalle con SIE y nombre.
  - Suspensión/reactivación: motivo y nuevo estado.
  - Asignación de directores o administradores.

---

### Fase 3: Verificación (DoD)

#### `T06-SCH-TEST-UNIT`: Pruebas Unitarias
- **Descripción:** `institutions.service.spec.ts` validando:
  - Detección de departamentos inválidos.
  - Comportamiento ante duplicidad de SIE.
  - Asignación de autoridad a usuario existente y no existente.

#### `T07-SCH-TEST-E2E`: Pruebas de Integración E2E
- **Descripción:** `test/institutions.e2e-spec.ts` validando:
  - Registro de colegio por Superadmin (201 Created).
  - Rechazo de registro por usuario maestro (403 Forbidden).
  - Listado paginado y filtrado por departamento (e.g. "La Paz").
  - Asignación de directora Elena Flores a un nuevo colegio.
  - Suspensión institucional (`activo = false`) y verificación de que el usuario bloqueado recibe 403 en endpoints con `TenantContextGuard`.
  - Modificación descentralizada de dirección por la Directora activa (200 OK).
