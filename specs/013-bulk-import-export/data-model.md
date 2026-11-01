# Modelo de Datos y Contratos — Feature 013: Importación y Exportación Masiva

## 1. Esquema de Columnas y Mapeo de Entidades

### 1.1 Estudiantes (Plantilla e Importación)
| Columna | Obligatorio | Tipo | Ejemplo | Mapeo Prisma |
| :--- | :---: | :--- | :--- | :--- |
| `ci` | Sí | Texto | `10293847` | `Persona.ci` |
| `complemento` | No | Texto | `1A` | `Persona.complemento` |
| `nombres` | Sí | Texto | `Mateo` | `Persona.nombres` |
| `primerApellido`| Sí | Texto | `Arce` | `Persona.primerApellido` |
| `segundoApellido`| No | Texto | `Mendoza`| `Persona.segundoApellido` |
| `fechaNacimiento`| Sí | Fecha | `2012-05-14` | `Persona.fechaNacimiento` |
| `genero` | Sí | M/F | `M` | `Persona.genero` |
| `direccion` | No | Texto | `Av. 6 de Agosto` | `Persona.direccion` |
| `telefono` | No | Texto | `71234567` | `Persona.telefono` |
| `codigoRude` | Sí | Texto | `80730045202601M` | `Estudiante.codigoRude` |
| `nombreTutor` | No | Texto | `Ramiro Arce` | `Estudiante.nombreTutor` |
| `ciTutor` | No | Texto | `4829102` | `Estudiante.ciTutor` |
| `telefonoTutor`| No | Texto | `71234567` | `Estudiante.telefonoTutor` |

---

### 1.2 Docentes (Plantilla e Importación)
| Columna | Obligatorio | Tipo | Ejemplo | Mapeo Prisma |
| :--- | :---: | :--- | :--- | :--- |
| `ci` | Sí | Texto | `6789012` | `Persona.ci` |
| `complemento` | No | Texto | `LP` | `Persona.complemento` |
| `nombres` | Sí | Texto | `Hugo` | `Persona.nombres` |
| `primerApellido`| Sí | Texto | `Alvarez` | `Persona.primerApellido` |
| `segundoApellido`| No | Texto | `Flores` | `Persona.segundoApellido` |
| `fechaNacimiento`| No | Fecha | `1985-09-12` | `Persona.fechaNacimiento` |
| `genero` | Sí | M/F | `M` | `Persona.genero` |
| `email` | Sí | Email | `hugo.alvarez@minedu.bo` | `Usuario.email` |
| `telefono` | No | Texto | `78901234` | `Persona.telefono` |
| `rda` | Sí | Texto | `RDA-88990` | `Maestro.rda` |
| `especialidad` | Sí | Texto | `Matemática` | `Maestro.especialidad` |
| `cargo` | Sí | Texto | `DOCENTE` | `VinculacionInstitucional.rolInstitucional` |

---

## 2. Contratos de Respuestas DTOs

### 2.1 ImportResultResponse
```typescript
interface ImportResultResponse {
  totalFilas: number;
  creados: number;
  duplicados: number;
  errores: Array<{
    fila: number;
    error: string;
  }>;
}
```

### 2.2 QueryExportOptionsDto
```typescript
class QueryExportOptionsDto {
  format?: 'xlsx' | 'csv'; // default 'xlsx'
  paraleloId?: string;     // UUID opcional según reporte
  periodoId?: string;      // UUID opcional según reporte
}
```
