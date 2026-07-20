export function buildUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test.user@example.com',
    first_name: 'Test',
    last_name: 'User',
    organization_id: 'test-org-id',
    ...overrides,
  };
}
