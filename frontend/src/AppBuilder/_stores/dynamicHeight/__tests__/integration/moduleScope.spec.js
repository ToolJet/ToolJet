/**
 * The dynamic height engine's read model of one module: what is saved, what sits on which canvas, who owns a canvas,
 * how deep a widget is, and the height a widget is known to have.
 *
 * Runs on the real composed store, seeded through `seedApp`. `createModuleScope` reads a snapshot of the store
 * synchronously, so React is never rendered (as in validateWidget.spec.js and the Listview reflow spec).
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { bindModuleAwareGetResolvedComponent, createModuleScope } from '../../moduleScope';
import { bootModule, uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();

const CONTAINER = uuid(1);
const TABS = uuid(2);
const MODAL = uuid(3);
const LIST = uuid(4);
const INNER_LIST = uuid(5);
const ACCORDION = uuid(6);
const FORM = uuid(7);

const PAGE = {
  title: widget('title', 'Text', { top: 0, height: 40, mobile: { top: 5, left: 0, width: 20, height: 30 } }),
  [CONTAINER]: widget(CONTAINER, 'Container', { top: 50, height: 400 }),
  inside: widget('inside', 'Text', { parent: CONTAINER }),
  [TABS]: widget(TABS, 'Tabs', { parent: CONTAINER, top: 60, height: 300 }),
  onTab: widget('onTab', 'Text', { parent: `${TABS}-t1` }),
  [MODAL]: widget(MODAL, 'ModalV2', { top: 460 }),
  inHeader: widget('inHeader', 'Text', { parent: `${MODAL}-header` }),
  [LIST]: widget(LIST, 'Listview', { top: 510, height: 300 }),
  rowText: widget('rowText', 'Text', { parent: LIST }),
  [INNER_LIST]: widget(INNER_LIST, 'Listview', { parent: LIST, top: 50, height: 200 }),
  deepText: widget('deepText', 'Text', { parent: INNER_LIST }),
  [ACCORDION]: widget(ACCORDION, 'Accordion', { top: 820, height: 200 }),
  [FORM]: widget(FORM, 'Form', { top: 1030, height: 300, properties: { generateFormFrom: binding('jsonSchema') } }),
  name: widget('name', 'TextInput', {
    top: 1340,
    properties: { label: binding('Name') },
    styles: { alignment: binding('top'), width: binding('33') },
  }),
  grows: widget('grows', 'Text', { top: 1400, properties: { dynamicHeight: binding('{{true}}') } }),
  fixed: widget('fixed', 'Text', { top: 1450 }),
};

const scopeOf = (moduleId = 'canvas', layout = 'desktop') => createModuleScope(s(), moduleId, layout);

describe('dynamic height: module scope', () => {
  beforeEach(() => {
    seedApp(PAGE);
  });

  it('[DynamicHeight-SCOPE-001] reads the saved layout of the layout being drawn', () => {
    expect(scopeOf('canvas', 'desktop').savedLayout('title')).toEqual({ top: 0, left: 0, width: 10, height: 40 });
    expect(scopeOf('canvas', 'mobile').savedLayout('title')).toEqual({ top: 5, left: 0, width: 20, height: 30 });
    expect(scopeOf().savedLayout('missing')).toBeUndefined();
  });

  it('[DynamicHeight-SCOPE-002] reads the height a widget is drawn at, its top label row included', () => {
    const scope = scopeOf();
    expect(scope.savedHeight('title')).toBe(40);
    expect(scope.savedHeight('name')).toBe(60);
    // Not on this page (deleted mid-pass): no height.
    expect(scope.savedHeight('missing')).toBe(0);
  });

  it('[DynamicHeight-SCOPE-003] lists the widgets on each canvas, in page order', () => {
    const scope = scopeOf();
    expect(scope.childrenOf(null)).toEqual([
      'title',
      CONTAINER,
      MODAL,
      LIST,
      ACCORDION,
      FORM,
      'name',
      'grows',
      'fixed',
    ]);
    expect(scope.childrenOf(CONTAINER)).toEqual(['inside', TABS]);
    expect(scope.childrenOf(`${TABS}-t1`)).toEqual(['onTab']);
    expect(scope.childrenOf(`${TABS}-t2`)).toEqual([]);
  });

  it('[DynamicHeight-SCOPE-004] finds the widget that owns a canvas', () => {
    const scope = scopeOf();
    expect(scope.ownerOf(null)).toBeNull();
    expect(scope.ownerOf(CONTAINER)).toBe(CONTAINER);
    expect(scope.ownerOf(`${TABS}-t1`)).toBe(TABS);
    expect(scope.ownerOf(`${MODAL}-header`)).toBe(MODAL);
    expect(scope.ownerOf(uuid(99))).toBeNull();
  });

  it('[DynamicHeight-SCOPE-005] counts the containers around a widget', () => {
    const scope = scopeOf();
    expect(scope.depthOf('title')).toBe(0);
    expect(scope.depthOf('inside')).toBe(1);
    expect(scope.depthOf('onTab')).toBe(2);
    expect(scope.depthOf('deepText')).toBe(2);
  });

  it('[DynamicHeight-SCOPE-006] counts the List views around a widget, each of which adds a row index', () => {
    const scope = scopeOf();
    expect(scope.rowDepthOf('title')).toBe(0);
    expect(scope.rowDepthOf('onTab')).toBe(0);
    expect(scope.rowDepthOf('rowText')).toBe(1);
    expect(scope.rowDepthOf(INNER_LIST)).toBe(1);
    expect(scope.rowDepthOf('deepText')).toBe(2);
  });

  it('[DynamicHeight-SCOPE-007] knows each widget type and its height contract', () => {
    const scope = scopeOf();
    expect(scope.typeOf(TABS)).toBe('Tabs');
    expect(scope.contractOf(TABS)).toEqual({ content: 'grid', contentSlot: 'activeTab' });
    expect(scope.contractOf('title')).toBeNull();
  });

  it('[DynamicHeight-SCOPE-008] follows visibility, a runtime setVisibility included', () => {
    expect(scopeOf().isVisible('title', null)).toBe(true);
    s().setExposedValue('title', 'isVisible', false);
    expect(scopeOf().isVisible('title', null)).toBe(false);
  });

  it('[DynamicHeight-SCOPE-009] knows whether a widget collapses when hidden', () => {
    seedApp({ ...PAGE, title: widget('title', 'Text', { properties: { collapseWhenHidden: binding('{{true}}') } }) });
    const scope = scopeOf();
    expect(scope.isCollapsible('title', null)).toBe(true);
    expect(scope.isCollapsible('fixed', null)).toBe(false);
  });

  it('[DynamicHeight-SCOPE-010] knows a Form generated from a JSON schema', () => {
    expect(scopeOf().isJsonSchemaForm(FORM)).toBe(true);
    // Generated from a binding that resolves to the schema option, or not generated at all.
    const formFrom = (generateFormFrom) =>
      seedApp({ ...PAGE, [FORM]: widget(FORM, 'Form', { properties: { generateFormFrom } }) });
    formFrom(binding('{{"jsonSchema"}}'));
    expect(scopeOf().isJsonSchemaForm(FORM)).toBe(true);
    formFrom(undefined);
    expect(scopeOf().isJsonSchemaForm(FORM)).toBe(false);
  });

  it('[DynamicHeight-SCOPE-011] reads the tab a Tabs shows', () => {
    // Before the Tabs mounts it reports its registered default, '' (getContentSlotId then uses the default tab).
    expect(scopeOf().currentTabOf(TABS, null)).toBe('');
    s().setExposedValue(TABS, 'currentTab', 't2');
    expect(scopeOf().currentTabOf(TABS, null)).toBe('t2');
  });

  describe('the height a widget is known to have', () => {
    it('[DynamicHeight-SCOPE-012] is its last rendered height when it sizes to its content', () => {
      expect(scopeOf().knownHeight('grows', null, { top: 1400, height: 120 })).toBe(120);
    });

    it('[DynamicHeight-SCOPE-013] is its drawn height before it has rendered, or when it reported no size', () => {
      const scope = scopeOf();
      expect(scope.knownHeight('grows', null, undefined)).toBe(40);
      expect(scope.knownHeight('grows', null, { height: 0 })).toBe(40);
    });

    it('[DynamicHeight-SCOPE-014] is its drawn height when it does not size to its content', () => {
      // A rendered height left over from when Dynamic height was on is ignored.
      expect(scopeOf().knownHeight('fixed', null, { height: 120 })).toBe(40);
      expect(scopeOf().knownHeight('name', null, undefined)).toBe(60);
    });

    it('[DynamicHeight-SCOPE-015] follows an Accordion opening and closing, Dynamic height on or off', () => {
      expect(scopeOf().knownHeight(ACCORDION, null, { height: 52 })).toBe(52);
    });
  });
});

describe('dynamic height: a module root takes Dynamic height from the module it is used in', () => {
  const INSTANCE = uuid(50);
  const ROOT = uuid(51);

  const seedModule = ({ instanceDynamicHeight, rootDynamicHeight }) => {
    seedApp({
      [INSTANCE]: widget(INSTANCE, 'ModuleViewer', { properties: { dynamicHeight: binding(instanceDynamicHeight) } }),
    });
    bootModule(INSTANCE);
    seedApp(
      { [ROOT]: widget(ROOT, 'ModuleContainer', { properties: { dynamicHeight: binding(rootDynamicHeight) } }) },
      { moduleId: INSTANCE }
    );
  };

  const resolvedDynamicHeight = (moduleId, id) =>
    bindModuleAwareGetResolvedComponent(s().getResolvedComponent, s().getComponentTypeFromId, moduleId)(id, null)
      ?.properties?.dynamicHeight;

  it('[DynamicHeight-SCOPE-016] takes it from the instance, both ways', () => {
    seedModule({ instanceDynamicHeight: '{{true}}', rootDynamicHeight: '{{false}}' });
    expect(resolvedDynamicHeight(INSTANCE, ROOT)).toBe(true);
    seedModule({ instanceDynamicHeight: '{{false}}', rootDynamicHeight: '{{true}}' });
    expect(resolvedDynamicHeight(INSTANCE, ROOT)).toBe(false);
  });

  it('[DynamicHeight-SCOPE-017] leaves every other widget, and the main canvas, as resolved', () => {
    seedModule({ instanceDynamicHeight: '{{true}}', rootDynamicHeight: '{{false}}' });
    expect(resolvedDynamicHeight('canvas', INSTANCE)).toBe(true);
  });

  it('[DynamicHeight-SCOPE-018] reads the module root through the scope with the instance setting', () => {
    seedModule({ instanceDynamicHeight: '{{true}}', rootDynamicHeight: '{{false}}' });
    expect(scopeOf(INSTANCE).getResolvedComponent(ROOT, null).properties.dynamicHeight).toBe(true);
  });
});
