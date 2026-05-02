const express = require('express');
const router = express.Router();
const { Log } = require('../../logging_middleware/logger');

router.get('/', async (req, res) => {
  await Log('notification_app_be/src/routes/index.js', 'info', 'notification_app_be', 'Health check endpoint called');

  res.json({
    status: 'success',
    message: 'Notification service is running',
  });
});

module.exports = router;
