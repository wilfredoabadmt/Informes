# Sistema Integral de Registro y Gestión de Maestros

Plataforma web centralizada y multiinstitucional para la administración del magisterio y la gestión académica escolar en el **Estado Plurinacional de Bolivia**, desarrollada bajo la metodología **Spec-Driven Development (SDD)**.

---

## 🏛️ Fuente de Verdad del Proyecto

La arquitectura, principios de diseño, modelo de datos y decisiones estratégicas se rigen estrictamente por la **Constitución del Proyecto**:
👉 **[specs/constitution.md](specs/constitution.md)** *(Versión 1.1.0 — Ratificada)*

Cualquier discrepancia entre especificaciones, planes técnicos o código de implementación se resuelve a favor de la Constitución.

---

## 🎯 Decisiones Estratégicas Clave (Adenda V1.1)

1. **Alcance Multiinstitucional (Multi-Tenant):** Una sola plataforma centralizada para administrar múltiples unidades educativas con total aislamiento de sus datos.
2. **Gestión Integral:**
   - **Área A (Gestión Profesional de Maestros):** Expedientes, RDA, formación, especialidades, historial de vinculaciones y estado laboral.
   - **Área B (Gestión Académica Escolar):** Cursos, paralelos, materias, estudiantes, asistencia, evaluaciones trimestrales, centralizadores y boletines.
3. **Administración Central:** Nivel de supervisión general del sistema para gestionar instituciones (código SIE), catálogos curriculares y auditoría consolidada.
4. **Identidad Docente Centralizada:** Un maestro posee una única identidad profesional global en la plataforma, pero sus vinculaciones laborales y asignaciones académicas son estrictamente independientes por colegio.
5. **Arquitectura Multi-Tenant con PostgreSQL y RLS:** Base de datos relacional compartida con aislamiento forzado en la base de datos mediante **PostgreSQL Row Level Security (RLS)** y validación contextual obligatoria en el backend.

---

## 🏢 Arquitectura Institucional (Tres Niveles)

* **Nivel 1 — Administración Central:** Habilitación de unidades educativas, catálogos del Sistema Educativo Plurinacional (SEP), parámetros globales y auditoría global.
* **Nivel 2 — Administración Institucional (Unidad Educativa):** Directores y secretarios gestionando la unidad educativa, matrícula de estudiantes, vinculación de docentes, asignaciones y centralizadores.
* **Nivel 3 — Gestión Docente:** Maestros gestionando sus listas de estudiantes asignados, registro de asistencia, calificaciones por dimensiones (Ser, Saber, Hacer, Decidir) y planificaciones de aula.

---

## 🛠️ Stack Tecnológico Oficial (Monolito Modular)

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router) + React + Tailwind CSS** | Portal web responsivo, conmutador de contexto institucional y planillas ágiles de notas. |
| **Backend** | **NestJS + TypeScript estricto** | API REST modular, validación estricta de DTOs, OpenAPI 3.0 (Swagger) y guards de contexto multi-tenant. |
| **Base de Datos** | **PostgreSQL 16+** | Persistencia relacional normalizada con políticas **Row Level Security (RLS)** activas. |
| **ORM** | **Prisma ORM** | Mapeo objeto-relacional y control de migraciones con inyección de tenant en sesión. |
| **Almacenamiento** | **Compatible S3 (MinIO / S3)** | Repositorio seguro para digitalización de títulos, memorándums y expedientes docentes. |
| **Infraestructura** | **Docker & Docker Compose** | Despliegue reproducible y soberano en entornos locales y servidores dedicados. |

---

## 📁 Estructura del Repositorio SDD

```text
├── specs/                   # Especificaciones funcionales y planes por feature (SDD)
│   ├── constitution.md      # Fuente de verdad oficial (Constitución v1.1.0)
│   └── README.md            # Guía del directorio de especificaciones
├── 02-DOCS/                 # Memoria persistente del arnés y wiki del proyecto
│   └── wiki/sdd/            # Documentación y constitución vinculada al arnés
├── .specify/                # Plantillas y scripts del flujo SpecKit (SDD)
│   └── memory/              # Memoria viva de la constitución y contexto
├── CLAUDE.md                # Contrato operativo y loop de desarrollo para asistentes de IA
└── README.md                # Este archivo
```

---

## 🚀 Alcance del MVP (17 Módulos Prioritarios)

1. Autenticación y Gestión de Sesión Multi-Tenant.
2. Gestión de Usuarios y Credenciales.
3. Administración de Unidades Educativas (Códigos SIE).
4. Motor de Roles y Permisos (RBAC Contextual).
5. Expediente y Registro Profesional de Maestros.
6. Vinculaciones Institucionales de Docentes.
7. Gestión Académica Anual y Periodos Evaluativos.
8. Padrón y Registro de Estudiantes (Códigos RUDE).
9. Estructura de Cursos, Grados y Paralelos.
10. Asignaciones Académicas (Docente-Materia-Paralelo).
11. Control de Asistencia Escolar y Justificaciones.
12. Configuración de Dimensiones de Evaluación.
13. Planilla de Registro de Calificaciones.
14. Centralizadores Consolidados de Notas.
15. Emisión de Reportes, Boletines y Listas.
16. Módulo Inmutable de Auditoría del Sistema.
17. Importación y Exportación Masiva (Excel/CSV/PDF).

---

## 🔄 Metodología de Desarrollo

El proyecto prohíbe la escritura directa de código sin especificación previa. Todo desarrollo sigue el ciclo:

$$\text{Specify} \longrightarrow \text{Clarify} \longrightarrow \text{Plan} \longrightarrow \text{Tasks} \longrightarrow \text{Implement} \longrightarrow \text{Verify}$$

Para conocer las reglas de trabajo, consulta [specs/constitution.md](specs/constitution.md) y [CLAUDE.md](CLAUDE.md).
