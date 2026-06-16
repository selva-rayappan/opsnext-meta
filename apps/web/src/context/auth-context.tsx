'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { UserPayload } from '@opsnext/shared';
import api, { clearAccessToken, setAccessToken } from '@/lib/api';
import { refreshAccessToken } from '@/lib/auth';
import { decodeJwtPayload } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: UserPayload | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: attempt silent token refresh to restore an existing session.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const token = await refreshAccessToken();
        if (!cancelled) {
          const payload = decodeJwtPayload<UserPayload>(token);
          setUser(payload);
        }
      } catch {
        // No valid session — stay logged out
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string }>(
      '/api/v1/auth/login',
      { email, password },
    );
    const token = response.data.accessToken;
    setAccessToken(token);
    const payload = decodeJwtPayload<UserPayload>(token);
    setUser(payload);
  }, []);

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Best-effort — always clear local state regardless of server response
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
