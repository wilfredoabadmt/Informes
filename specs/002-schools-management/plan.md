# PLAN TÉCNICO DE IMPLEMENTACIÓN
# FEATURE 002: GESTIÓN CENTRALIZADA DE UNIDADES EDUCATIVAS

**Feature:** `002-schools-management`  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 003, 005)  
**ADRs Aplicables:** ADR-001 (PostgreSQL RLS), ADR-002 (Contexto Multi-Tenant), ADR-003 (Monolito Modular)  
**Estado:** PROPUESTO  

---

## 1. CONSTITUTION CHECK

| Requisito Constitucional | Decisión / Sección | Estado | Justificación Técnica |
|---|---|---|---|
| **Alcance Multiinstitucional** | Decisión 001 | Cumple | Cada institución registrada posee un UUID único que opera como tenant scope en la base de datos PostgreSQL. |
| **Administración Central** | Decisión 003 | Cumple | Los endpoints de creación, suspensión y supervisión general están restringidos al rol `SUPERADMIN` y `CENTRAL_ADMIN`. |
| **Aislamiento Multi-Tenant** | Decisión 005 & Principios §3 | Cumple | Los directores y administradores locales acceden a través de `TenantContextGuard`, sin posibilidad de modificar ni ver datos de otras instituciones. |
| **Trazabilidad y Auditoría** | Principio §3 (10) | Cumple | Toda operación sobre instituciones se registra en `RegistroAuditoria` con IP, user-agent y detalle. |

---

## 2. ARQUITECTURA DE COMPONENTES BACKEND

La feature se estructurará dentro de un nuevo módulo NestJS modular en `backend/src/modules/institutions`:

```
backend/src/modules/institutions/
├── institutions.module.ts
├── institutions.controller.ts
├── institutions.service.ts
├── dto/
│   ├── create-institution.dto.ts
│   ├── update-institution-status.dto.ts
│   ├── update-my-institution.dto.ts
│   ├── assign-authority.dto.ts
│   └── query-institutions.dto.ts
└── guards/
    └── central-admin.guard.ts
```

### Componentes Principales:

1. **`CentralAdminGuard`**:
   Guardia complementaria a `JwtAuthGuard` que verifica que el usuario autenticado cuente con `globalRole === RolGlobal.SUPERADMIN` o `RolGlobal.CENTRAL_ADMIN`. Deniega con `403 Forbidden` si un usuario institucional intenta acceder a endpoints centrales.
2. **`InstitutionsService`**:
   - `create(dto, adminUserId, ip, userAgent)`: Registra la institución en `unidades_educativas` y audita la acción.
   - `findAll(query)`: Consulta paginada con filtros por departamento, distrito, tipo, estado y búsqueda libre.
   - `findById(id)`: Retorna la ficha completa con autoridades vinculadas vigentes.
   - `updateStatus(id, activo, adminUserId, ip, userAgent)`: Suspende o reactiva la institución y registra auditoría.
   - `assignAuthority(id, dto, adminUserId, ip, userAgent)`: Asocia un director o administrador institucional a la Unidad Educativa en `vinculaciones_institucionales`.
   - `updateMyInstitution(tenantId, dto, userId, ip, userAgent)`: Permite actualizar datos de contacto locales garantizando que solo afecte al tenant en sesión.

---

## 3. DEFINICIÓN DE ENDPOINTS

| Método | Ruta | Guardia | Roles Permitidos | Propósito |
|---|---|---|---|---|
| `POST` | `/api/v1/institutions` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Crear una nueva Unidad Educativa (Tenant) |
| `GET` | `/api/v1/institutions` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Listar colegios con filtros geográficos y paginación |
| `GET` | `/api/v1/institutions/:id` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Obtener ficha detallada de un colegio y autoridades |
| `PATCH`| `/api/v1/institutions/:id/status` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Suspender (`activo = false`) o reactivar colegio |
| `POST` | `/api/v1/institutions/:id/authorities` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Asignar Director o Administrador Institucional |
| `GET` | `/api/v1/institutions/my-institution/profile` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Ver información del propio colegio |
| `PATCH`| `/api/v1/institutions/my-institution` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Actualizar datos de contacto de la institución en sesión |

---

## 4. ESTRATEGIA DE VERIFICACIÓN (TESTING)

1. **Pruebas Unitarias (`institutions.service.spec.ts`)**:
   - Validación de departamentos válidos según geografía boliviana.
   - Rechazo de SIE duplicado.
   - Lógica de asignación de autoridades con/sin perfil de maestro previo.
2. **Pruebas de Integración E2E (`institutions.e2e-spec.ts`)**:
   - Creación de nueva Unidad Educativa con Superadmin -> 201 Created.
   - Intento de creación con usuario docente -> 403 Forbidden.
   - Paginación y filtrado por departamento (ej: "La Paz", "Cochabamba").
   - Suspensión institucional y comprobación de que el `TenantContextGuard` deniega el acceso a sus usuarios.
   - Edición descentralizada desde cuenta de Director -> 200 OK.
