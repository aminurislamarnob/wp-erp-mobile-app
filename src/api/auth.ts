import axios from 'axios';
import { WPUser, Employee, ERPModule } from '../types';

export interface SiteValidationResult {
  isWordPress: boolean;
  hasERP: boolean;
  error?: string;
}

export interface LoginResult {
  token: string;
  user: WPUser;
}

const ALLOWED_EMPLOYEE_ROLES = ['employee', 'administrator', 'erp_hr_manager'];

export async function validateSite(siteUrl: string): Promise<SiteValidationResult> {
  // HTTPS check
  if (!siteUrl.startsWith('https://')) {
    return { isWordPress: false, hasERP: false, error: 'Site URL must use HTTPS' };
  }

  // Validate WordPress REST API
  let namespaces: string[];
  try {
    const response = await axios.get(`${siteUrl}/wp-json/`, { timeout: 10000 });
    namespaces = response.data?.namespaces || [];
    if (!namespaces.length) {
      return { isWordPress: false, hasERP: false, error: 'WordPress REST API not available at this URL' };
    }
  } catch {
    return { isWordPress: false, hasERP: false, error: 'Could not connect to site. Please check the URL.' };
  }

  // Check if WP-ERP namespace is present
  const hasERPNamespace = namespaces.some((ns: string) => ns.startsWith('erp/'));
  if (!hasERPNamespace) {
    return { isWordPress: true, hasERP: false, error: 'WP-ERP plugin is not active on this site' };
  }

  return { isWordPress: true, hasERP: true };
}

export function verifyEmployeeRole(user: WPUser): boolean {
  if (!user.roles || !user.roles.length) return true;
  return user.roles.some((role) => ALLOWED_EMPLOYEE_ROLES.includes(role));
}

/**
 * Login via the custom erp-mobile/v1/login endpoint.
 * Returns a persistent Bearer token for subsequent API calls.
 */
export async function loginWithPassword(
  siteUrl: string,
  username: string,
  password: string
): Promise<LoginResult> {
  const response = await axios.post(
    `${siteUrl}/wp-json/erp-app/v1/login`,
    { username, password },
    { timeout: 15000 }
  );

  const data = response.data;
  if (!data?.success || !data?.token) {
    throw new Error('Login failed — unexpected response');
  }

  return {
    token: data.token,
    user: data.user,
  };
}

export async function fetchEmployee(
  siteUrl: string,
  userId: number,
  token: string
): Promise<Employee> {
  const response = await axios.get(
    `${siteUrl}/wp-json/erp/v1/hrm/employees/${userId}`,
    {
      params: { include: 'department,designation,reporting_to,avatar' },
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  return response.data;
}

export async function registerBiometricToken(siteUrl: string, token: string): Promise<string> {
  const res = await axios.post(
    `${siteUrl}/wp-json/erp-app/v1/biometric/register`,
    {},
    { headers: { 'Authorization': `Bearer ${token}` }, timeout: 10000 }
  );
  if (!res.data?.biometric_token) throw new Error('Failed to obtain biometric token');
  return res.data.biometric_token as string;
}

export async function loginWithBiometricToken(siteUrl: string, biometricToken: string): Promise<LoginResult> {
  const res = await axios.post(
    `${siteUrl}/wp-json/erp-app/v1/biometric/login`,
    { biometric_token: biometricToken },
    { timeout: 10000 }
  );
  const data = res.data;
  if (!data?.success || !data?.token) throw new Error('Biometric login failed');
  return { token: data.token, user: data.user };
}

export async function revokeBiometricToken(siteUrl: string, token: string): Promise<void> {
  await axios.delete(
    `${siteUrl}/wp-json/erp-app/v1/biometric/revoke`,
    { headers: { 'Authorization': `Bearer ${token}` }, timeout: 10000 }
  );
}

export async function fetchActiveModules(
  siteUrl: string,
  token: string
): Promise<ERPModule[]> {
  try {
    const response = await axios.get(
      `${siteUrl}/wp-json/erp_pro/v1/admin/modules`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    return response.data;
  } catch {
    return [];
  }
}
