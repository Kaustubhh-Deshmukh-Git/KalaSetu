const BaseMarketplaceIntegration = require('./baseMarketplaceIntegration');

/**
 * Mock Sandbox Marketplace Provider
 * Provides deterministic simulation of third-party channel connections and listings.
 */
class MockMarketplaceIntegration extends BaseMarketplaceIntegration {
  constructor() {
    super('samarth', 'Flipkart Samarth');
    this.connectionStore = new Map();
  }

  async connect(userId, authConfig = {}) {
    const mockId = authConfig.merchantId || `FK-SAMARTH-${userId.toString().slice(-6).toUpperCase()}`;
    this.connectionStore.set(userId.toString(), {
      status: 'connected',
      mockId,
      connectedAt: new Date(),
    });

    return {
      success: true,
      status: 'connected',
      accountId: mockId,
      message: 'Successfully connected to Flipkart Samarth Handicraft Hub.',
    };
  }

  async disconnect(userId) {
    this.connectionStore.delete(userId.toString());
    return {
      success: true,
      status: 'not_connected',
    };
  }

  async status(userId) {
    const conn = this.connectionStore.get(userId.toString());
    if (!conn || conn.status !== 'connected') {
      return {
        provider: this.providerName,
        name: this.displayName,
        status: 'not_connected',
        externalAccountId: null,
      };
    }

    return {
      provider: this.providerName,
      name: this.displayName,
      status: 'connected',
      externalAccountId: conn.mockId,
      lastSyncedAt: new Date(),
    };
  }

  async publish(product, artisanConfig = {}) {
    const externalListingId = `FSAMARTH-${Date.now()}-${product._id.toString().slice(-4).toUpperCase()}`;
    const listingUrl = `https://www.flipkart.com/samarth/p/${externalListingId}`;

    return {
      success: true,
      provider: this.providerName,
      externalListingId,
      listingUrl,
      status: 'published',
    };
  }

  async syncOrders(userId) {
    return [];
  }
}

module.exports = new MockMarketplaceIntegration();
