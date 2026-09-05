import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@kalasetu_offline_queue';

export interface QueuedAction {
  id: string;
  type: 'UPLOAD_IMAGE' | 'VOICE_NOTE' | 'SAVE_PRODUCT';
  payload: any;
  createdAt: number;
  retryCount: number;
}

export const offlineQueue = {
  async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async enqueue(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newAction: QueuedAction = {
        ...action,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
        retryCount: 0,
      };
      queue.push(newAction);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('[OfflineQueue] Enqueue failed', e);
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  },
};
