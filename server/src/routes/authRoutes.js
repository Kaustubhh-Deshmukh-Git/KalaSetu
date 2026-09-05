const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/auth/otp/request
 * @desc    Request OTP for phone number
 * @access  Public (Rate-limited)
 */
router.post(
  '/otp/request',
  [
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please enter a valid 10 to 15 digit phone number'),
  ],
  otpRateLimiter,
  authController.requestOtp
);

/**
 * @route   POST /api/auth/otp/verify
 * @desc    Verify OTP and issue JWT session token
 * @access  Public
 */
router.post(
  '/otp/verify',
  [
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits')
      .isNumeric()
      .withMessage('OTP must be numeric'),
  ],
  authController.verifyOtp
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new artisan/facilitator account
 * @access  Public
 */
router.post(
  '/register',
  [
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please enter a valid phone number'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('role')
      .optional()
      .isIn(['artisan', 'facilitator', 'admin'])
      .withMessage('Role must be artisan, facilitator, or admin'),
    body('preferredLanguage')
      .optional()
      .isString()
      .withMessage('Preferred language must be a valid code'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  authController.register
);

/**
 * @route   GET /api/auth/me
 * @desc    Fetch current authenticated user profile
 * @access  Private (JWT Protected)
 */
router.get('/me', protect, authController.getMe);

module.exports = router;
