import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee, ERPModule, WPUser } from '../types';
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
} from '../api/client';
import {
  validateSite,
  validateCredentials,
  fetchEmployee,
  fetchActiveModules,
} from '../api/auth';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: WPUser | null;
  employee: Employee | null;
  modules: ERPModule[];
}

interface AuthContextType extends AuthState {
  login: (siteUrl: string, username: string, appPassword: string) => Promise<void>;
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

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const credentials = await getCredentials();
      if (!credentials) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      const token = btoa(`${credentials.username}:${credentials.appPassword}`);
      const user = await validateCredentials(
        credentials.siteUrl,
        credentials.username,
        credentials.appPassword
      );
      const employee = await fetchEmployee(credentials.siteUrl, user.id, token);
      const modules = await fetchActiveModules(credentials.siteUrl, token);

      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        employee,
        modules,
      });
    } catch {
      await clearCredentials();
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        employee: null,
        modules: [],
      });
    }
  }

  async function login(siteUrl: string, username: string, appPassword: string) {
    // Normalize URL
    const normalizedUrl = siteUrl.replace(/\/+$/, '');

    // Validate site
    const isValid = await validateSite(normalizedUrl);
    if (!isValid) throw new Error('Invalid WordPress site or REST API not available');

    // Validate credentials
    const user = await validateCredentials(normalizedUrl, username, appPassword);

    // Save credentials
    await saveCredentials({
      siteUrl: normalizedUrl,
      username,
      appPassword,
    });

    const token = btoa(`${username}:${appPassword}`);

    // Fetch employee profile
    const employee = await fetchEmployee(normalizedUrl, user.id, token);

    // Fetch active modules
    const modules = await fetchActiveModules(normalizedUrl, token);

    setState({
      isLoading: false,
      isAuthenticated: true,
      user,
      employee,
      modules,
    });
  }

  async function logout() {
    await clearCredentials();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      employee: null,
      modules: [],
    });
  }

  function isModuleActive(moduleId: string): boolean {
    return state.modules.some((m) => m.id === moduleId && m.active);
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isModuleActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
