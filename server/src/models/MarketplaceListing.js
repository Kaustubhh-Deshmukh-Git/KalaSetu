const mongoose = require('mongoose');

const marketplaceListingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gem', 'karigar', 'samarth', 'storefront', 'mock'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_connected', 'pending', 'published', 'error'],
      default: 'not_connected',
      index: true,
    },
    externalListingId: {
      type: String,
      default: null,
    },
    storefrontUrl: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MarketplaceListing = mongoose.model('MarketplaceListing', marketplaceListingSchema);

module.exports = MarketplaceListing;
