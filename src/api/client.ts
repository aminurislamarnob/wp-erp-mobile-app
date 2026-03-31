import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Credentials } from '../types';

const CREDENTIALS_KEY = 'erp_credentials';

let apiClient: AxiosInstance | null = null;

export async function saveCredentials(credentials: Credentials): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
  apiClient = createClient(credentials);
}

export async function getCredentials(): Promise<Credentials | null> {
  const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  apiClient = null;
}

function createClient(credentials: Credentials): AxiosInstance {
  const { siteUrl, username, appPassword } = credentials;
  const token = btoa(`${username}:${appPassword}`);

  const client = axios.create({
    baseURL: `${siteUrl}/wp-json`,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers.Authorization = `Basic ${token}`;
    return config;
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

export function extractPagination(headers: Record<string, any>) {
  return {
    total: parseInt(headers['x-wp-total'] || '0', 10),
    totalPages: parseInt(headers['x-wp-totalpages'] || '0', 10),
  };
}
