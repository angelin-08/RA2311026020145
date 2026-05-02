const { Log } = require('../../logging_middleware/logger');
const notificationService = require('../services/notificationService');

async function getNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getAll();
    await Log('notification_app_be/src/controllers/notificationController.js', 'info', 'notification_app_be', 'Fetched notifications', {
      count: notifications.length,
    });

    res.json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

async function createNotification(req, res, next) {
  try {
    const { type, title, message, priority, recipientId } = req.body;
    const newNotification = await notificationService.create({ type, title, message, priority, recipientId });

    await Log('notification_app_be/src/controllers/notificationController.js', 'info', 'notification_app_be', 'Created new notification', {
      id: newNotification.id,
      type: newNotification.type,
      recipientId: newNotification.recipientId,
    });

    res.status(201).json({
      status: 'success',
      data: newNotification,
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await notificationService.markAsRead(id);

    if (!updated) {
      const notFound = new Error('Notification not found');
      notFound.status = 404;
      throw notFound;
    }

    await Log('notification_app_be/src/controllers/notificationController.js', 'info', 'notification_app_be', 'Notification marked as read', {
      id,
    });

    res.json({
      status: 'success',
      data: { id, isRead: true },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
};
