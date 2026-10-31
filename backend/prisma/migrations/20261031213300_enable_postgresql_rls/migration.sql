-- Enable and force Row Level Security on vinculaciones_institucionales
ALTER TABLE "vinculaciones_institucionales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vinculaciones_institucionales" FORCE ROW LEVEL SECURITY;

-- Isolation policy for vinculaciones_institucionales
CREATE POLICY vinculaciones_isolation_policy ON "vinculaciones_institucionales"
FOR ALL
USING (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
)
WITH CHECK (
  institucion_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid
  OR NULLIF(current_setting('app.bypass_rls', true), '') = 'true'
);

-- Enable and force Row Level Security on registros_auditoria
ALTER TABLE "registros_auditoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "registros_auditoria" FORCE ROW LEVEL SECURITY;

-- Allow insert and select on audit records
CREATE POLICY auditoria_all_policy ON "registros_auditoria"
FOR ALL
USING (true)
WITH CHECK (true);
