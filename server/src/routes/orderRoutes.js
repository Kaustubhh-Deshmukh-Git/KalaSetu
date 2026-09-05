const express = require('express');
const { param, body, query } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Require auth for artisan order routes
router.use(protect);

/**
 * @route GET /api/orders
 * @desc  List orders across channels with metrics
 */
router.get(
  '/',
  [
    query('channel').optional().isString(),
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  orderController.getOrders
);

/**
 * @route POST /api/orders
 * @desc  Create order (simulated channel order or storefront order)
 */
router.post(
  '/',
  [
    body('productId').isMongoId().withMessage('Valid productId is required'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  ],
  orderController.createOrder
);

/**
 * @route GET /api/orders/:id
 * @desc  Get order details
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid order ID')],
  orderController.getOrderById
);

/**
 * @route PATCH /api/orders/:id/status
 * @desc  Update order status ('new', 'processing', 'shipped', 'completed', 'cancelled')
 */
router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status')
      .isIn(['new', 'processing', 'shipped', 'completed', 'cancelled'])
      .withMessage('Invalid status value'),
  ],
  orderController.updateOrderStatus
);

module.exports = router;
