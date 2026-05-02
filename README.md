<<<<<<< HEAD
# Notification Evaluation Backend

This project contains a production-ready backend evaluation sample with:
- Reusable logging middleware sending logs to an external API
- Express notification API with request/response/error logging
- Vehicle maintenance scheduler solving the knapsack optimization problem
- System design documentation in `notification_system_design.md`

## Structure

root/
├── logging_middleware/
├── notification_app_be/
└── vehicle_maintenance_scheduler/

## Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start API server:
   ```bash
   npm start
   ```
3. Start scheduler sample:
   ```bash
   npm run start:scheduler
   ```

## Environment

- `LOGGING_API_URL` - external logging endpoint
- `EXTERNAL_API_TOKEN` - token for protected external notification fetch
- `PORT` - Express server port
=======
# RA2311026020145
>>>>>>> 4989c64f5445119b0872e63185cff92e46bf62e9
