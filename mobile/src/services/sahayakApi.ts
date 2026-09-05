import api from './api';

export interface SahayakPrompt {
  id: string;
  intent: 'order_status' | 'listing_status' | 'how_to' | 'unknown';
  labelEn: string;
  labelHi: string;
  query: string;
}

export interface SahayakQueryResponse {
  query: string;
  intent: 'order_status' | 'listing_status' | 'how_to' | 'unknown';
  topic?: string;
  answer: {
    en: string;
    hi: string;
  };
  data?: {
    totalOrders?: number;
    pendingOrders?: number;
    shippedOrders?: number;
    completedOrders?: number;
    totalRevenue?: number;
    totalProducts?: number;
    publishedProducts?: number;
  } | null;
}

export const sahayakApi = {
  /**
   * Send text or voice audio query to Sahayak
   */
  async sendQuery(queryText?: string, audioUri?: string): Promise<SahayakQueryResponse> {
    if (audioUri) {
      const formData = new FormData();
      if (queryText) {
        formData.append('queryText', queryText);
      }

      const filename = audioUri.split('/').pop() || 'voice_query.m4a';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `audio/${match[1]}` : 'audio/m4a';

      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type,
      } as any);

      const res = await api.post('/sahayak/query', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    }

    const res = await api.post('/sahayak/query', { queryText });
    return res.data.data;
  },

  /**
   * Fetch quick localized suggested prompt chips
   */
  async getQuickPrompts(): Promise<SahayakPrompt[]> {
    try {
      const res = await api.get('/sahayak/quick-prompts');
      return res.data.data || [];
    } catch (e) {
      // Fallback local prompts
      return [
        {
          id: 'check_orders',
          intent: 'order_status',
          labelEn: 'Check Orders & Sales',
          labelHi: 'ऑर्डर और कमाई देखें',
          query: 'मेरे कितने ऑर्डर आए हैं?',
        },
        {
          id: 'check_listings',
          intent: 'listing_status',
          labelEn: 'Check Listed Crafts',
          labelHi: 'मेरे उत्पाद और लिस्टिंग',
          query: 'मेरे कितने उत्पाद लाइव हैं?',
        },
        {
          id: 'how_to_photos',
          intent: 'how_to',
          labelEn: 'How to take studio photos',
          labelHi: 'स्टूडियो फोटो कैसे बनाएं?',
          query: 'फोटो की बैकग्राउंड कैसे हटाएं?',
        },
      ];
    }
  },
};
