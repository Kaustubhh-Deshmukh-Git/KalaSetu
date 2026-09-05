const express = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { uploadMultiple, uploadAudio } = require('../middleware/uploadMiddleware');

const router = express.Router();

// All product routes require JWT authentication
router.use(protect);

/**
 * @route   GET /api/products
 * @desc    List products belonging to authenticated artisan
 * @access  Private
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status filter'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a non-negative integer'),
  ],
  productController.getProducts
);

/**
 * @route   POST /api/products
 * @desc    Create a draft product
 * @access  Private
 */
router.post(
  '/',
  [
    body('category').optional().isString().trim(),
    body('rawMaterialCost').optional().isNumeric().withMessage('Raw material cost must be a number'),
    body('stockCount').optional().isInt({ min: 0 }).withMessage('Stock count must be a non-negative integer'),
  ],
  productController.createProduct
);

/**
 * @route   GET /api/products/:id
 * @desc    Fetch product details by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  productController.getProductById
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product details
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid product ID format'),
    body('rawMaterialCost').optional().isNumeric().withMessage('Raw material cost must be a number'),
    body('finalPrice').optional().isNumeric().withMessage('Final price must be a number'),
    body('stockCount').optional().isInt({ min: 0 }).withMessage('Stock count must be a non-negative integer'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  ],
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  productController.deleteProduct
);

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload raw photo(s) (up to 5 photos per product)
 * @access  Private
 */
router.post(
  '/:id/images',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  uploadMultiple,
  productController.uploadImages
);

/**
 * @route   POST /api/products/:id/enhance-image
 * @desc    Run AI Image Studio background removal & enhancement pipeline
 * @access  Private
 */
router.post(
  '/:id/enhance-image',
  [
    param('id').isMongoId().withMessage('Invalid product ID format'),
    body('imageIndex').optional().isInt({ min: 0, max: 4 }).withMessage('Image index must be between 0 and 4'),
  ],
  productController.enhanceImage
);

/**
 * @route   PUT /api/products/:id/enhance-image/override
 * @desc    Artisan manual override ('keep_original' or 'accept_enhanced')
 * @access  Private
 */
router.put(
  '/:id/enhance-image/override',
  [
    param('id').isMongoId().withMessage('Invalid product ID format'),
    body('choice')
      .isIn(['keep_original', 'accept_enhanced'])
      .withMessage("Choice must be 'keep_original' or 'accept_enhanced'"),
  ],
  productController.overrideImageChoice
);

/**
 * @route   POST /api/products/:id/voice-note
 * @desc    Upload voice recording describing product
 * @access  Private
 */
router.post(
  '/:id/voice-note',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  uploadAudio,
  productController.uploadVoiceNote
);

/**
 * @route   POST /api/products/:id/generate-description
 * @desc    Run Multilingual Auto-Cataloger (transcribe -> translate -> bilingual description)
 * @access  Private
 */
router.post(
  '/:id/generate-description',
  [
    param('id').isMongoId().withMessage('Invalid product ID format'),
    body('voiceNoteId').optional().isMongoId().withMessage('Invalid voiceNoteId format'),
    body('manualTranscript').optional().isString(),
  ],
  productController.generateDescription
);

/**
 * @route   POST /api/products/:id/suggest-price
 * @desc    Run Dynamic Pricing Assistant (ML regression or deterministic cost-plus fallback)
 * @access  Private
 */
router.post(
  '/:id/suggest-price',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  productController.suggestPrice
);

/**
 * @route   POST /api/products/:id/publish
 * @desc    One-Tap Publish product and fan out to all connected marketplace channels
 * @access  Private
 */
router.post(
  '/:id/publish',
  [param('id').isMongoId().withMessage('Invalid product ID format')],
  productController.publishProduct
);

module.exports = router;


