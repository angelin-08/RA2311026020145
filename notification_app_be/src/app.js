const express = require('express');
const { Log } = require('../../logging_middleware/logger');
const notificationRoutes = require('./routes/notifications');
const rootRoutes = require('./routes/index');
const { errorHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/requestLogger');

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/', rootRoutes);
app.use('/notifications', notificationRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  await Log('notification_app_be/src/app.js', 'info', 'notification_app_be', `Server started on port ${PORT}`);
  process.stdout.write(`Server is listening on port ${PORT}\n`);
});

module.exports = app;
