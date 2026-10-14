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
    name: 'event1',
    sourceId: TABLE_ID,
    target: 'component',
    event: { eventId: 'onRowClicked', actionId: 'run-query', queryId: QUERY_ID },
  },
  {
    id: 'ev3',
    name: 'event2',
    index: 1,
    sourceId: TABLE_ID,
    target: 'component',
    event: { eventId: 'onClick', actionId: 'show-alert', message: 'Saved' },
  },
  {
    id: 'ev4',
    name: 'event3',
    index: 2,
    sourceId: TABLE_ID,
    target: 'component',
    event: { eventId: 'onClick', actionId: 'show-alert', message: 'Failed' },
  },
  { id: 'ev2', sourceId: 'deleted-entity', target: 'component', event: { eventId: 'onClick' } },
];
const widgetDefs = {
  Table: {
    displayName: 'Table',
    properties: { data: { displayName: 'Data' } },
    events: { onRowClicked: { displayName: 'On row clicked' }, onClick: { displayName: 'On click' } },
  },
};
const actionDefs = [
  { id: 'run-query', name: 'Run query' },
  { id: 'show-alert', name: 'Show Alert' },
];
// Mirrors the store's replaceIdsWithName for the one id used in these fixtures.
const translate = (text) => text.replaceAll(`queries.${QUERY_ID}`, 'queries.getUsers');

const build = (overrides = {}) =>
  buildSearchRecords({ pages, queries, events, globalSettings: {}, translate, widgetDefs, actionDefs, ...overrides });
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
    expect(label((r) => r.fieldPath.join('.') === 'event.queryId')).toBe('On row clicked → Run query › Query');
  });

  test('event fields are labelled by trigger and action, and the full label names the handler', () => {
    const record = find(build(), (r) => r.eventId === 'ev1' && r.fieldPath.join('.') === 'event.queryId');
    expect(record.fieldLabel).toBe('Events › event1 › On row clicked → Run query › Query');
  });

  test('handlers sharing a trigger and action on one owner are told apart by handler name', () => {
    const labels = build()
      .filter((r) => r.fieldPath.join('.') === 'event.message')
      .map((r) => r.shortLabel);
    expect(labels).toEqual(['On click → Show Alert (event2) › Message', 'On click → Show Alert (event3) › Message']);
  });

  test('look-alike handlers whose names repeat too are told apart by position', () => {
    const twin = (id, index, message) => ({
      id,
      name: 'onClick → show-alert',
      index,
      sourceId: TABLE_ID,
      target: 'component',
      event: { eventId: 'onClick', actionId: 'show-alert', message },
    });
    const labels = build({ events: [twin('t2', 5, 'Second'), twin('t1', 2, 'First')] })
      .filter((r) => r.fieldPath.join('.') === 'event.message')
      .map((r) => [r.text, r.shortLabel]);
    expect(labels).toEqual([
      ['Second', 'On click → Show Alert #2 › Message'],
      ['First', 'On click → Show Alert #1 › Message'],
    ]);
  });

  test('indexes the handler name but not its trigger and action keys', () => {
    const records = build().filter((r) => r.eventId === 'ev1');
    expect(records.some((r) => ['event.eventId', 'event.actionId'].includes(r.fieldPath.join('.')))).toBe(false);
    expect(find(records, (r) => r.fieldPath[0] === 'name')).toMatchObject({
      text: 'event1',
      shortLabel: 'On row clicked → Run query › Event name',
    });
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

  test('indexes page conditions like hidden, but not internal page keys', () => {
    const records = build({
      pages: [
        {
          ...pages[0],
          hidden: { value: '{{globals.currentUser.role !== "admin"}}' },
          pageHeader: { height: 60 },
          appId: 'app-1',
          index: 0,
        },
      ],
    });
    const pageRecords = records.filter((r) => r.entityType === 'page');
    expect(find(pageRecords, (r) => r.fieldPath.join('.') === 'hidden')).toMatchObject({
      shortLabel: 'Hidden',
      text: '{{globals.currentUser.role !== "admin"}}',
    });
    expect(find(pageRecords, (r) => r.fieldPath.join('.') === 'pageHeader.height').shortLabel).toBe(
      'Page header · Height'
    );
    expect(pageRecords.some((r) => ['appId', 'index', 'components'].includes(r.fieldPath[0]))).toBe(false);
  });

  test('indexes app-wide page settings with their style labels', () => {
    const records = build({
      pageSettings: {
        definition: {
          properties: { disableMenu: { value: `{{queries.${QUERY_ID}.data.length === 0}}` } },
          styles: { textColor: { value: '#222222', isDefault: false } },
        },
      },
      pageSettingsDef: { styles: { textColor: { displayName: 'Default text' } } },
    });
    const settings = records.filter((r) => r.entityId === 'pageSettings');
    expect(find(settings, (r) => r.fieldPath.join('.') === 'properties.disableMenu').text).toBe(
      '{{queries.getUsers.data.length === 0}}'
    );
    expect(find(settings, (r) => r.fieldPath.join('.') === 'styles.textColor').shortLabel).toBe('Style · Default text');
    expect(settings.some((r) => r.fieldPath.includes('isDefault'))).toBe(false);
  });

  test('indexes every global setting once, except the theme palette', () => {
    const records = build({
      globalSettings: {
        canvasBackgroundColor: '{{variables.bg}}',
        preloadedScript: { javascript: 'x()' },
        theme: { definition: { brand: { colors: { primary: '#4368E3' } } } },
      },
    });
    const app = records.filter((r) => r.entityId === 'app');
    expect(find(app, (r) => r.fieldPath[0] === 'canvasBackgroundColor')).toMatchObject({
      shortLabel: 'Canvas background color',
      text: '{{variables.bg}}',
    });
    expect(app.filter((r) => r.text === 'x()')).toHaveLength(1);
    expect(app.some((r) => r.fieldPath[0] === 'theme')).toBe(false);
  });

  test("indexes values left at the widget default, like a freshly dropped Table's columns", () => {
    const columns = { value: [{ name: 'email', key: 'email' }] };
    const records = build({
      pages: [
        {
          id: PAGE_ID,
          name: 'Home',
          components: {
            [TABLE_ID]: {
              component: {
                name: 'table1',
                component: 'Table',
                definition: { properties: { columns }, styles: { textColor: { value: '#111111' } } },
              },
            },
          },
        },
      ],
      widgetDefs: {
        Table: {
          displayName: 'Table',
          definition: { properties: { columns }, styles: { textColor: { value: '#111111' } } },
        },
      },
    });
    const table = records.filter((r) => r.entityId === TABLE_ID).map((r) => [r.fieldPath.join('.'), r.text]);
    expect(table).toEqual(
      expect.arrayContaining([
        ['properties.columns.value.0.name', 'email'],
        ['properties.columns.value.0.key', 'email'],
        ['styles.textColor', '#111111'],
      ])
    );
  });

  test('list items are labelled by their own name, and reveal their item', () => {
    const records = build({
      pages: [
        {
          id: PAGE_ID,
          name: 'Home',
          components: {
            [TABLE_ID]: {
              component: {
                name: 'table1',
                component: 'Table',
                definition: {
                  properties: {
                    columns: {
                      value: [
                        { id: 'col-1', name: 'email', key: 'email' },
                        { id: 'col-2', key: 'phone' },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ],
      widgetDefs: { Table: { displayName: 'Table', properties: { columns: { displayName: 'Table Columns' } } } },
    });
    const field = (path) => find(records, (r) => r.fieldPath.join('.') === path);
    expect(field('properties.columns.value.0.name')).toMatchObject({
      shortLabel: 'Table Columns › email › Name',
      fieldLabel: 'Properties › Table Columns › email › Name',
      reveal: [{ kind: 'listItem', ownerId: TABLE_ID, itemId: 'col-1' }],
    });
    // No name: falls back to the key, then to the item's position.
    expect(field('properties.columns.value.1.key').shortLabel).toBe('Table Columns › phone › Key');
  });

  test('items named by their title (tabs, tags) are labelled by it', () => {
    const records = build({
      pages: [
        {
          id: PAGE_ID,
          name: 'Home',
          components: {
            [TABLE_ID]: {
              component: {
                name: 'tabs1',
                component: 'Tabs',
                definition: {
                  properties: { tabItems: { value: [{ id: 't0', title: 'Profile', visible: { value: '{{true}}' } }] } },
                },
              },
            },
          },
        },
      ],
      widgetDefs: {},
    });
    expect(find(records, (r) => r.fieldPath.at(-1) === 'visible').shortLabel).toBe('Tab items › Profile › Visible');
  });

  test('query lists are labelled by item: key-value rows by key, parameters by name', () => {
    const records = build({
      queries: [
        {
          id: QUERY_ID,
          name: 'getUsers',
          kind: 'restapi',
          options: {
            url_params: [['page', '{{page}}']],
            parameters: [{ name: 'limit', defaultValue: '10' }],
          },
        },
      ],
    });
    const label = (path) => find(records, (r) => r.fieldPath.join('.') === path).shortLabel;
    expect(label('options.url_params.0.0')).toBe('Url params › page › Key');
    expect(label('options.url_params.0.1')).toBe('Url params › page › Value');
    expect(label('options.parameters.0.defaultValue')).toBe('Parameters › limit › Default value');
  });

  test('a blank display name falls back to the property key', () => {
    const records = build({
      widgetDefs: { Table: { displayName: 'Table', properties: { data: { displayName: ' ' } } } },
    });
    expect(find(records, (r) => r.fieldPath.join('.') === 'properties.data').shortLabel).toBe('Data');
  });

  test('indexes page settings left at default too, but never the isDefault flag itself', () => {
    const records = build({
      pageSettings: {
        definition: {
          properties: { hideHeader: { value: false }, disableMenu: { value: '{{variables.locked}}' } },
          styles: {
            textColor: { value: '#000000', isDefault: true },
            iconColor: { value: '#ff0000', isDefault: false },
          },
        },
      },
      pageSettingsDef: { properties: { hideHeader: false, disableMenu: { value: '{{false}}' } }, styles: {} },
    });
    const keys = records.filter((r) => r.entityId === 'pageSettings').map((r) => r.fieldPath.join('.'));
    expect(keys).toEqual(['properties.hideHeader', 'properties.disableMenu', 'styles.textColor', 'styles.iconColor']);
  });
});

describe('reveal chains: the steps that open where a value is edited', () => {
  const NAV_ID = '44444444-4444-4444-8444-444444444444';
  const SELECT_ID = '55555555-5555-4555-8555-555555555555';
  const GRAPHQL_ID = '66666666-6666-4666-8666-666666666666';
  const revealPages = [
    {
      id: PAGE_ID,
      name: 'Home',
      components: {
        [TABLE_ID]: {
          component: {
            name: 'table1',
            component: 'Table',
            definition: {
              properties: { columns: { value: [{ id: 'col-1', name: 'email', key: 'email', textColor: '#ff0000' }] } },
            },
          },
        },
        [NAV_ID]: {
          component: {
            name: 'nav1',
            component: 'Navigation',
            definition: { properties: { menuItems: { value: [{ id: 'nav-item-1', label: 'Home' }] } } },
          },
        },
        [SELECT_ID]: {
          component: {
            name: 'dropdown1',
            component: 'DropdownV2',
            definition: { properties: { options: { value: [{ label: 'One', value: 'opt-1' }] } } },
          },
        },
      },
    },
  ];
  const revealQueries = [
    {
      id: QUERY_ID,
      name: 'getUsers',
      kind: 'restapi',
      options: {
        transformation: 'return data;',
        url: '/users',
        url_params: [['page', '1']],
        raw_body: '{"a": 1}',
        parameters: [{ name: 'userId', defaultValue: '42' }],
      },
    },
    { id: GRAPHQL_ID, name: 'getPosts', kind: 'graphql', options: { url_params: [['limit', '10']] } },
  ];
  const handler = (id, target, sourceId, extra = {}) => ({
    id,
    name: id,
    sourceId,
    target,
    event: { eventId: 'onClick', actionId: 'show-alert', message: `msg ${id}`, ...extra },
  });
  const revealEvents = [
    handler('ev-component', 'component', TABLE_ID),
    handler('ev-query', 'data_query', QUERY_ID),
    handler('ev-page', 'page', PAGE_ID),
    handler('ev-column', 'table_column', TABLE_ID, { ref: 'email' }),
    handler('ev-nav', 'component', NAV_ID, { ref: 'nav-item-1' }),
  ];
  const records = () =>
    buildSearchRecords({ pages: revealPages, queries: revealQueries, events: revealEvents, globalSettings: {} });
  const revealOf = (predicate) => records().find(predicate)?.reveal;
  const eventStep = (itemId, ownerId) => ({ kind: 'event', ownerId, itemId });

  test('a Table column field opens the column; a column style field also opens its Styles tab', () => {
    const column = (key) => (r) => r.fieldPath.join('.') === `properties.columns.value.0.${key}`;
    expect(revealOf(column('name'))).toEqual([{ kind: 'listItem', ownerId: TABLE_ID, itemId: 'col-1' }]);
    expect(revealOf(column('textColor'))).toEqual([
      { kind: 'listItem', ownerId: TABLE_ID, itemId: 'col-1' },
      { kind: 'popoverTab', ownerId: 'col-1', itemId: 'styles' },
    ]);
  });

  test('a list item without an id is revealed by its value', () => {
    expect(revealOf((r) => r.entityId === SELECT_ID && r.fieldPath.at(-1) === 'label')).toEqual([
      { kind: 'listItem', ownerId: SELECT_ID, itemId: 'opt-1' },
    ]);
  });

  test("a list item's own `value` field keeps its key (it is a field, not a `{ value }` wrapper)", () => {
    const optionValue = records().find((r) => r.entityId === SELECT_ID && r.text === 'opt-1');
    expect(optionValue.fieldPath).toEqual(['properties', 'options', 'value', '0', 'value']);
    expect(optionValue.shortLabel).toBe('Options › One › Value');
  });

  test('a query field opens the query tab it lives in', () => {
    expect(revealOf((r) => r.fieldPath.join('.') === 'options.transformation')).toEqual([
      { kind: 'queryTab', ownerId: QUERY_ID, itemId: 'transformation' },
    ]);
    expect(revealOf((r) => r.fieldPath.join('.') === 'options.url')).toEqual([
      { kind: 'queryTab', ownerId: QUERY_ID, itemId: 'setup' },
    ]);
  });

  test('a query parameter field opens the Setup tab, then that parameter', () => {
    const setup = { kind: 'queryTab', ownerId: QUERY_ID, itemId: 'setup' };
    const param = { kind: 'queryParam', ownerId: QUERY_ID, itemId: 'userId' };
    expect(revealOf((r) => r.fieldPath.join('.') === 'options.parameters.0.name')).toEqual([setup, param]);
    expect(revealOf((r) => r.fieldPath.join('.') === 'options.parameters.0.defaultValue')).toEqual([setup, param]);
  });

  test('a REST key-value or body field opens its request tab', () => {
    const setup = { kind: 'queryTab', ownerId: QUERY_ID, itemId: 'setup' };
    expect(revealOf((r) => r.fieldPath.join('.') === 'options.url_params.0.1')).toEqual([
      setup,
      { kind: 'restTab', ownerId: QUERY_ID, itemId: 'params' },
    ]);
    expect(revealOf((r) => r.fieldPath.join('.') === 'options.raw_body')).toEqual([
      setup,
      { kind: 'restTab', ownerId: QUERY_ID, itemId: 'body' },
    ]);
  });

  test('a GraphQL key-value field opens its tab, keyed by the option name', () => {
    expect(revealOf((r) => r.entityId === GRAPHQL_ID && r.fieldPath.join('.') === 'options.url_params.0.0')).toEqual([
      { kind: 'queryTab', ownerId: GRAPHQL_ID, itemId: 'setup' },
      { kind: 'restTab', ownerId: GRAPHQL_ID, itemId: 'url_params' },
    ]);
  });

  test('a page field opens the page details popover', () => {
    expect(revealOf((r) => r.entityType === 'page' && r.fieldPath[0] === 'name')).toEqual([
      { kind: 'page', ownerId: null, itemId: PAGE_ID },
    ]);
  });

  test('the preloaded script opens its editor', () => {
    const preloaded = buildSearchRecords({ globalSettings: { preloadedScript: { javascript: 'window.x = 1' } } }).find(
      (r) => r.fieldPath[0] === 'preloadedScript'
    );
    expect(preloaded.reveal).toEqual([{ kind: 'preloadedScript', ownerId: null, itemId: 'javascript' }]);
  });

  test('event handlers open their popover, after whatever holds their list', () => {
    const ofEvent = (id) => revealOf((r) => r.eventId === id && r.fieldPath.join('.') === 'event.message');
    expect(ofEvent('ev-component')).toEqual([eventStep('ev-component', TABLE_ID)]);
    expect(ofEvent('ev-query')).toEqual([
      { kind: 'queryTab', ownerId: QUERY_ID, itemId: 'settings' },
      eventStep('ev-query', QUERY_ID),
    ]);
    expect(ofEvent('ev-page')).toEqual([
      { kind: 'page', ownerId: null, itemId: PAGE_ID },
      eventStep('ev-page', PAGE_ID),
    ]);
    expect(ofEvent('ev-column')).toEqual([
      { kind: 'listItem', ownerId: TABLE_ID, itemId: 'col-1' },
      eventStep('ev-column', TABLE_ID),
    ]);
    expect(ofEvent('ev-nav')).toEqual([
      { kind: 'listItem', ownerId: NAV_ID, itemId: 'nav-item-1' },
      eventStep('ev-nav', NAV_ID),
    ]);
  });
});
