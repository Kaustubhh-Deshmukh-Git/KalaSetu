import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // 1. Explicit env var override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Web browser running on the same machine
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // 3. Physical phone or emulator running in Expo Go:
  // Automatically extract the developer's machine LAN IP from Metro hostUri
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

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
