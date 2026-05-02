const axios = require('axios');
const { Log } = require('../../logging_middleware/logger');

const EXTERNAL_API_URL = process.env.EXTERNAL_NOTIFICATION_API || 'http://20.207.122.201/evaluation-service/notifications';
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || 'example-token';

/**
 * Fetch notifications from an external evaluation API.
 * Demonstrates protected route handling with Authorization headers.
 */
async function fetchExternalNotifications() {
  try {
    const response = await axios.get(EXTERNAL_API_URL, {
      headers: {
        Authorization: `Bearer ${EXTERNAL_API_TOKEN}`,
        Accept: 'application/json',
      },
      timeout: 5000,
    });

    await Log('notification_app_be/src/services/externalNotificationService.js', 'info', 'notification_app_be', 'Fetched external notifications', {
      url: EXTERNAL_API_URL,
      status: response.status,
      count: Array.isArray(response.data) ? response.data.length : 0,
    });

    if (!Array.isArray(response.data)) {
      return [];
    }

    return response.data.map((item, index) => ({
      id: item.id || `external-${index}`,
      type: item.type || 'event',
      title: item.title || item.message || 'External notification',
      message: item.message || '',
      priority: Number(item.priority || 1),
      recipientId: item.recipientId || 'external-user',
      isRead: false,
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    await Log('notification_app_be/src/services/externalNotificationService.js', 'warn', 'notification_app_be', 'External notification fetch failed', {
      error: error.message,
      url: EXTERNAL_API_URL,
    });
    return [];
  }
}

module.exports = {
  fetchExternalNotifications,
};
