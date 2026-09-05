const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/notifications
 * @desc  Fetch artisan alerts & notifications
 */
router.get('/', async (req, res, next) => {
  try {
    const { isRead, limit } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, { isRead, limit });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/notifications/:id/read
 * @desc  Mark single notification as read
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationRead(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/notifications/read-all
 * @desc  Mark all notifications as read
 */
router.post('/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
