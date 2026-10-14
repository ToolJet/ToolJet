import {
  inputsByArea,
  readAppVersionsFromExport,
  toComponentWrites,
  toIndexData,
} from '@modules/app-validation/export-reader';

describe('readAppVersionsFromExport', () => {
  const exported = {
    tooljet_version: '3.20.0',
    app: [
      {
        definition: {
          appV2: {
            id: 'a1',
            name: 'Orders',
            type: 'front-end',
            appVersions: [
              { id: 'v1', name: 'v1', homePageId: 'p1' },
              { id: 'v2', name: 'v2', homePageId: 'p2' },
            ],
            pages: [
              { id: 'p1', name: 'Home', handle: 'home', appVersionId: 'v1' },
              { id: 'p2', name: 'Home', handle: 'home', appVersionId: 'v2' },
            ],
            components: [
              {
                id: 'c1',
                name: 'button1',
                type: 'Button',
                pageId: 'p1',
                displayPreferences: { showOnDesktop: { value: '{{true}}' } },
              },
              { id: 'c2', name: 'button1', type: 'Button', pageId: 'p2' },
            ],
            events: [{ id: 'e1', appVersionId: 'v1' }],
            dataQueries: [{ id: 'q1', name: 'getOrders', appVersionId: 'v2' }],
            modules: [
              {
                appV2: {
                  id: 'm1',
                  name: 'Header module',
                  type: 'module',
                  appVersions: [{ id: 'mv1', name: 'v1', homePageId: 'mp1' }],
                  pages: [{ id: 'mp1', name: 'Module', handle: 'module', appVersionId: 'mv1' }],
                  components: [{ id: 'mc1', name: 'container', type: 'ModuleContainer', pageId: 'mp1' }],
                },
              },
            ],
          },
        },
      },
    ],
  };

  it('keeps each app version separate', () => {
    const [v1, v2] = readAppVersionsFromExport(exported);
    expect(v1).toMatchObject({ appVersionId: 'v1', homePageId: 'p1', toolJetVersion: '3.20.0' });
    expect(v1.components.map((c) => c.id)).toEqual(['c1']);
    expect(v1.events.map((e) => e.id)).toEqual(['e1']);
    expect(v1.queries).toEqual([]);
    expect(v2.components.map((c) => c.id)).toEqual(['c2']);
    expect(v2.queries.map((q) => q.id)).toEqual(['q1']);
  });

  it('includes modules nested in the export', () => {
    const module = readAppVersionsFromExport(exported).find((v) => v.appType === 'module');
    expect(module).toMatchObject({ appName: 'Header module', appVersionId: 'mv1' });
    expect(module.components.map((c) => c.type)).toEqual(['ModuleContainer']);
  });

  it('treats an older single-version export without appVersionId tags as one version', () => {
    const [only] = readAppVersionsFromExport({
      app: {
        appV2: {
          id: 'a',
          name: 'Old',
          type: 'front-end',
          editingVersion: { id: 'v', homePageId: 'p' },
          pages: [{ id: 'p' }],
          components: [{ id: 'c', pageId: 'p' }],
        },
      },
    });
    expect(only).toMatchObject({ appVersionId: 'v', homePageId: 'p' });
    expect(only.components).toHaveLength(1);
  });

  it('maps components to rule inputs and lookup data', () => {
    const [v1] = readAppVersionsFromExport(exported);
    expect(toComponentWrites(v1)[0]).toMatchObject({
      op: 'create',
      id: 'c1',
      data: {
        name: 'button1',
        type: 'Button',
        parent: null,
        displayPreferences: { showOnDesktop: { value: '{{true}}' } },
      },
    });
    expect(inputsByArea(v1).components).toEqual(toComponentWrites(v1));
    expect(toIndexData(v1).components).toEqual([
      { id: 'c1', name: 'button1', type: 'Button', parent: null, pageId: 'p1' },
    ]);
  });
});
