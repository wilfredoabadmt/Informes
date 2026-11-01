# Plan de Implementación — Feature 013: Importación y Exportación Masiva

## 1. Arquitectura Técnica

El módulo `DataExchangeModule` se encargará de las transformaciones tabulares entre archivos binarios (Excel/CSV) y la base de datos:
- `DataExchangeController`: Expone endpoints con `FileInterceptor` para subida de archivos y descargas binarias con cabeceras `Content-Type` y `Content-Disposition`.
- `SpreadsheetParserService`: Servicio utilitario que utiliza `xlsx` para:
  - Parsear buffers `.xlsx` y `.csv` a arreglos de objetos tipados.
  - Generar buffers `.xlsx` o `.csv` a partir de arreglos tabulares y hojas de cálculo.
- `DataExchangeService`:
  - `importStudents`: Procesa nóminas por lote, valida cédulas, RUDEs, crea Personas, Estudiantes e Inscripciones bajo RLS, registrando auditoría.
  - `importTeachers`: Procesa docentes, crea Personas, Usuarios, Maestros y Vinculaciones bajo RLS con auditoría.
  - `exportStudents`: Genera planilla de estudiantes para un paralelo.
  - `exportTeachers`: Genera planilla de docentes vinculados.
  - `getStudentTemplate` y `getTeacherTemplate`: Genera plantillas oficiales de llenado.

---

## 2. Fases de Ejecución

1. **Fase 1: Especificación y Contratos** ✅
2. **Fase 2: Instalación de Dependencias y DTOs**
   - `xlsx` y `@types/multer` (instalados).
   - Crear DTOs para query params (`QueryExportStudentsDto`, `QueryExportTeachersDto`, `QueryTemplateDto`, etc.).
3. **Fase 3: Implementación de Servicios y Controlador**
   - Implementar `SpreadsheetParserService`.
   - Implementar `DataExchangeService`.
   - Implementar `DataExchangeController`.
   - Registrar `DataExchangeModule` en `AppModule`.
4. **Fase 4: Pruebas Unitarias**
   - Probar parsing, validaciones, importación y exportación en `data-exchange.service.spec.ts`.
5. **Fase 5: Pruebas de Integración E2E**
   - Configuración en PostgreSQL con RLS (`data-exchange.e2e-spec.ts`).
   - Importar estudiantes vía multipart con archivo CSV/XLSX.
   - Importar docentes vía multipart.
   - Exportar estudiantes y verificar buffer binario.
   - Verificar auditoría y rechazo cross-tenant.
6. **Fase 6: Merge a Main**
