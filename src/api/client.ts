import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Credentials } from '../types';

const CREDENTIALS_KEY = 'erp_credentials';
const BIOMETRIC_TOKEN_KEY = 'erp_biometric_token';

let apiClient: AxiosInstance | null = null;
let currentCredentials: Credentials | null = null;

export async function saveCredentials(credentials: Credentials): Promise<void> {
  currentCredentials = credentials;
  try {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch {
    // Fallback: SecureStore may not be available (e.g. web)
  }
  apiClient = createClient(credentials);
}

export async function getCredentials(): Promise<Credentials | null> {
  if (currentCredentials) return currentCredentials;
  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) return null;
    currentCredentials = JSON.parse(raw);
    return currentCredentials;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  currentCredentials = null;
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch {
    // Fallback: SecureStore may not be available (e.g. web)
  }
  apiClient = null;
}

export async function updateToken(token: string): Promise<void> {
  const creds = await getCredentials();
  if (creds) {
    creds.token = token;
    currentCredentials = creds;
    try {
      await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(creds));
    } catch {
      // web fallback
    }
    apiClient = createClient(creds);
  }
}

function createClient(credentials: Credentials): AxiosInstance {
  const { siteUrl, token } = credentials;

  const client = axios.create({
    baseURL: `${siteUrl}/wp-json`,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return client;
}

export async function getClient(): Promise<AxiosInstance> {
  if (apiClient) return apiClient;

  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error('Not authenticated');
  }

  apiClient = createClient(credentials);
  return apiClient;
}

export async function saveBiometricToken(token: string, siteUrl: string): Promise<void> {
  try { await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, JSON.stringify({ token, siteUrl })); } catch {}
}

export async function getBiometricToken(): Promise<{ token: string; siteUrl: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export async function clearBiometricToken(): Promise<void> {
  try { await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY); } catch {}
}

export function extractPagination(headers: Record<string, any>) {
  return {
    total: parseInt(headers['x-wp-total'] || '0', 10),
    totalPages: parseInt(headers['x-wp-totalpages'] || '0', 10),
  };
}
