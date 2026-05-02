const { Log } = require('../../logging_middleware/logger');

/**
 * Selects maintenance tasks to maximize importance within total available hours.
 * Uses a one-dimensional 0/1 knapsack DP approach with backtracking.
 * @param {Array<{time:number, importanceScore:number, description?:string}>} tasks
 * @param {number} maxHours
 * @returns {{selectedTasks:Array, totalHours:number, totalImportance:number}}
 */
async function scheduleMaintenance(tasks, maxHours) {
  const capacity = Math.max(0, Math.floor(maxHours));
  await Log('vehicle_maintenance_scheduler/src/scheduler.js', 'debug', 'vehicle_maintenance_scheduler', 'Starting schedule maintenance', {
    taskCount: tasks.length,
    capacity,
  });

  const dp = Array.from({ length: capacity + 1 }, () => ({ importance: 0, lastTask: -1, prevCap: -1 }));

  tasks.forEach((task, index) => {
    const time = Math.max(0, Math.floor(task.time));
    const importance = Number(task.importanceScore || 0);

    if (time === 0 || time > capacity) {
      return;
    }

    for (let available = capacity; available >= time; available -= 1) {
      const candidateImportance = dp[available - time].importance + importance;
      if (candidateImportance > dp[available].importance) {
        dp[available] = {
          importance: candidateImportance,
          lastTask: index,
          prevCap: available - time,
        };
      }
    }
  });

  let bestCapacity = 0;
  for (let i = 1; i <= capacity; i += 1) {
    if (dp[i].importance > dp[bestCapacity].importance) {
      bestCapacity = i;
    }
  }

  const selectedTasks = [];
  let pointer = bestCapacity;
  const picked = new Set();

  while (pointer > 0 && dp[pointer].lastTask >= 0) {
    const taskIndex = dp[pointer].lastTask;
    if (picked.has(taskIndex)) {
      break;
    }
    picked.add(taskIndex);
    selectedTasks.push(tasks[taskIndex]);
    pointer = dp[pointer].prevCap;
  }

  selectedTasks.reverse();
  const totalHours = selectedTasks.reduce((sum, task) => sum + task.time, 0);
  const totalImportance = selectedTasks.reduce((sum, task) => sum + task.importanceScore, 0);

  await Log('vehicle_maintenance_scheduler/src/scheduler.js', 'info', 'vehicle_maintenance_scheduler', 'Completed schedule maintenance selection', {
    selectedCount: selectedTasks.length,
    totalHours,
    totalImportance,
  });

  return {
    selectedTasks,
    totalHours,
    totalImportance,
  };
}

module.exports = {
  scheduleMaintenance,
};
