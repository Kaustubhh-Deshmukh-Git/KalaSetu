const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['artisan', 'facilitator', 'admin'],
      default: 'artisan',
      required: true,
    },
    preferredLanguage: {
      type: String,
      default: 'hi', // default to Hindi for accessible artisan onboarding
      trim: true,
    },
    clusterId: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      default: null, // For facilitator/admin email+password login
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    otp: {
      codeHash: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
      lastRequestedAt: { type: Date, default: null },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Do not return password or OTP fields in JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
