import axios from 'axios';
import { WPUser, Employee, ERPModule } from '../types';

export async function validateSite(siteUrl: string): Promise<boolean> {
  const response = await axios.get(`${siteUrl}/wp-json/`, { timeout: 10000 });
  return !!response.data?.namespaces;
}

export async function validateCredentials(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WPUser> {
  const token = btoa(`${username}:${appPassword}`);
  const response = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
    headers: { Authorization: `Basic ${token}` },
    timeout: 10000,
  });
  return response.data;
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
      headers: { Authorization: `Basic ${token}` },
    }
  );
  return response.data;
}

export async function fetchActiveModules(
  siteUrl: string,
  token: string
): Promise<ERPModule[]> {
  try {
    const response = await axios.get(
      `${siteUrl}/wp-json/erp_pro/v1/admin/modules`,
      { headers: { Authorization: `Basic ${token}` } }
    );
    return response.data;
  } catch {
    // erp-pro not installed — return empty
    return [];
  }
}
