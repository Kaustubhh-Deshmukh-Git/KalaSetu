const Product = require('../models/Product');
const visionProvider = require('../providers/visionProvider');

/**
 * Run the AI Image Studio enhancement pipeline on a product's photo
 */
const enhanceProductImage = async (userId, productId, { imageId, imageIndex = 0 }) => {
  const product = await Product.findOne({ _id: productId, owner: userId });

  if (!product) {
    const error = new Error('Product not found or access denied');
    error.statusCode = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  if (!product.images || product.images.length === 0) {
    const error = new Error('Product has no uploaded images to enhance');
    error.statusCode = 400;
    error.code = 'NO_IMAGES_FOUND';
    throw error;
  }

  // Find targeted image
  let targetImage = null;
  if (imageId) {
    targetImage = product.images.id(imageId);
  }
  if (!targetImage && imageIndex !== undefined && product.images[imageIndex]) {
    targetImage = product.images[imageIndex];
  }
  if (!targetImage) {
    targetImage = product.images[0];
  }

  targetImage.enhancementStatus = 'processing';
  await product.save();

  try {
    const result = await visionProvider.enhanceImage({
      imageUrl: targetImage.originalUrl,
      filename: `product-${productId}-${targetImage._id}.jpg`,
    });

    targetImage.enhancedUrl = result.enhancedUrl;
    targetImage.isEnhanced = true;
    targetImage.enhancementStatus = 'completed';

    await product.save();

    return {
      success: true,
      image: targetImage,
      product,
      provider: result.provider,
      tier: result.tier,
      metadata: result.metadata,
    };
  } catch (enhanceError) {
    targetImage.enhancementStatus = 'failed';
    await product.save();
    throw enhanceError;
  }
};

/**
 * Handle artisan's manual override ("keep original" vs "accept enhanced")
 */
const overrideImageChoice = async (userId, productId, { imageId, imageIndex = 0, choice }) => {
  const product = await Product.findOne({ _id: productId, owner: userId });

  if (!product) {
    const error = new Error('Product not found or access denied');
    error.statusCode = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  let targetImage = null;
  if (imageId) {
    targetImage = product.images.id(imageId);
  }
  if (!targetImage && imageIndex !== undefined && product.images[imageIndex]) {
    targetImage = product.images[imageIndex];
  }
  if (!targetImage) {
    targetImage = product.images[0];
  }

  if (choice === 'keep_original') {
    targetImage.enhancementStatus = 'kept_original';
    targetImage.isEnhanced = false;
  } else if (choice === 'accept_enhanced') {
    targetImage.enhancementStatus = 'completed';
    targetImage.isEnhanced = true;
  } else {
    const error = new Error("Invalid choice. Must be 'keep_original' or 'accept_enhanced'");
    error.statusCode = 400;
    error.code = 'INVALID_OVERRIDE_CHOICE';
    throw error;
  }

  await product.save();

  return {
    success: true,
    image: targetImage,
    product,
  };
};

module.exports = {
  enhanceProductImage,
  overrideImageChoice,
};
