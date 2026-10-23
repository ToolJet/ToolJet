import { buildReflowPatch } from '../dynamicHeightReflow';

// A column of widgets of different widths: 'above' (a UI 2.0 widget 10 columns wide, drawn 300 tall) fits itself to
// 294, and 'wide' (20 columns, 30 under it) and 'under' (10 columns, 30 under that) sit below. Every widget below a
// shrinking widget moves up with it. A widget wider than the one above it has no blocker covering its whole width (no
// "shadower"), so the pull-up was floored at its drawn top: it stayed put while everything above it moved up, and
// every widget under it lost that move too. The Cypress parity check saw the cut cascade in the viewer (a Carousel
// under a Calendar 14px off, a Heatmap under a Funnel chart 107px off, Steps 29px, Pagination 9px...).
const components = (aboveType = 'ShadCalendar', wideType = 'ShadCarousel') => ({
  above: {
    component: { component: aboveType, parent: null },
    layouts: { desktop: { top: 0, left: 0, width: 10, height: 300 } },
  },
  wide: {
    component: { component: wideType, parent: null },
    layouts: { desktop: { top: 330, left: 0, width: 20, height: 100 } },
  },
  under: {
    component: { component: 'ShadText', parent: null },
    layouts: { desktop: { top: 460, left: 0, width: 10, height: 40 } },
  },
});
const reflow = (c, aboveHeight) =>
  buildReflowPatch({
    changedComponentId: 'above',
    componentIds: ['above', 'wide', 'under'],
    currentLayout: 'desktop',
    currentPageComponents: c,
    temporaryLayouts: {},
    contextIndices: null,
    inFlowMap: { above: true, wide: true, under: true },
    resolvedHeights: { above: aboveHeight, wide: 100, under: 40 },
    collapseWhenHiddenMap: {},
    calculateMoveableBoxHeightWithId: (id) => c[id].layouts.desktop.height,
    getComponentDefinition: (id) => c[id],
  }).temporaryLayoutPatch;

describe('a widget wider than the shrinking UI 2.0 widget above it', () => {
  it('moves up with it, and so does everything under it', () => {
    const patch = reflow(components(), 294);
    expect(patch.wide.top).toBe(324);
    expect(patch.under.top).toBe(454);
  });

  it('moves down with it when it grows', () => {
    const patch = reflow(components(), 320);
    expect(patch.wide.top).toBe(350);
    expect(patch.under.top).toBe(480);
  });

  it('a native widget above still never pulls it above its drawn top', () => {
    const patch = reflow(components('Text', 'Text'), 294);
    expect(patch.wide.top).toBe(330);
  });
});
