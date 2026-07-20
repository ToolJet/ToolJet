export function buildApp(overrides = {}) {
  return {
    id: 'test-app-id',
    name: 'Test app',
    slug: 'test-app',
    organization_id: 'test-org-id',
    is_public: false,
    is_maintenance_on: false,
    current_version_id: 'test-version-id',
    editing_version: { id: 'test-version-id', name: 'v1' },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
