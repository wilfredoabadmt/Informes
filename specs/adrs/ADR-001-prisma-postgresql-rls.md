# ADR-001: Estrategia de Enlace de PostgreSQL Row Level Security (RLS) con Prisma ORM

- **Estado:** Aprobado
- **Fecha:** 2026-10-31
- **Decisores:** Arquitectura de Software
- **Contexto:** Decisión Pendiente 1 de la Constitución V1.1.0 (Sección 10)

---

## 1. Contexto y Problema

La **Decisión Estratégica 005** y el **Principio de Aislamiento II** de la Constitución mandan el uso de **PostgreSQL Row Level Security (RLS)** como mecanismo de defensa en profundidad para garantizar que ninguna consulta pueda acceder a datos de una unidad educativa ajena.

En PostgreSQL, las políticas RLS leen variables de configuración de la sesión, típicamente mediante:
```sql
CREATE POLICY tenant_isolation_policy ON evaluaciones
FOR ALL
USING (institution_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid);
```

Dado que Prisma ORM utiliza un pool de conexiones compartido, establecer una variable de sesión a nivel de conexión persistente (`SET app.current_institution_id = '...'`) causaría contaminación cruzada (*tenant leakage*) cuando otra petición HTTP reutilice la misma conexión física.

---

## 2. Opciones Consideradas

1. **Opción A (Prisma Client Extension con transacciones interactivas):**
   Extender Prisma mediante `$extends` para envolver cada consulta o mutación en una transacción interactiva que ejecuta `SET LOCAL app.current_institution_id = $id`. `SET LOCAL` restringe el valor de la variable únicamente a la duración de esa transacción, reseteándose automáticamente al finalizar.
2. **Opción B (Doble capa: Prisma para esquemas + Kysely/pg para consultas de dominio):**
   Usar Prisma solo para migraciones y un query builder SQL directo para todas las consultas con RLS.
3. **Opción C (Filtrado solo en cláusula `WHERE` del backend sin RLS en BD):**
   Inyectar `where: { institution_id }` manualmente en cada llamada. *Rechazada: Viola la Constitución (RLS es mandatorio e independiente).*

---

## 3. Decisión Adoptada

Se adopta la **Opción A: Prisma Client Extension con `SET LOCAL` scoped por petición**, complementada con un helper transaccional de NestJS:

```typescript
// Patron de extension scoped en NestJS
export function getTenantPrismaClient(prisma: PrismaClient, institutionId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(
              `SET LOCAL app.current_institution_id = '${institutionId}';`
            );
            return query(args);
          });
        },
      },
    },
  });
}
```

### Ventajas:
1. **Seguridad Absoluta:** `SET LOCAL` se revierte automáticamente al concluir la transacción; ninguna conexión en el pool queda contaminada.
2. **Cumplimiento Constitucional:** Si un desarrollador omite un `where: { institutionId }`, PostgreSQL RLS bloquea o filtra los registros en el motor de base de datos.
3. **Tipado Completo:** Mantiene los tipos generados automáticamente de Prisma Client en todo el backend NestJS.

---

## 4. Consecuencias y Reglas de Implementación

- Todo servicio o repositorio en NestJS que opere sobre entidades con alcance institucional debe inyectar el cliente Prisma contextualizado a través del `TenantContextService`.
- Las entidades globales (`Persona`, `Usuario`, `UnidadEducativa`) quedan exentas de la política de `institution_id` mediante políticas RLS específicas para administración central.
- Para operaciones masivas o migraciones, el rol `superadmin` o el usuario de mantenimiento de base de datos utilizará la directiva de bypass `BYPASSRLS` debidamente auditada.
