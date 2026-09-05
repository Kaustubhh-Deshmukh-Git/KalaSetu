const marketplaceService = require('../services/marketplaceService');

const getMarketplaceStatus = async (req, res, next) => {
  try {
    const result = await marketplaceService.getChannelStatuses(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const connectChannel = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await marketplaceService.connectChannel(req.user._id, provider, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const disconnectChannel = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await marketplaceService.disconnectChannel(req.user._id, provider);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const publishProductToChannel = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }
    const result = await marketplaceService.publishProductToChannel(req.user._id, productId, provider);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPublicStorefront = async (req, res, next) => {
  try {
    const { artisanId } = req.params;
    const result = await marketplaceService.getPublicStorefront(artisanId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMarketplaceStatus,
  connectChannel,
  disconnectChannel,
  publishProductToChannel,
  getPublicStorefront,
};
