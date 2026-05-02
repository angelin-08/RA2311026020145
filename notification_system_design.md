# Notification System Design

## STAGE 1: REST API design

### Endpoints

#### GET /notifications
- Description: Retrieve all active notifications for a user.
- Headers:
  - `Authorization: Bearer <token>`
  - `Accept: application/json`
- Response:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "notif-123",
        "type": "placement",
        "title": "Campus placement update",
        "message": "New placement drive scheduled.",
        "priority": 10,
        "isRead": false,
        "createdAt": "2026-05-02T10:00:00Z"
      }
    ]
  }
  ```

#### POST /notifications
- Description: Create/send a new notification.
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Request body:
  ```json
  {
    "type": "result",
    "title": "Exam results published",
    "message": "Your score is available in the student portal.",
    "priority": 8,
    "recipientId": "student-321"
  }
  ```
- Response:
  ```json
  {
    "status": "success",
    "data": {
      "id": "notif-456",
      "type": "result",
      "title": "Exam results published",
      "message": "Your score is available in the student portal.",
      "priority": 8,
      "recipientId": "student-321",
      "isRead": false,
      "createdAt": "2026-05-02T11:10:00Z"
    }
  }
  ```

#### PATCH /notifications/:id/read
- Description: Mark a notification as read.
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Response:
  ```json
  {
    "status": "success",
    "data": {
      "id": "notif-123",
      "isRead": true
    }
  }
  ```

### Real-time system design

#### WebSocket approach
- Use a dedicated WebSocket channel for connected clients.
- Push notifications on creation.
- Advantages: low latency, event-driven updates, reduced polling.
- Use case: student dashboard with live placement/event updates.

#### Polling approach
- Client polls `GET /notifications` every 10-15 seconds.
- Advantages: simple implementation, works with restrictive firewalls.
- Disadvantages: higher API load, stale data between polls.

#### Recommended hybrid design
- Use WebSocket for active sessions.
- Fall back to polling when WebSocket is unavailable.

## STAGE 2: Database selection and schema

### Database choice
- Selected: **NoSQL document database** (MongoDB or DynamoDB).
- Justification:
  - Notification records are semi-structured and may evolve.
  - Write-heavy workload with many inserts and reads.
  - Horizontal scalability and distributed sharding support.
  - Fast retrieval for user-specific notification feeds.

### Schema design
- Collection: `notifications`
- Example document:
  ```json
  {
    "_id": "notif-789",
    "recipientId": "student-321",
    "type": "placement",
    "title": "Interview scheduled",
    "message": "Interview on May 10.",
    "priority": 9,
    "metadata": {
      "source": "placement",
      "campaignId": "campus-spring"
    },
    "isRead": false,
    "createdAt": "2026-05-02T12:00:00Z",
    "expiresAt": "2026-06-01T00:00:00Z"
  }
  ```

### Scaling problems
- Problem: large notification volumes for active users.
- Problem: frequent fan-out when sending notifications to many recipients.
- Problem: read queries scanning unindexed fields.

### Solutions
- Indexing: create compound indexes on `recipientId`, `isRead`, `createdAt`.
- Sharding: shard by `recipientId` to distribute per-user traffic.
- Caching: use Redis for recent notifications and unread counts.
- Write optimization: use batched insert operations for bulk notifications.

### Sample queries
- Get latest notifications for a user:
  ```js
  db.notifications.find({ recipientId: "student-321" })
    .sort({ createdAt: -1 })
    .limit(20);
  ```
- Get unread placement notifications:
  ```js
  db.notifications.find({ recipientId: "student-321", type: "placement", isRead: false })
    .sort({ createdAt: -1 });
  ```
- Mark notification as read:
  ```js
  db.notifications.updateOne(
    { _id: "notif-123", recipientId: "student-321" },
    { $set: { isRead: true } }
  );
  ```

## STAGE 3: Slow query analysis

### Why a query can be slow
- Missing indexes causing full collection scans.
- Query filtering on non-indexed fields.
- Sorting on a field without an index.
- Large documents returned unnecessarily.

### Fix with indexing strategy
- Add indexes on frequently filtered fields.
- Use compound indexes for common patterns.
- Avoid indexing every column, which wastes storage and slows writes.

### Why indexing all columns is not good
- Extra write amplification on inserts/updates.
- Increased storage footprint.
- Diminishing returns for rarely used filters.
- Index maintenance overhead hurts write-heavy workloads.

### Optimized query
- Requirement: students who got placement notifications in last 7 days.
- With index: `{ type: 1, createdAt: -1, recipientId: 1 }`

```js
const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const placementNotifications = await db.notifications
  .find({
    type: "placement",
    createdAt: { $gte: oneWeekAgo }
  })
  .sort({ createdAt: -1 })
  .project({ recipientId: 1, title: 1, createdAt: 1 });
```

## STAGE 4: DB overload due to frequent fetch

### Caching (Redis)
- Cache recent notification results per user.
- Use TTL to keep caches fresh.
- Tradeoff: risk of staleness, more infrastructure.

### Pagination
- Return notifications in pages of 20 or 50.
- Use `limit` + `skip` or cursor-based pagination.
- Tradeoff: additional complexity for cursor state.

### Lazy loading
- Load first page immediately, defer older pages until requested.
- Tradeoff: more client-side logic and incremental fetches.

### Batching
- Group multiple notification fetches into one request when clients need multiple feeds.
- Tradeoff: larger payloads and more complex aggregation logic.

## STAGE 5: notify_all() redesign

### Issues in naive pseudocode
- Performance: sending sequentially blocks the system.
- Reliability: one email failure may halt the entire batch.
- Lack of visibility: no retry, no durable persistence.

### Failure scenario
- If email service fails while processing the middle of a notification list, remaining users never receive messages.
- Without retries, transient SMTP or network failures cause lost notifications.

### Improved design
- Use a queue system such as RabbitMQ or Kafka.
- Enqueue each notification event.
- Use async consumers to deliver notifications.
- Add retry logic with exponential backoff.
- Persist failed notification attempts to a dead-letter queue.

### Improved pseudocode

```text
function publishNotification(event):
  queue.publish("notifications", event)

consumer processNotification:
  while message = queue.consume("notifications"):
    try:
      sendEmail(message)
      sendPush(message)
      queue.ack(message)
    catch transientError:
      if message.retryCount < 3:
        message.retryCount += 1
        queue.requeue(message, delay=exponentialBackoff(message.retryCount))
      else:
        queue.moveToDeadLetter(message)
    catch permanentError:
      queue.moveToDeadLetter(message)
```

## STAGE 6: Top N notification logic

### Requirements
- Rank by priority: `placement > result > event`
- Then order by recency
- Efficient handling for continuous incoming notifications

### Working strategy
- Use a stable sorting function with priority and timestamp.
- Maintain top N by sorting only when necessary.
- For continuous streams, use a min-heap of size N.

### Example algorithm
- Map types to numerical priority.
- For each notification, compute sorting key.
- Keep top N notifications in a heap.

### Sample implementation concept
- `getTopNotifications(notifications, N)` returns notifications sorted by priority and recency.

```js
const priorityMap = { placement: 3, result: 2, event: 1 };
const sorted = notifications
  .slice()
  .sort((a, b) => {
    const priorityDiff = priorityMap[b.type] - priorityMap[a.type];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  })
  .slice(0, N);
```

### Efficiency note
- For large streams, a fixed-size min-heap is preferred.
- It avoids sorting the entire feed when only top N are needed.

---

This document is designed for submission-ready architecture and implementation guidance.
