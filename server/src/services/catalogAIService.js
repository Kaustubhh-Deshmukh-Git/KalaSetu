const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const VoiceNote = require('../models/VoiceNote');
const speechProvider = require('../providers/speechProvider');
const nlpProvider = require('../providers/nlpProvider');
const { UPLOADS_DIR } = require('../config/cloudinary');

/**
 * Save an uploaded voice recording for a product
 */
const saveVoiceNote = async (userId, productId, file) => {
  const product = await Product.findOne({ _id: productId, owner: userId });

  if (!product) {
    const error = new Error('Product not found or access denied');
    error.statusCode = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  if (!file) {
    const error = new Error('No audio file provided');
    error.statusCode = 400;
    error.code = 'NO_AUDIO_FILE';
    throw error;
  }

  const ext = path.extname(file.originalname) || '.m4a';
  const filename = `voice-${productId}-${Date.now()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);
  const audioUrl = `/uploads/${filename}`;

  const voiceNote = new VoiceNote({
    productId: product._id,
    audioUrl,
    detectedLanguage: 'hi',
    transcript: '',
    translatedTranscript: { en: '', hi: '' },
    status: 'pending',
  });

  await voiceNote.save();

  return {
    success: true,
    voiceNote,
  };
};

/**
 * Run multilingual transcription, translation, and SEO description generation pipeline
 */
const generateBilingualCatalog = async (userId, productId, { voiceNoteId, manualTranscript } = {}) => {
  const product = await Product.findOne({ _id: productId, owner: userId });

  if (!product) {
    const error = new Error('Product not found or access denied');
    error.statusCode = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  let transcript = manualTranscript || '';
  let detectedLanguage = 'hi';
  let speechMeta = null;
  let voiceNote = null;

  // 1. If voiceNoteId provided (or find latest voice note for product), transcribe via speechProvider
  if (voiceNoteId) {
    voiceNote = await VoiceNote.findOne({ _id: voiceNoteId, productId: product._id });
  } else {
    voiceNote = await VoiceNote.findOne({ productId: product._id }).sort({ createdAt: -1 });
  }

  if (voiceNote && voiceNote.audioUrl && !transcript) {
    voiceNote.status = 'processing';
    await voiceNote.save();

    speechMeta = await speechProvider.transcribeAudio({
      audioUrl: voiceNote.audioUrl,
      filename: path.basename(voiceNote.audioUrl),
      metadata: {
        category: product.category,
        materials: product.materials,
      },
    });

    transcript = speechMeta.transcript;
    detectedLanguage = speechMeta.detectedLanguage || 'hi';
    voiceNote.transcript = transcript;
    voiceNote.detectedLanguage = detectedLanguage;
  }

  // 2. Generate SEO catalog descriptions in English and Hindi via nlpProvider
  const nlpResult = await nlpProvider.generateCatalogListing({
    transcript,
    category: product.category,
    materials: product.materials,
    rawMaterialCost: product.rawMaterialCost,
  });

  // 3. Update Product document with generated title and description
  product.title = {
    en: nlpResult.title.en,
    hi: nlpResult.title.hi,
  };

  product.description = {
    en: nlpResult.description.en,
    hi: nlpResult.description.hi,
  };

  if (Array.isArray(nlpResult.tags) && nlpResult.tags.length > 0) {
    const combinedTags = Array.from(new Set([...product.tags, ...nlpResult.tags]));
    product.tags = combinedTags;
  }

  await product.save();

  // 4. Update VoiceNote status
  if (voiceNote) {
    voiceNote.translatedTranscript = {
      en: nlpResult.description.en,
      hi: nlpResult.description.hi,
    };
    voiceNote.status = 'completed';
    await voiceNote.save();
  }

  return {
    success: true,
    title: product.title,
    description: product.description,
    tags: product.tags,
    transcript,
    detectedLanguage,
    product,
    voiceNote,
    speechProvider: speechMeta ? speechMeta.provider : 'manual_transcript',
    nlpProvider: nlpResult.provider,
    tier: nlpResult.tier,
  };
};

module.exports = {
  saveVoiceNote,
  generateBilingualCatalog,
};
