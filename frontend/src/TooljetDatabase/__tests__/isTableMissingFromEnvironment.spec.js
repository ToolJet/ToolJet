import { isTableMissingFromEnvironment } from '../constants';

const DEVELOPMENT = { id: 'env-development', priority: 1 };
const STAGING = { id: 'env-staging', priority: 2 };
const table = (hasRelationInStaging) => ({
  id: 'table-1',
  environments: [
    { environment_id: DEVELOPMENT.id, has_relation: true },
    { environment_id: STAGING.id, has_relation: hasRelationInStaging },
  ],
});

describe('isTableMissingFromEnvironment', () => {
  it('is true only when the list says the viewed environment lacks the table', () => {
    expect(isTableMissingFromEnvironment([table(false)], 'table-1', STAGING)).toBe(true);
    expect(isTableMissingFromEnvironment([table(true)], 'table-1', STAGING)).toBe(false);
  });

  it('never reports a table missing from development, or before the list or environment has loaded', () => {
    expect(isTableMissingFromEnvironment([table(false)], 'table-1', DEVELOPMENT)).toBe(false);
    expect(isTableMissingFromEnvironment([], 'table-1', STAGING)).toBe(false);
    expect(isTableMissingFromEnvironment([table(false)], 'table-1', null)).toBe(false);
  });
});
