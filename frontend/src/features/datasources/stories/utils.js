/**
 * Generates an array of mock datasource objects for Storybook.
 * @param {number} count - The number of mock datasources to generate.
 * @returns {Array<Object>} An array of mock datasource objects.
 */
export function generateMockDatasources(count = 10) {
  const types = ['postgres', 'mysql', 'mongodb', 'redis', 'restapi', 'graphql', 'elasticsearch', 'dynamodb'];
  const typeNames = {
    postgres: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    redis: 'Redis',
    restapi: 'REST API',
    graphql: 'GraphQL',
    elasticsearch: 'Elasticsearch',
    dynamodb: 'DynamoDB',
  };
  const prefixes = ['Production', 'Staging', 'Dev', 'Analytics', 'Backup', 'Main', 'Secondary', 'Primary'];
  const users = ['Admin', 'John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson'];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const daysAgo = Math.floor(Math.random() * 30) + 1;

    return {
      id: `ds-${i + 1}`,
      name: `${prefix} ${typeNames[type]}`,
      type: type,
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo).toISOString(),
      user: { name: user, email: `${user.toLowerCase().replace(' ', '.')}@example.com` },
      is_active: Math.random() > 0.2, // 80% active
      user_id: Math.floor(Math.random() * 10) + 1,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * (daysAgo + 10)).toISOString(),
      created_by: { name: user, email: `${user.toLowerCase().replace(' ', '.')}@example.com` },
    };
  });
}

/**
 * Generates an array of mock environment objects for Storybook.
 * @param {number} count - The number of mock environments to generate.
 * @returns {Array<Object>} An array of mock environment objects.
 */
export function generateMockEnvironments(count = 5) {
  const envNames = ['Production', 'Staging', 'Development', 'Testing', 'UAT', 'QA', 'Preview', 'Demo'];

  return Array.from({ length: count }, (_, i) => ({
    id: `env-${i + 1}`,
    name: envNames[i % envNames.length],
    count: Math.floor(Math.random() * 20) + 1,
  }));
}
