import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { getStoredInstitutions } from '../utils/multiTenantStore';

export interface User {
  id: string;
  email: string;
  globalRole: string;
  persona: {
    ci: string;
    complemento?: string;
    nombres: string;
    primerApellido: string;
    segundoApellido?: string;
  };
  institutions?: Array<{
    id?: string;
    institutionId?: string;
    sie: string;
    nombre: string;
    rol?: string;
    role?: string;
    cargoOficial?: string;
  }>;
}

export type EffectiveRole = 'SUPERADMIN' | 'DIRECTOR' | 'MAESTRO' | 'USER';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  currentInstitutionId: string | null;
  setCurrentInstitutionId: (id: string | null) => void;
  effectiveRole: EffectiveRole;
  isSuperAdmin: boolean;
  isDirector: boolean;
  isMaestro: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentInstitutionId, setCurrentInstitutionId] = useState<string | null>(
    localStorage.getItem('currentInstitutionId')
  );

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      identifier,
      password,
    });

    const { tokens, user: userData, institutions } = response.data;

    // Validación preventiva: Si es Director o Maestro y su colegio está suspendido
    if (userData.globalRole !== 'SUPERADMIN' && userData.globalRole !== 'CENTRAL_ADMIN') {
      const stored = getStoredInstitutions();
      const userInstIds = (institutions || []).map((i: any) => i.institutionId || i.id || i.sie);
      const matched = stored.filter(
        (s) => userInstIds.includes(s.id) || userInstIds.includes(s.sie) || (institutions && institutions.some((i: any) => i.sie === s.sie))
      );

      if (matched.length > 0 && matched.every((s) => s.activo === false)) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentInstitutionId');
        setUser(null);
        setCurrentInstitutionId(null);

        const inst = matched[0];
        const motivo = inst.motivoSuspension || 'Regularización de suscripción SaaS o disposición administrativa.';
        const err: any = new Error(
          `ACCESO INSTITUCIONAL SUSPENDIDO: La Unidad Educativa "${inst.nombre}" (SIE: ${inst.sie}) se encuentra suspendida. Motivo: ${motivo}. El Director y los Maestros no tienen permitido el ingreso al sistema mientras dure la suspensión.`
        );
        err.isSuspended = true;
        err.suspensionData = {
          nombre: inst.nombre,
          sie: inst.sie,
          motivo,
          fecha: inst.fechaSuspension,
        };
        throw err;
      }
    }

    localStorage.setItem('token', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    const fullUser = {
      ...userData,
      institutions: institutions || [],
    };

    localStorage.setItem('user', JSON.stringify(fullUser));
    setUser(fullUser);

    if (institutions && institutions.length > 0) {
      const defaultInst = institutions[0].institutionId || institutions[0].id;
      if (defaultInst) {
        localStorage.setItem('currentInstitutionId', defaultInst);
        setCurrentInstitutionId(defaultInst);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentInstitutionId');
    setUser(null);
    setCurrentInstitutionId(null);
    window.location.href = '/login';
  };

  const handleSetInstitution = (id: string | null) => {
    if (id) {
      localStorage.setItem('currentInstitutionId', id);
    } else {
      localStorage.removeItem('currentInstitutionId');
    }
    setCurrentInstitutionId(id);
  };

  // Determine effective role based on global role & active institution
  let effectiveRole: EffectiveRole = 'USER';
  if (user?.globalRole === 'SUPERADMIN' || user?.globalRole === 'CENTRAL_ADMIN') {
    effectiveRole = 'SUPERADMIN';
  } else if (user?.institutions && user.institutions.length > 0) {
    const currentInst = user.institutions.find(
      (i) => (i.institutionId || i.id) === currentInstitutionId
    ) || user.institutions[0];

    const instRole = (currentInst.role || currentInst.rol || '').toUpperCase();
    if (instRole === 'DIRECTOR' || instRole === 'ADMIN_INSTITUCIONAL') {
      effectiveRole = 'DIRECTOR';
    } else if (instRole === 'MAESTRO') {
      effectiveRole = 'MAESTRO';
    }
  }

  const isSuperAdmin = effectiveRole === 'SUPERADMIN';
  const isDirector = effectiveRole === 'DIRECTOR';
  const isMaestro = effectiveRole === 'MAESTRO';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        currentInstitutionId,
        setCurrentInstitutionId: handleSetInstitution,
        effectiveRole,
        isSuperAdmin,
        isDirector,
        isMaestro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
