const productService = require('./productService');
const User = require('../models/User');
const Product = require('../models/Product');
const MarketplaceListing = require('../models/MarketplaceListing');
const notificationService = require('./notificationService');

const storefrontIntegration = require('../integrations/storefrontIntegration');
const gemIntegration = require('../integrations/gemIntegration');
const karigarIntegration = require('../integrations/karigarIntegration');
const mockMarketplace = require('../integrations/mockMarketplace');

const INTEGRATIONS = {
  storefront: storefrontIntegration,
  gem: gemIntegration,
  karigar: karigarIntegration,
  samarth: mockMarketplace,
};

/**
 * Get connection status and storefront details for all marketplace channels
 */
const getChannelStatuses = async (userId) => {
  const channels = [];

  for (const [key, adapter] of Object.entries(INTEGRATIONS)) {
    const statusInfo = await adapter.status(userId);
    channels.push(statusInfo);
  }

  const storefrontInfo = await storefrontIntegration.status(userId);

  return {
    success: true,
    storefrontUrl: storefrontInfo.storefrontUrl,
    qrDataPayload: storefrontInfo.qrDataPayload,
    channels,
  };
};

/**
 * Connect artisan account to a specific marketplace channel
 */
const connectChannel = async (userId, provider, authConfig = {}) => {
  const adapter = INTEGRATIONS[provider];
  if (!adapter) {
    const error = new Error(`Unsupported marketplace provider: ${provider}`);
    error.statusCode = 400;
    throw error;
  }

  const result = await adapter.connect(userId, authConfig);
  return result;
};

/**
 * Disconnect artisan account from a marketplace channel
 */
const disconnectChannel = async (userId, provider) => {
  const adapter = INTEGRATIONS[provider];
  if (!adapter) {
    const error = new Error(`Unsupported marketplace provider: ${provider}`);
    error.statusCode = 400;
    throw error;
  }

  const result = await adapter.disconnect(userId);
  return result;
};

/**
 * Publish a single product to a specific marketplace channel
 */
const publishProductToChannel = async (userId, productId, provider) => {
  const product = await productService.getProductById(userId, productId);
  const adapter = INTEGRATIONS[provider];

  if (!adapter) {
    const error = new Error(`Unsupported marketplace provider: ${provider}`);
    error.statusCode = 400;
    throw error;
  }

  const publishResult = await adapter.publish(product);

  const listing = await MarketplaceListing.findOneAndUpdate(
    { productId: product._id, provider },
    {
      owner: userId,
      productId: product._id,
      provider,
      status: publishResult.status || 'published',
      externalListingId: publishResult.externalListingId || null,
      storefrontUrl: publishResult.listingUrl || null,
      lastSyncedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return {
    success: true,
    listing,
    publishResult,
  };
};

/**
 * One-Tap Publish Fan-Out
 * Marks product as published and automatically fans out to all connected channels
 */
const publishProductToAllChannels = async (userId, productId) => {
  const product = await productService.getProductById(userId, productId);

  // 1. Mark product as published in primary catalog
  product.status = 'published';
  await product.save();

  // 2. Fan-out to all connected channels
  const listings = [];
  const publishedChannels = [];

  for (const [providerKey, adapter] of Object.entries(INTEGRATIONS)) {
    try {
      const channelStatus = await adapter.status(userId);
      if (channelStatus.status === 'connected') {
        const result = await adapter.publish(product);
        const listingDoc = await MarketplaceListing.findOneAndUpdate(
          { productId: product._id, provider: providerKey },
          {
            owner: userId,
            productId: product._id,
            provider: providerKey,
            status: 'published',
            externalListingId: result.externalListingId,
            storefrontUrl: result.listingUrl,
            lastSyncedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        listings.push(listingDoc);
        publishedChannels.push(adapter.displayName);
      }
    } catch (err) {
      console.error(`Failed to fan-out publish to ${providerKey}:`, err.message);
    }
  }

  // 3. Create Notification for the artisan
  try {
    await notificationService.createNotification(
      userId,
      'marketplace',
      'Product Published Successfully',
      `"${product.title?.hi || product.title?.en || 'Craft'}" is now published to ${publishedChannels.length} channel(s): ${publishedChannels.join(', ')}.`
    );
  } catch (notifErr) {
    console.error('Notification creation error:', notifErr.message);
  }

  return {
    success: true,
    product,
    publishedCount: listings.length,
    publishedChannels,
    listings,
  };
};

/**
 * Public Storefront endpoint (accessible by buyers without auth)
 */
const getPublicStorefront = async (artisanId) => {
  const user = await User.findById(artisanId).select('name phone role clusterId preferredLanguage createdAt');
  if (!user) {
    const error = new Error('Artisan storefront not found');
    error.statusCode = 404;
    throw error;
  }

  const products = await Product.find({
    owner: artisanId,
    status: 'published',
  }).sort({ updatedAt: -1 });

  return {
    success: true,
    artisan: {
      id: user._id,
      name: user.name || 'Master Artisan',
      cluster: user.clusterId || 'Indian Handloom & Handicraft Cluster',
      memberSince: user.createdAt,
    },
    totalProducts: products.length,
    products,
  };
};

module.exports = {
  getChannelStatuses,
  connectChannel,
  disconnectChannel,
  publishProductToChannel,
  publishProductToAllChannels,
  getPublicStorefront,
};
