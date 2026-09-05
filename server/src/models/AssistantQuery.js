const mongoose = require('mongoose');

const assistantQuerySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transcript: {
      type: String,
      required: true,
    },
    detectedLanguage: {
      type: String,
      default: 'hi',
    },
    intent: {
      type: String,
      enum: ['how_to', 'order_status', 'listing_status', 'unknown'],
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    audioReplyUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AssistantQuery = mongoose.model('AssistantQuery', assistantQuerySchema);

module.exports = AssistantQuery;
