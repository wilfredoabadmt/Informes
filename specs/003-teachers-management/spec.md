# ESPECIFICACIÓN TÉCNICA Y DE NEGOCIO (SPEC)
# FEATURE 003: EXPEDIENTE PROFESIONAL Y GESTIÓN DE MAESTROS

**Feature ID:** `003-teachers-management`  
**Título:** Expediente Profesional Docente, Padrón Centralizado y Vinculación Multi-Institucional  
**Constitución Referencia:** V1.1.0 (Decisiones 002, 004, 005; Niveles 1, 2 y 3 de Arquitectura Institucional)  
**Estado:** PROPUESTO  
**Prioridad:** ALTA (Requisito fundamental para asignaciones académicas y calificaciones)  

---

## 1. CONTEXTO Y PROPÓSITO

La **Decisión 002** y la **Decisión 004** de la Constitución establecen la separación ontológica entre la **identidad profesional única del maestro** (Persona + Registro Docente Administrativo - RDA) y sus **vinculaciones institucionales independientes** con una o varias Unidades Educativas.

En el sistema educativo del Estado Plurinacional de Bolivia, es habitual que un maestro ejerza docencia en más de una Unidad Educativa (por ejemplo, en el turno mañana en una institución y en el turno tarde en otra). La plataforma debe garantizar que el maestro cuente con un único expediente profesional centralizado, mientras que cada Unidad Educativa gestiona de forma autónoma su vinculación laboral, cargo y estado dentro de su espacio institucional.

---

## 2. REGLAS DE NEGOCIO E INVARIANTES

1. **Unicidad e Inmutabilidad del RDA:**
   El código RDA (Registro Docente Administrativo emitido por el Ministerio de Educación) es único por maestro a nivel nacional. No pueden existir dos docentes con el mismo RDA.
2. **Identidad Personal Única (CI):**
   Un maestro está asociado a una única `Persona` identificada por su Cédula de Identidad (CI). Si un maestro ya existe en el sistema por haber trabajado en otro colegio, no se duplican sus datos personales; se reutiliza su identidad global.
3. **Independencia de Vinculaciones Institucionales:**
   - Un maestro puede tener vinculaciones activas simultáneas en diferentes Unidades Educativas.
   - La modificación del estado de una vinculación (ej. `LICENCIA`, `TRASLADADO` o `INACTIVO`) en la Unidad Educativa A **no altera** ni suspende su vinculación ni sus derechos en la Unidad Educativa B.
4. **Formación Normalista y Académica:**
   El expediente consigna:
   - Título profesional de provisión nacional o licenciatura.
   - Especialidad pedagógica (ej. *Matemática, Física, Primaria Comunitaria Vocacional, etc.*).
   - Condición de normalista (graduado de Escuela Superior de Formación de Maestros - ESFM) o egresado universitario.
   - Año de egreso.
5. **Alcance y Niveles de Acceso:**
   - **Nivel 1 (Administración Central):** Alta de maestros en el padrón nacional, consulta global del padrón y auditoría.
   - **Nivel 2 (Administración Institucional - Director/Secretario):** Búsqueda de docentes por CI o RDA para vincularlos a su colegio, consulta de la nómina docente del colegio y desvinculación/licencia institucional.
   - **Nivel 3 (Maestro):** Consulta de su propio expediente profesional y de su historial de vinculaciones.

---

## 3. HISTORIAS DE USUARIO Y CRITERIOS DE ACEPTACIÓN

### US-001 (P1): Alta de Maestro en el Padrón Nacional (Nivel Central)
**Como** Administrador Central del Ministerio,  
**Quiero** registrar a un docente en el padrón nacional con su CI, datos personales, credenciales y RDA,  
**Para** incorporar su expediente profesional único a la plataforma.

#### Criterios de Aceptación:
- **AC-001.1:** El endpoint `POST /api/v1/teachers` valida que el RDA tenga formato válido (mínimo 5 caracteres alfanuméricos) y que el CI sea obligatorio.
- **AC-001.2:** Si el RDA ya existe, la solicitud es rechazada con `409 Conflict`.
- **AC-001.3:** Si el CI ya pertenece a otra persona registrada, se asocia el perfil de `Maestro` a dicha persona sin duplicar el registro biográfico.
- **AC-001.4:** Se crea una cuenta de `Usuario` con rol global `INSTITUTIONAL_USER` y contraseña inicial segura hasheada con Argon2id.
- **AC-001.5:** Se audita la creación en `registros_auditoria` con tipo `USER_CREATE`.

---

### US-002 (P1): Vinculación de Maestro a la Unidad Educativa (Nivel Institucional)
**Como** Director o Administrador Institucional de un colegio,  
**Quiero** buscar a un docente registrado por su CI o RDA y vincularlo a mi Unidad Educativa,  
**Para** incorporarlo a la nómina oficial del establecimiento y habilitarle asignaciones pedagógicas.

#### Criterios de Aceptación:
- **AC-002.1:** El endpoint `POST /api/v1/teachers/link` opera bajo el contexto validado por `TenantContextGuard` (`X-Institution-Id`).
- **AC-002.2:** Recibe `identifier` (CI o RDA), `rolInstitucional` (`MAESTRO` o `COMISION_PEDAGOGICA`), `cargoOficial` y opcionalmente `fechaInicio`.
- **AC-002.3:** Si el docente ya se encuentra vinculado con estado `ACTIVO` en esa misma institución con ese rol, retorna `409 Conflict`.
- **AC-002.4:** Si el docente estaba previamente `INACTIVO` o con `LICENCIA` en esa institución, se reactiva la vinculación actualizando el cargo y estado a `ACTIVO`.
- **AC-002.5:** Se registra un evento en `registros_auditoria` con tipo `TEACHER_LINK`.

---

### US-003 (P1): Nómina Docente del Colegio (Nivel Institucional)
**Como** Director o Administrador Institucional,  
**Quiero** listar todos los maestros vinculados activamente a mi Unidad Educativa,  
**Para** supervisar la plantilla docente, sus especialidades y cargos oficiales.

#### Criterios de Aceptación:
- **AC-003.1:** `GET /api/v1/teachers/my-institution` retorna únicamente los maestros con vinculación en la institución identificada por `X-Institution-Id`.
- **AC-003.2:** Se aíslan estrictamente los registros: un colegio nunca puede ver en esta lista maestros que solo pertenecen a otra institución.
- **AC-003.3:** Admite filtro por estado (`ACTIVO`, `LICENCIA`, `TRASLADADO`, `INACTIVO`) y búsqueda libre por nombre o RDA.
- **AC-003.4:** Cada ítem incluye: `vinculacionId`, `nombres`, `apellidos`, `ci`, `rda`, `especialidad`, `tituloProfesional`, `cargoOficial`, `estado` y `fechaInicio`.

---

### US-004 (P2): Consulta de Expediente Profesional e Historial (Nivel Central y Docente)
**Como** Maestro autenticado (o Administrador Central),  
**Quiero** consultar mi expediente profesional completo con el historial de todos los colegios donde he prestado servicios,  
**Para** verificar mi hoja de vida y antecedentes institucionales.

#### Criterios de Aceptación:
- **AC-004.1:** `GET /api/v1/teachers/me/dossier` retorna el expediente del docente autenticado.
- **AC-004.2:** `GET /api/v1/teachers/:id/dossier` permite a un Administrador Central consultar el expediente de cualquier maestro del país.
- **AC-004.3:** El expediente incluye: datos personales, formación académica (título, especialidad, normalista, año de egreso) y el arreglo cronológico de todas las `vinculaciones` (colegio, SIE, departamento, cargo, periodo de fechas y estado).

---

### US-005 (P2): Desvinculación o Licencia de Maestro en el Colegio (Nivel Institucional)
**Como** Director de la Unidad Educativa,  
**Quiero** registrar la desvinculación, traslado o licencia de un docente en mi establecimiento,  
**Para** dar de baja sus accesos locales manteniendo la integridad histórica institucional.

#### Criterios de Aceptación:
- **AC-005.1:** `PATCH /api/v1/teachers/link/:vinculacionId/status` permite actualizar el estado a `LICENCIA`, `TRASLADADO` o `INACTIVO`, con una fecha de fin opcional.
- **AC-005.2:** `TenantContextGuard` verifica que la `vinculacionId` pertenezca efectivamente a la Unidad Educativa que realiza la petición; de lo contrario arroja `403 Forbidden`.
- **AC-005.3:** No se eliminan filas físicas de la base de datos (preservación histórica).
- **AC-005.4:** Se audita el cambio de estado con tipo `TEACHER_UNLINK` o `USER_UPDATE`.

---

## 4. CASOS DE BORDE Y REGLAS DE SEGURIDAD

1. **Búsqueda nacional sin contexto institucional:**
   Directores autorizados pueden buscar si un maestro existe por su CI o RDA para vincularlo a su colegio (`GET /api/v1/teachers/search?q=...`), pero la respuesta pública para vinculación solo expone datos profesionales mínimos (nombre, apellidos, RDA, especialidad) sin exponer información privada ni historiales de otros colegios.
2. **Docente que asume dirección:**
   Un maestro puede ser simultáneamente profesor en una institución y director en otra, o ascender a director en su misma institución, registrando roles separados e independientes.
