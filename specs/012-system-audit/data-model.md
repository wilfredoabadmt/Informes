# Modelo de Datos y Contratos — Feature 012: Auditoría del Sistema

## 1. Modelo de Datos Existente

El modelo `RegistroAuditoria` persiste eventos inmutables en la tabla `registros_auditoria` con llaves foráneas opcionales hacia `usuarios` y `unidades_educativas`:

```prisma
model RegistroAuditoria {
  id            String        @id @default(uuid()) @db.Uuid
  usuarioId     String?       @map("usuario_id") @db.Uuid
  institucionId String?       @map("institucion_id") @db.Uuid
  tipo          TipoAuditoria
  accion        String        @db.VarChar(100)
  detalle       Json?
  ip            String?       @db.VarChar(45)
  userAgent     String?       @map("user_agent") @db.VarChar(255)
  timestamp     DateTime      @default(now())

  usuario     Usuario?         @relation(fields: [usuarioId], references: [id], onDelete: SetNull)
  institucion UnidadEducativa? @relation(fields: [institucionId], references: [id], onDelete: SetNull)

  @@index([usuarioId])
  @@index([institucionId])
  @@index([tipo])
  @@index([timestamp])
  @@map("registros_auditoria")
}

enum TipoAuditoria {
  LOGIN_SUCCESS
  LOGIN_FAILED
  CONTEXT_SWITCH
  SECURITY_VIOLATION
  USER_CREATE
  USER_UPDATE
  TEACHER_LINK
  TEACHER_UNLINK
}
```

---

## 2. Contratos de Datos (DTOs)

### 2.1 QueryAuditLogsDto
```typescript
class QueryAuditLogsDto {
  page?: number;        // default 1
  limit?: number;       // default 20, max 100
  tipo?: TipoAuditoria; // opcional
  accion?: string;      // opcional (búsqueda parcial)
  usuarioId?: string;   // UUID opcional
  institucionId?: string; // UUID opcional (solo Nivel 1)
  fechaDesde?: string;  // ISO Date opcional
  fechaHasta?: string;  // ISO Date opcional
}
```

### 2.2 QueryAuditStatsDto
```typescript
class QueryAuditStatsDto {
  institucionId?: string; // UUID opcional (solo Nivel 1)
  fechaDesde?: string;    // ISO Date opcional
  fechaHasta?: string;    // ISO Date opcional
}
```

### 2.3 PaginatedAuditLogsResponse
```typescript
interface PaginatedAuditLogsResponse {
  data: Array<{
    id: string;
    tipo: TipoAuditoria;
    accion: string;
    detalle: Record<string, any> | null;
    ip: string | null;
    userAgent: string | null;
    timestamp: Date;
    usuario: {
      id: string;
      email: string;
      persona?: {
        nombres: string;
        primerApellido: string;
        segundoApellido?: string | null;
      };
    } | null;
    institucion: {
      id: string;
      sie: string;
      nombre: string;
    } | null;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```
