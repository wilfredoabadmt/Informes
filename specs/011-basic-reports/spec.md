# Especificación de Requerimientos — Feature 011: Reportes Básicos (Listas, Boletines y Libretas Oficiales)

**Feature:** `011-basic-reports`  
**Módulo:** Emisión de Reportes Básicos: Listas de Curso, Boletines Trimestrales y Libretas Escolares en PDF (Nivel 2 y Nivel 3)  
**Versión:** 1.0.0  
**Fecha:** 2026-10-31  
**Estado:** PROPUESTO  
**Constitución Referencia:** V1.1.0 (Decisiones 001, 002-B; Sección 2 - Nivel 2 y 3; Sección 3 - Principios 1, 2, 5, 6, 10; Sección 7 - Módulo 15; Sección 10 - Resolución ADR-001)  

---

## 1. Contexto del Negocio y Dominio SEP (Bolivia)

Conforme a la normativa educativa del Subsistema de Educación Regular de Bolivia (Ley 070 Avelino Siñani - Elizardo Pérez y resoluciones administrativas ministeriales):
1. **Lista Oficial de Curso / Paralelo (Roster Oficial):**
   - Nómina oficial de estudiantes matriculados en estado `EFECTIVO` para un grado y paralelo determinado.
   - Orden alfabético estricto: Primer Apellido, Segundo Apellido, Nombres.
   - Datos requeridos: Nº de orden, Código RUDE, Cédula de Identidad con complemento, Nombres y Apellidos, Género, Fecha de Nacimiento, Tutor/Apoderado legal y teléfono de contacto.
   - Encabezado oficial con datos institucionales: Código SIE, Unidad Educativa, Distrito Educativo, Departamento, Nivel, Turno y Gestión Escolar.
2. **Boletín Trimestral de Calificaciones:**
   - Instrumento periódico de información académica y pedagógica entregado a tutores y padres de familia al finalizar cada trimestre.
   - Refleja para cada materia de la malla curricular:
     - Dimensiones evaluativas: Ser, Saber, Hacer, Decidir y Autoevaluación.
     - Nota cuantitativa final del trimestre en escala de 1 a 100 puntos.
     - Estado de aprobación ($ \ge 51 $ Aprobado, $ < 51 $ Reprobado).
     - Apreciación cualitativa de orientación pedagógica.
     - Resumen de asistencia del estudiante en el trimestre (Presentes, Atrasos, Licencias, Faltas).
   - Resumen general: promedio trimestral del estudiante, total de materias aprobadas y reprobadas.
3. **Libreta Escolar Electrónica Oficial:**
   - Documento acreditativo oficial emitido al concluir la gestión escolar.
   - Consolida las calificaciones de los tres trimestres (1T, 2T, 3T) por materia, el promedio anual por materia y el Promedio General Anual.
   - Estado por asignatura y Situación Final oficial del estudiante: `PROMOVIDO` o `RETENIDO`.
   - Resumen global anual de asistencia y conducta/desempeño integral.
   - Espacios formales para firmas del Director/a y del Maestro/a Asesor de Curso.
4. **Formato Dual de Entrega (JSON + PDF):**
   - Cada reporte debe poder consultarse como estructura de datos tipada (JSON) para renderizado en frontend/interfaces interactivas.
   - Debe poder descargarse como documento PDF imprimible (`application/pdf`) de alta fidelidad técnica.

---

## 2. Requerimientos Funcionales (User Stories)

### US-001: Emisión de Lista Oficial de Curso / Paralelo
**Como** Director, Secretario o Maestro Asesor de un paralelo  
**Quiero** obtener la lista oficial de estudiantes inscritos en formato JSON y PDF  
**Para** contar con la nómina de control de aula, archivo físico institucional y verificación de matrícula.

#### Criterios de Aceptación:
- Parámetro de entrada: `paraleloId` (UUID).
- Valida que el paralelo pertenezca a la institución activa del usuario autenticado (RLS).
- Lista únicamente inscripciones en estado `EFECTIVO`.
- Ordena alfabéticamente por apellido y nombre de los estudiantes.
- Incluye encabezado institucional: SIE, nombre de UE, nivel, grado, paralelo, turno y gestión.
- Endpoint JSON: `GET /reports/course-roster?paraleloId=...`
- Endpoint PDF: `GET /reports/course-roster/pdf?paraleloId=...` con headers `Content-Type: application/pdf` y `Content-Disposition: inline; filename="lista_curso_...pdf"`.

---

### US-002: Emisión del Boletín Trimestral de Calificaciones
**Como** Director, Secretario o Maestro de una unidad educativa  
**Quiero** emitir el boletín de calificaciones de un estudiante para un trimestre determinado  
**Para** entregar el informe oficial de aprovechamiento escolar a los padres de familia.

#### Criterios de Aceptación:
- Parámetros de entrada: `inscripcionId` (UUID) y `periodoId` (UUID).
- Valida aislamiento multi-tenant RLS sobre la inscripción y el periodo.
- Desglosa todas las materias asignadas al paralelo del estudiante.
- Presenta las notas de las dimensiones (Ser, Saber, Hacer, Decidir, Autoevaluación) y la nota trimestral final.
- Incluye la apreciación cualitativa del trimestre si existe.
- Incluye el desglose de asistencia del estudiante durante el rango de fechas del periodo evaluativo (Presentes, Atrasos, Licencias, Faltas).
- Calcula promedio trimestral del estudiante y total materias reprobadas.
- Endpoint JSON: `GET /reports/trimester-bulletin?inscripcionId=...&periodoId=...`
- Endpoint PDF: `GET /reports/trimester-bulletin/pdf?inscripcionId=...&periodoId=...`.

---

### US-003: Emisión de la Libreta Escolar Anual
**Como** Director o Secretario de la Unidad Educativa  
**Quiero** generar la libreta escolar electrónica oficial de un estudiante  
**Para** certificar el rendimiento anual y la promoción o retención de grado escolar.

#### Criterios de Aceptación:
- Parámetro de entrada: `inscripcionId` (UUID).
- Valida aislamiento multi-tenant RLS.
- Incluye las notas de los 3 trimestres por cada materia y el promedio anual redondeado.
- Muestra el promedio general anual y la `situacionFinal` (`PROMOVIDO` o `RETENIDO`).
- Muestra el consolidado acumulado de asistencia en toda la gestión escolar.
- Endpoint JSON: `GET /reports/school-report-card?inscripcionId=...`
- Endpoint PDF: `GET /reports/school-report-card/pdf?inscripcionId=...`.

---

### US-004: Auditoría y Seguridad Multi-Tenant
**Como** Responsable de Seguridad del Sistema  
**Quiero** que la generación y descarga de reportes oficiales quede registrada en la bitácora de auditoría  
**Para** garantizar la inmutabilidad y trazabilidad de los documentos emitidos.

#### Criterios de Aceptación:
- Toda invocación de reporte genera traza en `AuditService`.
- Ningún usuario puede acceder a reportes de otra institución (`TenantContextGuard` + RLS).
