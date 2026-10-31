# MODELO DE DATOS — FEATURE 003: EXPEDIENTE PROFESIONAL Y MAESTROS

**Feature:** `003-teachers-management`  
**Estado:** VIGENTE  

---

## 1. ENTIDADES INVOLUCRADAS

### `maestros`
Almacena el perfil profesional y académico específico del docente en Bolivia:
```prisma
model Maestro {
  id                String   @id @default(uuid()) @db.Uuid
  personaId         String   @unique @map("persona_id") @db.Uuid
  rda               String   @unique @db.VarChar(50)
  tituloProfesional String?  @map("titulo_profesional") @db.VarChar(255)
  especialidad      String?  @db.VarChar(255)
  anioEgreso        Int?     @map("anio_egreso")
  normalista        Boolean  @default(true)
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  persona       Persona                   @relation(fields: [personaId], references: [id], onDelete: Cascade)
  vinculaciones VinculacionInstitucional[]

  @@index([rda])
  @@map("maestros")
}
```

### `vinculaciones_institucionales`
Gestiona la relación laboral multi-tenant e independiente entre el maestro y cada Unidad Educativa:
```prisma
model VinculacionInstitucional {
  id               String            @id @default(uuid()) @db.Uuid
  institucionId    String            @map("institucion_id") @db.Uuid
  maestroId        String?           @map("maestro_id") @db.Uuid
  usuarioId        String            @map("usuario_id") @db.Uuid
  rolInstitucional RolInstitucional  @map("rol_institucional")
  cargoOficial     String?           @map("cargo_oficial") @db.VarChar(150)
  fechaInicio      DateTime          @default(now()) @map("fecha_inicio") @db.Date
  fechaFin         DateTime?         @map("fecha_fin") @db.Date
  estado           EstadoVinculacion @default(ACTIVO)
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  institucion UnidadEducativa @relation(fields: [institucionId], references: [id], onDelete: Cascade)
  maestro     Maestro?        @relation(fields: [maestroId], references: [id], onDelete: SetNull)
  usuario     Usuario         @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@unique([institucionId, usuarioId, rolInstitucional])
  @@index([institucionId])
  @@index([usuarioId])
  @@index([maestroId])
  @@map("vinculaciones_institucionales")
}
```

---

## 2. REGLAS DE INTEGRIDAD

1. **Unicidad de `rda`**: Clave única en `maestros`.
2. **Índice Compuesto Único**: `[institucionId, usuarioId, rolInstitucional]` en `vinculaciones_institucionales` evita que un docente tenga duplicada la misma vinculación activa en el mismo establecimiento.
3. **Historial de Desvinculación**: Cuando un docente pasa a `LICENCIA`, `TRASLADADO` o `INACTIVO`, se asigna `fechaFin = CURRENT_DATE` sin eliminar la fila física, preservando la trazabilidad de centralizadores y evaluaciones pasadas.
