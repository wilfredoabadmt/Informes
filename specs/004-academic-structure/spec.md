# ESPECIFICACIÓN TÉCNICA Y DE NEGOCIO (SPEC)
# FEATURE 004: ESTRUCTURA ACADÉMICA INSTITUCIONAL (GESTIONES, CURSOS Y PARALELOS)

**Feature ID:** `004-academic-structure`  
**Título:** Configuración de Gestiones Escolares, Cursos, Paralelos y Catálogo Curricular del SEP  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B, 005; Sección 4 - Modelado de Datos)  
**Estado:** PROPUESTO  
**Prioridad:** ALTA (Base estructural obligatoria para asignaciones docentes, estudiantes y calificaciones)  

---

## 1. CONTEXTO Y PROPÓSITO

Conforme a la **Decisión 001** y la **Decisión 002-B** de la Constitución del Proyecto, cada Unidad Educativa cuenta con un espacio institucional independiente que organiza su oferta académica anual.

En el marco del Sistema Educativo Plurinacional (SEP) de Bolivia (Ley 070 *Avelino Siñani - Elizardo Pérez*), la estructura académica se organiza en:
1. **Gestión Escolar:** Periodo lectivo anual (ej. 2026), que delimita todas las operaciones académicas, asistencias y calificaciones.
2. **Niveles y Grados:**
   - Educación Inicial en Familia Comunitaria (1º y 2º año).
   - Educación Primaria Comunitaria Vocacional (1º a 6º de Primaria).
   - Educación Secundaria Comunitaria Productiva (1º a 6º de Secundaria).
3. **Paralelos y Turnos:** Divisiones de sección (ej. "A", "B", "C") en turnos oficiales (*Mañana, Tarde, Noche*).
4. **Campos de Saberes y Conocimientos y Áreas Curriculares:**
   - *Cosmos y Pensamiento* (Filosofía/Psicología, Espiritualidades y Religiones).
   - *Comunidad y Sociedad* (Comunicación y Lenguajes, Ciencias Sociales, Artes Plásticas, Educación Musical, Educación Física y Deportes).
   - *Vida Tierra Territorio* (Ciencias Naturales: Biología/Geografía, Física/Química).
   - *Ciencia Tecnología y Producción* (Matemática, Técnica Tecnológica General y Especializada).

---

## 2. REGLAS DE NEGOCIO E INVARIANTES

1. **Aislamiento Multi-Tenant por Institución y Gestión:**
   - Los paralelos, cupos y turnos pertenecen de forma exclusiva a una Unidad Educativa y a una Gestión Escolar determinada.
   - Dos colegios pueden tener un paralelo "1º A Secundaria - Turno Mañana" sin ninguna interferencia mutua.
2. **Unicidad de Gestión Escolar Activa:**
   - Una institución puede registrar varias gestiones escolares (históricas, presentes o en planificación), pero **solo una gestión escolar puede estar en estado `ABIERTA` de forma simultánea** por colegio.
3. **Unicidad de Paralelo por Grado y Turno en la Gestión:**
   - Dentro de una misma Unidad Educativa y una misma gestión escolar, no puede duplicarse el mismo paralelo para un mismo grado y turno (ej. no pueden existir dos "1º de Secundaria - Paralelo A - Turno Mañana").
4. **Catálogo Curricular Nacional del SEP:**
   - Existe un catálogo base oficial inmutable de materias y campos de saberes definido a nivel central (Nivel 1).
   - Las instituciones pueden consultar este catálogo para habilitar materias en sus cursos.
5. **Inmutabilidad de Gestiones Cerradas:**
   - Cuando una gestión escolar pasa a estado `CERRADA`, no se permite la creación, modificación ni eliminación de paralelos dentro de ella, asegurando la inmutabilidad histórica.

---

## 3. HISTORIAS DE USUARIO Y CRITERIOS DE ACEPTACIÓN

### US-001 (P1): Apertura y Configuración de Gestión Escolar (Nivel 2)
**Como** Director o Administrador Institucional de una Unidad Educativa,  
**Quiero** crear y abrir la gestión escolar (ej. 2026) en mi colegio,  
**Para** habilitar el ciclo lectivo donde se organizarán cursos, inscripciones y calificaciones.

#### Criterios de Aceptación:
- **AC-001.1:** El endpoint `POST /api/v1/academic/school-years` opera bajo el header `X-Institution-Id` validado por `TenantContextGuard`.
- **AC-001.2:** Recibe `anio` (entero entre 2020 y 2035), `fechaInicio`, `fechaFin` y estado inicial (`EN_PLANIFICACION` o `ABIERTA`).
- **AC-001.3:** Si se solicita abrir la gestión (`ABIERTA`), cualquier gestión previamente abierta en esa institución pasa automáticamente a `CERRADA` o requiere cierre explícito.
- **AC-001.4:** No se permite registrar el mismo año más de una vez en la misma institución (`409 Conflict`).
- **AC-001.5:** Se audita la creación en `registros_auditoria`.

---

### US-002 (P1): Catálogo Oficial de Campos y Áreas Curriculares del SEP (Niveles 1 y 2)
**Como** Director o Administrador de la plataforma,  
**Quiero** consultar el catálogo oficial de áreas curriculares clasificadas por Campos de Saberes y Niveles Educativos,  
**Para** estandarizar las materias que se imparten en los cursos.

#### Criterios de Aceptación:
- **AC-002.1:** `GET /api/v1/academic/subjects` lista las materias oficiales del Sistema Educativo Plurinacional.
- **AC-002.2:** Cada materia incluye: `codigo`, `nombre`, `campoSaberes`, `nivel` y `esTroncal`.
- **AC-002.3:** Admite filtro por `nivel` (`PRIMARIA`, `SECUNDARIA`, `INICIAL`) y por `campoSaberes`.

---

### US-003 (P1): Creación de Paralelos Institucionales (Nivel 2)
**Como** Director de la Unidad Educativa,  
**Quiero** crear los paralelos (ej. "1º A - Turno Mañana") para un grado en la gestión escolar activa,  
**Para** definir los ambientes pedagógicos donde se asignarán docentes y matricularán estudiantes.

#### Criterios de Aceptación:
- **AC-003.1:** El endpoint `POST /api/v1/academic/sections` opera bajo el header `X-Institution-Id`.
- **AC-003.2:** Recibe `gestionId`, `cursoId` (o nivel + grado), `letra` (A, B, C, etc.), `turno` (`MANANA`, `TARDE`, `NOCHE`) y opcionalmente `cupoMaximo`.
- **AC-003.3:** Si la gestión escolar indicada está `CERRADA`, la creación se rechaza con `400 Bad Request`.
- **AC-003.4:** Si ya existe ese paralelo en el mismo grado, turno y gestión en la institución, retorna `409 Conflict`.
- **AC-003.5:** El registro resultante queda aislado y protegido por PostgreSQL Row Level Security.

---

### US-004 (P2): Consulta del Árbol Académico Institucional (Nivel 2)
**Como** Director de la Unidad Educativa,  
**Quiero** consultar la estructura académica completa de mi colegio para una gestión escolar (cursos y paralelos agrupados por nivel y turno),  
**Para** tener un mapa pedagógico claro de la institución.

#### Criterios de Aceptación:
- **AC-004.1:** `GET /api/v1/academic/sections/tree?gestionId=...` retorna la estructura jerárquica: Nivel ➔ Grado ➔ Paralelos.
- **AC-004.2:** Cada paralelo incluye información de turno, cupo máximo y conteo de estudiantes matriculados (inicialmente 0).
- **AC-004.3:** No expone datos de ninguna otra Unidad Educativa.

---

### US-005 (P2): Cierre y Cambio de Estado de la Gestión Escolar (Nivel 2)
**Como** Director de la Unidad Educativa,  
**Quiero** cambiar el estado de la gestión escolar (`EN_PLANIFICACION`, `ABIERTA`, `CERRADA`),  
**Para** controlar el ciclo de vida del año escolar y congelar registros al término de la gestión.

#### Criterios de Aceptación:
- **AC-005.1:** `PATCH /api/v1/academic/school-years/:id/status` valida que la gestión pertenezca a la institución en sesión.
- **AC-005.2:** Permite cambiar el estado y audita el evento con `STATUS_CHANGE`.
