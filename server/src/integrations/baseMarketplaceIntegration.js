/**
 * Base Marketplace Integration Interface
 * All marketplace adapters (GeM, Amazon Karigar, Storefront, Mock) inherit from this class.
 */
class BaseMarketplaceIntegration {
  constructor(providerName, displayName) {
    if (new.target === BaseMarketplaceIntegration) {
      throw new TypeError('Cannot construct BaseMarketplaceIntegration instances directly.');
    }
    this.providerName = providerName;
    this.displayName = displayName || providerName;
  }

  /**
   * Connect / Authenticate artisan account with the marketplace channel
   * @param {string} userId - Artisan MongoDB User ID
   * @param {Object} authConfig - Credentials, API keys, or OAuth tokens
   * @returns {Promise<{ success: boolean, status: string, accountId?: string, message?: string }>}
   */
  async connect(userId, authConfig = {}) {
    throw new Error(`connect() not implemented for ${this.providerName}`);
  }

  /**
   * Disconnect / De-authorize artisan account
   * @param {string} userId - Artisan MongoDB User ID
   * @returns {Promise<{ success: boolean, status: string }>}
   */
  async disconnect(userId) {
    throw new Error(`disconnect() not implemented for ${this.providerName}`);
  }

  /**
   * Fetch current connection and sync status for the artisan
   * @param {string} userId - Artisan MongoDB User ID
   * @returns {Promise<{ provider: string, name: string, status: string, externalAccountId?: string, lastSyncedAt?: Date }>}
   */
  async status(userId) {
    throw new Error(`status() not implemented for ${this.providerName}`);
  }

  /**
   * Publish product listing to the marketplace
   * @param {Object} product - Mongoose Product document or object
   * @param {Object} artisanConfig - Artisan account and channel configurations
   * @returns {Promise<{ success: boolean, externalListingId: string, listingUrl: string, status: string, error?: string }>}
   */
  async publish(product, artisanConfig = {}) {
    throw new Error(`publish() not implemented for ${this.providerName}`);
  }

  /**
   * Sync orders from the marketplace channel
   * @param {string} userId - Artisan MongoDB User ID
   * @returns {Promise<Array<Object>>}
   */
  async syncOrders(userId) {
    return [];
  }
}

module.exports = BaseMarketplaceIntegration;
