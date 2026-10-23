import { buildReflowPatch } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

// A column: 'wide' (20 columns, drawn 240) covers the target's whole width; under it 'narrow' (a UI 2.0 widget, 10
// columns, drawn 260) fits itself 9 shorter; under that 'target' (16 columns) sits 30 below. Every widget under a
// shrinking one moves up with it. 'wide' is the target's shadower: the target's floor was wide's bottom plus their
// drawn gap, which ignores that 'narrow', between them, now sits 9 shorter, so the target stayed 9 too low and
// everything under it with it (the Cypress parity check: Pagination 9px, Steps 29, Summary strip 93...).
const layout = (type) => ({
  wide: {
    component: { component: 'ShadQuestionnaire', parent: null },
    layouts: { desktop: { top: 0, left: 0, width: 20, height: 240 } },
  },
  narrow: {
    component: { component: type, parent: null },
    layouts: { desktop: { top: 270, left: 0, width: 10, height: 260 } },
  },
  target: {
    component: { component: 'ShadPagination', parent: null },
    layouts: { desktop: { top: 560, left: 0, width: 16, height: 40 } },
  },
});
const reflow = (c, narrowHeight) =>
  buildReflowPatch({
    changedComponentId: 'narrow',
    componentIds: ['wide', 'narrow', 'target'],
    currentLayout: 'desktop',
    currentPageComponents: c,
    temporaryLayouts: {},
    contextIndices: null,
    inFlowMap: { wide: true, narrow: true, target: true },
    resolvedHeights: { wide: 240, narrow: narrowHeight, target: 40 },
    collapseWhenHiddenMap: {},
    calculateMoveableBoxHeightWithId: (id) => c[id].layouts.desktop.height,
    getComponentDefinition: (id) => c[id],
  }).temporaryLayoutPatch;

describe('a widget under a shadower, with a fitted UI 2.0 widget between them', () => {
  it('moves up by what the fitted widget shrank', () => {
    expect(reflow(layout('ShadKeyValue'), 251).target.top).toBe(551);
  });

  it('a native widget between them keeps the authored floor', () => {
    expect(reflow(layout('Text'), 251).target.top).toBe(560);
  });
});
