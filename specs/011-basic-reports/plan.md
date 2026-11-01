# Plan de Implementación — Feature 011: Reportes Básicos

## 1. Arquitectura Técnica y Estrategia

El módulo `ReportsModule` se estructurará desacoplado en:
- `ReportsController`: Expone endpoints REST en `/reports` para consultas JSON y descargas en PDF con streaming o buffers binarios.
- `ReportsService`: Coordina consultas agregadas con `PrismaService.withTenantContext(...)` garantizando PostgreSQL RLS.
- `PdfGeneratorService`: Servicio especializado que construye documentos PDF profesionales utilizando `pdfkit`. Genera encabezados formales con el escudo/nombre del colegio, tablas estructuradas con líneas divisorias, formato de notas y pie de página con firmas de Dirección y Docente.
- DTOs fuertemente tipados con `class-validator` (`IsUUID`, etc.).
- Auditoría mediante `AuditService`.

---

## 2. Fases de Ejecución

1. **Fase 1: Especificación y Contratos** ✅
   - `spec.md`, `data-model.md`, `contracts/openapi.yaml`, `plan.md`, `tasks.md`.
2. **Fase 2: Dependencias y DTOs**
   - Instalar `pdfkit` y `@types/pdfkit` (completado).
   - Crear DTOs para query params (`QueryCourseRosterDto`, `QueryTrimesterBulletinDto`, `QuerySchoolReportCardDto`).
3. **Fase 3: Implementación del Generador PDF y Servicio de Reportes**
   - `PdfGeneratorService`: Funciones para construir buffers de PDF (lista de curso, boletín trimestral, libreta anual).
   - `ReportsService`: Métodos para consulta agregada multi-tenant de datos y delegación a PDF.
   - `ReportsController`: Decoradores `@Get()`, `@Res()`, `@Audit()`, control de encabezados HTTP (`Content-Type: application/pdf`).
4. **Fase 4: Registro y Módulos**
   - Crear `ReportsModule` y registrar en `AppModule`.
5. **Fase 5: Pruebas Unitarias**
   - Probar `ReportsService` y cálculo de boletines/libretas, validaciones y manejo de excepciones.
6. **Fase 6: Pruebas de Integración E2E**
   - Configuración multi-tenant: 2 colegios (SIE 80710001 y 80710002), estudiantes, materias, asistencias, notas trimestrales y libreta anual.
   - Verificar respuestas JSON 200 y descargas PDF binarias válidas (que inicien con el header mágico `%PDF-`).
   - Verificar rechazo cross-tenant 404 (aislamiento RLS).
7. **Fase 7: Commit y Merge**
   - Actualizar `tasks.md`, commit en `feature/011-basic-reports`, merge `--no-ff` a `main`.
