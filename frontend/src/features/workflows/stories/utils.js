/**
 * Generates an array of mock workflow objects for Storybook.
 * @param {number} count - The number of mock workflows to generate.
 * @returns {Array<Object>} An array of mock workflow objects.
 */
export function generateMockWorkflows(count = 10) {
  const statuses = ['active', 'inactive', 'draft'];
  const triggers = ['manual', 'schedule', 'webhook', 'event'];
  const prefixes = ['Daily', 'Weekly', 'Hourly', 'Monthly', 'Real-time', 'Automated', 'Scheduled', 'On-demand'];
  const suffixes = [
    'Data Sync',
    'Report Generator',
    'Email Notification',
    'Inventory Update',
    'Order Processing',
    'Backup Task',
    'Alert System',
    'Analytics Pipeline',
  ];
  const users = ['Admin', 'John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson'];

  return Array.from({ length: count }, (_, i) => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[i % suffixes.length];
    const user = users[Math.floor(Math.random() * users.length)];
    const status = statuses[i % statuses.length];
    const trigger = triggers[i % triggers.length];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const hoursAgo = Math.floor(Math.random() * 24) + 1;

    return {
      id: `wf-${i + 1}`,
      name: `${prefix} ${suffix}`,
      status: status,
      trigger: trigger,
      last_run: status === 'draft' ? null : new Date(Date.now() - 1000 * 60 * 60 * hoursAgo).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
      user: {
        firstName: user.split(' ')[0],
        lastName: user.split(' ')[1] || '',
        email: `${user.toLowerCase().replace(' ', '.')}@example.com`,
      },
      description: `${prefix} workflow for ${suffix.toLowerCase()}`,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * (daysAgo + 10)).toISOString(),
      is_enabled: status === 'active',
    };
  });
}

/**
 * Generates an array of mock folder objects for Storybook.
 * @param {number} count - The number of mock folders to generate.
 * @returns {Array<Object>} An array of mock folder objects.
 */
export function generateMockFolders(count = 5) {
  const folderNames = ['Production', 'Automation', 'Integration', 'Reporting', 'Maintenance', 'Testing', 'Development'];

  return Array.from({ length: count }, (_, i) => ({
    id: `folder-${i + 1}`,
    name: folderNames[i % folderNames.length],
    count: Math.floor(Math.random() * 15) + 1,
  }));
}
