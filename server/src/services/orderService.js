const Order = require('../models/Order');
const Product = require('../models/Product');
const notificationService = require('./notificationService');

/**
 * Get all orders for the authenticated artisan with channel & status filters and financial analytics
 */
const getUserOrders = async (userId, { channel, status, limit = 50, skip = 0 } = {}) => {
  const query = { owner: userId };

  if (channel && channel !== 'all') {
    query.channel = channel;
  }
  if (status && status !== 'all') {
    query.status = status;
  }

  const [orders, total, allArtisanOrders] = await Promise.all([
    Order.find(query)
      .populate('productId', 'title images category finalPrice stockCount')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10)),
    Order.countDocuments(query),
    Order.find({ owner: userId }),
  ]);

  // Financial analytics calculation
  let totalEarnings = 0;
  let activeOrdersCount = 0;
  let completedOrdersCount = 0;
  const channelBreakdown = {
    storefront: 0,
    gem: 0,
    karigar: 0,
    samarth: 0,
    direct: 0,
  };

  allArtisanOrders.forEach((ord) => {
    if (ord.status !== 'cancelled') {
      totalEarnings += ord.amount || 0;
    }
    if (['new', 'processing', 'shipped'].includes(ord.status)) {
      activeOrdersCount++;
    }
    if (ord.status === 'completed') {
      completedOrdersCount++;
    }
    if (channelBreakdown[ord.channel] !== undefined) {
      channelBreakdown[ord.channel] += ord.amount || 0;
    }
  });

  return {
    orders,
    total,
    metrics: {
      totalEarnings,
      activeOrdersCount,
      completedOrdersCount,
      totalOrdersCount: allArtisanOrders.length,
      channelBreakdown,
    },
  };
};

/**
 * Get single order detail by ID
 */
const getOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, owner: userId }).populate(
    'productId',
    'title images category finalPrice stockCount rawMaterialCost'
  );

  if (!order) {
    const error = new Error('Order not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Create a new incoming order (e.g. from buyer storefront checkout or simulated channel sync)
 */
const createOrder = async (data = {}) => {
  const {
    owner,
    productId,
    buyerInfo = {},
    channel = 'storefront',
    quantity = 1,
    amount,
  } = data;

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const orderAmount = amount || (product.finalPrice || product.suggestedPrice?.amount || 1000) * quantity;
  const artisanOwner = owner || product.owner;

  const order = new Order({
    owner: artisanOwner,
    productId: product._id,
    buyerInfo: {
      name: buyerInfo.name || 'Artisan Buyer',
      phone: buyerInfo.phone || '+919876543210',
      address: buyerInfo.address || 'Handicraft Delivery Address, India',
    },
    channel: ['storefront', 'gem', 'karigar', 'samarth', 'direct'].includes(channel) ? channel : 'storefront',
    quantity: Number(quantity) || 1,
    amount: orderAmount,
    status: 'new',
  });

  await order.save();

  // Create notification for the artisan
  try {
    await notificationService.createNotification(
      artisanOwner,
      'order',
      'New Order Received! 🛍️',
      `You received a new order for "${product.title?.hi || product.title?.en || 'Craft'}" (₹${orderAmount}) via ${channel.toUpperCase()}.`
    );
  } catch (notifErr) {
    console.error('Failed to create order notification:', notifErr.message);
  }

  return order;
};

/**
 * Update order status ('new' -> 'processing' -> 'shipped' -> 'completed' / 'cancelled')
 */
const updateOrderStatus = async (userId, orderId, newStatus) => {
  const validStatuses = ['new', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid status. Allowed values: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findOne({ _id: orderId, owner: userId }).populate('productId');
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.status = newStatus;
  await order.save();

  // Notify artisan
  try {
    await notificationService.createNotification(
      userId,
      'order',
      'Order Status Updated',
      `Order #${order._id.toString().slice(-6).toUpperCase()} status changed to ${newStatus.toUpperCase()}.`
    );
  } catch (notifErr) {
    console.error('Failed to create notification:', notifErr.message);
  }

  return order;
};

module.exports = {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
};
