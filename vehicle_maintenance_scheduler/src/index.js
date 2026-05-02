const { scheduleMaintenance } = require('./scheduler');

const sampleTasks = [
  { time: 2, importanceScore: 9, description: 'Replace brake pads' },
  { time: 1, importanceScore: 4, description: 'Check tire pressure' },
  { time: 4, importanceScore: 15, description: 'Service engine oil' },
  { time: 3, importanceScore: 7, description: 'Inspect suspension' },
  { time: 5, importanceScore: 17, description: 'Full transmission check' },
  { time: 2, importanceScore: 8, description: 'Replace air filter' },
];

const MAX_HOURS = 8;

async function runScheduler() {
  const result = await scheduleMaintenance(sampleTasks, MAX_HOURS);

  process.stdout.write('Vehicle Maintenance Scheduler Example\n');
  process.stdout.write(`Input tasks: ${JSON.stringify(sampleTasks, null, 2)}\n`);
  process.stdout.write(`Max available hours: ${MAX_HOURS}\n`);
  process.stdout.write('Selected tasks:\n');
  result.selectedTasks.forEach((task) => {
    process.stdout.write(`- ${task.description} (${task.time}h, importance ${task.importanceScore})\n`);
  });
  process.stdout.write(`Total hours: ${result.totalHours}\n`);
  process.stdout.write(`Total importance score: ${result.totalImportance}\n`);
}

runScheduler();
