import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Employee, ERPModule, WPUser } from '../types';
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
  getClient,
} from '../api/client';
import {
  validateSite,
  loginWithPassword,
  fetchEmployee,
  fetchActiveModules,
  verifyEmployeeRole,
  SiteValidationResult,
} from '../api/auth';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: WPUser | null;
  employee: Employee | null;
  modules: ERPModule[];
}

interface AuthContextType extends AuthState {
  connectSite: (siteUrl: string) => Promise<SiteValidationResult>;
  login: (siteUrl: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isModuleActive: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    employee: null,
    modules: [],
  });

  const logoutRef = useRef<() => Promise<void>>(undefined);

  const logout = useCallback(async () => {
    await clearCredentials();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      employee: null,
      modules: [],
    });
  }, []);

  logoutRef.current = logout;

  useEffect(() => {
    restoreSession();
  }, []);

  // Set up response interceptor: auto-logout on 401
  useEffect(() => {
    if (!state.isAuthenticated) return;

    let interceptorId: number | undefined;

    (async () => {
      try {
        const client = await getClient();
        interceptorId = client.interceptors.response.use(
          (response) => response,
          async (error) => {
            const status = error?.response?.status;

            // Token invalid or expired — logout
            if (status === 401) {
              logoutRef.current?.();
            }

            return Promise.reject(error);
          }
        );
      } catch {
        // client not available yet
      }
    })();

    return () => {
      if (interceptorId !== undefined) {
        (async () => {
          try {
            const client = await getClient();
            client.interceptors.response.eject(interceptorId!);
          } catch {
            // ignore
          }
        })();
      }
    };
  }, [state.isAuthenticated]);

  async function restoreSession() {
    try {
      const credentials = await getCredentials();
      if (!credentials) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      // Token is persistent — verify it still works by fetching employee
      const employee = await fetchEmployee(credentials.siteUrl, 0, credentials.token).catch(() => null);

      if (!employee) {
        // Token may be expired — try re-login with stored credentials
        try {
          const result = await loginWithPassword(
            credentials.siteUrl,
            credentials.username,
            credentials.password
          );

          const user = result.user;

          if (!verifyEmployeeRole(user)) {
            await clearCredentials();
            setState({ isLoading: false, isAuthenticated: false, user: null, employee: null, modules: [] });
            return;
          }

          await saveCredentials({
            siteUrl: credentials.siteUrl,
            username: credentials.username,
            password: credentials.password,
            token: result.token,
          });

          const emp = await fetchEmployee(credentials.siteUrl, user.id, result.token);
          const modules = await fetchActiveModules(credentials.siteUrl, result.token);

          setState({
            isLoading: false,
            isAuthenticated: true,
            user,
            employee: emp,
            modules,
          });
        } catch {
          await clearCredentials();
          setState({ isLoading: false, isAuthenticated: false, user: null, employee: null, modules: [] });
        }
        return;
      }

      // Token works — build user from stored credentials
      // Re-login to get fresh user data
      const result = await loginWithPassword(
        credentials.siteUrl,
        credentials.username,
        credentials.password
      );

      await saveCredentials({
        siteUrl: credentials.siteUrl,
        username: credentials.username,
        password: credentials.password,
        token: result.token,
      });

      const modules = await fetchActiveModules(credentials.siteUrl, result.token);

      const freshEmployee = await fetchEmployee(credentials.siteUrl, result.user.id, result.token);

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: result.user,
        employee: freshEmployee,
        modules,
      });
    } catch {
      await clearCredentials();
      setState({ isLoading: false, isAuthenticated: false, user: null, employee: null, modules: [] });
    }
  }

  async function connectSite(siteUrl: string): Promise<SiteValidationResult> {
    const normalizedUrl = siteUrl.replace(/\/+$/, '');
    return validateSite(normalizedUrl);
  }

  async function login(siteUrl: string, username: string, password: string) {
    const normalizedUrl = siteUrl.replace(/\/+$/, '');

    // Login via custom endpoint — returns persistent Bearer token
    const result = await loginWithPassword(normalizedUrl, username, password);
    const user = result.user;

    if (!verifyEmployeeRole(user)) {
      throw new Error(
        'Your account is not registered as an employee. Please contact your HR administrator.'
      );
    }

    // Save credentials (for session restore)
    await saveCredentials({
      siteUrl: normalizedUrl,
      username,
      password,
      token: result.token,
    });

    // Fetch employee profile
    let employee: Employee;
    try {
      employee = await fetchEmployee(normalizedUrl, user.id, result.token);
    } catch {
      await clearCredentials();
      throw new Error(
        'Your account is not registered as an employee in WP-ERP. Please contact your HR administrator.'
      );
    }

    // Fetch active modules
    const modules = await fetchActiveModules(normalizedUrl, result.token);

    setState({
      isLoading: false,
      isAuthenticated: true,
      user,
      employee,
      modules,
    });
  }

  function isModuleActive(moduleId: string): boolean {
    return state.modules.some((m) => m.id === moduleId && m.active);
  }

  return (
    <AuthContext.Provider value={{ ...state, connectSite, login, logout, isModuleActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
