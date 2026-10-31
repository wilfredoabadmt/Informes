# Tareas de Implementación — Feature 003: Expediente Profesional y Gestión de Maestros

**Feature:** `003-teachers-management`  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 002, 004, 005)  
**DoD:** Código compilado sin errores + Linter aprobado + Pruebas unitarias + Pruebas de integración E2E contra PostgreSQL + Documentación sincronizada.

---

## Matriz de Tareas

| ID | Fase | Tarea | Dependencias | Estado |
|---|---|---|---|---|
| `T01-TEA-DTO` | Contratos | Implementar DTOs (`create`, `link`, `status`, `search`) con validaciones de RDA y CI | Ninguna | PENDIENTE |
| `T02-TEA-SVC` | Backend Core | Implementar `TeachersService` (alta central, búsqueda, multi-vinculación, nómina institucional, expediente e historial) | T01-TEA-DTO | PENDIENTE |
| `T03-TEA-CTRL`| Endpoints | Implementar `TeachersController` con rutas de Nivel 1, Nivel 2 y Nivel 3 | T02-TEA-SVC | PENDIENTE |
| `T04-TEA-MOD` | Integración | Configurar `TeachersModule` y registrar en `AppModule` | T03-TEA-CTRL | PENDIENTE |
| `T05-TEA-AUDIT`| Seguridad | Integrar eventos de auditoría para altas, vinculaciones y cambios de estado | T02-TEA-SVC | PENDIENTE |
| `T06-TEA-UNIT`| Verificación | Pruebas unitarias en `teachers.service.spec.ts` (RDA duplicado, vinculación, armado de dossier) | T02-TEA-SVC | PENDIENTE |
| `T07-TEA-E2E` | Verificación | Pruebas E2E en `test/teachers.e2e-spec.ts` demostrando multi-vinculación simultánea e independencia | T04-TEA-MOD | PENDIENTE |

---

## Detalle de Tareas

### Fase 1: Contratos y DTOs

#### `T01-TEA-DTO`: DTOs de Gestión Docente
- **Descripción:** Crear clases DTO en `backend/src/modules/teachers/dto/`:
  - `CreateTeacherDto`: `ci`, `nombres`, `primerApellido`, `segundoApellido`, `email`, `telefono`, `rda` (min 5 chars), `tituloProfesional`, `especialidad`, `anioEgreso`, `normalista`, `passwordInicial`.
  - `LinkTeacherDto`: `identifier` (CI o RDA), `rolInstitucional` (`MAESTRO`, `COMISION_PEDAGOGICA`), `cargoOficial`, `fechaInicio`.
  - `UpdateLinkStatusDto`: `estado` (`ACTIVO`, `LICENCIA`, `TRASLADADO`, `INACTIVO`), `fechaFin`, `motivo`.

---

### Fase 2: Servicios, Endpoints y Auditoría

#### `T02-TEA-SVC`: TeachersService
- **Descripción:** Lógica de negocio en `backend/src/modules/teachers/teachers.service.ts`:
  - `createTeacher`: Alta de `Persona`, `Usuario` y `Maestro`. Valida unicidad de RDA y CI.
  - `searchTeachers`: Búsqueda de coincidencia por CI o RDA para directores.
  - `linkTeacher`: Vinculación a la Unidad Educativa bajo contexto `X-Institution-Id`.
  - `getInstitutionTeachers`: Consulta de nómina de docentes filtrada por la institución en sesión.
  - `getTeacherDossier`: Construcción de la hoja de vida profesional con todas las vinculaciones institucionales pasadas y presentes.
  - `updateLinkStatus`: Cambio de estado laboral en la institución activa.

#### `T03-TEA-CTRL`: TeachersController
- **Descripción:** Endpoints REST con decoradores de seguridad:
  - Nivel 1: `@UseGuards(JwtAuthGuard, CentralAdminGuard)` para alta y consulta global.
  - Nivel 2: `@UseGuards(JwtAuthGuard, TenantContextGuard)` para vinculación y nómina local.
  - Nivel 3: `@UseGuards(JwtAuthGuard)` para consulta del propio expediente (`me/dossier`).

#### `T05-TEA-AUDIT`: Trazabilidad y Auditoría
- **Descripción:** Grabación en `registros_auditoria` para cada acción crítica: `USER_CREATE`, `TEACHER_LINK`, `TEACHER_UNLINK`.

---

### Fase 3: Verificación (DoD)

#### `T06-TEA-UNIT`: Pruebas Unitarias
- **Descripción:** Pruebas en `teachers.service.spec.ts` validando:
  - Prevención de colisión de RDA con `ConflictException`.
  - Mapeo del expediente y desglose de historial multi-colegio.

#### `T07-TEA-E2E`: Pruebas de Integración E2E
- **Descripción:** Pruebas en `test/teachers.e2e-spec.ts` validando:
  - Alta de maestro nuevo en el padrón nacional por el Superadmin.
  - Incorporación del maestro a la U.E. Franz Tamayo por la Directora Elena.
  - Incorporación del MISMO maestro a la U.E. Mariscal Sucre demostrando que un maestro opera en múltiples colegios sin conflictos.
  - Consulta de la nómina de Franz Tamayo aislada de otros colegios.
  - Consulta del expediente donde se visualizan ambas vinculaciones institucionales.
  - Elena pone en `LICENCIA` al docente en Franz Tamayo y se comprueba que en Mariscal Sucre sigue `ACTIVO` (independencia estricta de vinculaciones).
