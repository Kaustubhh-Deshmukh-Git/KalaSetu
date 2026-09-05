const express = require('express');
const { param, body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const marketplaceController = require('../controllers/marketplaceController');

const router = express.Router();

/**
 * Public Storefront endpoint (accessible by anyone)
 * @route GET /api/marketplace/store/:artisanId
 */
router.get(
  '/store/:artisanId',
  [param('artisanId').isMongoId().withMessage('Invalid artisan ID')],
  marketplaceController.getPublicStorefront
);

// All following routes require JWT authentication
router.use(protect);

/**
 * @route GET /api/marketplace
 * @desc  List channel connection statuses & storefront info
 */
router.get('/', marketplaceController.getMarketplaceStatus);

/**
 * @route POST /api/marketplace/:provider/connect
 * @desc  Connect/Authorize artisan account with provider (gem, karigar, samarth)
 */
router.post(
  '/:provider/connect',
  [param('provider').isIn(['gem', 'karigar', 'samarth', 'storefront']).withMessage('Invalid provider')],
  marketplaceController.connectChannel
);

/**
 * @route POST /api/marketplace/:provider/disconnect
 * @desc  Disconnect artisan account from provider
 */
router.post(
  '/:provider/disconnect',
  [param('provider').isIn(['gem', 'karigar', 'samarth', 'storefront']).withMessage('Invalid provider')],
  marketplaceController.disconnectChannel
);

/**
 * @route GET /api/marketplace/oauth/:provider/start
 * @desc  Start OAuth connection flow
 */
router.get('/oauth/:provider/start', (req, res, next) => {
  req.params.provider = req.params.provider;
  marketplaceController.connectChannel(req, res, next);
});

/**
 * @route GET /api/marketplace/oauth/:provider/callback
 * @desc  Handle OAuth callback
 */
router.get('/oauth/:provider/callback', (req, res, next) => {
  marketplaceController.connectChannel(req, res, next);
});

/**
 * @route POST /api/marketplace/:provider/publish
 * @desc  Publish product to a specific marketplace channel
 */
router.post(
  '/:provider/publish',
  [
    param('provider').isIn(['gem', 'karigar', 'samarth', 'storefront']).withMessage('Invalid provider'),
    body('productId').isMongoId().withMessage('Invalid product ID'),
  ],
  marketplaceController.publishProductToChannel
);

module.exports = router;
