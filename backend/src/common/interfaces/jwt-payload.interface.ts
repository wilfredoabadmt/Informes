import { RolGlobal, RolInstitucional } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  globalRole: RolGlobal;
  institutionId?: string;
  institutionRole?: RolInstitucional;
  iat?: number;
  exp?: number;
}
