/**
 * Mock data for Storybook stories
 */

export const MOCK_MODULES_DATA = [
  {
    id: 'module-1',
    name: 'User Management Module',
    updated_at: new Date().toISOString(),
    user: { name: 'John Doe' },
    slug: 'user-management',
    icon: null,
    is_public: false,
    folder_id: null,
    user_id: 1,
  },
  {
    id: 'module-2',
    name: 'Dashboard Module',
    updated_at: new Date().toISOString(),
    user: { name: 'Jane Smith' },
    slug: 'dashboard',
    icon: null,
    is_public: true,
    folder_id: null,
    user_id: 2,
  },
  {
    id: 'module-3',
    name: 'Analytics Module',
    updated_at: new Date().toISOString(),
    user: { name: 'Bob Wilson' },
    slug: 'analytics',
    icon: null,
    is_public: false,
    folder_id: null,
    user_id: 3,
  },
];

export const MOCK_MODULES_META = {
  current_page: 1,
  total_pages: 1,
  total_count: MOCK_MODULES_DATA.length,
  per_page: 10,
};
