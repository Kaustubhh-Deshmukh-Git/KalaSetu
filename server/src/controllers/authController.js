const { validationResult } = require('express-validator');
const authService = require('../services/authService');

/**
 * Handle validation errors helper
 */
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
 * POST /api/auth/otp/request
 */
const requestOtp = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { phone } = req.body;
    const result = await authService.requestOtp(phone);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/otp/verify
 */
const verifyOtp = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  const validationError = checkValidation(req, res);
  if (validationError) return;

  try {
    const { phone, name, role, preferredLanguage, clusterId, password, email } = req.body;
    const result = await authService.registerUser({
      phone,
      name,
      role,
      preferredLanguage,
      clusterId,
      password,
      email,
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
  register,
  getMe,
};
