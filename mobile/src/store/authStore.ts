import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import i18n from '../i18n';

export interface UserProfile {
  _id: string;
  phone: string;
  name?: string;
  role: 'artisan' | 'facilitator' | 'admin';
  preferredLanguage: string;
  clusterId?: string;
  email?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  hasSelectedLanguage: boolean;
  error: string | null;
  devOtp: string | null;

  // Actions
  loadSession: () => Promise<void>;
  requestOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  setLanguage: (language: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = '@kalasetu_token';
const USER_KEY = '@kalasetu_user';
const LANG_KEY = '@kalasetu_lang';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  hasSelectedLanguage: false,
  error: null,
  devOtp: null,

  loadSession: async () => {
    try {
      set({ isInitializing: true });
      const [storedToken, storedUser, storedLang] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(LANG_KEY),
      ]);

      if (storedLang) {
        await i18n.changeLanguage(storedLang);
        set({ hasSelectedLanguage: true });
      }

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        set({
          token: storedToken,
          user: parsedUser,
          isAuthenticated: true,
        });

        // Background refresh profile
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
            set({ user: res.data.user });
          }
        } catch {
          // Keep cached user if offline
        }
      }
    } catch (e) {
      console.warn('[AuthStore] Session hydration error', e);
    } finally {
      set({ isInitializing: false });
    }
  },

  requestOtp: async (phone: string) => {
    set({ isLoading: true, error: null, devOtp: null });
    try {
      const res = await api.post('/auth/otp/request', { phone });
      const devOtp = res.data?.devOtp || null;
      set({ isLoading: false, devOtp });
      return { success: true, devOtp };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/otp/verify', { phone, otp });
      const { token, user } = res.data;

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      if (user.preferredLanguage) {
        await i18n.changeLanguage(user.preferredLanguage);
        await AsyncStorage.setItem(LANG_KEY, user.preferredLanguage);
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      return false;
    }
  },

  setLanguage: async (language: string) => {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANG_KEY, language);
    set({ hasSelectedLanguage: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      devOtp: null,
    });
  },

  clearError: () => set({ error: null }),
}));
