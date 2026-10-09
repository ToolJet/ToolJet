/** @jest-environment node */
import { buildSearchRecords } from '../buildSearchRecords';

const TABLE_ID = '11111111-1111-4111-8111-111111111111';
const CHILD_ID = '22222222-2222-4222-8222-222222222222';
const QUERY_ID = '33333333-3333-4333-8333-333333333333';
const PAGE_ID = 'page-home';

const pages = [
  {
    id: PAGE_ID,
    name: 'Home',
    handle: 'home',
    components: {
      [TABLE_ID]: {
        component: {
          name: 'usersTable',
          component: 'Table',
          definition: {
            properties: { data: { value: `{{queries.${QUERY_ID}.data}}` } },
            styles: { textColor: { value: '#111111', fxActive: true } },
          },
          layouts: { desktop: { top: 10, left: 4 } },
        },
      },
      [CHILD_ID]: {
        component: {
          name: 'nestedText',
          component: 'Text',
          parent: TABLE_ID,
          definition: { properties: { text: { value: '{{secrets.API_KEY}}' } } },
        },
      },
    },
  },
];
const queries = [{ id: QUERY_ID, name: 'getUsers', kind: 'postgresql', options: { query: 'select * from users' } }];
const events = [
  {
    id: 'ev1',
    sourceId: TABLE_ID,
    target: 'component',
    event: { eventId: 'onRowClicked', actionId: 'run-query', queryId: QUERY_ID },
  },
  { id: 'ev2', sourceId: 'deleted-entity', target: 'component', event: { eventId: 'onClick' } },
];
const widgetDefs = { Table: { displayName: 'Table', properties: { data: { displayName: 'Data' } } } };
// Mirrors the store's replaceIdsWithName for the one id used in these fixtures.
const translate = (text) => text.replaceAll(`queries.${QUERY_ID}`, 'queries.getUsers');

const build = (overrides = {}) =>
  buildSearchRecords({ pages, queries, events, globalSettings: {}, translate, widgetDefs, ...overrides });
const find = (records, predicate) => records.find(predicate);

describe('buildSearchRecords', () => {
  test('indexes component properties with ids translated to names and the widget display label', () => {
    const record = find(build(), (r) => r.entityId === TABLE_ID && r.fieldPath.join('.') === 'properties.data');
    expect(record).toMatchObject({
      entityType: 'component',
      entityName: 'usersTable',
      pageId: PAGE_ID,
      fieldLabel: 'Properties › Data',
      text: '{{queries.getUsers.data}}',
    });
  });

  test('indexes nested child components on the page', () => {
    expect(find(build(), (r) => r.entityId === CHILD_ID && r.fieldPath[0] === 'name')).toBeTruthy();
  });

  test('keeps secret references literal', () => {
    const record = find(build(), (r) => r.entityId === CHILD_ID && r.fieldPath.join('.') === 'properties.text');
    expect(record.text).toBe('{{secrets.API_KEY}}');
  });

  test('skips layout coordinates and fx flags', () => {
    const records = build();
    expect(records.some((r) => r.fieldPath.includes('layouts'))).toBe(false);
    expect(records.some((r) => r.fieldPath.includes('fxActive'))).toBe(false);
  });

  test('indexes query name and every option', () => {
    const records = build();
    expect(find(records, (r) => r.entityId === QUERY_ID && r.fieldPath[0] === 'name').text).toBe('getUsers');
    expect(find(records, (r) => r.fieldPath.join('.') === 'options.query').text).toBe('select * from users');
  });

  test('nests events under their owner and shows bare ids as names', () => {
    const records = build().filter((r) => r.entityType === 'event');
    expect(records.every((r) => r.ownerId === TABLE_ID && r.ownerType === 'component')).toBe(true);
    expect(find(records, (r) => r.fieldPath.join('.') === 'event.queryId').text).toBe('getUsers');
  });

  test('drops events whose owner no longer exists', () => {
    expect(build().some((r) => r.eventId === 'ev2')).toBe(false);
  });

  test('short labels name the field the way the Inspector does', () => {
    const records = build();
    const label = (predicate) => find(records, predicate).shortLabel;
    expect(label((r) => r.fieldPath.join('.') === 'properties.data')).toBe('Data');
    expect(label((r) => r.fieldPath.join('.') === 'styles.textColor')).toBe('Style · Text color');
    expect(label((r) => r.fieldPath.join('.') === 'options.query')).toBe('Query');
    expect(label((r) => r.fieldPath.join('.') === 'event.queryId')).toBe('On row clicked · Query id');
  });

  test('indexes page name/handle and app-level code', () => {
    const records = build({
      globalSettings: {
        preloadedScript: { javascript: 'window.x = 1' },
        libraries: { javascript: [{ url: 'https://cdn/lodash.js' }] },
      },
    });
    expect(find(records, (r) => r.entityType === 'page' && r.fieldPath[0] === 'handle').text).toBe('home');
    expect(find(records, (r) => r.fieldLabel === 'Preloaded JavaScript').text).toBe('window.x = 1');
    expect(find(records, (r) => r.fieldLabel === 'JavaScript libraries').text).toBe('https://cdn/lodash.js');
  });
});
