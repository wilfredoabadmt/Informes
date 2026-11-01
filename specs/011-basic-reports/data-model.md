# Modelo de Datos y Entidades — Feature 011: Reportes Básicos

## 1. Relación con el Modelo de Datos Existente

El módulo de Reportes Básicos (`ReportsModule`) consolida y proyecta información agregada proveniente de los módulos de Gestión Institucional, Estructura Académica, Asistencia, Evaluaciones, Calificaciones y Centralizadores. No introduce mutaciones de esquema transaccional en PostgreSQL, pero utiliza intensivamente el aislamiento Row Level Security (RLS) en todas sus consultas.

```
[ Institucion ] ── (RLS context)
      │
      ├── [ GestionEscolar ] ── [ PeriodoEvaluacion ] (Trimestres 1, 2, 3)
      │
      ├── [ Curso ] ── [ Paralelo ] ── [ AsignacionAcademica ] ── [ Materia ]
      │                     │
      │                     └── [ Inscripcion ] (promedioAnual, situacionFinal)
      │                               │
      │                               ├── [ Estudiante ] ── [ Persona ]
      │                               │
      │                               ├── [ Asistencia ] (PRESENTE, FALTA, ATRASO, LICENCIA)
      │                               │
      │                               └── [ Calificacion ] ── [ Evaluacion ] (SER, SABER, HACER, DECIDIR, AUTOEVALUACION)
      │
      └── [ Auditoria ] (Registro inmutable de emisión de reportes)
```

---

## 2. Estructuras de Datos de Reportes (DTOs y Respuestas)

### 2.1 CourseRosterReport (Lista Oficial de Curso)
```typescript
interface CourseRosterReport {
  institucion: {
    sie: string;
    nombre: string;
    distrito: string;
    departamento: string;
  };
  academico: {
    gestion: number;
    nivel: string;
    curso: string;
    paralelo: string;
    turno: string;
  };
  totalEstudiantes: number;
  generadoEn: string;
  estudiantes: Array<{
    numero: number;
    inscripcionId: string;
    rude: string;
    ci: string;
    apellidos: string;
    nombres: string;
    genero: string;
    fechaNacimiento: string;
    tutorNombre: string | null;
    tutorTelefono: string | null;
  }>;
}
```

### 2.2 TrimesterBulletinReport (Boletín Trimestral de Calificaciones)
```typescript
interface TrimesterBulletinReport {
  institucion: {
    sie: string;
    nombre: string;
  };
  estudiante: {
    inscripcionId: string;
    rude: string;
    apellidos: string;
    nombres: string;
    curso: string;
    paralelo: string;
  };
  periodo: {
    id: string;
    numero: number;
    nombre: string;
    gestion: number;
  };
  materias: Array<{
    materiaId: string;
    codigo: string;
    nombre: string;
    dimensiones: {
      ser: number;
      saber: number;
      hacer: number;
      decidir: number;
      autoevaluacion: number;
    };
    notaFinal: number;
    estado: 'APROBADO' | 'REPROBADO';
    apreciacionCualitativa: string | null;
  }>;
  resumenAsistencia: {
    presente: number;
    falta: number;
    atraso: number;
    licencia: number;
    totalDias: number;
  };
  promedioTrimestral: number;
  materiasAprobadas: number;
  materiasReprobadas: number;
  generadoEn: string;
}
```

### 2.3 SchoolReportCardReport (Libreta Escolar Anual)
```typescript
interface SchoolReportCardReport {
  institucion: {
    sie: string;
    nombre: string;
    distrito: string;
  };
  estudiante: {
    inscripcionId: string;
    rude: string;
    apellidos: string;
    nombres: string;
    curso: string;
    paralelo: string;
    gestion: number;
  };
  materias: Array<{
    materiaId: string;
    codigo: string;
    nombre: string;
    primerTrimestre: number;
    segundoTrimestre: number;
    tercerTrimestre: number;
    promedioAnual: number;
    estado: 'APROBADO' | 'REPROBADO';
  }>;
  promedioGeneralAnual: number;
  situacionFinal: 'PROMOVIDO' | 'RETENIDO';
  resumenAsistenciaAnual: {
    presente: number;
    falta: number;
    atraso: number;
    licencia: number;
    totalRegistros: number;
  };
  generadoEn: string;
}
```
