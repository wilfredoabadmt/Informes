# Especificación de Requerimientos — Feature 013: Importación y Exportación Masiva (Excel/CSV)

**Feature:** `013-bulk-import-export`  
**Módulo:** Carga Masiva de Estudiantes/Docentes y Exportación de Planillas Oficiales (Nivel 2)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B; Sección 2 - Nivel 2; Sección 3 - Principios 1, 2, 5, 8, 10; Sección 7 - Módulo 17)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

En el inicio de cada gestión escolar o en los periodos de regularización de matrícula del Sistema Educativo Plurinacional (SEP):
1. **Carga Masiva de Estudiantes:**
   - Las unidades educativas reciben listas oficiales o archivos desde el sistema ministerial SIGED/RUDE con cientos de estudiantes.
   - Registrar alumno por alumno manualmente es ineficiente y propenso a errores de transcripción.
   - Se requiere un importador robusto que procese archivos Excel (`.xlsx`) y CSV (`.csv`), valide los datos biométricos (CI, RUDE, nombres, fecha de nacimiento, tutor) e inscriba formalmente a los estudiantes en sus paralelos correspondientes.
2. **Carga Masiva de Docentes:**
   - Al inicio del año lectivo, la Dirección debe registrar al cuerpo docente asignado por memorándum distrital con su respectivo código RDA (Registro Docente Administrativo) y especialidad de formación.
3. **Exportación de Planillas Oficiales:**
   - La Dirección y Secretaría deben remitir periódicamente nóminas de estudiantes y planillas consolidadas de calificaciones a las Direcciones Distritales de Educación en formatos tabulares abiertos (`.xlsx` y `.csv`).
4. **Plantillas Oficiales de Intercambio:**
   - El sistema debe ofrecer la descarga de plantillas en blanco con las cabeceras normalizadas para asegurar la compatibilidad de importación sin fallos de formato.
5. **Auditoría y Aislamiento Multi-Tenant:**
   - Toda importación masiva debe ejecutarse de forma atómica y auditable bajo el contexto institucional del usuario autenticado (RLS).

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Importación Masiva de Estudiantes
**Como** Director o Secretario de la Unidad Educativa  
**Quiero** subir un archivo Excel o CSV con la nómina de estudiantes  
**Para** registrar automáticamente las personas, estudiantes e inscripciones en el paralelo asignado.

#### Criterios de Aceptación:
- Endpoint: `POST /data-exchange/import/students` (form-data: `file`, `paraleloId`).
- Acepta archivos `.xlsx`, `.xls` y `.csv`.
- Valida campos requeridos: `ci`, `nombres`, `primerApellido`, `codigoRude`.
- Valida formato de fecha de nacimiento (`YYYY-MM-DD` o fecha serial de Excel).
- Reutiliza personas existentes por CI o crea nuevas.
- Asocia al estudiante con su código RUDE único y genera la inscripción en estado `EFECTIVO`.
- Si un estudiante ya está inscrito en el paralelo, lo cuenta como omitido/duplicado sin abortar el resto del lote.
- Retorna resumen detallado: `{ totalProcesados, creados, duplicados, errores: Array<{ fila, error }> }`.
- Registra auditoría con `BULK_STUDENTS_IMPORTED`.

---

### US-002: Importación Masiva de Docentes
**Como** Director de la Unidad Educativa  
**Quiero** cargar una planilla con los maestros asignados al colegio  
**Para** registrar sus expedientes profesionales y habilitar sus vinculaciones institucionales activas.

#### Criterios de Aceptación:
- Endpoint: `POST /data-exchange/import/teachers` (form-data: `file`).
- Columnas: `ci`, `nombres`, `primerApellido`, `segundoApellido`, `email`, `telefono`, `rda`, `especialidad`, `rolInstitucional` (`DOCENTE`, `DIRECTOR`, `SECRETARIO`).
- Crea Persona, Usuario (con contraseña inicial segura hasheada con Argon2id), Maestro (RDA) y Vinculación Institucional en estado `ACTIVO`.
- Retorna resumen de filas procesadas, creadas y errores por fila.
- Registra auditoría con `BULK_TEACHERS_IMPORTED`.

---

### US-003: Exportación Tabular de Nóminas y Planillas (Excel y CSV)
**Como** Director o Secretario  
**Quiero** exportar nóminas de estudiantes, listas docentes y planillas de calificaciones en `.xlsx` o `.csv`  
**Para** remitir informes a la Dirección Distrital o trabajar hojas de cálculo fuera de línea.

#### Criterios de Aceptación:
- `GET /data-exchange/export/students?paraleloId=...&format=xlsx|csv`: Exporta nómina del curso.
- `GET /data-exchange/export/teachers?format=xlsx|csv`: Exporta nómina de docentes vinculados.
- `GET /data-exchange/export/grades?paraleloId=...&periodoId=...&format=xlsx|csv`: Exporta matriz centralizada de calificaciones.
- Encabezados HTTP con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` o `text/csv` y `Content-Disposition: attachment; filename=...`.

---

### US-004: Descarga de Plantillas de Carga
**Como** Usuario del sistema  
**Quiero** descargar plantillas en blanco con la estructura oficial requerida  
**Para** llenar la información correctamente antes de importar.

#### Criterios de Aceptación:
- `GET /data-exchange/templates/students?format=xlsx|csv`
- `GET /data-exchange/templates/teachers?format=xlsx|csv`
- Genera un archivo con encabezados oficiales y fila de ejemplo.
