import {
  ROOT_LAYOUT_CONTEXT,
  getDynamicElementSelector,
  getDynamicLayoutKey,
  getEffectiveLayout,
  normalizeLayoutContext,
  serializeLayoutContext,
} from '../layoutKeys';

// Where a widget's rendered layout is stored and found. Every reader and writer
// of `temporaryLayouts` and every DOM lookup of a widget's box goes through these.

describe('layout context of a widget', () => {
  it('[DynamicHeight-KEY-001] is the root canvas when there is no row or the row list is empty', () => {
    expect(normalizeLayoutContext()).toBeNull();
    expect(normalizeLayoutContext(null)).toBeNull();
    expect(normalizeLayoutContext([])).toBeNull();
    expect(normalizeLayoutContext([null, undefined, ''])).toBeNull();
  });

  it('[DynamicHeight-KEY-002] keeps row 0 and the order of nested rows', () => {
    expect(normalizeLayoutContext(0)).toEqual([0]);
    expect(normalizeLayoutContext([0, 3])).toEqual([0, 3]);
    expect(normalizeLayoutContext([null, 2])).toEqual([2]);
  });

  it('[DynamicHeight-KEY-003] serializes to "root" at the canvas and to the joined rows inside a list', () => {
    expect(ROOT_LAYOUT_CONTEXT).toBe('root');
    expect(serializeLayoutContext(null)).toBe('root');
    expect(serializeLayoutContext([1, 2])).toBe('1.2');
  });
});

describe('rendered layout key of a widget', () => {
  it('[DynamicHeight-KEY-004] is the bare id on the main canvas', () => {
    expect(getDynamicLayoutKey('text1')).toBe('text1');
    expect(getDynamicLayoutKey('text1', null, '', 'canvas')).toBe('text1');
    expect(getDynamicLayoutKey('text1', null, '', null)).toBe('text1');
  });

  it('[DynamicHeight-KEY-005] carries the row path inside a list', () => {
    expect(getDynamicLayoutKey('text1', [2])).toBe('text1-2');
    expect(getDynamicLayoutKey('text1', [0, 3])).toBe('text1-0.3');
  });

  it('[DynamicHeight-KEY-006] is scoped by the module instance, so two instances of one module never share a key', () => {
    expect(getDynamicLayoutKey('text1', null, '', 'module-a')).toBe('module-a::text1');
    expect(getDynamicLayoutKey('text1', [1], '', 'module-b')).toBe('module-b::text1-1');
  });

  it('[DynamicHeight-KEY-007] appends a suffix after the scope (the modal body)', () => {
    expect(getDynamicLayoutKey('modal1', null, '-body')).toBe('modal1-body');
    expect(getDynamicLayoutKey('modal1', null, '-body', 'module-a')).toBe('module-a::modal1-body');
  });
});

describe('DOM selector of a widget box', () => {
  it('[DynamicHeight-KEY-008] names the box, its row context and its module', () => {
    expect(getDynamicElementSelector('text1')).toBe('.ele-text1[data-layout-context="root"][data-module-id="canvas"]');
    expect(getDynamicElementSelector('text1', [0, 2], 'module-a')).toBe(
      '.ele-text1[data-layout-context="0.2"][data-module-id="module-a"]'
    );
    expect(getDynamicElementSelector('text1', null, null)).toBe(
      '.ele-text1[data-layout-context="root"][data-module-id="canvas"]'
    );
  });
});

describe('effective layout of a widget', () => {
  const components = { text1: { layouts: { desktop: { top: 40, left: 2, width: 10, height: 100 } } } };

  it('[DynamicHeight-KEY-009] is the saved layout when nothing has been rendered for it', () => {
    expect(getEffectiveLayout('text1', 'desktop', components, {}, null)).toEqual({
      top: 40,
      left: 2,
      width: 10,
      height: 100,
    });
  });

  it('[DynamicHeight-KEY-010] takes the rendered top and height over the saved ones, for its own row and module', () => {
    const temporaryLayouts = {
      text1: { top: 60, height: 300 },
      'text1-1': { top: 90, height: 120 },
      'module-a::text1': { top: 10, height: 50 },
    };
    expect(getEffectiveLayout('text1', 'desktop', components, temporaryLayouts, null)).toEqual({
      top: 60,
      left: 2,
      width: 10,
      height: 300,
    });
    expect(getEffectiveLayout('text1', 'desktop', components, temporaryLayouts, [1])).toMatchObject({
      top: 90,
      height: 120,
    });
    expect(getEffectiveLayout('text1', 'desktop', components, temporaryLayouts, null, 'module-a')).toMatchObject({
      top: 10,
      height: 50,
    });
  });

  it('[DynamicHeight-KEY-011] is null for a widget with no layout in the current layout', () => {
    expect(getEffectiveLayout('text1', 'mobile', components, {}, null)).toBeNull();
    expect(getEffectiveLayout('missing', 'desktop', components, {}, null)).toBeNull();
  });
});
