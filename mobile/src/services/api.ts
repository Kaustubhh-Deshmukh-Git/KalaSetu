import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_BACKEND_URL = 'https://kalasetu-backend-trh4.onrender.com';

/**
 * Returns the root backend URL (without trailing slash or /api)
 */
export const getBackendRootUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  return DEFAULT_BACKEND_URL;
};

/**
 * Returns the full /api base URL
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return `${DEFAULT_BACKEND_URL}/api`;
};

export const BACKEND_ROOT_URL = getBackendRootUrl();
export const API_BASE_URL = getApiBaseUrl();

/**
 * Health check helper to verify if the server is awake and responding
 */
export const checkServerHealth = async (timeoutMs = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject JWT Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@kalasetu_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API Interceptor] Failed to read token from storage', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: unify error messages with retry-friendly offline diagnostics
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Network request failed. Please check your connection and try again.';

    if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timed out. Please check your network connection and retry.';
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      message = 'Cannot reach KalaSetu servers. Please check your internet connection and try again.';
    } else if (error.response?.status >= 500) {
      message = 'Server is currently experiencing a temporary issue. Please retry in a few moments.';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
