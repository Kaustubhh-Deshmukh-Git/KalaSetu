const BaseMarketplaceIntegration = require('./baseMarketplaceIntegration');

/**
 * Personal Shareable Digital Storefront Provider
 * Generates an artisan's direct-to-buyer mobile/web storefront link and QR code.
 */
class StorefrontIntegration extends BaseMarketplaceIntegration {
  constructor() {
    super('storefront', 'Personal Digital Storefront');
  }

  getBaseStorefrontUrl() {
    return process.env.STOREFRONT_BASE_URL || 'https://kalasetu.app';
  }

  async connect(userId, authConfig = {}) {
    return {
      success: true,
      status: 'connected',
      accountId: `STORE-${userId}`,
      message: 'Personal storefront is permanently active.',
    };
  }

  async disconnect(userId) {
    return {
      success: true,
      status: 'connected',
    };
  }

  async status(userId) {
    const baseUrl = this.getBaseStorefrontUrl();
    const storefrontUrl = `${baseUrl}/store/${userId}`;
    
    // Generate a lightweight QR SVG data URI
    const qrDataPayload = `kalasetu://store/${userId}`;

    return {
      provider: this.providerName,
      name: this.displayName,
      status: 'connected',
      externalAccountId: `STORE-${userId}`,
      storefrontUrl,
      qrDataPayload,
      lastSyncedAt: new Date(),
    };
  }

  async publish(product, artisanConfig = {}) {
    const baseUrl = this.getBaseStorefrontUrl();
    const userId = product.owner?.toString() || 'artisan';
    const externalListingId = `STORE-PROD-${product._id}`;
    const listingUrl = `${baseUrl}/store/${userId}/product/${product._id}`;

    return {
      success: true,
      provider: this.providerName,
      externalListingId,
      listingUrl,
      status: 'published',
      directShareText: `Namaste! Explore my new handmade craft "${product.title?.hi || product.title?.en || 'Craft'}" on my KalaSetu Store: ${listingUrl}`,
    };
  }

  async syncOrders(userId) {
    return [];
  }
}

module.exports = new StorefrontIntegration();
