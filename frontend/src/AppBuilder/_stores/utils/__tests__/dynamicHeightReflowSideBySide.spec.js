import { buildReflowPatch } from '../dynamicHeightReflow';

// Two texts drawn side by side (0–100 tall), with a widget spanning both drawn 20px below them (top 120). Each text
// that grows runs its own reflow pass, on top of the layout the earlier passes left. The widget below must sit its
// drawn 20px under the LOWER of the two texts: it was pushed by the sum of both growths, as each pass added its own
// growth to wherever the widget already sat.
const components = {
  left: {
    component: { component: 'Text', parent: null },
    layouts: { desktop: { top: 0, left: 0, width: 20, height: 100 } },
  },
  right: {
    component: { component: 'Text', parent: null },
    layouts: { desktop: { top: 0, left: 20, width: 23, height: 100 } },
  },
  below: {
    component: { component: 'Button', parent: null },
    layouts: { desktop: { top: 120, left: 0, width: 43, height: 40 } },
  },
};

// Grows the texts one at a time, in order, as the store does: each pass's patch becomes the next pass's temporary
// layouts. Returns where the widget below ends up after the last pass.
const growInTurn = (steps) => {
  const heights = { left: 100, right: 100, below: 40 };
  let temporaryLayouts = {};
  steps.forEach(([changedComponentId, height]) => {
    heights[changedComponentId] = height;
    const { temporaryLayoutPatch } = buildReflowPatch({
      changedComponentId,
      componentIds: Object.keys(components),
      currentLayout: 'desktop',
      currentPageComponents: components,
      temporaryLayouts,
      contextIndices: null,
      inFlowMap: { left: true, right: true, below: true },
      resolvedHeights: { ...heights },
      collapseWhenHiddenMap: {},
      calculateMoveableBoxHeightWithId: (id) => components[id].layouts.desktop.height,
      getComponentDefinition: (id) => components[id],
    });
    temporaryLayouts = { ...temporaryLayouts, ...temporaryLayoutPatch };
  });
  return temporaryLayouts.below.top;
};

describe('a widget under two side-by-side texts that grow', () => {
  it('[DynamicHeight-SIDE-001] sits its drawn gap under the lower text, not pushed by the sum of both growths', () => {
    expect(
      growInTurn([
        ['left', 200],
        ['right', 300],
      ])
    ).toBe(320);
  });

  it('[DynamicHeight-SIDE-002] lands in the same place whichever text grows first', () => {
    expect(
      growInTurn([
        ['right', 300],
        ['left', 200],
      ])
    ).toBe(320);
  });

  it('[DynamicHeight-SIDE-003] is pushed by the whole growth of a single text', () => {
    expect(growInTurn([['left', 200]])).toBe(220);
  });
});
