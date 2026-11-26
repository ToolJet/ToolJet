import { BOX_PADDING, SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { resolveFlexContainerHeight } from '../flexContainerHeight';

// Ported case for case from _stores/utils/__tests__/dynamicHeightReflowFlexContainer.spec.js (main), same values.
//
// A FlexContainer 'flex' drawn `height` tall and `wrapperWidth` wide, with `children` in that order. Layouts are the
// saved ones; `temps` are heights the children were measured at. The container is a new one (layoutVersion 2) unless
// `legacy`: saved before UI 2.0, it keeps the lts-3.16 layout.
const resolve = ({
  properties: ownProperties,
  legacy = false,
  children,
  height = 40,
  wrapperWidth = 1264,
  temps = {},
  bump,
  hidden = [],
  styles = {},
  childOrder = children.map((c) => c.id),
}) => {
  const properties = legacy ? ownProperties : { layoutVersion: '2', ...ownProperties };
  const currentPageComponents = {
    flex: {
      component: {
        component: 'FlexContainer',
        definition: { properties: { childOrder: { value: childOrder } } },
      },
      layouts: { desktop: { height } },
    },
    ...Object.fromEntries(
      children.map((c) => [c.id, { component: { component: c.type, parent: 'flex' }, layouts: { desktop: c.layout } }])
    ),
  };
  const childById = (id) => children.find((c) => c.id === id);
  return resolveFlexContainerHeight({
    componentId: 'flex',
    currentLayout: 'desktop',
    contextIndices: null,
    currentPageComponents,
    temporaryLayouts: temps,
    wrapperWidth,
    getResolvedComponent: (id) =>
      id === 'flex'
        ? { properties, styles }
        : { properties: childById(id)?.properties ?? {}, styles: childById(id)?.styles ?? {} },
    getExposedPropertyForAdditionalActions: (id, ctx, property) =>
      property === 'isVisible' && hidden.includes(id) ? false : undefined,
    getContainerChildrenMapping: () => children.map((c) => c.id),
    calculateMoveableBoxHeightWithId: bump,
  });
};

const chrome = (padding) => padding * 2 + BOX_PADDING * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2;
// lts-3.16 left the widget's box padding out.
const legacyChrome = (padding) => padding * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2;
const cards = (n, layout) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, layout }));

describe('dynamic height: FlexContainer', () => {
  it('[DynamicHeight-FLEX-001] fits fill children of a wrapping row on one line (the over-grown KPI row)', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 16, padding: 0 },
      children: cards(3, { fillWidth: true, height: 158 }),
    });
    expect(height).toBe(158 + chrome(0));
  });

  it('[DynamicHeight-FLEX-002] wraps fill children once their minimum widths no longer fit', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 16, padding: 0 },
      children: cards(3, { fillWidth: true, minWidthPx: 500, height: 100 }),
    });
    // 500 + 16 + 500 fits in 1264; the third card wraps.
    expect(height).toBe(100 + 16 + 100 + chrome(0));
  });

  it('[DynamicHeight-FLEX-003] still wraps fixed-width children by their widths', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 8, padding: 12 },
      children: cards(3, { fillWidth: false, widthPx: 600, height: 50 }),
      wrapperWidth: 1264 + 24,
    });
    expect(height).toBe(50 + 8 + 50 + chrome(12));
  });

  it('[DynamicHeight-FLEX-004] keeps a wrapping row on one line while its width is not known yet', () => {
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 8, padding: 12 },
      children: cards(3, { fillWidth: false, widthPx: 600, height: 50 }),
      wrapperWidth: null, // not measured yet
    });
    expect(height).toBe(50 + chrome(12));
  });

  it('[DynamicHeight-FLEX-021] packs a wrapping row in the order the container draws its children', () => {
    // Listed b, a, c but drawn a, c, b. In the listed order the tall `b` would share a line with `a` (300 + 80);
    // as drawn, `a` is alone and `b` joins `c` (100 + 300).
    const children = [
      { id: 'b', layout: { fillWidth: false, widthPx: 200, height: 300 } },
      { id: 'a', layout: { fillWidth: false, widthPx: 1000, height: 100 } },
      { id: 'c', layout: { fillWidth: false, widthPx: 1000, height: 80 } },
    ];
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 8, padding: 0 },
      children,
      childOrder: ['a', 'c', 'b'],
    });
    expect(height).toBe(100 + 8 + 300 + chrome(0));
  });

  it('[DynamicHeight-FLEX-022] packs a wrapping row inside its padding', () => {
    // Two 640px children and an 8px gap need 1288px: the wrapper is that wide, but 12px of padding on each side
    // leaves 1264, so the second one wraps.
    const height = resolve({
      properties: { direction: 'row', flexWrap: true, gap: 8, padding: 12 },
      children: cards(2, { fillWidth: false, widthPx: 640, height: 50 }),
      wrapperWidth: 1288,
    });
    expect(height).toBe(50 + 8 + 50 + chrome(12));
  });

  it('[DynamicHeight-FLEX-005] stacks a column with its gap, and uses the default gap and padding when unset', () => {
    // 8px gap and 12px padding are what FlexContainer.jsx draws when they are not set.
    const height = resolve({ properties: { direction: 'column' }, children: cards(3, { height: 40 }), height: 10 });
    expect(height).toBe(40 * 3 + 8 * 2 + chrome(12));
  });

  it('[DynamicHeight-FLEX-006] counts the card header', () => {
    const plain = resolve({
      properties: { direction: 'column', gap: 8, padding: 16 },
      children: cards(2, { height: 40 }),
    });
    const titled = resolve({
      properties: { direction: 'column', gap: 8, padding: 16, cardStyle: 'shadcnCard', cardTitle: 'Fleet' },
      children: cards(2, { height: 40 }),
    });
    expect(titled - plain).toBe(48);
  });

  it('[DynamicHeight-FLEX-007] fits a card to its content, below its authored height too', () => {
    const height = resolve({
      properties: { direction: 'column', padding: 24, cardStyle: 'shadcnCard', cardTitle: 'Fleet' },
      children: cards(1, { height: 120 }),
      height: 600,
    });
    expect(height).toBe(48 + 120 + chrome(24));
  });

  it('[DynamicHeight-FLEX-008] fits a row to its tallest child, below its authored height too', () => {
    // A Luna clinic build drew a row of two cards at 430px; the cards fit their tables at ~260px and the row kept
    // 170px of empty band under them.
    const height = resolve({
      properties: { direction: 'row', padding: 0 },
      children: cards(2, { width: 20, height: 260 }),
      height: 430,
    });
    expect(height).toBe(260 + chrome(0));
  });

  it("[DynamicHeight-FLEX-009] lets a pack widget's measured height below its drawn height count", () => {
    // The bump floor (calculateMoveableBoxHeightWithId) returns the drawn height for non-input widgets, so a ShadTable
    // drawn at 340 that renders 161 kept its card at 440.
    const bump = (id) => (id === 't' ? 340 : 40);
    const card = (type) =>
      resolve({
        properties: { direction: 'column', padding: 0, cardStyle: 'shadcnCard' },
        children: [{ id: 't', type, layout: { height: 340 } }],
        temps: { t: { height: 161 } },
        bump,
        height: 440,
      });
    expect(card('ShadTable')).toBe(161 + chrome(0));
    // A native widget keeps the floor (its label bump).
    expect(card('Table')).toBe(340 + chrome(0));
  });

  it("[DynamicHeight-FLEX-010] lets a shadcn-look Table's fitted height below its drawn height count", () => {
    // A churn card kept 140px under its table.
    const bump = (id) => (id === 't' ? 690 : 40);
    const card = (styles) =>
      resolve({
        properties: { direction: 'column', padding: 0, cardStyle: 'shadcnCard' },
        children: [{ id: 't', type: 'Table', layout: { height: 690 }, styles }],
        temps: { t: { height: 550 } },
        bump,
        height: 800,
      });
    expect(card({ tableLook: 'shadcn' })).toBe(550 + chrome(0));
    // The ToolJet look keeps its drawn height as the floor.
    expect(card({})).toBe(690 + chrome(0));
  });

  it('[DynamicHeight-FLEX-011] lets a card child of a row count at its fitted height', () => {
    const height = resolve({
      properties: { direction: 'row', padding: 0 },
      children: ['a', 'b'].map((id) => ({
        id,
        type: 'FlexContainer',
        properties: { cardStyle: 'shadcnCard' },
        layout: { width: 20, height: 410 },
      })),
      temps: { a: { height: 264 }, b: { height: 264 } },
      bump: () => 410,
      height: 430,
    });
    expect(height).toBe(264 + chrome(0));
  });

  it('[DynamicHeight-FLEX-012] leaves a hidden child out, as the page draws it (an empty state under a table)', () => {
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

  it("[DynamicHeight-FLEX-013] counts the widget's box padding, which wraps the canvas", () => {
    // A button row came out 4px short.
    const row = (styles) =>
      resolve({ properties: { direction: 'row', padding: 0 }, children: cards(1, { width: 6, height: 36 }), styles });
    expect(row()).toBe(36 + BOX_PADDING * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2);
    expect(row({ padding: 'none' })).toBe(36 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2);
  });

  it('[DynamicHeight-FLEX-014] keeps the authored height as the floor', () => {
    const height = resolve({
      properties: { direction: 'column', padding: 0 },
      children: cards(1, { height: 40 }),
      height: 300,
    });
    expect(height).toBe(300);
  });

  it('[DynamicHeight-FLEX-015] keeps its authored height with no child in the flow', () => {
    const height = resolve({
      properties: { direction: 'column', padding: 0, cardStyle: 'shadcnCard' },
      children: [{ id: 'a', layout: { height: 40 } }],
      hidden: ['a'],
      height: 250,
    });
    expect(height).toBe(250);
  });
});

describe('dynamic height: FlexContainer saved before layout version 2 (lts-3.16)', () => {
  it('[DynamicHeight-FLEX-016] gives each fill child of a wrapping row its own line', () => {
    const height = resolve({
      legacy: true,
      properties: { direction: 'row', flexWrap: true, gap: 16, padding: 0 },
      children: cards(3, { fillWidth: true, height: 158 }),
    });
    expect(height).toBe(158 * 3 + 16 * 2 + legacyChrome(0));
  });

  it('[DynamicHeight-FLEX-023] gives a fill child its own line even when it has a width', () => {
    const height = resolve({
      legacy: true,
      properties: { direction: 'row', flexWrap: true, gap: 16, padding: 0 },
      children: cards(3, { fillWidth: true, widthPx: 300, height: 50 }),
    });
    expect(height).toBe(50 * 3 + 16 * 2 + legacyChrome(0));
  });

  it('[DynamicHeight-FLEX-017] keeps the authored height of a row as its floor', () => {
    const height = resolve({
      legacy: true,
      properties: { direction: 'row', padding: 0 },
      children: cards(2, { width: 20, height: 260 }),
      height: 430,
    });
    expect(height).toBe(430);
  });

  it('[DynamicHeight-FLEX-018] keeps the slot of a hidden child unless it collapses when hidden', () => {
    const height = (collapseWhenHidden) =>
      resolve({
        legacy: true,
        properties: { direction: 'column', padding: 0, gap: 8 },
        children: [
          { id: 't', layout: { height: 390 } },
          { id: 'empty', layout: { height: 180 }, properties: { collapseWhenHidden } },
        ],
        hidden: ['empty'],
        height: 100,
      });
    expect(height(false)).toBe(390 + 8 + 180 + legacyChrome(0));
    expect(height(true)).toBe(390 + legacyChrome(0));
  });

  it("[DynamicHeight-FLEX-019] leaves the widget's box padding out", () => {
    const height = resolve({
      legacy: true,
      properties: { direction: 'column', padding: 0 },
      children: cards(1, { width: 6, height: 36 }),
      height: 20,
    });
    expect(height).toBe(36 + legacyChrome(0));
  });

  it('[DynamicHeight-FLEX-020] floors a row child saved before layout version 2 at its drawn height, inside a new row', () => {
    const row = (childProperties) =>
      resolve({
        properties: { direction: 'row', padding: 0 },
        children: ['a', 'b'].map((id) => ({
          id,
          type: 'FlexContainer',
          properties: { direction: 'row', ...childProperties },
          layout: { width: 20, height: 410 },
        })),
        temps: { a: { height: 264 }, b: { height: 264 } },
        bump: () => 410,
        height: 430,
      });
    expect(row({})).toBe(410 + chrome(0));
    expect(row({ layoutVersion: '2' })).toBe(264 + chrome(0));
  });
});
