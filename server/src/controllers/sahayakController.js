const sahayakService = require('../services/sahayakService');

/**
 * Handle voice / text query to Sahayak AI Assistant
 * POST /api/v1/sahayak/query
 */
exports.querySahayak = async (req, res, next) => {
  try {
    const artisanId = req.user ? req.user.id || req.user._id : null;
    const { queryText } = req.body;

    let audioBuffer = null;
    let audioMimeType = null;

    if (req.file) {
      audioBuffer = req.file.buffer;
      audioMimeType = req.file.mimetype;
    }

    const response = await sahayakService.processSahayakQuery({
      artisanId,
      queryText,
      audioBuffer,
      audioMimeType,
    });

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve quick localized starter chips
 * GET /api/v1/sahayak/quick-prompts
 */
exports.getQuickPrompts = async (req, res, next) => {
  try {
    const prompts = sahayakService.getQuickPrompts();
    return res.status(200).json({
      success: true,
      data: prompts,
    });
  } catch (error) {
    next(error);
  }
};
