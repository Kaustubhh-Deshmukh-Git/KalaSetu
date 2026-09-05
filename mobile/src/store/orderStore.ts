import { create } from 'zustand';
import { api } from '../services/api';

export interface OrderItem {
  _id: string;
  owner: string;
  productId: {
    _id: string;
    title: { en?: string; hi?: string };
    images?: Array<{ originalUrl: string; enhancedUrl?: string }>;
    category?: string;
    finalPrice?: number;
    stockCount?: number;
  };
  buyerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  channel: 'storefront' | 'gem' | 'karigar' | 'samarth' | 'direct';
  quantity: number;
  amount: number;
  status: 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface OrderMetrics {
  totalEarnings: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  totalOrdersCount: number;
  channelBreakdown: {
    storefront: number;
    gem: number;
    karigar: number;
    samarth: number;
    direct: number;
  };
}

interface OrderState {
  orders: OrderItem[];
  metrics: OrderMetrics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: (channelFilter?: string, statusFilter?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<OrderItem>;
  createSimulatedOrder: (orderData: Partial<OrderItem>) => Promise<OrderItem>;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  metrics: null,
  isLoading: false,
  error: null,

  fetchOrders: async (channelFilter, statusFilter) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (channelFilter && channelFilter !== 'all') {
        params.channel = channelFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await api.get('/orders', { params });
      set({
        orders: res.data?.orders || [],
        metrics: res.data?.metrics || null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  updateOrderStatus: async (orderId: string, newStatus: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      const updatedOrder = res.data?.order;

      set((state) => ({
        orders: state.orders.map((o) => (o._id === orderId ? { ...o, status: updatedOrder.status } : o)),
        isLoading: false,
      }));

      // Refresh metrics
      await get().fetchOrders();

      return updatedOrder;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  createSimulatedOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/orders', orderData);
      const newOrder = res.data?.order;
      set((state) => ({
        orders: [newOrder, ...state.orders],
        isLoading: false,
      }));
      await get().fetchOrders();
      return newOrder;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
