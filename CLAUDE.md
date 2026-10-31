# Sistema Integral de Registro y Gestión de Maestros — Guía de Desarrollo SDD

> **Fuente de Verdad del Proyecto:** [specs/constitution.md](specs/constitution.md).  
> **Ámbito:** Estado Plurinacional de Bolivia | **Arquitectura:** Multi-Tenant con PostgreSQL RLS | **Metodología:** Spec-Driven Development (SDD).

---

## Estado del Proyecto

- **Constitución:** V1.1.0 Ratificada ([specs/constitution.md](specs/constitution.md)).
- **Fase Actual:** Preparación de especificaciones de arquitectura base y MVP.
- **Active feature:** Ninguna activa (en fase de especificación inicial).

<!--
## Historial de Features:
- [specs/NNN-.../plan.md](...): Resumen de feature completada.
-->

---

## Stack Tecnológico Oficial

- **Frontend:** Next.js (App Router), React, TypeScript estricto (`strict: true`, `noUncheckedIndexedAccess`), Tailwind CSS.
- **Backend:** NestJS con arquitectura modular por dominios (Auth, Institutions, Teachers, Academic, Evaluations, Attendance, Audit) y API REST tipada bajo OpenAPI 3.0 (Swagger).
- **Base de Datos & Persistencia:** PostgreSQL 16+ con **Row Level Security (RLS)** obligatorio + Prisma ORM (con inyección de contexto de sesión tenant).
- **Autenticación & Autorización:** JWT con resolución de contexto institucional + RBAC Contextual evaluado contra `[Usuario, Rol, Institución, Recurso, Operación]`.
- **Almacenamiento de Archivos:** Compatible con S3 (MinIO / S3 estándar) con URLs prefirmadas de corta duración sujetas a validación de pertenencia.
- **Infraestructura:** Docker y Docker Compose para reproducibilidad exacta en desarrollo y despliegues soberanos.

---

## Reglas Mandatorias de la Constitución (No Negociables)

1. **Aislamiento Multi-Tenant Estricto:** Toda tabla de datos institucionales contiene la columna `institution_id` indexada. Ninguna consulta o endpoint puede devolver o alterar datos de un tenant ajeno.
2. **Defensa en Profundidad con RLS:** PostgreSQL RLS está habilitado y forzado en todas las entidades institucionales.
3. **No Confianza en el Frontend:** El `institution_id` enviado por cliente nunca es autorización; el backend valida y fija el contexto institucional activo desde la sesión.
4. **Separación Ontológica de Identidad:**
   - `Persona`: Datos biográficos únicos y globales (evita duplicidad).
   - `Maestro`: Perfil profesional y RDA único.
   - `Vinculación Institucional`: Relación formal N:M entre Maestro y Unidad Educativa.
   - `Asignación Académica`: Asignación local por Gestión Escolar, Materia y Paralelo.
5. **Specs Antes de Código:** Prohibido escribir código de producción sin una especificación previa (`spec.md`), plan técnico (`plan.md`) y tareas ordenadas (`tasks.md`) aprobadas.
6. **Inmutabilidad y Auditoría:** Prohibido el *hard-delete* en calificaciones, asistencias y expedientes; borrado lógico y registro inmutable en tabla `AuditLog`.

---

## Manejo de Variables de Entorno / Credenciales (Obligatorio)

Cuando se requieran variables de entorno o credenciales:
1. Crear los placeholders directamente en `.env` (append, sin alterar lo existente) con el prefijo `REEMPLAZA_...`.
2. Incluir comentarios `#` explicativos sobre cómo obtener o generar el valor de forma local.
3. Resumir brevemente en el chat y continuar; nunca exponer secretos reales en el control de versiones.

---

## Definición de Hecho REFORZADA (DoD Operativa)

"Typecheck + lint + build" es el piso básico. Una feature **NO está terminada** hasta que se ejecute la verificación de comportamiento de punta a punta:
1. Conducir el flujo real de punta a punta (usando navegador / Playwright para UI, llamadas REST OpenAPI para backend).
2. Verificar el resultado observable de cara al usuario, no únicamente códigos de estado HTTP 2xx.
3. Probar el camino infeliz (inputs inválidos, intentos de acceso cruzado entre instituciones, conmutación de contexto errónea) comprobando que degrada con mensajes claros sin caídas.
4. Si algo requiere juicio humano o validación ministerial externa, marcarlo explícitamente como **pendiente de verificación humana**.

---

## Modo Objetivo — Loop SDD

Cuando se asigna un objetivo, el desarrollo se ejecuta mediante el ciclo autónomo y disciplinado:

$$\text{Discover} \longrightarrow \text{Plan} \longrightarrow \text{Execute} \longrightarrow \text{Verify} \longrightarrow \text{Iterate}$$

1. **Discover:** Leer spec, plan, tasks, constitución y estado del código. Agrupar dudas bloqueantes en una sola consulta inicial.
2. **Plan:** Generar especificaciones y tareas atómicas dependientes.
3. **Execute:** Construir tarea por tarea siguiendo los principios constitucionales.
4. **Verify:** Ejecutar gate técnico (types, lint, build) y verificación de comportamiento E2E (aislamiento multi-tenant comprobado).
5. **Iterate:** Diagnosticar y corregir fallos dentro del loop hasta obtener verde antes de entregar.
