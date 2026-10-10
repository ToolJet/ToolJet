import { resolveFlexContainerHeight } from '../dynamicHeightReflowFlexContainer';
import { SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';

// A FlexContainer 'flex' with children, rendered `wrapperWidth` wide. Layouts are canonical; no temp heights.
const resolve = ({ properties, children, height = 40, wrapperWidth = 1264, temps = {}, bump, hidden = [] }) => {
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
    getResolvedComponent: (id) =>
      id === 'flex' ? { properties } : { properties: children.find((c) => c.id === id)?.properties ?? {} },
    getContainerChildrenMapping: () => children.map((c) => c.id),
    getExposedPropertyForAdditionalActions: () => undefined,
    calculateMoveableBoxHeightWithId: bump,
    getComponentDefinition: (id) => ({ component: { component: children.find((c) => c.id === id)?.type } }),
    getCanonicalLayout: (id) => layouts[id],
    getDynamicElementSelector: () => '#flex-wrapper',
    getEffectiveLayout: (id) => (temps[id] ? { ...layouts[id], ...temps[id] } : layouts[id]),
    resolveWidgetVisibility: ({ componentId }) => !hidden.includes(componentId),
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

  it('fits a card to its content, below its authored height too', () => {
    const height = resolve({
      properties: { direction: 'column', padding: 24, cardStyle: 'shadcnCard', cardTitle: 'Fleet' },
      children: cards(1, { height: 120 }),
      height: 600,
    });
    expect(height).toBe(48 + 24 * 2 + 120 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2);
  });

  it('fits a row to its tallest child, below its authored height too', () => {
    // A Luna clinic build drew a row of two cards at 430px; the cards fit their tables at ~260px and the row kept
    // 170px of empty band under them.
    const height = resolve({
      properties: { direction: 'row', padding: 0 },
      children: cards(2, { width: 20, height: 260 }),
      height: 430,
    });
    expect(height).toBe(260 + chrome(0));
  });

  it("lets a pack widget's measured height below its drawn height count (a card of a short table)", () => {
    // The bump floor (calculateMoveableBoxHeightWithId) returns the drawn height for non-input widgets, so a ShadTable
    // drawn at 340 that renders 161 kept its card at 440.
    const bump = (id) => (id === 't' ? 340 : 40);
    const height = resolve({
      properties: { direction: 'column', padding: 0, cardStyle: 'shadcnCard' },
      children: [{ id: 't', type: 'ShadTable', layout: { height: 340 } }],
      temps: { t: { height: 161 } },
      bump,
      height: 440,
    });
    expect(height).toBe(161 + chrome(0));
    // A native widget keeps the floor (its label bump).
    const native = resolve({
      properties: { direction: 'column', padding: 0, cardStyle: 'shadcnCard' },
      children: [{ id: 't', type: 'Table', layout: { height: 340 } }],
      temps: { t: { height: 161 } },
      bump,
      height: 440,
    });
    expect(native).toBe(340 + chrome(0));
  });

  it('lets a card child of a row count at its fitted height', () => {
    const height = resolve({
      properties: { direction: 'row', padding: 0 },
      children: [
        { id: 'a', type: 'FlexContainer', properties: { cardStyle: 'shadcnCard' }, layout: { width: 20, height: 410 } },
        { id: 'b', type: 'FlexContainer', properties: { cardStyle: 'shadcnCard' }, layout: { width: 20, height: 410 } },
      ],
      temps: { a: { height: 264 }, b: { height: 264 } },
      bump: () => 410,
      height: 430,
    });
    expect(height).toBe(264 + chrome(0));
  });

  it('leaves a hidden child out, as the page draws it (an empty state under a table)', () => {
    // An IT desk card held a table and a hidden 180px empty state: the card drew 180px of blank space under the table
    // (2026-10-10). A hidden widget renders at 0 in a flex container whether or not it set collapseWhenHidden.
    const height = resolve({
      properties: { direction: 'column', padding: 0, gap: 8 },
      children: [
        { id: 't', layout: { height: 390 } },
        { id: 'empty', type: 'ShadEmpty', layout: { height: 180 } },
      ],
      hidden: ['empty'],
      height: 100,
    });
    expect(height).toBe(390 + chrome(0));
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
