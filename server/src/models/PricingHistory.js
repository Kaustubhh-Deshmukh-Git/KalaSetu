const mongoose = require('mongoose');

const pricingHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    suggestedPrice: {
      type: Number,
      required: true,
    },
    finalPrice: {
      type: Number,
      default: null,
    },
    modelVersion: {
      type: String,
      default: 'v1',
    },
    marketComparables: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const PricingHistory = mongoose.model('PricingHistory', pricingHistorySchema);

module.exports = PricingHistory;
