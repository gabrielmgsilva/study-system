'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

type AuthRole = 'user' | 'admin';

type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchAuthState() {
  const response = await fetch('/api/auth/verify', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as { user?: AuthUser } | null;
  return data?.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshAuth() {
    setIsLoading(true);

    try {
      const nextUser = await fetchAuthState();
      setUser(nextUser);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      setIsLoading(false);
      router.refresh();
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const nextUser = await fetchAuthState();
        if (!alive) {
          return;
        }

        setUser(nextUser);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshAuth,
      logout,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return value;
}