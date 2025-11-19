import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { httpClient, login as apiLogin, logout as apiLogout } from '../api/httpClient';

const AUTH_USER_KEY = 'angela_auth_user';

function loadStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}


function notifySessionChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session-changed'))
  }
}

function persistStoredUser(next: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!next) {
      window.localStorage.removeItem(AUTH_USER_KEY);
    } else {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage errors for private browsing
  }
}

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requireRole: (...roles: AuthUser['role'][]) => boolean;
}

/**
 * AuthContext
 * - Fonte única de verdade para autenticação no frontend.
 * - Baseado em tokens geridos por httpClient (localStorage).
 * - Não guarda tokens aqui; apenas o utilizador e estado.
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());

  const syncFromToken = useCallback(async () => {
    const token = httpClient.getAccessToken?.();
    if (!token) {
      setStatus('unauthenticated');
      setUser(null);
      persistStoredUser(null);
      notifySessionChange();
      return;
    }

    try {
      const storedUser = loadStoredUser();
      if (!storedUser) {
        setStatus('unauthenticated');
        setUser(null);
        persistStoredUser(null);
      notifySessionChange();
      return;
    }
      // Para j� n�o existe endpoint /me no contrato.
      // Estrat�gia: assumimos que se existe token v�lido, o backend ir� aceitar chamadas;
      // podemos opcionalmente decodificar JWT no futuro.
      setUser(storedUser);
      setStatus('authenticated');
      notifySessionChange();
    } catch {
      setStatus('unauthenticated');
      setUser(null);
      persistStoredUser(null);
      notifySessionChange();
    }
  }, []);

  useEffect(() => {
    setStatus('checking');
    void syncFromToken();
  }, [syncFromToken]);

  const login = useCallback(async (email: string, password: string) => {
    setStatus('checking');
    try {
      const result = await apiLogin(email, password);
      // O httpClient.login já persiste tokens via setTokens().
      const { user: loggedUser } = result;
      setUser(loggedUser);
      persistStoredUser(loggedUser);
      setStatus('authenticated');
      notifySessionChange();
    } catch (error) {
      setUser(null);
      persistStoredUser(null);
      notifySessionChange();
      setStatus('unauthenticated');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setStatus('checking');
    try {
      await apiLogout();
    } finally {
      setUser(null);
      persistStoredUser(null);
      notifySessionChange();
      setStatus('unauthenticated');
    }
  }, []);

  const requireRole = useCallback(
    (...roles: AuthUser['role'][]) => {
      if (!user) return false;
      if (roles.length === 0) return true;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated' && !!user,
      isLoading: status === 'idle' || status === 'checking',
      login,
      logout,
      requireRole,
    }),
    [status, user, login, logout, requireRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * Higher-order component para proteger páginas/rotas por role.
 * Uso:
 *   export default withRequiredRole(['TEACHER'], MyPageComponent)
 */
export function withRequiredRole<P extends object>(
  roles: AuthUser['role'][],
  Component: React.ComponentType<P>,
): React.FC<P> {
  return function Guarded(props: P) {
    const { isAuthenticated, isLoading, requireRole } = useAuth();

    if (isLoading) {
      return <div className="flex h-full items-center justify-center">A validar sessão...</div>;
    }

    if (!isAuthenticated || !requireRole(...roles)) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <h2 className="text-lg font-semibold">Acesso restrito</h2>
          <p className="text-sm text-gray-500">
            Esta área é reservada. Inicie sessão com uma conta com permissões adequadas.
          </p>
        </div>
      );
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} />;
  };
}







