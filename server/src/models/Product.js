const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      en: { type: String, default: '' },
      hi: { type: String, default: '' },
    },
    description: {
      en: { type: String, default: '' },
      hi: { type: String, default: '' },
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    materials: [{
      type: String,
      trim: true,
    }],
    rawMaterialCost: {
      type: Number,
      default: 0,
    },
    images: [{
      originalUrl: { type: String, required: true },
      enhancedUrl: { type: String, default: null },
      isEnhanced: { type: Boolean, default: false },
      enhancementStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'kept_original'],
        default: 'pending',
      },
      createdAt: { type: Date, default: Date.now },
    }],
    suggestedPrice: {
      amount: { type: Number, default: null },
      minPrice: { type: Number, default: null },
      maxPrice: { type: Number, default: null },
      breakdown: {
        rawMaterialCost: { type: Number, default: 0 },
        suggestedMargin: { type: Number, default: 0 },
        marketBenchmark: { type: Number, default: 0 },
        labourEstimate: { type: Number, default: 0 },
      },
      modelVersion: { type: String, default: 'fallback_v1' },
    },
    finalPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    stockCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
