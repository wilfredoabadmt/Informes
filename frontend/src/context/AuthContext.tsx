import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  currentInstitutionId: string | null;
  setCurrentInstitutionId: (id: string | null) => void;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        currentInstitutionId,
        setCurrentInstitutionId: handleSetInstitution,
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

