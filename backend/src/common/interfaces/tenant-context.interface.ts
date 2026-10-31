import { RolInstitucional } from '@prisma/client';

export interface TenantContext {
  institutionId: string;
  sie: string;
  nombre: string;
  role: RolInstitucional;
  cargoOficial?: string | null;
  maestroId?: string | null;
}

