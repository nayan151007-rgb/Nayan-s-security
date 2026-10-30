import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  authApi,
  getStoredToken,
  setStoredToken,
} from '../services/api';
import type { UserProfile, UserRole } from '../shared/schemas';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (params: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }) => Promise<UserProfile>;
  updateProfile: (params: {
    fullName: string;
    department?: string;
    jobTitle?: string;
  }) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        setStoredToken(null);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('sentinel:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('sentinel:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedInUser } = await authApi.login({ email, password });
    setStoredToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      role: UserRole;
    }) => {
      const { token, user: createdUser } = await authApi.register(params);
      setStoredToken(token);
      setUser(createdUser);
      return createdUser;
    },
    []
  );

  const updateProfile = useCallback(
    async (params: {
      fullName: string;
      department?: string;
      jobTitle?: string;
    }) => {
      const { token, user: updatedUser } = await authApi.updateProfile(params);
      setStoredToken(token);
      setUser(updatedUser);
      return updatedUser;
    },
    []
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
