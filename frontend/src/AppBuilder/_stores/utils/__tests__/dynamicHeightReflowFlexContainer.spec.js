import { resolveFlexContainerHeight } from '../dynamicHeightReflowFlexContainer';
import { SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// A FlexContainer 'flex' with children, rendered `wrapperWidth` wide. Layouts are canonical; no temp heights.
const resolve = ({ properties, children, height = 40, wrapperWidth = 1264 }) => {
  const layouts = { flex: { height }, ...Object.fromEntries(children.map((c) => [c.id, c.layout])) };
  const components = {
    flex: { component: { definition: { properties: { childOrder: { value: children.map((c) => c.id) } } } } },
  };
  document.body.innerHTML = `<div id="flex-wrapper"></div>`;
  const wrapper = document.getElementById('flex-wrapper');
  Object.defineProperty(wrapper, 'clientWidth', { value: wrapperWidth });
  return resolveFlexContainerHeight({
    componentId: 'flex',
    currentLayout: 'desktop',
    currentPageComponents: components,
    temporaryLayouts: {},
    contextIndices: [],
    getResolvedComponent: (id) => (id === 'flex' ? { properties } : { properties: {} }),
    getContainerChildrenMapping: () => children.map((c) => c.id),
    getExposedPropertyForAdditionalActions: () => undefined,
    calculateMoveableBoxHeightWithId: undefined,
    getComponentDefinition: () => undefined,
    getCanonicalLayout: (id) => layouts[id],
    getDynamicElementSelector: () => '#flex-wrapper',
    getEffectiveLayout: (id) => layouts[id],
    resolveWidgetVisibility: () => true,
  });
};

const chrome = (padding) => padding * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2;
const cards = (n, layout) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, layout }));

describe('FlexContainer dynamic height', () => {
  it('fits fill children of a wrapping row on one line (the over-grown KPI row)', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 16, padding: 0 },
      children: cards(3, { fillWidth: true, height: 158 }),
    });
    expect(height).toBe(158 + chrome(0));
  });

  it('wraps fill children once their minimum widths no longer fit', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 16, padding: 0 },
      children: cards(3, { fillWidth: true, minWidthPx: 500, height: 100 }),
    });
    // 500 + 16 + 500 fits in 1264; the third card wraps.
    expect(height).toBe(100 + 16 + 100 + chrome(0));
  });

  it('still wraps fixed-width children by their widths', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 8, padding: 12 },
      children: cards(3, { fillWidth: false, widthPx: 600, height: 50 }),
      wrapperWidth: 1264 + 24,
    });
    expect(height).toBe(50 + 8 + 50 + chrome(12));
  });

  it('counts the Ant card header', () => {
    const plain = resolve({
      properties: { direction: 'column', gap: 8, padding: 16 },
      children: cards(2, { height: 40 }),
    });
    const titled = resolve({
      properties: { direction: 'column', gap: 8, padding: 16, cardStyle: 'antCard', cardTitle: 'Fleet' },
      children: cards(2, { height: 40 }),
    });
    expect(titled - plain).toBe(56);
  });

  it('keeps the authored height as the floor', () => {
    const height = resolve({
      properties: { direction: 'column', padding: 0 },
      children: cards(1, { height: 40 }),
      height: 300,
    });
    expect(height).toBe(300);
  });
});
