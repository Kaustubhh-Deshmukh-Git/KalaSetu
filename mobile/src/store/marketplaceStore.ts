import { create } from 'zustand';
import { api } from '../services/api';

export interface MarketplaceChannel {
  provider: string;
  name: string;
  status: 'connected' | 'not_connected' | 'pending' | 'error';
  externalAccountId?: string | null;
  lastSyncedAt?: string | null;
}

interface MarketplaceState {
  channels: MarketplaceChannel[];
  storefrontUrl: string;
  qrDataPayload: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMarketplaceStatus: () => Promise<void>;
  connectChannel: (provider: string, authConfig?: any) => Promise<void>;
  disconnectChannel: (provider: string) => Promise<void>;
  publishProductToAllChannels: (productId: string) => Promise<{ publishedCount: number; publishedChannels: string[] }>;
  clearError: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  channels: [],
  storefrontUrl: '',
  qrDataPayload: '',
  isLoading: false,
  error: null,

  fetchMarketplaceStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/marketplace');
      set({
        channels: res.data?.channels || [],
        storefrontUrl: res.data?.storefrontUrl || '',
        qrDataPayload: res.data?.qrDataPayload || '',
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  connectChannel: async (provider, authConfig = {}) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/marketplace/${provider}/connect`, authConfig);
      await get().fetchMarketplaceStatus();
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  disconnectChannel: async (provider) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/marketplace/${provider}/disconnect`);
      await get().fetchMarketplaceStatus();
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  publishProductToAllChannels: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/products/${productId}/publish`);
      set({ isLoading: false });
      return {
        publishedCount: res.data?.publishedCount || 0,
        publishedChannels: res.data?.publishedChannels || [],
      };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
