/** @group platform */
import { overlaySnapshotDefinition } from '@modules/versions/diff/snapshot-definition';
import { VersionRows } from '@modules/versions/diff/snapshot';

// The snapshot: a home page with a heading, one query on a REST source and one event.
const rows: VersionRows = {
  version: {
    id: 'v-1',
    name: 'v1',
    status: 'DRAFT',
    homePageId: 'p-home',
    showViewerNavigation: false,
    globalSettings: { canvasMaxWidth: 1292 },
    pageSettings: { properties: {} },
  },
  pages: [
    {
      id: 'p-home',
      name: 'Home',
      handle: 'home',
      index: 0,
      disabled: false,
      hidden: null,
      icon: 'IconHome',
      isPageGroup: false,
      pageGroupId: null,
      pageGroupIndex: 0,
      autoComputeLayout: true,
      pageHeader: null,
      pageFooter: null,
      type: 'default',
      url: null,
    },
    {
      id: 'p-old',
      name: 'Settings',
      handle: 'settings',
      index: 1,
      disabled: false,
      hidden: null,
      icon: null,
      isPageGroup: false,
      pageGroupId: null,
      autoComputeLayout: true,
      pageHeader: null,
      pageFooter: null,
      type: 'default',
      url: null,
    },
  ],
  components: [
    {
      id: 'c-title',
      name: 'title',
      type: 'Text',
      pageId: 'p-home',
      parent: null,
      properties: { text: { value: 'Before' } },
      styles: {},
      general: null,
      generalStyles: {},
      displayPreferences: null,
      validation: {},
    },
  ],
  layouts: [
    {
      componentId: 'c-title',
      type: 'desktop',
      top: 10,
      left: 1,
      width: 20,
      height: 40,
      fillWidth: true,
    },
    {
      componentId: 'c-title',
      type: 'mobile',
      top: 10,
      left: 1,
      width: 20,
      height: 40,
    },
  ],
  queries: [
    {
      id: 'q-kept',
      name: 'getDeals',
      dataSourceId: 'ds-rest',
      options: { url: 'https://example.test/before' },
    },
    {
      id: 'q-gone',
      name: 'getOld',
      dataSourceId: 'ds-rest',
      options: { url: 'https://example.test/old' },
    },
  ],
  dataSources: [{ id: 'ds-rest', name: 'REST', kind: 'restapi' }],
  events: [
    {
      id: 'e-1',
      name: 'Go',
      index: 0,
      event: { eventId: 'onClick' },
      sourceId: 'c-title',
      target: 'component',
    },
  ],
};

// The live definition of the same version after the edit: the title changed, the Settings page
// and the getOld query were deleted, and the theme is injected into globalSettings.
const live = {
  id: 'app-1',
  name: 'Pipeline',
  editing_version: {
    id: 'v-1',
    homePageId: 'p-home',
    showViewerNavigation: true,
    globalSettings: { canvasMaxWidth: 1000, theme: { id: 't-1' } },
    pageSettings: { properties: { hideHeader: true } },
  },
  pages: [
    {
      id: 'p-home',
      handle: 'home',
      openIn: 'new_tab',
      permissions: ['viewers'],
      components: {
        'c-title': {
          component: {
            name: 'title',
            component: 'Text',
            definition: { properties: { text: { value: 'After' } } },
          },
          layouts: {
            desktop: {
              top: 10,
              left: 1,
              width: 20,
              height: 40,
              minWidthPx: 150,
            },
          },
        },
      },
    },
  ],
  data_queries: [
    {
      id: 'q-kept',
      name: 'getDeals',
      data_source_id: 'ds-rest',
      kind: 'restapi',
      options: { url: 'https://example.test/after' },
      plugins: [],
      created_at: '2026-10-15',
    },
  ],
  events: [],
  modules: [],
  should_freeze_editor: false,
};

describe('overlaySnapshotDefinition', () => {
  const withDefaults = (pages: any[]) => pages.map((page) => ({ ...page, defaultsMerged: true }));
  const result = overlaySnapshotDefinition(live, rows, 'v-1', withDefaults);

  it('renders the snapshot content and freezes it', () => {
    const title = result.pages[0].components['c-title'];
    expect(title.component.definition.properties.text.value).toBe('Before');
    expect(title.component.component).toBe('Text');
    expect(result.should_freeze_editor).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ id: 'e-1', appVersionId: 'v-1' });
  });

  it('keeps live extras on pages that still exist and rebuilds deleted pages', () => {
    expect(result.pages.map((page) => page.handle)).toEqual(['home', 'settings']);
    expect(result.pages[0]).toMatchObject({
      openIn: 'new_tab',
      permissions: ['viewers'],
      icon: 'IconHome',
    });
    expect(result.pages[1]).toMatchObject({
      openIn: 'same_tab',
      appId: '',
      components: {},
    });
  });

  it('merges widget defaults into the pages', () => {
    expect(result.pages.every((page) => page.defaultsMerged)).toBe(true);
  });

  it('takes settings from the snapshot but keeps the theme', () => {
    expect(result.editing_version.globalSettings).toEqual({
      canvasMaxWidth: 1292,
      theme: { id: 't-1' },
    });
    expect(result.editing_version.pageSettings).toEqual({ properties: {} });
    expect(result.editing_version.showViewerNavigation).toBe(false);
  });

  it('runs queries with the snapshot options, including deleted ones', () => {
    const kept = result.data_queries.find((query) => query.id === 'q-kept');
    const gone = result.data_queries.find((query) => query.id === 'q-gone');
    expect(kept).toMatchObject({
      options: { url: 'https://example.test/before' },
      created_at: '2026-10-15',
    });
    expect(gone).toMatchObject({
      kind: 'restapi',
      data_source_id: 'ds-rest',
      plugins: [],
    });
  });

  it('borrows min widths from the live layout for snapshots that predate them', () => {
    const layouts = result.pages[0].components['c-title'].layouts;
    expect(layouts.desktop).toMatchObject({
      top: 10,
      width: 20,
      fillWidth: true,
      minWidthPx: 150,
    });
    expect(layouts.mobile.minWidthPx).toBeUndefined();
    const withMin = overlaySnapshotDefinition(
      live,
      { ...rows, layouts: [{ ...rows.layouts[0], minWidthPx: null }] },
      'v-1'
    );
    expect(withMin.pages[0].components['c-title'].layouts.desktop.minWidthPx).toBeUndefined();
  });
});
