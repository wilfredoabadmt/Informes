# PLAN TÉCNICO DE IMPLEMENTACIÓN
# FEATURE 004: ESTRUCTURA ACADÉMICA INSTITUCIONAL

**Feature:** `004-academic-structure`  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Principios de Modelado de Datos)  
**ADRs Aplicables:** ADR-001 (PostgreSQL RLS), ADR-002 (Contexto Multi-Tenant), ADR-003 (Monolito Modular)  
**Estado:** PROPUESTO  

---

## 1. CONSTITUTION CHECK

| Requisito Constitucional | Decisión / Sección | Estado | Justificación Técnica |
|---|---|---|---|
| **Espacio Institucional Independiente** | Decisión 001 | Cumple | Gestiones escolares y paralelos cuentan con clave foránea `institucionId` aislada por RLS. |
| **Gestión Académica de Cursos y Paralelos**| Decisión 002-B | Cumple | Entidades normalizadas de Cursos, Paralelos y Gestiones Escolares según el SEP de Bolivia. |
| **Aislamiento Multi-Tenant** | Decisión 005 & Principios §3 | Cumple | Toda operación académica institucional se ejecuta bajo `TenantContextGuard` y `withTenantContext`. |
| **Separación de Entidades** | Principios §4 | Cumple | Separación explícita entre `GestionEscolar`, `Curso`, `Paralelo` y `Materia`. |

---

## 2. ARQUITECTURA DE COMPONENTES BACKEND

La feature se implementará en el módulo NestJS `backend/src/modules/academic/`:

```
backend/src/modules/academic/
├── academic.module.ts
├── academic.controller.ts
├── academic.service.ts
└── dto/
    ├── create-school-year.dto.ts
    ├── update-school-year-status.dto.ts
    ├── create-section.dto.ts
    ├── query-sections.dto.ts
    └── query-subjects.dto.ts
```

### Componentes y Responsabilidades:

1. **`AcademicService`**:
   - `createSchoolYear(institutionId, dto, userId, ip, userAgent)`: Registra la gestión escolar (ej. 2026). Garantiza que si se abre, otras gestiones abiertas se cierren o validen.
   - `getSchoolYears(institutionId)`: Lista todas las gestiones de la institución activa ordenadas descendentemente por año.
   - `updateSchoolYearStatus(institutionId, gestionId, dto, userId, ip, userAgent)`: Permite transicionar entre `EN_PLANIFICACION`, `ABIERTA` y `CERRADA`.
   - `getSubjects(query)`: Consulta el catálogo curricular oficial de campos de saberes y áreas curriculares del SEP.
   - `getCourses(nivel?)`: Consulta los cursos base oficiales (1º a 6º de Primaria, 1º a 6º de Secundaria, Inicial).
   - `createSection(institutionId, dto, userId, ip, userAgent)`: Crea un paralelo (letra, turno, cupo) asociado al curso y a la gestión escolar.
   - `getAcademicTree(institutionId, gestionId)`: Construye la estructura jerárquica de la institución para una gestión escolar.

---

## 3. DEFINICIÓN DE ENDPOINTS

| Método | Ruta | Guardia | Roles Permitidos | Propósito |
|---|---|---|---|---|
| `POST` | `/api/v1/academic/school-years` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Apertura de gestión escolar anual |
| `GET` | `/api/v1/academic/school-years` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL`, `MAESTRO` | Listar gestiones escolares del colegio |
| `PATCH`| `/api/v1/academic/school-years/:id/status`| `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Cambiar estado de la gestión escolar |
| `GET` | `/api/v1/academic/subjects` | `JwtAuthGuard` | Todos los autenticados | Catálogo curricular nacional del SEP |
| `GET` | `/api/v1/academic/courses` | `JwtAuthGuard` | Todos los autenticados | Catálogo de grados escolares oficiales |
| `POST` | `/api/v1/academic/sections` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL` | Crear paralelo (aula/sección) |
| `GET` | `/api/v1/academic/sections/tree` | `JwtAuthGuard`, `TenantContextGuard` | `DIRECTOR`, `ADMIN_INSTITUCIONAL`, `MAESTRO` | Árbol académico estructurado del colegio |

---

## 4. ESTRATEGIA DE VERIFICACIÓN (TESTING)

1. **Pruebas Unitarias (`academic.service.spec.ts`)**:
   - Validación de años válidos y prevención de gestiones duplicadas en un mismo colegio.
   - Regla de no permitir paralelos duplicados (mismo grado, letra y turno en la misma gestión).
   - Bloqueo de creación de paralelos en gestiones escolares cerradas.
2. **Pruebas de Integración E2E (`academic.e2e-spec.ts`)**:
   - Apertura de Gestión 2026 en U.E. Franz Tamayo por la Directora Elena (201 Created).
   - Apertura de Gestión 2026 en U.E. Mariscal Sucre demostrando aislamiento multi-tenant sin colisión de año.
   - Creación de Paralelo "1º A - Secundaria - Turno Mañana" en Franz Tamayo (201 Created).
   - Intento de duplicar el paralelo en Franz Tamayo arroja 409 Conflict.
   - Creación del MISMO paralelo "1º A - Secundaria - Turno Mañana" en Mariscal Sucre (201 Created, demostrando aislamiento).
   - Consulta del árbol académico de Franz Tamayo (muestra únicamente sus cursos y paralelos).
   - Cierre de gestión en Franz Tamayo e intento de crear nuevo paralelo en gestión cerrada (400 Bad Request).

