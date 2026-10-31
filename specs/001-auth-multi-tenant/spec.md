# Feature Specification: 001-auth-multi-tenant
## Autenticación Multi-Tenant y Resolución de Contexto Institucional

**Feature Branch:** `001-auth-multi-tenant`  
**Creado:** 2026-10-31  
**Estado:** Especificación Aprobada  
**Dominio:** Módulo 001 del MVP — Seguridad y Multi-Tenancy  
**Marco Normativo:** [specs/constitution.md](../constitution.md) (Decisiones 001, 004, 005) y [ADR-002](../adrs/ADR-002-multi-tenant-auth-context.md)

---

## 1. Resumen Ejecutivo

El Módulo de Autenticación Multi-Tenant constituye la puerta de entrada y el cimiento de seguridad del Sistema Integral de Registro y Gestión de Maestros. Permite que cualquier usuario (maestro, director, secretario o administrador) autentique su identidad global única mediante credenciales seguras, obtenga el listado de unidades educativas donde posee vinculación activa y conmute fluidamente entre sus espacios institucionales autorizados.

Cada interacción con recursos protegidos por la institución exige y valida el contexto institucional activo en el backend, imposibilitando accesos cruzados o fugas de información entre colegios.

---

## 2. Historias de Usuario y Escenarios de Aceptación

### User Story 1 — Inicio de Sesión Global y Consulta de Colegios Vinculados (Prioridad: P1)

Como usuario registrado en la plataforma (maestro, director o administrativo), quiero iniciar sesión con mi correo electrónico / nombre de usuario y contraseña para acceder a la plataforma y visualizar las unidades educativas en las que tengo vinculación activa.

**Por qué esta prioridad:** Es el requisito previo indispensable para cualquier operación en el sistema.

**Prueba Independiente:** Se puede probar enviando credenciales válidas a `POST /api/v1/auth/login`, comprobando que devuelva un JWT válido y la lista de unidades educativas autorizadas con sus roles correspondientes.

**Escenarios de Aceptación:**
1. **Given** un usuario activo con contraseña correcta, **When** envía sus credenciales al endpoint de login, **Then** el sistema responde con `200 OK`, un token JWT de identidad con expiración definida y un arreglo de objetos con las instituciones donde posee vinculación activa (`id`, `nombre`, `sie`, `cargo`).
2. **Given** credenciales con contraseña incorrecta o usuario inexistente, **When** intenta iniciar sesión, **Then** el sistema responde con `401 Unauthorized` con un mensaje genérico para evitar enumeración de cuentas.
3. **Given** un usuario en estado "bloqueado" o "inactivo", **When** intenta iniciar sesión, **Then** el sistema rechaza el acceso con `403 Forbidden: Cuenta inactiva o suspendida`.

---

### User Story 2 — Selección y Enlace de Contexto Institucional Activo (Prioridad: P1)

Como usuario vinculado a una unidad educativa, quiero enviar el identificador de mi colegio activo en cada solicitud mediante el encabezado `X-Institution-Id` para que el backend valide mi membresía y filtre estrictamente la información de ese colegio.

**Por qué esta prioridad:** Cumple con la Decisión Constitucional 005 y el Principio de Aislamiento I (aislamiento multi-tenant en backend).

**Prueba Independiente:** Realizar una petición a un recurso institucional (`GET /api/v1/auth/me/context`) con el header `X-Institution-Id` de un colegio vinculado y verificar que devuelva el contexto de la institución con los permisos asignados en ella.

**Escenarios de Aceptación:**
1. **Given** un token JWT válido y un header `X-Institution-Id` correspondiente a un colegio donde el usuario está vinculado activamente, **When** realiza una solicitud protegida, **Then** el `TenantContextGuard` permite la ejecución, inyecta el `institution_id` en la sesión y devuelve los datos correspondientes a ese tenant.
2. **Given** una solicitud a un endpoint institucional sin el header `X-Institution-Id`, **When** se evalúa la petición, **Then** el sistema responde con `400 Bad Request: Contexto de institución no especificado`.

---

### User Story 3 — Bloqueo de Acceso a Instituciones no Vinculadas (Prioridad: P1)

Como responsable de seguridad del sistema, quiero que cualquier intento de acceder con un `X-Institution-Id` no vinculado al usuario sea rechazado inmediatamente y registrado en auditoría, para prevenir ataques de elevación de privilegios o consulta de datos cruzados entre colegios.

**Por qué esta prioridad:** Garantiza el criterio constitucional C1 y C2 (cero fugas de información interinstitucional).

**Prueba Independiente:** Intentar acceder a datos institucionales enviando un UUID de colegio válido en el sistema pero al cual el usuario autenticado NO pertenece.

**Escenarios de Aceptación:**
1. **Given** un maestro que solo trabaja en el Colegio "San Martín" (ID: `uuid-a`), **When** envía una solicitud con `X-Institution-Id: uuid-b` (Colegio "Bolívar"), **Then** el `TenantContextGuard` bloquea la solicitud respondiendo `403 Forbidden: No posee vinculación activa con la institución solicitada`.
2. **Given** el intento de acceso bloqueado en el escenario anterior, **When** se evalúa la acción, **Then** el sistema genera una entrada de alerta en la tabla de auditoría con la IP, ID de usuario, institución solicitada y código de evento `SECURITY_TENANT_MISMATCH`.

---

### User Story 4 — Conmutación Ágil de Contexto Institucional (Prioridad: P2)

Como maestro que trabaja simultáneamente en dos unidades educativas (ej. Colegio Mañana y Colegio Tarde), quiero seleccionar mi colegio en un selector de la barra superior para cambiar mi espacio de trabajo de forma instantánea sin tener que volver a ingresar mi contraseña.

**Por qué esta prioridad:** Resuelve la Decisión Estratégica 004 (identidad profesional única con asignaciones independientes).

**Prueba Independiente:** Cambiar el valor del header `X-Institution-Id` entre dos llamadas consecutivas con el mismo JWT de identidad y verificar que ambas llamadas respondan con el conjunto de datos aislado de cada colegio.

**Escenarios de Aceptación:**
1. **Given** un docente vinculado al Colegio A y al Colegio B, **When** realiza una consulta con `X-Institution-Id: Colegio_A`, **Then** recibe la información del Colegio A.
2. **Given** el mismo docente del escenario anterior, **When** en la siguiente petición envía `X-Institution-Id: Colegio_B`, **Then** recibe la información del Colegio B, sin requerir reautenticación.

---

### User Story 5 — Cierre de Sesión y Revocación de Tokens (Prioridad: P3)

Como usuario de la plataforma, quiero cerrar sesión en el sistema para invalidar mi sesión en terminales compartidas de la sala de profesores.

**Escenarios de Aceptación:**
1. **Given** un usuario autenticado, **When** envía una petición a `POST /api/v1/auth/logout`, **Then** el refresh token es revocado en la base de datos y la sesión queda cerrada.

---

## 3. Requerimientos Funcionales y No Funcionales

### Requerimientos Funcionales
- **RF-01:** Autenticación de credenciales con hashing de contraseñas mediante **Argon2id**.
- **RF-02:** Emisión de pares de tokens: Access Token JWT (vida corta: 15 minutos) y Refresh Token (vida media: 7 días, rotación en cada uso).
- **RF-03:** Endpoint `GET /api/v1/auth/me` para obtener el perfil del usuario y sus vinculaciones activas.
- **RF-04:** Guard de NestJS (`TenantContextGuard`) que intercepte y valide la existencia y vigencia de la vinculación entre el usuario y la institución indicada en `X-Institution-Id`.
- **RF-05:** Inyección del identificador de institución verificado en el contexto de la transacción interactiva de PostgreSQL mediante `SET LOCAL app.current_institution_id = $id`.

### Requerimientos No Funcionales
- **RNF-01 (Seguridad):** Tiempos de verificación de credenciales con protección contra ataques de temporización (*constant-time comparison*).
- **RNF-02 (Rendimiento):** La resolución de la vinculación institucional en el Guard no debe demorar más de 10ms (utilizando índices específicos en `(user_id, institution_id)` o caché en memoria).
- **RNF-03 (Observabilidad):** Formato estándar de errores HTTP conforme a RFC 7807 (Problem Details).
