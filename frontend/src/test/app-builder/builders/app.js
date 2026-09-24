import { applyDeclaredOverrides } from '../shared';

export function buildApp(overrides = {}) {
  return applyDeclaredOverrides(
    'app',
    {
      id: 'app-1',
      name: 'Test app',
      type: 'front-end',
      current_version_id: 'version-1',
      is_public: false,
    },
    overrides,
    ['id', 'name', 'type', 'current_version_id', 'is_public']
  );
}
