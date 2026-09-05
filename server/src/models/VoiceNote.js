const mongoose = require('mongoose');

const voiceNoteSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    detectedLanguage: {
      type: String,
      default: 'hi',
    },
    transcript: {
      type: String,
      default: '',
    },
    translatedTranscript: {
      en: { type: String, default: '' },
      hi: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const VoiceNote = mongoose.model('VoiceNote', voiceNoteSchema);

module.exports = VoiceNote;
