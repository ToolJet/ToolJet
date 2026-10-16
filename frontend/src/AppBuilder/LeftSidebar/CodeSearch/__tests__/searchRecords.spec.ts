/** @jest-environment node */
import { searchRecords, MAX_RESULTS, type ResultRow } from '../searchRecords';
import type { SearchRecord } from '../buildSearchRecords';

const component = (overrides: Partial<SearchRecord>) =>
  ({
    entityType: 'component',
    entityId: 'c1',
    entityName: 'usersTable',
    pageId: 'p1',
    fieldPath: ['properties', 'data'],
    fieldLabel: 'Properties › Data',
    shortLabel: 'Data',
    ...overrides,
  } as SearchRecord);
// Fixtures carry only the fields searchRecords reads.
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
] as SearchRecord[];
const ctx = { currentPageId: 'p2', pages: [{ id: 'p1' }, { id: 'p2' }] };
const previewText = (row: ResultRow) => row.preview.map((s) => s.text).join('');
const marked = (row: ResultRow) => row.preview.filter((s) => s.match).map((s) => s.text);

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

  test('entity named by the term is pinned first in its section and tagged defined', () => {
    const queries = searchRecords(records, 'getUsers', {}, ctx).groups.find((g) => g.key === 'queries');
    expect(queries?.entities[0]).toMatchObject({ entityId: 'q1', defined: true });
  });

  test('results come in fixed sections: Components, Queries, Events, then Pages & app', () => {
    const keys = searchRecords(records, 'users', {}, ctx).groups.map((g) => g.key);
    expect(keys).toEqual(['components', 'queries', 'events', 'pages']);
  });

  test('components are one flat list, current page first, each carrying its page', () => {
    const components = searchRecords(records, 'users', {}, ctx).groups.find((g) => g.key === 'components');
    expect(components?.entities.map((e) => [e.entityId, e.pageId])).toEqual([
      ['c2', 'p2'],
      ['c1', 'p1'],
    ]);
  });

  test('events get their own section, listed under the entity that owns them', () => {
    const { groups } = searchRecords(records, 'getUsers', {}, ctx);
    const events = groups.find((g) => g.key === 'events');
    expect(events?.entities).toMatchObject([{ entityId: 'c1', entityType: 'component', pageId: 'p1' }]);
    expect(events?.entities[0].rows).toHaveLength(1);
    const c1 = groups.find((g) => g.key === 'components')?.entities.find((e) => e.entityId === 'c1');
    expect(c1?.rows).toHaveLength(1);
  });

  test('several occurrences in one field make one row with every occurrence marked', () => {
    const result = searchRecords([component({ text: 'a.b a.b a.b' })], 'a.b', {}, ctx);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].matches.map((m) => m.occurrence)).toEqual([0, 1, 2]);
    expect(marked(result.rows[0])).toEqual(['a.b', 'a.b', 'a.b']);
    expect(result).toMatchObject({ total: 3, fieldCount: 1 });
  });

  test('each marked copy in the preview knows which occurrence it is, so a click opens that one', () => {
    const [row] = searchRecords([component({ text: 'a.b a.b a.b' })], 'a.b', {}, ctx).rows;
    expect(row.preview.filter((s) => s.match).map((s) => s.occurrence)).toEqual([0, 1, 2]);
  });

  test('a regex marks what it matches, per record', () => {
    const texts = [component({ text: 'alpha' }), component({ entityId: 'c2', text: 'beta' })];
    const result = searchRecords(texts, 'al+', { regex: true }, ctx);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].matches).toEqual([{ start: 0, end: 2, occurrence: 0 }]);
    expect(marked(result.rows[0])).toEqual(['al']);
  });

  test('preview starts on the token holding the first match, not mid-way through the value before it', () => {
    const text = `${'x'.repeat(80)} queries.records.data`;
    const [row] = searchRecords([component({ text })], 'records', {}, ctx).rows;
    expect(previewText(row)).toBe('queries.records.data');
    expect(marked(row)).toEqual(['records']);
  });

  test("a match in a data literal opens on its key, not the previous value's tail", () => {
    const text = "{{[{ date: '15/05/2022', email: 'olivia@example.com' }]}}";
    const [row] = searchRecords([component({ text })], 'email', {}, ctx).rows;
    expect(previewText(row)).toBe("email: 'olivia@example.com' }]}}");
  });

  test('without a separator in reach the preview keeps a short lead, marked as cut with …', () => {
    const text = `${'x'.repeat(40)}records`;
    const [row] = searchRecords([component({ text })], 'records', {}, ctx).rows;
    expect(previewText(row)).toBe(`…${'x'.repeat(10)}records`);
  });

  test('a row without a short label is a title and previews whole, whichever part matched', () => {
    const text = 'Row clicked → Show Alert';
    const [row] = searchRecords([component({ text, shortLabel: '' })], 'show alert', {}, ctx).rows;
    expect(previewText(row)).toBe(text);
    expect(marked(row)).toEqual(['Show Alert']);
  });

  test('preview collapses whitespace runs', () => {
    const [row] = searchRecords([component({ text: 'getUsers\n\n   .run()' })], 'getUsers', {}, ctx).rows;
    expect(previewText(row)).toBe('getUsers .run()');
  });

  test('counts occurrences per entity and per section', () => {
    const result = searchRecords(records, 'getUsers', {}, ctx);
    const components = result.groups.find((g) => g.key === 'components');
    expect(components?.count).toBe(2);
    expect(components?.entities[0].count).toBe(1);
  });

  test('type filter narrows rows but chip counts stay unfiltered', () => {
    const result = searchRecords(records, 'getUsers', { type: 'query' }, ctx);
    expect(result.rows.map((r) => r.record.entityType)).toEqual(['query']);
    expect(result.total).toBe(1);
    expect(result.typeCounts).toMatchObject({ all: 5, component: 2, query: 1, event: 1, app: 1 });
  });

  test('current page only drops other pages, queries and app', () => {
    const result = searchRecords(records, 'getUsers', { currentPageOnly: true }, ctx);
    expect(result.groups.map((g) => g.key)).toEqual(['components']);
    expect(result.typeCounts.all).toBe(1);
  });

  test('rows come back in display order', () => {
    const result = searchRecords(records, 'users', {}, ctx);
    expect(result.rows.map((r) => r.record.entityId)).toEqual(['c2', 'c1', 'q1', 'c1', 'app']);
  });

  test('caps field rows but reports the full totals', () => {
    const many = Array.from({ length: MAX_RESULTS + 5 }, (_, i) => component({ entityId: `c${i}`, text: 'hit' }));
    const result = searchRecords(many, 'hit', {}, ctx);
    expect(result.rows).toHaveLength(MAX_RESULTS);
    expect(result).toMatchObject({ total: MAX_RESULTS + 5, fieldCount: MAX_RESULTS + 5, truncated: true });
  });
});
