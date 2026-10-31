# MODELO DE DATOS — FEATURE 004: ESTRUCTURA ACADÉMICA INSTITUCIONAL

**Feature:** `004-academic-structure`  
**Estado:** PROPUESTO  

---

## 1. NUEVOS ENUMS

```prisma
enum EstadoGestion {
  EN_PLANIFICACION
  ABIERTA
  CERRADA
}

enum Turno {
  MANANA
  TARDE
  NOCHE
}

enum CampoSaberes {
  COSMOS_Y_PENSAMIENTO
  COMUNIDAD_Y_SOCIEDAD
  VIDA_TIERRA_TERRITORIO
  CIENCIA_TECNOLOGIA_PRODUCCION
}
```

---

## 2. NUEVAS ENTIDADES RELACIONALES

### `gestiones_escolares` (Aislada por Institución con PostgreSQL RLS)
```prisma
model GestionEscolar {
  id            String        @id @default(uuid()) @db.Uuid
  institucionId String        @map("institucion_id") @db.Uuid
  anio          Int
  fechaInicio   DateTime      @map("fecha_inicio") @db.Date
  fechaFin      DateTime?     @map("fecha_fin") @db.Date
  estado        EstadoGestion @default(EN_PLANIFICACION)
  activo        Boolean       @default(true)
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  institucion UnidadEducativa @relation(fields: [institucionId], references: [id], onDelete: Cascade)
  paralelos   Paralelo[]

  @@unique([institucionId, anio])
  @@index([institucionId])
  @@map("gestiones_escolares")
}
```

### `cursos` (Catálogo Oficial Nacional de Grados Escolares)
```prisma
model Curso {
  id        String         @id @default(uuid()) @db.Uuid
  nivel     NivelEducativo
  grado     Int
  nombre    String         @db.VarChar(100)
  orden     Int

  paralelos Paralelo[]

  @@unique([nivel, grado])
  @@map("cursos")
}
```

### `materias` (Catálogo Oficial Nacional del SEP)
```prisma
model Materia {
  id        String         @id @default(uuid()) @db.Uuid
  codigo    String         @unique @db.VarChar(30)
  nombre    String         @db.VarChar(150)
  campo     CampoSaberes
  nivel     NivelEducativo
  esTroncal Boolean        @default(true) @map("es_troncal")
  orden     Int            @default(0)

  @@index([nivel])
  @@index([campo])
  @@map("materias")
}
```

### `paralelos` (Aulas / Secciones Aisladas por Institución y Gestión con PostgreSQL RLS)
```prisma
model Paralelo {
  id            String   @id @default(uuid()) @db.Uuid
  institucionId String   @map("institucion_id") @db.Uuid
  gestionId     String   @map("gestion_id") @db.Uuid
  cursoId       String   @map("curso_id") @db.Uuid
  letra         String   @db.VarChar(5)
  turno         Turno    @default(MANANA)
  cupoMaximo    Int      @default(35) @map("cupo_maximo")
  activo        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  institucion UnidadEducativa @relation(fields: [institucionId], references: [id], onDelete: Cascade)
  gestion     GestionEscolar  @relation(fields: [gestionId], references: [id], onDelete: Cascade)
  curso       Curso           @relation(fields: [cursoId], references: [id], onDelete: Cascade)

  @@unique([gestionId, cursoId, letra, turno])
  @@index([institucionId])
  @@index([gestionId])
  @@index([cursoId])
  @@map("paralelos")
}
```

---

## 3. POLÍTICAS DE ROW LEVEL SECURITY (POSTGRESQL)

```sql
-- RLS en gestiones_escolares
ALTER TABLE "gestiones_escolares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gestiones_escolares" FORCE ROW LEVEL SECURITY;

CREATE POLICY gestiones_isolation_policy ON "gestiones_escolares"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
);

-- RLS en paralelos
ALTER TABLE "paralelos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "paralelos" FORCE ROW LEVEL SECURITY;

CREATE POLICY paralelos_isolation_policy ON "paralelos"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
);
```

