import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, getToken, setToken } from '../lib/api';
import type { Role, User } from '../lib/types';

interface AuthValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    email: string;
    password: string;
    full_name?: string;
    role: Role;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the session on boot so a refresh does not log the user out.
  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    api.auth
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login(email, password);
    setToken(result.access_token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      full_name?: string;
      role: Role;
    }) => {
      const result = await api.auth.register(input);
      setToken(result.access_token);
      setUser(result.user);
      return result.user;
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return value;
}
