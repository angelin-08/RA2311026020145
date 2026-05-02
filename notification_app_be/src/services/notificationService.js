const { Log } = require('../../logging_middleware/logger');
const { fetchExternalNotifications } = require('./externalNotificationService');

const notifications = [
  {
    id: 'notif-001',
    type: 'placement',
    title: 'Placement drive open',
    message: 'New placement drive announced for final year students.',
    priority: 10,
    recipientId: 'student-001',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

async function getAll() {
  await Log('notification_app_be/src/services/notificationService.js', 'debug', 'notification_app_be', 'Loading current notifications');
  const external = await fetchExternalNotifications();
  return [...notifications, ...external];
}

async function create(notificationPayload) {
  const newNotification = {
    id: `notif-${Date.now()}`,
    type: notificationPayload.type || 'event',
    title: notificationPayload.title || 'Untitled notification',
    message: notificationPayload.message || '',
    priority: Number(notificationPayload.priority || 1),
    recipientId: notificationPayload.recipientId || 'unknown',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  notifications.push(newNotification);
  await Log('notification_app_be/src/services/notificationService.js', 'info', 'notification_app_be', 'Notification saved to in-memory store', {
    id: newNotification.id,
    recipientId: newNotification.recipientId,
  });

  return newNotification;
}

async function markAsRead(id) {
  const existing = notifications.find((item) => item.id === id);
  if (!existing) {
    return false;
  }

  existing.isRead = true;
  await Log('notification_app_be/src/services/notificationService.js', 'info', 'Notification read status updated', {
    id,
  });
  return true;
}

module.exports = {
  getAll,
  create,
  markAsRead,
};
