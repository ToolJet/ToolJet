/** @jest-environment node */
import { searchRecords, MAX_RESULTS } from '../searchRecords';

const component = (overrides) => ({
  entityType: 'component',
  entityId: 'c1',
  entityName: 'usersTable',
  pageId: 'p1',
  fieldPath: ['properties', 'data'],
  fieldLabel: 'Properties › Data',
  shortLabel: 'Data',
  ...overrides,
});
const records = [
  component({ text: '{{queries.getUsers.data}}' }),
  component({ entityId: 'c2', entityName: 'title', pageId: 'p2', text: 'Users: {{queries.getUsers.data.length}}' }),
  {
    entityType: 'query',
    entityId: 'q1',
    entityName: 'getUsers',
    pageId: null,
    fieldPath: ['name'],
    fieldLabel: 'Name',
    text: 'getUsers',
  },
  {
    entityType: 'app',
    entityId: 'app',
    entityName: 'App',
    pageId: null,
    fieldPath: ['x'],
    fieldLabel: 'Preloaded JavaScript',
    text: 'getUsersCount()',
  },
  {
    entityType: 'event',
    entityId: 'c1',
    ownerType: 'component',
    ownerId: 'c1',
    entityName: 'usersTable',
    pageId: 'p1',
    fieldPath: ['event', 'queryId'],
    fieldLabel: 'Events › On row clicked › Query id',
    text: 'getUsers',
  },
];
const ctx = { currentPageId: 'p2', pages: [{ id: 'p1' }, { id: 'p2' }] };
const previewText = (row) => row.preview.map((s) => s.text).join('');
const marked = (row) => row.preview.filter((s) => s.match).map((s) => s.text);

describe('searchRecords', () => {
  test('ignores terms shorter than two characters', () => {
    expect(searchRecords(records, 'g', {}, ctx).total).toBe(0);
  });

  test('substring match is case-insensitive by default', () => {
    expect(searchRecords(records, 'GETUSERS', {}, ctx).total).toBe(5);
  });

  test('case-sensitive option', () => {
    expect(searchRecords(records, 'GETUSERS', { caseSensitive: true }, ctx).total).toBe(0);
  });

  test('whole-word option excludes getUsersCount', () => {
    const result = searchRecords(records, 'getUsers', { wholeWord: true }, ctx);
    expect(result.rows.some((r) => r.record.entityType === 'app')).toBe(false);
    expect(result.total).toBe(4);
  });

  test('regex option', () => {
    expect(searchRecords(records, 'getUsers\\.data\\.\\w+', { regex: true }, ctx).total).toBe(1);
  });

  test('invalid regex returns an error instead of throwing', () => {
    expect(searchRecords(records, '([', { regex: true }, ctx).error).toBe('Invalid regular expression');
  });

  test('zero-width regex does not loop', () => {
    expect(searchRecords(records, '^|$', { regex: true }, ctx).total).toBe(0);
  });

  test('entity named by the term is pinned first and tagged defined', () => {
    const result = searchRecords(records, 'getUsers', {}, ctx);
    expect(result.groups[0].key).toBe('queries');
    expect(result.groups[0].entities[0]).toMatchObject({ entityId: 'q1', defined: true });
  });

  test('current page ranks before other pages; app comes last', () => {
    const keys = searchRecords(records, 'users', {}, ctx).groups.map((g) => g.key);
    expect(keys).toEqual(['page:p2', 'page:p1', 'queries', 'app']);
  });

  test('events nest under their owner entity', () => {
    const p1 = searchRecords(records, 'getUsers', {}, ctx).groups.find((g) => g.key === 'page:p1');
    expect(p1.entities).toHaveLength(1);
    expect(p1.entities[0].rows).toHaveLength(2);
  });

  test('several occurrences in one field make one row with every occurrence marked', () => {
    const result = searchRecords([component({ text: 'a.b a.b a.b' })], 'a.b', {}, ctx);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].matches.map((m) => m.occurrence)).toEqual([0, 1, 2]);
    expect(marked(result.rows[0])).toEqual(['a.b', 'a.b', 'a.b']);
    expect(result).toMatchObject({ total: 3, fieldCount: 1 });
  });

  test('preview starts just before the first match so the match is in view', () => {
    const text = `${'x'.repeat(80)} queries.records.data`;
    const [row] = searchRecords([component({ text })], 'records', {}, ctx).rows;
    expect(previewText(row)).toBe('…x queries.records.data');
    expect(marked(row)).toEqual(['records']);
  });

  test('preview collapses whitespace runs', () => {
    const [row] = searchRecords([component({ text: 'a\n\n   getUsers' })], 'getUsers', {}, ctx).rows;
    expect(previewText(row)).toBe('a getUsers');
  });

  test('counts occurrences per entity and per group', () => {
    const result = searchRecords(records, 'getUsers', {}, ctx);
    const p1 = result.groups.find((g) => g.key === 'page:p1');
    expect(p1.count).toBe(2);
    expect(p1.entities[0].count).toBe(2);
  });

  test('type filter narrows rows but chip counts stay unfiltered', () => {
    const result = searchRecords(records, 'getUsers', { type: 'query' }, ctx);
    expect(result.rows.map((r) => r.record.entityType)).toEqual(['query']);
    expect(result.total).toBe(1);
    expect(result.typeCounts).toMatchObject({ all: 5, component: 2, query: 1, event: 1, app: 1 });
  });

  test('current page only drops other pages, queries and app', () => {
    const result = searchRecords(records, 'getUsers', { currentPageOnly: true }, ctx);
    expect(result.groups.map((g) => g.key)).toEqual(['page:p2']);
    expect(result.typeCounts.all).toBe(1);
  });

  test('rows come back in display order', () => {
    const result = searchRecords(records, 'users', {}, ctx);
    expect(result.rows.map((r) => r.record.entityId)).toEqual(['c2', 'c1', 'c1', 'q1', 'app']);
  });

  test('caps field rows but reports the full totals', () => {
    const many = Array.from({ length: MAX_RESULTS + 5 }, (_, i) => component({ entityId: `c${i}`, text: 'hit' }));
    const result = searchRecords(many, 'hit', {}, ctx);
    expect(result.rows).toHaveLength(MAX_RESULTS);
    expect(result).toMatchObject({ total: MAX_RESULTS + 5, fieldCount: MAX_RESULTS + 5, truncated: true });
  });
});
