import {
  getNextBubbleContext,
  getNextBubbleTargetId,
  resolveContainerHeight,
  resolveListviewHeightFromRows,
} from '../../dynamicHeightReflow';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

// Pins how the native Listview's rows and widget height come out of the reflow on main, so changes made for the UI 2.0
// lists (which share these paths) cannot move them. A row with no DOM to measure (jsdom here, a mobile canvas in the
// app) takes main's mobile path: the bottom of its lowest child, or rowHeight when it has none.

const ROWS = [{ n: 1 }, { n: 2 }, { n: 3 }];

// A Listview 'lv' (rowHeight 100, three rows, drawn 400 tall) with children laid out on its row canvas.
const resolve = ({
  properties = {},
  children = [
    { id: 'a', layout: { top: 10, left: 0, width: 10, height: 40 } },
    { id: 'b', layout: { top: 60, left: 0, width: 10, height: 30 } },
  ],
  temps = {},
  hidden = [],
  context = [1],
  scoped = false,
  bump,
  componentType = 'Listview',
  height = 400,
} = {}) => {
  const lvProperties = { rowHeight: 100, dataSourceSelector: 'rawJson', data: ROWS, ...properties };
  const components = {
    lv: { component: { component: componentType, parent: null }, layouts: { desktop: { top: 0, height } } },
    ...Object.fromEntries(
      children.map((c) => [c.id, { component: { component: 'Text', parent: 'lv' }, layouts: { desktop: c.layout } }])
    ),
  };
  // The list's own wrapper is drawn at `context` only when the list itself sits in an outer row.
  document.body.innerHTML = scoped
    ? `<div class="ele-lv" data-layout-context="${context.join('.')}" data-module-id="canvas"><div class="dynamic-lv"></div></div>`
    : '';
  return resolveContainerHeight({
    componentId: 'lv',
    componentType,
    currentLayout: 'desktop',
    currentPageComponents: components,
    temporaryLayouts: temps,
    contextIndices: context,
    visibility: true,
    getResolvedComponent: (id) =>
      id === 'lv' ? { properties: lvProperties } : children.find((c) => c.id === id)?.resolved ?? { properties: {} },
    getResolvedValue: (v) => v,
    getComponentDefinition: (id) => components[id],
    getContainerChildrenMapping: () => children.map((c) => c.id),
    getExposedPropertyForAdditionalActions: (id, ctx, prop) =>
      prop === 'isVisible' && hidden.includes(id) ? false : undefined,
    calculateMoveableBoxHeightWithId: bump,
  });
};

describe('Listview reflow (pinned)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('a row', () => {
    it('is the bottom of its lowest child', () => {
      // b ends at 90; a child grown to 300 in row 1 pushes the row down with it.
      expect(resolve()).toBe(90);
      expect(resolve({ temps: { 'a-1': { height: 300 } } })).toBe(10 + 300);
    });

    it('takes rowHeight only when it has no children', () => {
      expect(resolve({ properties: { rowHeight: 250 } })).toBe(90);
      expect(resolve({ children: [] })).toBe(100);
    });

    it('reads its children at its own row context only', () => {
      expect(resolve({ temps: { 'a-0': { height: 300 }, a: { height: 300 } } })).toBe(90);
    });

    it('keeps the slot of a hidden child, collapsing or not', () => {
      const children = [
        { id: 'a', layout: { top: 10, left: 0, width: 10, height: 40 } },
        { id: 'b', layout: { top: 200, left: 0, width: 10, height: 30 } },
      ];
      expect(resolve({ children, hidden: ['b'] })).toBe(230);
      const collapsing = [children[0], { ...children[1], resolved: { properties: { collapseWhenHidden: true } } }];
      expect(resolve({ children: collapsing, hidden: ['b'] })).toBe(230);
    });

    it('reads a child without a temp at its drawn height', () => {
      expect(resolve({ bump: (id) => (id === 'b' ? 120 : 40) })).toBe(60 + 30);
    });

    it('follows its children with dynamic height off too', () => {
      expect(resolve({ properties: { dynamicHeight: false }, temps: { 'a-1': { height: 300 } } })).toBe(10 + 300);
    });
  });

  describe('the widget', () => {
    it('sums its rows (temps, else the row its children fill) plus 18px of outer chrome, floored at its drawn height', () => {
      const temps = { 'lv-0': { height: 150 }, 'lv-2': { height: 320 } };
      expect(resolve({ context: null, temps })).toBe(150 + 90 + 320 + 18);
      expect(resolve({ context: null, temps: {} })).toBe(400);
    });

    it('adds a border per row in list mode and the pagination bar', () => {
      const temps = { 'lv-0': { height: 300 } };
      const height = resolve({
        context: null,
        temps,
        properties: { showBorder: true, enablePagination: true, rowsPerPage: 2 },
      });
      expect(height).toBe(300 + 90 + 2 + 61 + 18);
    });

    it('takes the tallest row of each band in grid mode', () => {
      const temps = { 'lv-0': { height: 300 }, 'lv-1': { height: 120 }, 'lv-2': { height: 200 } };
      expect(resolve({ context: null, temps, properties: { mode: 'grid', columns: 2 } })).toBe(300 + 200 + 18);
    });

    it('sums its rows under an outer row when it is drawn there (a nested list)', () => {
      const temps = { 'lv-1.0': { height: 150 }, 'lv-1.1': { height: 50 } };
      expect(resolve({ context: [1], scoped: true, temps })).toBe(150 + 50 + 90 + 18);
    });
  });

  it('resolveListviewHeightFromRows counts the rows a page shows', () => {
    const component = {
      properties: { rowHeight: 50, dataSourceSelector: 'rawJson', data: ROWS, enablePagination: true, rowsPerPage: 2 },
    };
    expect(
      resolveListviewHeightFromRows({
        componentId: 'lv',
        contextIndices: null,
        component,
        currentLayout: 'desktop',
        currentPageComponents: {},
        temporaryLayouts: { 'lv-1': { height: 80 } },
      })
    ).toBe(50 + 80 + 61 + 18);
  });

  it('bubbles a row to the list itself one context up', () => {
    const target = getNextBubbleTargetId({
      componentId: 'lv',
      componentType: 'Listview',
      parentId: 'canvas-parent',
      contextIndices: [2, 1],
      isScopedContextRenderable: false,
      currentPageComponents: { lv: {} },
    });
    expect(target).toBe('lv');
    expect(getNextBubbleContext('Listview', [2, 1], 'lv', 'lv')).toEqual([2]);
    expect(getNextBubbleContext('Listview', [1], 'lv', 'lv')).toBeNull();
  });
});

describe('Listview row reflow in the store (pinned)', () => {
  const listview = () => {
    const lv = componentDefinition('lv', 'list1', 'Listview', {
      data: binding('{{[{ n: 1 }, { n: 2 }, { n: 3 }]}}'),
      rowHeight: binding('{{100}}'),
      dynamicHeight: binding('{{true}}'),
    });
    lv.layouts = { desktop: { top: 0, left: 0, width: 20, height: 400 } };
    const text = componentDefinition('t', 'text1', 'Text');
    text.component.parent = 'lv';
    text.layouts = { desktop: { top: 10, left: 0, width: 10, height: 40 } };
    const below = componentDefinition('below', 'button1', 'Button');
    below.layouts = { desktop: { top: 420, left: 0, width: 10, height: 40 } };
    return { lv, t: text, below };
  };

  it('writes the row temp, then sums the rows at the widget and moves what is below', () => {
    seedApp(listview());
    useStore.getState().setTemporaryLayouts({ 't-1': { top: 10, height: 300 } });
    useStore
      .getState()
      .flushReflows([{ id: 'lv', layout: 'desktop', isContainer: true, contextIndices: [1], moduleId: 'canvas' }]);
    const temps = useStore.getState().temporaryLayouts;
    expect(temps['lv-1'].height).toBe(10 + 300);
    // No sibling temps under the row context: the row pass writes the row and hands over to the widget.
    expect(temps['below-1']).toBeUndefined();
    // Rows 0 and 2 fit their text (50). The rows sum to 431 with a pixel of border each and the outer chrome, but the
    // widget pass keeps the drawn 400 here, so nothing below moves.
    expect(temps.lv.height).toBe(400);
    expect(temps.below.top).toBe(420);
  });
});
