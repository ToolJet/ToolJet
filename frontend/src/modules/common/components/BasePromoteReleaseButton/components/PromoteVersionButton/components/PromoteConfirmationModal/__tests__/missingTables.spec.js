import { missingTablesFrom, promoteErrorMessage, promoteTablesOneUp, tablesToPromoteFor } from '../missingTables';

describe('promote blocked on tables the target environment does not have', () => {
  const blocked = {
    error: {
      error: 'Promote blocked - 2 tables not available in staging: vendors, activity. Promote the tables first.',
      code: 'TABLES_NOT_IN_TARGET_ENVIRONMENT',
      tables: [
        { id: 't-1', name: 'vendors' },
        { id: 't-2', name: 'activity' },
      ],
    },
  };

  it('reads the missing tables from the promote error', () => {
    expect(missingTablesFrom(blocked)).toEqual(blocked.error.tables);
  });

  it('is null for any other promote error', () => {
    expect(missingTablesFrom({ error: 'Something else' })).toBeNull();
    expect(missingTablesFrom({ error: { error: 'x', code: 'OTHER' } })).toBeNull();
    expect(missingTablesFrom(undefined)).toBeNull();
  });

  it('promotes each table from the source environment, in order', async () => {
    const promoteTable = jest.fn().mockResolvedValue({ data: {} });
    expect(await promoteTablesOneUp(promoteTable, 'org-1', blocked.error.tables, 'env-dev')).toBeNull();
    expect(promoteTable.mock.calls).toEqual([
      ['org-1', 't-1', 'env-dev'],
      ['org-1', 't-2', 'env-dev'],
    ]);
  });

  it('stops at the first table that fails and names it', async () => {
    const promoteTable = jest
      .fn()
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ error: { message: 'no access to staging' } });
    expect(await promoteTablesOneUp(promoteTable, 'org-1', blocked.error.tables, 'env-dev')).toEqual({
      name: 'activity',
      reason: 'no access to staging',
    });
  });
});

describe('tablesToPromoteFor', () => {
  // The server lists tables parents first and says which listed tables each one references.
  const observations = { id: 't-obs', name: 'observations', depends_on: [] };
  const actions = { id: 't-act', name: 'actions', depends_on: ['t-obs'] };
  const reports = { id: 't-rep', name: 'reports', depends_on: ['t-act'] };
  const sites = { id: 't-sit', name: 'sites', depends_on: [] };
  const listed = [observations, sites, actions, reports];

  it('is just the table when it references none of the listed tables', () => {
    expect(tablesToPromoteFor(sites, listed)).toEqual([sites]);
  });

  it('puts the tables it references first', () => {
    expect(tablesToPromoteFor(actions, listed)).toEqual([observations, actions]);
  });

  it('follows references through other tables, in list order, and leaves unrelated tables out', () => {
    expect(tablesToPromoteFor(reports, listed)).toEqual([observations, actions, reports]);
  });

  it('ignores a reference to a table that is not listed', () => {
    const orphan = { id: 'x', name: 'x', depends_on: ['gone'] };
    expect(tablesToPromoteFor(orphan, [...listed, orphan])).toEqual([orphan]);
  });
});

describe('promoteErrorMessage', () => {
  it('reads a string error, an { error, details } error, and falls back when there is neither', () => {
    expect(promoteErrorMessage({ error: 'Nope' }, 'fallback')).toEqual({ message: 'Nope', details: 'Nope' });
    expect(promoteErrorMessage({ error: { error: 'Blocked', details: 'vendors' } }, 'fallback')).toEqual({
      message: 'Blocked',
      details: 'vendors',
    });
    expect(promoteErrorMessage({}, 'fallback')).toEqual({ message: 'fallback', details: 'fallback' });
  });
});
