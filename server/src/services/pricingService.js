const productService = require('./productService');
const PricingHistory = require('../models/PricingHistory');

const CATEGORY_MARKUPS = {
  handloom: 1.8,
  pottery: 2.2,
  woodcraft: 2.0,
  metalcraft: 1.9,
  jewelry: 2.4,
  painting: 2.5,
  leather: 1.8,
  bamboo: 2.1,
};
const DEFAULT_MARKUP = 2.0;

const CATEGORY_BASE_LABOUR = {
  handloom: 700,
  pottery: 400,
  woodcraft: 600,
  metalcraft: 800,
  jewelry: 900,
  painting: 750,
  leather: 500,
  bamboo: 350,
};
const DEFAULT_BASE_LABOUR = 500;

/**
 * Deterministic cost-plus fallback formula:
 * suggested_price = (raw_material_cost * category_markup) + labour_estimate
 */
const calculateRuleBasedFallback = ({ category, materials = [], rawMaterialCost = 0, tags = [] }) => {
  const catKey = (category || '').toLowerCase().trim();
  const markup = CATEGORY_MARKUPS[catKey] || DEFAULT_MARKUP;
  const baseLabour = CATEGORY_BASE_LABOUR[catKey] || DEFAULT_BASE_LABOUR;

  const complexityMultiplier = 1.0 + Math.min(materials.length, 4) * 0.05;
  const tagKeywords = ['intricate', 'fine', 'carved', 'silk', 'silver', 'gold', 'brass', 'embroidery', 'handcrafted'];
  const matchingTags = tags.filter((t) => tagKeywords.some((kw) => t.toLowerCase().includes(kw))).length;
  const tagMultiplier = Math.min(matchingTags * 0.05, 0.25);

  const labourEstimate = Math.round(baseLabour * (complexityMultiplier + tagMultiplier));
  const suggestedMargin = Math.round(rawMaterialCost * (markup - 1.0));
  const suggestedPrice = Math.round(rawMaterialCost + suggestedMargin + labourEstimate);

  const minPrice = Math.round(suggestedPrice * 0.9);
  const maxPrice = Math.round(suggestedPrice * 1.15);
  const marketBenchmark = Math.round(suggestedPrice * 1.05);

  return {
    suggestedPrice,
    priceRange: {
      minPrice,
      maxPrice,
    },
    breakdown: {
      rawMaterialCost: Math.round(rawMaterialCost * 100) / 100,
      suggestedMargin,
      labourEstimate,
      marketBenchmark,
    },
    modelVersion: 'rule_based_fallback_v1',
  };
};

/**
 * Call the Python FastAPI Pricing Microservice with strict timeout and fallback
 */
const callPricingMicroservice = async (payload) => {
  const pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:8000';
  const endpoint = `${pricingServiceUrl.replace(/\/$/, '')}/predict-price`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: payload.category,
        materials: payload.materials || [],
        rawMaterialCost: payload.rawMaterialCost || 0,
        imageTags: payload.tags || [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Pricing microservice returned status ${response.status}. Falling back to rule-based formula.`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`Pricing microservice unreachable or timed out (${error.message}). Falling back to rule-based formula.`);
    return null;
  }
};

/**
 * Main pricing suggestion orchestration for a product
 */
const calculateSuggestedPrice = async (userId, productId) => {
  const product = await productService.getProductById(userId, productId);

  const payload = {
    category: product.category,
    materials: product.materials,
    rawMaterialCost: product.rawMaterialCost,
    tags: product.tags,
  };

  // Attempt ML microservice first
  let pricingResult = await callPricingMicroservice(payload);

  // If microservice unavailable/unreachable, use deterministic rule-based fallback
  if (!pricingResult) {
    pricingResult = calculateRuleBasedFallback(payload);
  }

  // Persist suggestion to Product document
  product.suggestedPrice = {
    amount: pricingResult.suggestedPrice,
    minPrice: pricingResult.priceRange?.minPrice,
    maxPrice: pricingResult.priceRange?.maxPrice,
    breakdown: {
      rawMaterialCost: pricingResult.breakdown?.rawMaterialCost || product.rawMaterialCost || 0,
      suggestedMargin: pricingResult.breakdown?.suggestedMargin || 0,
      marketBenchmark: pricingResult.breakdown?.marketBenchmark || 0,
      labourEstimate: pricingResult.breakdown?.labourEstimate || 0,
    },
    modelVersion: pricingResult.modelVersion || 'rule_based_fallback_v1',
  };

  await product.save();

  // Log in PricingHistory collection for training and audit evaluation
  try {
    await PricingHistory.create({
      productId: product._id,
      suggestedPrice: pricingResult.suggestedPrice,
      finalPrice: product.finalPrice,
      modelVersion: pricingResult.modelVersion || 'rule_based_fallback_v1',
      marketComparables: {
        priceRange: pricingResult.priceRange,
        breakdown: pricingResult.breakdown,
      },
    });
  } catch (historyErr) {
    console.error('Failed to log pricing history:', historyErr.message);
  }

  return {
    success: true,
    suggestedPrice: pricingResult.suggestedPrice,
    priceRange: pricingResult.priceRange,
    breakdown: pricingResult.breakdown,
    modelVersion: pricingResult.modelVersion,
    product,
  };
};

module.exports = {
  calculateSuggestedPrice,
  calculateRuleBasedFallback,
  callPricingMicroservice,
};
