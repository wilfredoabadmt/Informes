# ADR-003: Estructura del Monolito Modular (NestJS + Next.js en Monorepo)

- **Estado:** Aprobado
- **Fecha:** 2026-10-31
- **Decisores:** Arquitectura de Software
- **Contexto:** Principios Arquitectónicos y Stack Técnico (Sección 5 de la Constitución)

---

## 1. Contexto y Problema

La **Constitución V1.1.0** estipula una arquitectura de **Monolito Modular** utilizando:
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Backend:** NestJS (TypeScript estricto), PostgreSQL con RLS, Prisma ORM, OpenAPI/Swagger.
- **Infraestructura:** Docker y Docker Compose.

Se requiere organizar el repositorio para que ambas aplicaciones convivan armoniosamente, compartan contratos tipados (DTOs, interfaces OpenAPI) y puedan ejecutarse de forma independiente o conjunta mediante Docker.

---

## 2. Decisión Adoptada

Se adopta una estructura de **Monorepo Limpio** con separación en dos aplicaciones de primer nivel: `backend/` y `frontend/`, coordinadas en la raíz por Docker Compose y scripts estandarizados.

### Estructura de Directorios del Código:

```text
├── backend/                       # Aplicación API REST (NestJS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # Autenticación, JWT, Guards y Tenant Context
│   │   │   ├── institutions/      # Unidades Educativas, SIE, configuración
│   │   │   ├── teachers/          # Padrón de Maestros, RDA, expedientes
│   │   │   ├── academic/          # Cursos, paralelos, materias, asignaciones
│   │   │   ├── students/          # Alumnos, inscripciones, RUDE
│   │   │   ├── evaluations/       # Evaluaciones, dimensiones, calificaciones
│   │   │   ├── attendance/        # Registro de asistencia escolar
│   │   │   ├── reports/           # Centralizadores, boletines, libretas PDF
│   │   │   └── audit/             # Trazabilidad y bitácora inmutable
│   │   ├── common/                # Decoradores, filtros, middlewares, RLS interceptors
│   │   ├── prisma/                # Prisma schema, migraciones y seeders
│   │   └── main.ts                # Bootstrap de la aplicación y Swagger
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                      # Aplicación Web (Next.js App Router)
│   ├── src/
│   │   ├── app/                   # Rutas de Next.js (Admin central, Institución, Docente)
│   │   ├── components/            # UI components (Tailwind CSS, tablas de notas, selector tenant)
│   │   ├── hooks/                 # Hooks de sesión y contexto institucional
│   │   ├── lib/                   # Clientes de API REST tipados
│   │   └── types/                 # Tipos compartidos generados desde OpenAPI
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml             # Orquestación de PostgreSQL 16 + Backend + Frontend
└── .env.example                   # Variables de entorno unificadas
```

---

## 3. Beneficios

1. **Desacoplamiento Estricto:** Frontend y backend mantienen dependencias limpias y aisladas.
2. **Desarrollo Guiado por Especificaciones (SDD):** Las especificaciones en `specs/` definen contratos OpenAPI que el backend implementa y el frontend consume sin ambigüedades.
3. **Escalabilidad y Despliegue Soberano:** Se puede desplegar todo en un único servidor dedicado o contenedor VPS mediante Docker Compose, cumpliendo con la soberanía de datos del Estado Plurinacional de Bolivia.

