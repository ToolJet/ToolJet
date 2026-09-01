import { applyDeclaredOverrides } from '../shared';

export function buildQuery(overrides = {}) {
  return applyDeclaredOverrides(
    'query',
    { id: 'query-1', name: 'query1', kind: 'restapi', options: {}, runOnPageLoad: false },
    overrides,
    ['id', 'name', 'kind', 'options', 'runOnPageLoad']
  );
}
