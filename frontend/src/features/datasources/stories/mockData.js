/**
 * Mock data for Datasources Storybook stories
 */

export const MOCK_DATASOURCES = [
  {
    id: 'ds-1',
    name: 'Production PostgreSQL',
    type: 'postgres',
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    user: { name: 'John Doe', email: 'john@example.com' },
    is_active: true,
    user_id: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    created_by: { name: 'Admin', email: 'admin@example.com' },
  },
  {
    id: 'ds-2',
    name: 'Main MySQL Database',
    type: 'mysql',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    user: { name: 'Jane Smith', email: 'jane@example.com' },
    is_active: true,
    user_id: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    created_by: { name: 'Jane Smith', email: 'jane@example.com' },
  },
  {
    id: 'ds-3',
    name: 'MongoDB Atlas',
    type: 'mongodb',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    user: { name: 'Bob Wilson', email: 'bob@example.com' },
    is_active: true,
    user_id: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    created_by: { name: 'Bob Wilson', email: 'bob@example.com' },
  },
  {
    id: 'ds-4',
    name: 'Redis Cache',
    type: 'redis',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    user: { name: 'Alice Johnson', email: 'alice@example.com' },
    is_active: true,
    user_id: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    created_by: { name: 'Alice Johnson', email: 'alice@example.com' },
  },
  {
    id: 'ds-5',
    name: 'Stripe API',
    type: 'restapi',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    user: { name: 'Charlie Brown', email: 'charlie@example.com' },
    is_active: true,
    user_id: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    created_by: { name: 'Charlie Brown', email: 'charlie@example.com' },
  },
  {
    id: 'ds-6',
    name: 'Analytics PostgreSQL',
    type: 'postgres',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    user: { name: 'John Doe', email: 'john@example.com' },
    is_active: false,
    user_id: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    created_by: { name: 'Admin', email: 'admin@example.com' },
  },
];

export const MOCK_DATASOURCES_META = {
  current_page: 1,
  total_pages: 1,
  total_count: MOCK_DATASOURCES.length,
  per_page: 10,
};

export const MOCK_ENVIRONMENTS = [
  {
    id: 'env-1',
    name: 'Production',
    count: 15,
  },
  {
    id: 'env-2',
    name: 'Staging',
    count: 8,
  },
  {
    id: 'env-3',
    name: 'Development',
    count: 12,
  },
  {
    id: 'env-4',
    name: 'Testing',
    count: 5,
  },
];
