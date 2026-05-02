const PRIORITY_RANK = {
  placement: 3,
  result: 2,
  event: 1,
};

/**
 * Returns the top N notifications sorted by priority and recency.
 * @param {Array<{type:string,createdAt:string}>} notifications
 * @param {number} limit
 * @returns {Array}
 */
function getTopNotifications(notifications, limit) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const normalizedLimit = Math.max(1, Number(limit) || 1);

  return notifications
    .slice()
    .sort((a, b) => {
      const aPriority = PRIORITY_RANK[a.type] || 0;
      const bPriority = PRIORITY_RANK[b.type] || 0;
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }

      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    })
    .slice(0, normalizedLimit);
}

module.exports = {
  getTopNotifications,
};
