# ESPECIFICACIÓN TÉCNICA Y DE NEGOCIO (SPEC)
# FEATURE 002: GESTIÓN CENTRALIZADA DE UNIDADES EDUCATIVAS

**Feature ID:** `002-schools-management`  
**Título:** Gestión Centralizada de Unidades Educativas y Espacios Institucionales Multi-Tenant  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 003, 005; Nivel 1 y Nivel 2 de Arquitectura Institucional)  
**Estado:** PROPUESTO  
**Prioridad:** ALTA (Bloqueante para gestión de maestros y matrícula)  

---

## 1. CONTEXTO Y PROPÓSITO

Conforme a la **Decisión 001** y **Decisión 003** de la Constitución del Proyecto, el sistema debe proveer una administración centralizada capaz de dar de alta y gobernar los espacios institucionales (tenants) independientes correspondientes a cada Unidad Educativa del Estado Plurinacional de Bolivia.

Cada Unidad Educativa creada en la plataforma constituye el contenedor lógico de aislamiento multi-tenant para gestiones escolares, asignaciones docentes, estudiantes y calificaciones. La creación y gobernanza de estas instituciones está restringida al **Nivel 1 (Administración Central / Superadmin)**, mientras que las autoridades institucionales (**Nivel 2: Director y Administrador Institucional**) pueden mantener y actualizar su ficha institucional autorizada.

---

## 2. REGLAS DE NEGOCIO E INVARIANTES

1. **Unicidad del Código SIE:**
   El código SIE (Sistema de Información Educativa del Ministerio de Educación) es un identificador numérico único e inmutable por Unidad Educativa. Dos colegios nunca pueden compartir el mismo SIE.
2. **División Geográfica Oficial de Bolivia:**
   Toda Unidad Educativa debe pertenecer a uno de los 9 departamentos oficiales: *La Paz, Cochabamba, Santa Cruz, Potosí, Oruro, Chuquisaca, Tarija, Beni, Pando*, además de consignar su provincia, municipio y distrito educativo correspondiente.
3. **Tipos de Dependencia Institucional:**
   - `FISCAL`: Unidad educativa pública financiada íntegramente por el Estado.
   - `CONVENIO`: Institución de administración compartida (e.g. Iglesia - Estado).
   - `PRIVADA`: Institución particular con personería y resolución ministerial.
4. **Niveles Educativos Ofertados:**
   - `INICIAL`
   - `PRIMARIA`
   - `SECUNDARIA`
   - `INTEGRADO` (Cubre dos o más niveles educativos).
5. **Aislamiento Multi-Tenant:**
   - La suspensión (`activo = false`) de una institución bloquea inmediatamente el acceso a todos sus usuarios bajo el contexto de dicha institución (retorna `403 Forbidden` a través de `TenantContextGuard`).
   - Los usuarios institucionales solo pueden leer y editar la información de su propia institución activa.
6. **Trazabilidad:**
   Toda alta, modificación de datos, cambio de estado o asignación de administrador institucional debe generar un evento de auditoría central inmutable en `registros_auditoria`.

---

## 3. HISTORIAS DE USUARIO Y CRITERIOS DE ACEPTACIÓN

### US-001 (P1): Registro Central de Unidad Educativa
**Como** Superadministrador o Administrador Central del Ministerio,  
**Quiero** registrar una nueva Unidad Educativa con su código SIE, nombre y localización,  
**Para** habilitar un nuevo tenant institucional seguro en la plataforma.

#### Criterios de Aceptación:
- **AC-001.1:** El endpoint `POST /api/v1/institutions` valida que el SIE tenga entre 6 y 10 dígitos y sea numérico.
- **AC-001.2:** Si el SIE ya existe en la base de datos, la solicitud es rechazada con `409 Conflict` indicando duplicidad.
- **AC-001.3:** Se valida que el departamento pertenezca a la lista oficial de los 9 departamentos de Bolivia.
- **AC-001.4:** Solo usuarios con rol global `SUPERADMIN` o `CENTRAL_ADMIN` pueden invocar este endpoint; cualquier otro usuario recibe `403 Forbidden`.
- **AC-001.5:** Tras la creación exitosa, se genera un registro en `registros_auditoria` con el tipo `USER_CREATE` / `INSTITUTION_CREATE`.

---

### US-002 (P1): Listado y Consulta Central con Filtros Geográficos
**Como** Administrador Central,  
**Quiero** consultar y filtrar la lista de unidades educativas registradas por departamento, municipio, distrito, tipo y estado,  
**Para** supervisar la cobertura educativa y gestionar las instituciones registradas.

#### Criterios de Aceptación:
- **AC-002.1:** `GET /api/v1/institutions` admite paginación (`page`, `limit`), ordenamiento y filtros: `departamento`, `distrito`, `tipo`, `activo`, `q` (búsqueda por SIE o nombre).
- **AC-002.2:** La respuesta incluye metadatos de paginación (`total`, `page`, `limit`, `totalPages`).
- **AC-002.3:** Cada ítem del listado incluye conteo de maestros vinculados activos.
- **AC-002.4:** `GET /api/v1/institutions/:id` retorna la ficha completa de la institución solicitada, incluyendo directores y administradores vigentes.

---

### US-003 (P1): Asignación de Autoridad Institucional (Director / Administrador)
**Como** Administrador Central,  
**Quiero** vincular a una Persona/Usuario existente como `DIRECTOR` o `ADMIN_INSTITUCIONAL` de una Unidad Educativa,  
**Para** delegar la administración local del colegio.

#### Criterios de Aceptación:
- **AC-003.1:** El endpoint `POST /api/v1/institutions/:id/authorities` recibe `ci` o `usuarioId`, `rolInstitucional` (`DIRECTOR` o `ADMIN_INSTITUCIONAL`) y `cargoOficial`.
- **AC-003.2:** Si la persona no tiene usuario activo, se retorna error explicativo.
- **AC-003.3:** Se crea o actualiza la fila en `vinculaciones_institucionales` asociando el colegio con el usuario.
- **AC-003.4:** Si el usuario designado es maestro (posee RDA), la vinculación asocia tanto `usuarioId` como `maestroId`.
- **AC-003.5:** Se audita la asignación con tipo `TEACHER_LINK`.

---

### US-004 (P2): Gestión de Estado Institucional (Suspensión / Reactivación)
**Como** Administrador Central,  
**Quiero** cambiar el estado de una Unidad Educativa entre activa e inactiva,  
**Para** suspender el servicio a instituciones en receso, clausuradas o en auditoría legal.

#### Criterios de Aceptación:
- **AC-004.1:** `PATCH /api/v1/institutions/:id/status` permite actualizar el campo booleano `activo`.
- **AC-004.2:** Cuando una institución pasa a `activo = false`, cualquier intento posterior de cualquier usuario de ingresar con `X-Institution-Id` de dicha institución es denegado de inmediato con `403 Forbidden` mediante `TenantContextGuard`.
- **AC-004.3:** No se eliminan datos físicos (`soft-block`), preservando la integridad histórica académica.

---

### US-005 (P2): Edición Institucional Descentralizada
**Como** Director o Administrador Institucional de un colegio,  
**Quiero** actualizar la dirección, teléfonos y datos de contacto de mi propia institución,  
**Para** mantener la información administrativa actualizada sin depender del nivel central.

#### Criterios de Aceptación:
- **AC-005.1:** `PATCH /api/v1/institutions/my-institution` permite a un usuario institucional autenticado modificar únicamente: `direccion`, `telefono`, y `cargoOficial`.
- **AC-005.2:** Campos estructurales (`sie`, `nombre`, `tipo`, `departamento`, `provincia`, `municipio`, `activo`) están bloqueados para edición local (inmutabilidad protegida; retorna `400 Bad Request` o se descartan si son enviados).
- **AC-005.3:** La operación se ejecuta bajo el contexto validado por `TenantContextGuard`.

---

## 4. CASOS DE BORDE Y CONDICIONES DE ERROR

1. **Intento de registrar SIE no numérico o con longitud inválida:**
   - La validación `class-validator` rechaza con `400 Bad Request` antes de tocar la base de datos.
2. **Colisión de código SIE:**
   - Se intercepta el código de error `P2002` de Prisma y se transforma en `409 Conflict: "El código SIE ya se encuentra registrado por otra Unidad Educativa"`.
3. **Institución sin autoridades registradas:**
   - El sistema permite el alta de la institución sin obligar a registrar un director en el mismo paso atómico, permitiendo flujos de aprovisionamiento en lote.
4. **Director trasladado:**
   - Un director puede desvincularse (`estado = TRASLADADO` o `INACTIVO`) manteniendo el registro histórico en `vinculaciones_institucionales`.
