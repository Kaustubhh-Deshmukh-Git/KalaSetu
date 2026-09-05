const { validationResult } = require('express-validator');
const productService = require('../services/productService');

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
      code: 'VALIDATION_ERROR',
    });
  }
  return null;
};

/**
 * GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const { status, limit, skip } = req.query;
    const result = await productService.getUserProducts(req.user._id, { status, limit, skip });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const product = await productService.createProduct(req.user._id, req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const product = await productService.updateProduct(req.user._id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/images
 */
const uploadImages = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    const result = await productService.uploadProductImages(req.user._id, req.params.id, files);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const imageEnhancementService = require('../services/imageEnhancementService');

/**
 * POST /api/products/:id/enhance-image
 */
const enhanceImage = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { imageId, imageIndex } = req.body;
    const result = await imageEnhancementService.enhanceProductImage(req.user._id, req.params.id, {
      imageId,
      imageIndex: imageIndex !== undefined ? Number(imageIndex) : 0,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id/enhance-image/override
 */
const overrideImageChoice = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { imageId, imageIndex, choice } = req.body;
    const result = await imageEnhancementService.overrideImageChoice(req.user._id, req.params.id, {
      imageId,
      imageIndex: imageIndex !== undefined ? Number(imageIndex) : 0,
      choice,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const catalogAIService = require('../services/catalogAIService');
const pricingService = require('../services/pricingService');
const marketplaceService = require('../services/marketplaceService');

/**
 * POST /api/products/:id/voice-note
 */
const uploadVoiceNote = async (req, res, next) => {
  try {
    const result = await catalogAIService.saveVoiceNote(req.user._id, req.params.id, req.file);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/generate-description
 */
const generateDescription = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { voiceNoteId, manualTranscript } = req.body;
    const result = await catalogAIService.generateBilingualCatalog(req.user._id, req.params.id, {
      voiceNoteId,
      manualTranscript,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/suggest-price
 */
const suggestPrice = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const result = await pricingService.calculateSuggestedPrice(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/publish
 * One-Tap Publish Fan-Out to all connected marketplace channels
 */
const publishProduct = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const result = await marketplaceService.publishProductToAllChannels(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadImages,
  enhanceImage,
  overrideImageChoice,
  uploadVoiceNote,
  generateDescription,
  suggestPrice,
  publishProduct,
};


