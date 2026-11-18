import { buildMenuTree, evaluateAllAppsHidden, expandAllAppsNavItems, toAppContext } from '../allAppsNavItems';

const internal = { id: 'f-internal', name: 'Internal' };
const ops = { id: 'f-ops', name: 'Ops' };

const menuApps = [
  { id: 'a-zeta', name: 'Zeta', slug: 'zeta', folder: ops },
  { id: 'a-beta', name: 'beta', slug: 'beta', folder: internal },
  { id: 'a-alpha', name: 'Alpha', slug: 'alpha', folder: null },
  { id: 'a-gamma', name: 'Gamma', slug: 'gamma', folder: internal },
  { id: 'a-current', name: 'Current', slug: 'current', folder: null },
];

const page = (overrides) => ({ id: 'p-home', name: 'Home', type: 'default', ...overrides });
const allAppsItem = (overrides) => ({
  id: 'p-all',
  name: 'All apps',
  type: 'all_apps',
  openIn: 'new_tab',
  groupByFolder: false,
  pageGroupId: null,
  ...overrides,
});

const expand = (pages, { isHidden = () => false } = {}) =>
  expandAllAppsNavItems(pages, menuApps, { currentAppId: 'a-current', isHidden });

const summary = (items) => items.map((item) => [item.name, item.isPageGroup ? 'group' : 'link', item.pageGroupId]);

describe('expandAllAppsNavItems', () => {
  it('returns the same pages when there is no All apps item', () => {
    const pages = [page()];
    expect(expand(pages)).toBe(pages);
  });

  it('lists every app flat and by name, in the item position, without the current app', () => {
    const items = expand([page(), allAppsItem(), page({ id: 'p-last', name: 'Last' })]);

    expect(items.map((item) => item.name)).toEqual(['Home', 'Alpha', 'beta', 'Gamma', 'Zeta', 'Last']);
    expect(items[1]).toMatchObject({
      type: 'app',
      targetSlug: 'alpha',
      openIn: 'new_tab',
      isGeneratedAppLink: true,
      icon: 'IconAppWindow',
      pageGroupId: null,
    });
  });

  it('groups apps under their folders, folders first by name, then apps without a folder', () => {
    const items = expand([allAppsItem({ groupByFolder: true })]);

    expect(summary(items)).toEqual([
      ['Internal', 'group', null],
      ['beta', 'link', 'p-all:folder:f-internal'],
      ['Gamma', 'link', 'p-all:folder:f-internal'],
      ['Ops', 'group', null],
      ['Zeta', 'link', 'p-all:folder:f-ops'],
      ['Alpha', 'link', null],
    ]);
  });

  it('drops a folder once every app in it is hidden', () => {
    const items = expand([allAppsItem({ groupByFolder: true })], {
      isHidden: (_item, app) => app.folder_name === 'Internal',
    });

    expect(items.map((item) => item.name)).toEqual(['Ops', 'Zeta', 'Alpha']);
  });

  it('lists apps flat inside the group that holds the item, since groups do not nest', () => {
    const items = expand([allAppsItem({ groupByFolder: true, pageGroupId: 'g-1' })]);

    expect(items.map((item) => [item.name, item.pageGroupId])).toEqual([
      ['Alpha', 'g-1'],
      ['beta', 'g-1'],
      ['Gamma', 'g-1'],
      ['Zeta', 'g-1'],
    ]);
  });

  it('generates nothing when no app is visible, or when the item is disabled', () => {
    expect(expand([allAppsItem({ groupByFolder: true })], { isHidden: () => true })).toEqual([]);
    expect(expand([allAppsItem({ disabled: true })])).toEqual([]);
  });

  it('gives every generated entry a unique handle, which the menu uses as its list key', () => {
    const items = expand([allAppsItem({ groupByFolder: true })]);
    const handles = items.map((item) => item.handle);

    expect(handles.every(Boolean)).toBe(true);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it('asks isHidden about each app with the app fields the expression can read', () => {
    const seen = [];
    expand([allAppsItem()], { isHidden: (_item, app) => seen.push(app) && false });

    expect(seen).toContainEqual({ id: 'a-beta', name: 'beta', folder_id: 'f-internal', folder_name: 'Internal' });
    expect(seen).toContainEqual({ id: 'a-alpha', name: 'Alpha', folder_id: null, folder_name: null });
  });
});

describe('evaluateAllAppsHidden', () => {
  const scope = { exposedValues: { variables: { hideOps: true } }, componentIds: {}, queryIds: {} };
  const app = toAppContext(menuApps[0]);

  it('reads the plain toggle values', () => {
    expect(evaluateAllAppsHidden({ value: '{{false}}', fxActive: false }, app, scope).hidden).toBe(false);
    expect(evaluateAllAppsHidden({ value: '{{true}}', fxActive: false }, app, scope).hidden).toBe(true);
    expect(evaluateAllAppsHidden(false, app, scope).hidden).toBe(false);
    expect(evaluateAllAppsHidden(undefined, app, scope).hidden).toBe(false);
  });

  it('evaluates an expression against the app', () => {
    const setting = { value: "{{app.folder_name === 'Ops'}}", fxActive: true };

    expect(evaluateAllAppsHidden(setting, app, scope)).toEqual({ hidden: true, error: null });
    expect(evaluateAllAppsHidden(setting, toAppContext(menuApps[2]), scope)).toEqual({ hidden: false, error: null });
  });

  it('can combine the app with existing context such as variables', () => {
    const setting = { value: "{{variables.hideOps && app.folder_name === 'Ops'}}", fxActive: true };

    expect(evaluateAllAppsHidden(setting, app, scope).hidden).toBe(true);
  });

  it('hides the app and reports the error when the expression throws', () => {
    const result = evaluateAllAppsHidden({ value: '{{app.folder.missing.name}}', fxActive: true }, app, scope);

    expect(result.hidden).toBe(true);
    expect(result.error).toBeTruthy();
  });
});

describe('buildMenuTree', () => {
  const nestAll = (items) => [{ nestedBy: 'buildTree', items }];
  const manualGroup = { id: 'g-manual', name: 'Manual', isPageGroup: true };
  const manualChild = page({ id: 'p-child', name: 'Child', pageGroupId: 'g-manual' });

  it('uses the nav group tree when nav groups are enabled', () => {
    const pages = [page()];
    expect(buildMenuTree(pages, { navGroupsEnabled: true, buildTree: nestAll })).toEqual(nestAll(pages));
  });

  it('still nests folder groups from All apps when nav groups are not licensed, and leaves manual groups flat', () => {
    const pages = [manualGroup, manualChild, ...expand([allAppsItem({ groupByFolder: true })])];
    const tree = buildMenuTree(pages, { navGroupsEnabled: false, buildTree: nestAll });

    expect(tree.map((item) => [item.name, item.children?.map((child) => child.name)])).toEqual([
      ['Manual', undefined],
      ['Child', undefined],
      ['Internal', ['beta', 'Gamma']],
      ['Ops', ['Zeta']],
      ['Alpha', undefined],
    ]);
  });

  it('returns the pages untouched when nothing is grouped', () => {
    const pages = [page(), ...expand([allAppsItem()])];
    expect(buildMenuTree(pages, { navGroupsEnabled: false, buildTree: nestAll })).toBe(pages);
  });
});
