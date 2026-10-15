/** @group platform */
import { buildSnapshot, VersionRows } from '@modules/versions/diff/snapshot';
import { diffVersions } from '@modules/versions/diff/version-diff';

// Two versions of the same small app. The target is a copy of the base, so
// every id differs, exactly as VersionsCreateService leaves them.
let counter = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

type Spec = {
  pages: Array<{ handle: string; name?: string; auto?: boolean }>;
  components: Array<{
    page: string;
    name: string;
    type?: string;
    parent?: string;
    properties?: any;
    styles?: any;
    display?: any;
    desktop?: [number, number, number, number];
    mobile?: [number, number, number, number];
  }>;
  queries?: Array<{ name: string; options?: any; source?: string }>;
  events?: Array<{ source: string; target?: string; event: any }>;
  globalSettings?: any;
  homePage?: string;
};

function rows(spec: Spec, versionName = 'v1'): VersionRows {
  const pageIds = new Map(spec.pages.map((page) => [page.handle, uuid()]));
  const componentIds = new Map(spec.components.map((component) => [component.name, uuid()]));
  const queryIds = new Map((spec.queries ?? []).map((query) => [query.name, uuid()]));
  const sourceIds = new Map<string, string>();
  const idOf = (ref: string) => componentIds.get(ref) ?? queryIds.get(ref) ?? pageIds.get(ref) ?? ref;
  // Refs written as <name> inside strings become that entity's uuid, the way
  // the database stores parents, child order and event targets.
  const withIds = (value: any): any =>
    typeof value === 'string'
      ? value.replace(/<([\w-]+)>/g, (_, name) => idOf(name))
      : Array.isArray(value)
        ? value.map(withIds)
        : value && typeof value === 'object'
          ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withIds(v)]))
          : value;
  const box = (componentId: string, type: string, b: [number, number, number, number]) => ({
    componentId,
    type,
    top: b[0],
    left: b[1],
    width: b[2],
    height: b[3],
    dimensionUnit: 'count',
  });
  return {
    version: {
      id: uuid(),
      name: versionName,
      status: 'DRAFT',
      homePageId: spec.homePage ? pageIds.get(spec.homePage) : null,
      showViewerNavigation: true,
      globalSettings: spec.globalSettings ?? {},
      pageSettings: {},
    },
    pages: spec.pages.map((page, index) => ({
      id: pageIds.get(page.handle),
      name: page.name ?? page.handle,
      handle: page.handle,
      index,
      disabled: false,
      hidden: null,
      icon: null,
      isPageGroup: false,
      pageGroupId: null,
      autoComputeLayout: page.auto ?? false,
      pageHeader: null,
      pageFooter: null,
      type: 'default',
      url: null,
    })),
    components: spec.components.map((component) => ({
      id: componentIds.get(component.name),
      name: component.name,
      type: component.type ?? 'Button',
      pageId: pageIds.get(component.page),
      parent: component.parent ? withIds(component.parent) : null,
      properties: withIds(component.properties ?? {}),
      styles: component.styles ?? {},
      general: {},
      generalStyles: {},
      displayPreferences: component.display ?? {},
      validation: {},
    })),
    layouts: spec.components.flatMap((component) => [
      ...(component.desktop ? [box(componentIds.get(component.name), 'desktop', component.desktop)] : []),
      ...(component.mobile ? [box(componentIds.get(component.name), 'mobile', component.mobile)] : []),
    ]),
    queries: (spec.queries ?? []).map((query) => {
      const kind = query.source ?? 'runjs';
      if (!sourceIds.has(kind)) sourceIds.set(kind, uuid());
      return {
        id: queryIds.get(query.name),
        name: query.name,
        dataSourceId: sourceIds.get(kind),
        options: withIds(query.options ?? {}),
      };
    }),
    dataSources: [...sourceIds.entries()].map(([kind, id]) => ({ id, name: `${kind}default`, kind })),
    events: (spec.events ?? []).map((handler, index) => ({
      id: uuid(),
      name: `handler${index}`,
      index,
      event: withIds(handler.event),
      sourceId: idOf(handler.source),
      target: handler.target ?? 'component',
    })),
  };
}

const diff = (base: Spec, target: Spec) =>
  diffVersions(buildSnapshot(rows(base, 'v1')), buildSnapshot(rows(target, 'v2')));
const summaries = (component: { changes: Array<{ summary: string }> }) =>
  component.changes.map((change) => change.summary);

const baseSpec = (): Spec => ({
  pages: [{ handle: 'home', name: 'Home' }],
  components: [
    { page: 'home', name: 'card', type: 'Container', desktop: [0, 0, 43, 400] },
    {
      page: 'home',
      name: 'title',
      type: 'Text',
      parent: '<card>',
      properties: { text: { value: 'Deals' } },
      desktop: [10, 1, 20, 40],
    },
    { page: 'home', name: 'save', parent: '<card>', properties: { text: { value: 'Save' } }, desktop: [300, 1, 8, 40] },
  ],
  queries: [{ name: 'getDeals', options: { code: 'return 1' } }],
  events: [
    {
      source: 'save',
      event: { eventId: 'onClick', actionId: 'run-query', queryId: '<getDeals>', queryName: 'getDeals' },
    },
  ],
});

describe('version diff', () => {
  it('finds no change between a version and its copy, although every id differs', () => {
    const result = diff(baseSpec(), baseSpec());
    expect(result.identical).toBe(true);
    expect(result.pages).toEqual([]);
    expect(result.queries).toEqual([]);
  });

  it('reports added and removed components with their layout boxes', () => {
    const target = baseSpec();
    target.components = target.components.filter((component) => component.name !== 'title');
    target.components.push({ page: 'home', name: 'chart', type: 'Chart', parent: '<card>', desktop: [60, 0, 43, 200] });
    const page = diff(baseSpec(), target).pages[0];
    expect(page.counts).toEqual({ added: 1, removed: 1, changed: 0 });
    const chart = page.components.find((component) => component.name === 'chart');
    expect(chart.status).toBe('added');
    expect(chart.parent.target).toBe('card');
    expect(chart.layouts.target.desktop).toMatchObject({ top: 60, left: 0, width: 43, height: 200 });
    expect(page.components.find((component) => component.name === 'title').status).toBe('removed');
  });

  it('describes moves, resizes and property edits in plain words', () => {
    const target = baseSpec();
    const title = target.components.find((component) => component.name === 'title');
    title.desktop = [30, 4, 24, 40];
    title.properties = { text: { value: 'Open deals' } };
    title.styles = { textColor: { value: '#393568' } };
    const component = diff(baseSpec(), target).pages[0].components[0];
    expect(component.status).toBe('changed');
    expect(summaries(component)).toEqual([
      'Moved 3 columns right and 20px down',
      'Resized: wider by 4 columns',
      'Text changed from "Deals" to "Open deals"',
      'Text colour set to "#393568"',
    ]);
  });

  it('treats a missing key and an empty value as the same', () => {
    const target = baseSpec();
    target.components[1].properties = {
      text: { value: 'Deals' },
      tooltip: { value: '' },
      placeholder: { value: '', fxActive: false },
    };
    expect(diff(baseSpec(), target).identical).toBe(true);
  });

  it('ignores whitespace just inside a binding', () => {
    const base = baseSpec();
    base.components[1].properties = { text: { value: '{{ queries.getDeals.data.length }}' } };
    const target = baseSpec();
    target.components[1].properties = { text: { value: '{{queries.getDeals.data.length}}' } };
    expect(diff(base, target).identical).toBe(true);
  });

  it('matches references to renamed-id entities by name, not by uuid', () => {
    const base = baseSpec();
    base.components[0].properties = { childOrder: { value: ['<title>', '<save>'] } };
    const target = baseSpec();
    target.components[0].properties = { childOrder: { value: ['<save>', '<title>'] } };
    const card = diff(base, target).pages[0].components[0];
    expect(summaries(card)).toEqual(['Child order: reordered']);
  });

  it('reports a component moved into another container', () => {
    const target = baseSpec();
    target.components.push({ page: 'home', name: 'footer', type: 'Container', desktop: [420, 0, 43, 80] });
    target.components.find((component) => component.name === 'save').parent = '<footer>';
    const save = diff(baseSpec(), target).pages[0].components.find((component) => component.name === 'save');
    expect(summaries(save)).toContain('Moved from card into footer');
  });

  it('skips mobile boxes when the page computes its mobile layout', () => {
    const base = baseSpec();
    base.pages[0].auto = true;
    base.components[1].mobile = [10, 0, 43, 40];
    const target = baseSpec();
    target.pages[0].auto = true;
    target.components[1].mobile = [90, 0, 43, 40];
    expect(diff(base, target).identical).toBe(true);
    base.pages[0].auto = false;
    target.pages[0].auto = false;
    const title = diff(base, target).pages[0].components[0];
    expect(summaries(title)).toEqual(['Moved 80px down on mobile']);
  });

  it('says when a component is hidden on mobile', () => {
    const target = baseSpec();
    target.components[2].display = { showOnMobile: { value: '{{false}}' } };
    const save = diff(baseSpec(), target).pages[0].components[0];
    expect(summaries(save)).toEqual(['Now hidden on mobile']);
  });

  it('attaches rewired events to the component that fires them', () => {
    const target = baseSpec();
    target.queries.push({ name: 'saveDeal' });
    target.events = [
      {
        source: 'save',
        event: { eventId: 'onClick', actionId: 'run-query', queryId: '<saveDeal>', queryName: 'saveDeal' },
      },
    ];
    const result = diff(baseSpec(), target);
    const save = result.pages[0].components.find((component) => component.name === 'save');
    expect(save.events).toHaveLength(1);
    expect(save.events[0].status).toBe('changed');
    expect(save.events[0].summary).toBe('Changed query id, query name: On click: run query saveDeal');
    expect(result.queries.map((query) => [query.name, query.status])).toEqual([['saveDeal', 'added']]);
  });

  it('summarises long query edits by lines', () => {
    const target = baseSpec();
    target.queries[0].options = { code: 'const rows = await fetchRows();\nreturn rows.filter(Boolean);' };
    const query = diff(baseSpec(), target).queries[0];
    expect(query.status).toBe('changed');
    expect(query.changes[0].summary).toBe('Code edited (2 lines added, 1 removed)');
  });

  it('reports pages added, removed, renamed and reordered, and the home page', () => {
    const base: Spec = {
      pages: [{ handle: 'home' }, { handle: 'deals' }, { handle: 'old' }],
      components: [],
      homePage: 'home',
    };
    const target: Spec = {
      pages: [{ handle: 'deals', name: 'Pipeline' }, { handle: 'home' }, { handle: 'reports' }],
      components: [],
      homePage: 'deals',
    };
    const result = diff(base, target);
    expect(result.pages.map((page) => [page.key, page.status])).toEqual([
      ['deals', 'changed'],
      ['home', 'changed'],
      ['reports', 'added'],
      ['old', 'removed'],
    ]);
    expect(result.pages[0].changes.map((change) => change.summary)).toEqual([
      'Name changed from "deals" to "Pipeline"',
      'Moved from position 2 to 1 in the page list',
    ]);
    expect(result.settings.map((change) => change.summary)).toEqual(['Home page changed from "home" to "deals"']);
  });

  it('names the theme when it changes', () => {
    const base = baseSpec();
    base.globalSettings = { theme: { id: 't1', name: 'Luna Sales' } };
    const target = baseSpec();
    target.globalSettings = { theme: { id: 't2', name: 'Luna Sales Vivid' } };
    expect(diff(base, target).settings[0].summary).toBe('Theme changed from "Luna Sales" to "Luna Sales Vivid"');
  });
});

describe('query option noise', () => {
  it('ignores ToolJet Database settings for operations the query does not run', () => {
    const base = baseSpec();
    base.queries = [{ name: 'getDeals', source: 'tooljetdb', options: { operation: 'list_rows', list_rows: { limit: 50 } } }];
    const target = baseSpec();
    target.queries = [
      {
        name: 'getDeals',
        source: 'tooljetdb',
        options: { operation: 'list_rows', list_rows: { limit: 50 }, delete_rows: { limit: 1, order_column: 'id' } },
      },
    ];
    expect(diff(base, target).identical).toBe(true);
    target.queries[0].options.list_rows = { limit: 100 };
    expect(diff(base, target).queries.map((query) => query.status)).toEqual(['changed']);
  });
});
