import { create } from 'zustand';
import { api } from '../services/api';
import { Platform } from 'react-native';

export interface ProductImage {
  _id?: string;
  originalUrl: string;
  enhancedUrl?: string | null;
  isEnhanced?: boolean;
  enhancementStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'kept_original';
  createdAt?: string;
}

export interface ProductItem {
  _id: string;
  owner?: string;
  title: { en?: string; hi?: string };
  description?: { en?: string; hi?: string };
  category: string;
  materials: string[];
  rawMaterialCost: number;
  suggestedPrice?: {
    amount?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    breakdown?: {
      rawMaterialCost?: number;
      suggestedMargin?: number;
      marketBenchmark?: number;
      labourEstimate?: number;
    };
    modelVersion?: string;
  };
  finalPrice?: number | null;
  images: ProductImage[];
  status: 'draft' | 'published' | 'archived';
  stockCount: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProductState {
  products: ProductItem[];
  selectedProduct: ProductItem | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions
  fetchProducts: (statusFilter?: string) => Promise<void>;
  fetchProductDetail: (id: string) => Promise<ProductItem>;
  createProduct: (
    data: {
      title?: { en?: string; hi?: string } | string;
      description?: { en?: string; hi?: string } | string;
      category?: string;
      materials?: string[];
      rawMaterialCost?: number;
      stockCount?: number;
      finalPrice?: number | null;
      status?: 'draft' | 'published';
    },
    localImageUris?: string[]
  ) => Promise<ProductItem>;
  updateProduct: (id: string, data: Partial<ProductItem>) => Promise<ProductItem>;
  deleteProduct: (id: string) => Promise<void>;
  uploadImages: (productId: string, imageUris: string[]) => Promise<ProductImage[]>;
  enhanceProductImage: (
    productId: string,
    options?: { imageId?: string; imageIndex?: number }
  ) => Promise<{ image: ProductImage; provider: string; tier: number }>;
  overrideProductImage: (
    productId: string,
    choice: 'keep_original' | 'accept_enhanced',
    options?: { imageId?: string; imageIndex?: number }
  ) => Promise<ProductImage>;
  uploadVoiceNote: (productId: string, audioUri: string) => Promise<{ voiceNoteId: string; audioUrl: string }>;
  generateCatalogDescription: (
    productId: string,
    options?: { voiceNoteId?: string; manualTranscript?: string }
  ) => Promise<{
    title: { en: string; hi: string };
    description: { en: string; hi: string };
    tags: string[];
    transcript?: string;
  }>;
  suggestPrice: (productId: string) => Promise<{
    suggestedPrice: number;
    priceRange: { minPrice: number; maxPrice: number };
    breakdown: {
      rawMaterialCost: number;
      suggestedMargin: number;
      labourEstimate: number;
      marketBenchmark: number;
    };
    modelVersion: string;
    product: ProductItem;
  }>;
  setSelectedProduct: (product: ProductItem | null) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  isUploading: false,
  error: null,

  fetchProducts: async (statusFilter) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await api.get('/products', { params });
      set({ products: res.data?.products || [], isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  fetchProductDetail: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/products/${id}`);
      const product = res.data?.product;
      set({ selectedProduct: product, isLoading: false });
      return product;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  createProduct: async (data, localImageUris) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/products', data);
      const newProduct: ProductItem = res.data?.product;

      // Upload local images if attached
      if (localImageUris && localImageUris.length > 0) {
        await get().uploadImages(newProduct._id, localImageUris);
        // Refresh product detail
        const updated = await get().fetchProductDetail(newProduct._id);
        set((state) => ({
          products: [updated, ...state.products.filter((p) => p._id !== newProduct._id)],
          isLoading: false,
        }));
        return updated;
      }

      set((state) => ({
        products: [newProduct, ...state.products],
        isLoading: false,
      }));
      return newProduct;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  updateProduct: async (id: string, data: Partial<ProductItem>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/products/${id}`, data);
      const updated = res.data?.product;
      set((state) => ({
        selectedProduct: updated,
        products: state.products.map((p) => (p._id === id ? updated : p)),
        isLoading: false,
      }));
      return updated;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/products/${id}`);
      set((state) => ({
        products: state.products.filter((p) => p._id !== id),
        selectedProduct: state.selectedProduct?._id === id ? null : state.selectedProduct,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  uploadImages: async (productId: string, imageUris: string[]) => {
    if (!imageUris || imageUris.length === 0) return [];

    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();

      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        const filename = uri.split('/').pop() || `photo_${Date.now()}_${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : `image/jpeg`;

        formData.append('images', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: type === 'image/jpg' ? 'image/jpeg' : type,
        } as any);
      }

      const res = await api.post(`/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedImages = res.data?.images || [];
      set((state) => {
        const updatedSelected = state.selectedProduct
          ? { ...state.selectedProduct, images: updatedImages }
          : null;
        return {
          isUploading: false,
          selectedProduct: updatedSelected,
        };
      });

      return updatedImages;
    } catch (err: any) {
      set({ isUploading: false, error: err.message });
      throw err;
    }
  },

  enhanceProductImage: async (productId, options) => {
    set({ isUploading: true, error: null });
    try {
      const res = await api.post(`/products/${productId}/enhance-image`, options || {});
      const { image, product, provider, tier } = res.data;

      set((state) => ({
        selectedProduct: product || state.selectedProduct,
        products: state.products.map((p) => (p._id === productId ? (product || p) : p)),
        isUploading: false,
      }));

      return { image, provider, tier };
    } catch (err: any) {
      set({ isUploading: false, error: err.message });
      throw err;
    }
  },

  overrideProductImage: async (productId, choice, options) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/products/${productId}/enhance-image/override`, {
        choice,
        ...(options || {}),
      });
      const { image, product } = res.data;

      set((state) => ({
        selectedProduct: product || state.selectedProduct,
        products: state.products.map((p) => (p._id === productId ? (product || p) : p)),
        isLoading: false,
      }));

      return image;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  uploadVoiceNote: async (productId: string, audioUri: string) => {
    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();
      const filename = audioUri.split('/').pop() || `voice_${Date.now()}.m4a`;

      formData.append('audio', {
        uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
        name: filename,
        type: 'audio/m4a',
      } as any);

      const res = await api.post(`/products/${productId}/voice-note`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ isUploading: false });
      return {
        voiceNoteId: res.data?.voiceNote?._id,
        audioUrl: res.data?.voiceNote?.audioUrl,
      };
    } catch (err: any) {
      set({ isUploading: false, error: err.message });
      throw err;
    }
  },

  generateCatalogDescription: async (productId: string, options) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/products/${productId}/generate-description`, options || {});
      const { title, description, tags, product, transcript } = res.data;

      set((state) => ({
        selectedProduct: product || state.selectedProduct,
        products: state.products.map((p) => (p._id === productId ? (product || p) : p)),
        isLoading: false,
      }));

      return { title, description, tags, transcript };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  suggestPrice: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/products/${productId}/suggest-price`);
      const { suggestedPrice, priceRange, breakdown, modelVersion, product } = res.data;

      set((state) => ({
        selectedProduct: product || (state.selectedProduct ? { ...state.selectedProduct, suggestedPrice: product?.suggestedPrice } : null),
        products: state.products.map((p) => (p._id === productId ? (product || p) : p)),
        isLoading: false,
      }));

      return { suggestedPrice, priceRange, breakdown, modelVersion, product };
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  clearError: () => set({ error: null }),
}));

