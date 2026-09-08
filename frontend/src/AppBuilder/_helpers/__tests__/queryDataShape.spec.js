/**
 * @jest-environment node
 */
import { buildDataShapeDigest, getQueryDataShape, renderMaskedSample, DATA_SHAPE_VERSION } from '../queryDataShape';

const mockState = { resolvedStore: { modules: { canvas: { exposedValues: { queries: {} } } } } };

jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: { getState: () => mockState },
}));

const setInspectorQuery = (queryId, value) => {
  mockState.resolvedStore.modules.canvas.exposedValues.queries[queryId] = value;
};

describe('buildDataShapeDigest', () => {
  const sqlRows = [
    {
      id: 1,
      name: 'Ada',
      email: 'ada@example.com',
      createdAt: '2024-05-01T10:00:00Z',
      status: 1,
      deletedAt: null,
      tags: ['a', 'b'],
    },
    { id: 2, name: 'Bob', email: 'bob@example.com', createdAt: '2024-05-02T10:00:00Z', status: 2, deletedAt: null },
  ];

  it('describes an array of rows as keys and types', () => {
    const digest = buildDataShapeDigest(sqlRows);

    expect(digest.version).toBe(DATA_SHAPE_VERSION);
    expect(digest.root.type).toBe('array');
    expect(digest.root).toHaveLength(2);
    expect(Object.keys(digest.root.items.keys)).toEqual(
      expect.arrayContaining(['id', 'name', 'email', 'createdAt', 'status', 'deletedAt', 'tags'])
    );
    expect(digest.root.items.keys.id.type).toBe('number');
    expect(digest.root.items.keys.tags.type).toBe('array');
  });

  it('classifies value formats without emitting any value', () => {
    const digest = buildDataShapeDigest(sqlRows);

    expect(digest.root.items.keys.email.format).toBe('email');
    expect(digest.root.items.keys.createdAt.format).toBe('iso_date');

    // The compliance rule this whole module exists for: structure only, never data.
    const serialized = JSON.stringify(digest);
    ['Ada', 'Bob', 'ada@example.com', '2024-05-01T10:00:00Z'].forEach((value) => {
      expect(serialized).not.toContain(value);
    });
  });

  it('marks a key nullable when it is null in one row and populated in another', () => {
    const digest = buildDataShapeDigest([{ deletedAt: null }, { deletedAt: '2024-06-01' }]);

    expect(digest.root.items.keys.deletedAt.type).toBe('string');
    expect(digest.root.items.keys.deletedAt.nullable).toBe(true);
  });

  it('marks a key nullable when it is missing from a later row', () => {
    const digest = buildDataShapeDigest([{ id: 1, note: 'x' }, { id: 2 }]);

    expect(digest.root.items.keys.note.nullable).toBe(true);
  });

  it('describes a nested REST envelope rather than assuming an array', () => {
    const digest = buildDataShapeDigest({
      results: [{ user: { id: 'b3f1a2b4-1111-2222-3333-444455556666', address: { city: 'Berlin' } }, ts: 1714550400 }],
      total: 1,
    });

    expect(digest.root.type).toBe('object');
    const row = digest.root.keys.results.items;
    expect(row.keys.user.keys.id.format).toBe('uuid');
    expect(row.keys.user.keys.address.keys.city.type).toBe('string');
    expect(row.keys.ts.format).toBe('unix_seconds');
    expect(JSON.stringify(digest)).not.toContain('Berlin');
  });

  it('returns null for results that describe nothing', () => {
    expect(buildDataShapeDigest([])).toBeNull();
    expect(buildDataShapeDigest({})).toBeNull();
    expect(buildDataShapeDigest(null)).toBeNull();
    expect(buildDataShapeDigest(undefined)).toBeNull();
  });
});

describe('renderMaskedSample', () => {
  it('renders the row shape with every value masked', () => {
    const digest = buildDataShapeDigest([
      { order_id: 'CA-2016-152156', created_at: '2016-11-08T00:00:00.000Z', sales: '261.96', quantity: 2 },
    ]);

    const sample = renderMaskedSample(digest);

    expect(sample).toContain('order_id: "****"');
    // Dates keep their format — that is what a transformation has to act on.
    expect(sample).toContain('created_at: "YYYY-MM-DDTHH:mm:ssZ"');
    expect(sample).toContain('quantity: **');
    ['CA-2016-152156', '2016-11-08', '261.96'].forEach((value) => expect(sample).not.toContain(value));
  });

  it('renders nested structures without leaking values', () => {
    const digest = buildDataShapeDigest({ results: [{ user: { city: 'Berlin' } }], total: 1 });
    const sample = renderMaskedSample(digest);

    expect(sample).toContain('results: [');
    expect(sample).toContain('city: "****"');
    expect(sample).not.toContain('Berlin');
  });

  it('returns null when there is no digest', () => {
    expect(renderMaskedSample(null)).toBeNull();
    expect(renderMaskedSample({})).toBeNull();
  });
});

describe('getQueryDataShape', () => {
  it('digests the query rawData held by the inspector', () => {
    setInspectorQuery('q1', { rawData: [{ id: 1 }], data: [{ renamed: 1 }] });

    // rawData, not data: a transformation receives the untransformed payload.
    expect(Object.keys(getQueryDataShape('q1').root.items.keys)).toEqual(['id']);
  });

  it('returns null when the query has never produced data', () => {
    setInspectorQuery('q2', { rawData: [], data: [] });

    expect(getQueryDataShape('q2')).toBeNull();
    expect(getQueryDataShape('never-run')).toBeNull();
    expect(getQueryDataShape(undefined)).toBeNull();
  });
});
