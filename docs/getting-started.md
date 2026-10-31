# Guía de Inicio Rápido (Getting Started)

Esta guía describe el flujo para comenzar a trabajar en el **Sistema Integral de Registro y Gestión de Maestros** bajo la metodología **Spec-Driven Development (SDD)**.

---

## 1. Requisitos Previos

- **Entorno de Asistente:** Antigravity / Claude Code autenticado.
- **Node.js 18+ y npm / npx:** Para ejecución de herramientas del arnés `rsc` y scripts de validación.
- **Docker y Docker Compose:** Para levantar la base de datos PostgreSQL con soporte de RLS y servicios locales.
- **Git:** Control de versiones.

---

## 2. Fuente de Verdad y Marco Constitucional

Antes de proponer o desarrollar cualquier funcionalidad, revisa:
- **[specs/constitution.md](../specs/constitution.md):** Contiene las decisiones estratégicas de la Adenda Oficial V1.1 (arquitectura multi-tenant, separación de entidades, 3 niveles institucionales y matriz RBAC).
- **[CLAUDE.md](../CLAUDE.md):** Define las reglas de trabajo, gestión de credenciales y la Definición de Hecho Reforzada.

---

## 3. Configuración del Entorno Local

1. Copia el archivo de variables de entorno de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Completa los valores de configuración local en `.env` (PostgreSQL `DATABASE_URL`, secretos JWT, etc.).
3. Levanta la base de datos local multi-tenant:
   ```bash
   docker compose up -d postgres
   ```

---

## 4. Ciclo de Desarrollo de Features (SDD)

El flujo de trabajo prohíbe escribir código directamente. Cada funcionalidad se desarrolla en fases:

```text
specify ──► clarify ──► plan ──► tasks ──► implement ──► verify
```

1. **Especificar (`/speckit-specify`):** Redactar `spec.md` con los requerimientos de usuario y criterios de aceptación observables.
2. **Aclarar (`/speckit-clarify`):** Resolver ambigüedades antes de planificar.
3. **Planificar (`/speckit-plan`):** Validar el **Constitution Check** (aislamiento multi-tenant, modelo de datos y RLS) y generar contratos OpenAPI.
4. **Tareas (`/speckit-tasks`):** Desglosar en tareas atómicas con dependencias ordenadas en `tasks.md`.
5. **Implementar (`/speckit-implement`):** Construcción paso a paso del código.
6. **Verificar:** Ejecutar validación de tipos, tests unitarios, verificación de aislamiento multi-tenant y prueba de comportamiento en vivo.
