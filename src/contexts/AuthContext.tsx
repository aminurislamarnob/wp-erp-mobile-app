import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Employee, ERPModule, WPUser } from '../types';
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
  getClient,
  saveBiometricToken,
  getBiometricToken,
  clearBiometricToken,
} from '../api/client';
import {
  validateSite,
  loginWithPassword,
  fetchEmployee,
  fetchActiveModules,
  verifyEmployeeRole,
  registerBiometricToken,
  loginWithBiometricToken,
  revokeBiometricToken,
  SiteValidationResult,
} from '../api/auth';
import * as LocalAuthentication from 'expo-local-authentication';

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
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  isModuleActive: (moduleId: string) => boolean;
  isBiometricEnabled: boolean;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
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
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const logoutRef = useRef<() => Promise<void>>(undefined);

  const logout = useCallback(async () => {
    try {
      const creds = await getCredentials();
      if (creds) await revokeBiometricToken(creds.siteUrl, creds.token).catch(() => {});
    } catch {}
    await clearBiometricToken();
    await clearCredentials();
    setIsBiometricEnabled(false);
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
    getBiometricToken().then((t) => setIsBiometricEnabled(!!t));
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

  async function loginWithBiometric(): Promise<void> {
    const storedToken = await getBiometricToken();
    if (!storedToken) throw new Error('Biometric login is not set up on this device');

    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) throw new Error('No biometric authentication available on this device');

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to sign in',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    if (!result.success) throw new Error('Biometric authentication cancelled');

    const creds = await getCredentials();
    if (!creds) throw new Error('Site URL not found — please log in manually first');

    const loginResult = await loginWithBiometricToken(creds.siteUrl, storedToken);
    const user = loginResult.user;

    await saveCredentials({ ...creds, token: loginResult.token });

    const employee = await fetchEmployee(creds.siteUrl, user.id, loginResult.token);
    const modules = await fetchActiveModules(creds.siteUrl, loginResult.token);

    setState({ isLoading: false, isAuthenticated: true, user, employee, modules });
  }

  async function enableBiometric(): Promise<void> {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) throw new Error('No biometric authentication available on this device');

    const prompt = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm to enable biometric login',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    if (!prompt.success) throw new Error('Biometric authentication cancelled');

    const creds = await getCredentials();
    if (!creds) throw new Error('Not authenticated');

    const biometricToken = await registerBiometricToken(creds.siteUrl, creds.token);
    await saveBiometricToken(biometricToken);
    setIsBiometricEnabled(true);
  }

  async function disableBiometric(): Promise<void> {
    const creds = await getCredentials();
    if (creds) await revokeBiometricToken(creds.siteUrl, creds.token).catch(() => {});
    await clearBiometricToken();
    setIsBiometricEnabled(false);
  }

  function isModuleActive(moduleId: string): boolean {
    return state.modules.some((m) => m.id === moduleId && m.active);
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      connectSite, login, loginWithBiometric, logout,
      isModuleActive,
      isBiometricEnabled, enableBiometric, disableBiometric,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
