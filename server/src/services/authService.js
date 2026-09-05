const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Generate a 6-digit numeric OTP
 */
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Issue a signed JWT for a user
 */
const issueToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      phone: user.phone,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Request OTP for a given phone number
 */
const requestOtp = async (phone) => {
  const cleanPhone = phone.trim();
  const rawOtp = generateNumericOtp();
  const salt = await bcrypt.genSalt(10);
  const codeHash = await bcrypt.hash(rawOtp, salt);
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  let user = await User.findOne({ phone: cleanPhone });

  if (!user) {
    // Auto-create initial artisan user record if it doesn't exist yet
    user = new User({
      phone: cleanPhone,
      role: 'artisan',
      preferredLanguage: 'hi',
    });
  }

  user.otp = {
    codeHash,
    expiresAt,
    attempts: 0,
    lastRequestedAt: new Date(),
  };

  await user.save();

  console.log(`\n========================================`);
  console.log(`[AUTH SERVICE - DEV OTP]`);
  console.log(`Phone: ${cleanPhone}`);
  console.log(`OTP Code: ${rawOtp}`);
  console.log(`Expires in: ${config.otp.expiryMinutes} minutes`);
  console.log(`========================================\n`);

  return {
    success: true,
    message: 'OTP sent successfully',
    expiresInMinutes: config.otp.expiryMinutes,
    ...(config.isDev && { devOtp: rawOtp }),
  };
};

/**
 * Verify OTP and issue JWT session token
 */
const verifyOtp = async (phone, otp) => {
  const cleanPhone = phone.trim();
  const user = await User.findOne({ phone: cleanPhone });

  if (!user || !user.otp || !user.otp.codeHash) {
    const error = new Error('No active OTP request found for this phone number');
    error.statusCode = 400;
    error.code = 'OTP_NOT_FOUND';
    throw error;
  }

  // Check expiration
  if (new Date() > new Date(user.otp.expiresAt)) {
    const error = new Error('OTP has expired. Please request a new one');
    error.statusCode = 400;
    error.code = 'OTP_EXPIRED';
    throw error;
  }

  // Check max attempts
  if (user.otp.attempts >= 5) {
    const error = new Error('Too many invalid attempts. Please request a new OTP');
    error.statusCode = 400;
    error.code = 'OTP_MAX_ATTEMPTS_EXCEEDED';
    throw error;
  }

  const isMatch = await bcrypt.compare(otp.trim(), user.otp.codeHash);

  if (!isMatch) {
    user.otp.attempts += 1;
    await user.save();
    const remaining = 5 - user.otp.attempts;
    const error = new Error(`Invalid OTP. ${remaining} attempts remaining`);
    error.statusCode = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  // Clear OTP on successful verification
  user.otp = {
    codeHash: null,
    expiresAt: null,
    attempts: 0,
    lastRequestedAt: null,
  };
  user.lastLogin = new Date();
  await user.save();

  const token = issueToken(user);

  return {
    success: true,
    token,
    user,
  };
};

/**
 * Register a new user (artisan or facilitator/admin)
 */
const registerUser = async ({ phone, name, role, preferredLanguage, clusterId, password, email }) => {
  const cleanPhone = phone.trim();

  let existingUser = await User.findOne({ phone: cleanPhone });
  if (existingUser && existingUser.name) {
    const error = new Error('A user with this phone number is already registered');
    error.statusCode = 400;
    error.code = 'USER_ALREADY_EXISTS';
    throw error;
  }

  let hashedPassword = null;
  if (password) {
    // Hash credentials with bcrypt at cost 12 as per spec
    const salt = await bcrypt.genSalt(12);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  let user;
  if (existingUser) {
    existingUser.name = name || existingUser.name;
    existingUser.role = role || existingUser.role;
    existingUser.preferredLanguage = preferredLanguage || existingUser.preferredLanguage;
    existingUser.clusterId = clusterId || existingUser.clusterId;
    if (hashedPassword) existingUser.password = hashedPassword;
    if (email) existingUser.email = email.trim().toLowerCase();
    existingUser.lastLogin = new Date();
    user = await existingUser.save();
  } else {
    user = await User.create({
      phone: cleanPhone,
      name: name || '',
      role: role || 'artisan',
      preferredLanguage: preferredLanguage || 'hi',
      clusterId: clusterId || null,
      password: hashedPassword,
      email: email ? email.trim().toLowerCase() : null,
      lastLogin: new Date(),
    });
  }

  const token = issueToken(user);

  return {
    success: true,
    token,
    user,
  };
};

/**
 * Get current profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }
  return user;
};

module.exports = {
  requestOtp,
  verifyOtp,
  registerUser,
  getUserProfile,
  issueToken,
};
