# Directorio de Especificaciones SDD (`specs/`)

En este directorio se gestiona todo el ciclo de vida de desarrollo guiado por especificaciones (**Spec-Driven Development**).

---

## 🏛️ Fuente de Verdad del Proyecto

La base normativa y funcional que gobierna todas las especificaciones es:
👉 **[constitution.md](constitution.md)** *(Constitución V1.1.0 — Ratificada)*

Cualquier especificación (`spec.md`), plan técnico (`plan.md`) o tarea (`tasks.md`) debe pasar obligatoriamente el **Constitution Check** antes de ser aprobada para desarrollo.

---

## 📁 Estructura de Features

Cada módulo o funcionalidad crea su propia carpeta numerada de forma atómica:

```text
specs/
├── constitution.md        # CONSTITUCIÓN OFICIAL (Fuente de Verdad)
├── README.md              # Este archivo
└── NNN-nombre-feature/    # Directorio de la funcionalidad
    ├── spec.md            # QUÉ y POR QUÉ (Requerimientos y comportamiento observable)
    ├── plan.md            # CÓMO (Arquitectura, modelo de datos y Constitution Check)
    ├── research.md        # Decisiones técnicas y pruebas de concepto
    ├── data-model.md      # Esquemas de base de datos y aislamiento RLS
    ├── contracts/         # Contratos de API REST (OpenAPI / Swagger)
    ├── quickstart.md      # Procedimiento de prueba y verificación E2E
    ├── checklists/        # Listas de verificación de calidad
    └── tasks.md           # Tareas ordenadas por dependencia (Estado durable)
```

Las carpetas de features no se crean manualmente; se generan a través de las herramientas de SpecKit (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`).
