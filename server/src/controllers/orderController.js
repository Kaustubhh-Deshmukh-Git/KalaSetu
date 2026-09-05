const orderService = require('../services/orderService');

const getOrders = async (req, res, next) => {
  try {
    const { channel, status, limit, skip } = req.query;
    const result = await orderService.getUserOrders(req.user._id, { channel, status, limit, skip });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      owner: req.body.owner || req.user?._id,
    });
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const order = await orderService.updateOrderStatus(req.user._id, req.params.id, status);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
};
