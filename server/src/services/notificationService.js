const Notification = require('../models/Notification');

/**
 * In-App Notification Service
 */
const createNotification = async (userId, type, title, message) => {
  const notification = new Notification({
    owner: userId,
    type: ['order', 'ai_pipeline', 'marketplace', 'system'].includes(type) ? type : 'system',
    title,
    message,
    isRead: false,
  });

  await notification.save();
  return notification;
};

const getUserNotifications = async (userId, { isRead, limit = 50 } = {}) => {
  const query = { owner: userId };
  if (isRead !== undefined) {
    query.isRead = isRead === 'true' || isRead === true;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10));

  const unreadCount = await Notification.countDocuments({ owner: userId, isRead: false });

  return {
    notifications,
    unreadCount,
  };
};

const markNotificationRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, owner: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany({ owner: userId, isRead: false }, { isRead: true });
  return { success: true, message: 'All notifications marked as read' };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
