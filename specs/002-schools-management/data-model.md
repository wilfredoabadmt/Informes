# MODELO DE DATOS — FEATURE 002: GESTIÓN DE UNIDADES EDUCATIVAS

**Feature:** `002-schools-management`  
**Estado:** VIGENTE (Soportado nativamente por el esquema Prisma inicial)  

---

## 1. ENTIDAD PRINCIPAL: `unidades_educativas`

```prisma
model UnidadEducativa {
  id           String          @id @default(uuid()) @db.Uuid
  sie          String          @unique @db.VarChar(20)
  nombre       String          @db.VarChar(255)
  departamento String          @db.VarChar(50)
  provincia    String          @db.VarChar(100)
  municipio    String          @db.VarChar(100)
  distrito     String?         @db.VarChar(100)
  direccion    String?         @db.VarChar(255)
  telefono     String?         @db.VarChar(20)
  tipo         TipoInstitucion @default(FISCAL)
  nivel        NivelEducativo  @default(INTEGRADO)
  activo       Boolean         @default(true)
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")

  vinculaciones VinculacionInstitucional[]
  auditorias    RegistroAuditoria[]

  @@index([sie])
  @@index([departamento])
  @@map("unidades_educativas")
}
```

---

## 2. CATÁLOGOS Y ENUMS APLICABLES

### `TipoInstitucion`
- `FISCAL`: Unidad pública sostenida por el Estado Plurinacional.
- `CONVENIO`: Institución de convenio iglesia/fundación y Ministerio.
- `PRIVADA`: Unidad particular regulada.

### `NivelEducativo`
- `INICIAL`
- `PRIMARIA`
- `SECUNDARIA`
- `INTEGRADO`

### Departamentos Válidos (Constante de Negocio de Bolivia)
- `La Paz`
- `Cochabamba`
- `Santa Cruz`
- `Oruro`
- `Potosí`
- `Chuquisaca`
- `Tarija`
- `Beni`
- `Pando`

---

## 3. RELACIONES CON VINCULACIONES INSTITUCIONALES

Cuando se asigna un Director o Administrador Institucional a través de `POST /api/v1/institutions/:id/authorities`:
- Se crea un registro en `vinculaciones_institucionales`:
  - `institucion_id` = UUID del colegio
  - `usuario_id` = UUID del usuario asignado
  - `maestro_id` = UUID del perfil de maestro (si existe)
  - `rol_institucional` = `DIRECTOR` | `ADMIN_INSTITUCIONAL`
  - `estado` = `ACTIVO`
  - `fecha_inicio` = Fecha actual
