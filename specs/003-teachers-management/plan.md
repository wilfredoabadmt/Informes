# PLAN TÉCNICO DE IMPLEMENTACIÓN
# FEATURE 003: EXPEDIENTE PROFESIONAL Y GESTIÓN DE MAESTROS

**Feature:** `003-teachers-management`  
**Constitución Referencia:** V1.1.0 (Decisiones 002, 004, 005)  
**ADRs Aplicables:** ADR-001 (PostgreSQL RLS), ADR-002 (Contexto Multi-Tenant), ADR-003 (Monolito Modular)  
**Estado:** PROPUESTO  

---

## 1. CONSTITUTION CHECK

| Requisito Constitucional | Decisión / Sección | Estado | Justificación Técnica |
|---|---|---|---|
| **Gestión Integral de Maestros** | Decisión 002 | Cumple | Expediente profesional unificado que articula datos personales, formación académica (RDA, normalista, especialidad) e historial laboral. |
| **Identidad Centralizada** | Decisión 004 | Cumple | El maestro tiene una sola cuenta de usuario y perfil profesional global, permitiendo trabajar en múltiples unidades educativas simultáneamente. |
| **Aislamiento Multi-Tenant** | Decisión 005 & Principios §3 | Cumple | Las vinculaciones son independientes por institución y se consultan a través de `TenantContextGuard` y PostgreSQL RLS. |
| **Separación de Entidades** | Principios §4 | Cumple | Entidades `Persona`, `Usuario`, `Maestro`, `UnidadEducativa` y `VinculacionInstitucional` claramente delimitadas en base de datos. |

---

## 2. ARQUITECTURA DE COMPONENTES BACKEND

La feature se implementará en el módulo NestJS `backend/src/modules/teachers/`:

```
backend/src/modules/teachers/
├── teachers.module.ts
├── teachers.controller.ts
├── teachers.service.ts
└── dto/
    ├── create-teacher.dto.ts
    ├── link-teacher.dto.ts
    ├── update-link-status.dto.ts
    ├── query-institution-teachers.dto.ts
    └── search-teacher.dto.ts
```

### Componentes y Responsabilidades:

1. **`TeachersService`**:
   - `createTeacher(dto, adminUserId, ip, userAgent)`: Alta central de docente, creación de `Persona`, `Usuario` y `Maestro` con contraseña por defecto hasheada con Argon2id.
   - `searchTeacher(query)`: Búsqueda ágil por CI o RDA para directores que van a vincular personal a su colegio.
   - `linkTeacherToInstitution(institutionId, dto, directorUserId, ip, userAgent)`: Vinculación formal de un maestro al colegio bajo sesión.
   - `getInstitutionTeachers(institutionId, query)`: Consulta protegida de la nómina docente del colegio.
   - `getTeacherDossier(userId, maestroId?)`: Consulta del expediente profesional completo con historial cronológico de vinculaciones.
   - `updateLinkStatus(institutionId, vinculacionId, dto, directorUserId, ip, userAgent)`: Modificación de estado (licencia, traslado, inactivo) en la institución actual.

---

## 3. DEFINICIÓN DE ENDPOINTS

| Método | Ruta | Guardia | Roles Permitidos | Propósito |
|---|---|---|---|---|
| `POST` | `/api/v1/teachers` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Alta de maestro en padrón nacional |
| `GET` | `/api/v1/teachers/search` | `JwtAuthGuard` | `SUPERADMIN`, `CENTRAL_ADMIN`, `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Buscar docente por CI o RDA para vinculación |
| `POST` | `/api/v1/teachers/link` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Vincular docente a la institución bajo sesión |
| `GET` | `/api/v1/teachers/my-institution` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Listar plantilla docente de la institución |
| `PATCH`| `/api/v1/teachers/link/:vinculacionId/status` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Cambiar estado (licencia, baja) de vinculación local |
| `GET` | `/api/v1/teachers/me/dossier` | `JwtAuthGuard` | `MAESTRO`, `DIRECTOR` | Ver propio expediente e historial institucional |
| `GET` | `/api/v1/teachers/:id/dossier` | `JwtAuthGuard`, `CentralAdminGuard` | `SUPERADMIN`, `CENTRAL_ADMIN` | Ver expediente de cualquier maestro del país |

---

## 4. ESTRATEGIA DE VERIFICACIÓN (TESTING)

1. **Pruebas Unitarias (`teachers.service.spec.ts`)**:
   - Validación de RDA y CI duplicados.
   - Lógica de vinculación y reactivación de docentes en un colegio.
   - Construcción del expediente profesional e historial institucional.
2. **Pruebas de Integración E2E (`teachers.e2e-spec.ts`)**:
   - Superadmin crea un nuevo maestro en el padrón nacional (201 Created).
   - Intento de duplicar RDA arroja 409 Conflict.
   - Directora Elena (Franz Tamayo) busca al maestro por RDA (200 OK) y lo vincula a su colegio (201 Created).
   - Director de Mariscal Sucre vincula al MISMO maestro en su colegio sin conflictos (demostrando multi-institucionalidad).
   - Verificación de que la plantilla de Franz Tamayo muestra al maestro, y el expediente del maestro refleja AMBAS vinculaciones simultáneas.
   - Elena pone en `LICENCIA` al maestro en Franz Tamayo y se verifica que en Mariscal Sucre sigue `ACTIVO` (independencia estricta).

