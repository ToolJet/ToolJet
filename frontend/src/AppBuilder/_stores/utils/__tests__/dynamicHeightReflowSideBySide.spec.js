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

// The same two texts as pack components (which fit their content, so start shorter than drawn), under a Switch whose
// lane covers the widget below. The Switch keeps its drawn gap to that widget plus how much the fitted widgets between
// them changed: side-by-side texts were each added, so the widget sat the smaller text's growth too far down.
const growUnderSwitch = (textType, steps, { switchWidth = 10 } = {}) => {
  const components = {
    switch: {
      component: { component: 'ToggleSwitchV2', parent: null },
      layouts: { desktop: { top: 0, left: 0, width: switchWidth, height: 40 } },
    },
    left: {
      component: { component: textType, parent: null },
      layouts: { desktop: { top: 60, left: 0, width: 20, height: 40 } },
    },
    right: {
      component: { component: textType, parent: null },
      layouts: { desktop: { top: 60, left: 20, width: 23, height: 40 } },
    },
    below: {
      component: { component: 'Button', parent: null },
      layouts: { desktop: { top: 120, left: 0, width: 43, height: 40 } },
    },
  };
  const heights = { switch: 40, left: 40, right: 40, below: 40 };
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
      inFlowMap: { switch: true, left: true, right: true, below: true },
      resolvedHeights: { ...heights },
      collapseWhenHiddenMap: {},
      calculateMoveableBoxHeightWithId: (id) => components[id].layouts.desktop.height,
      getComponentDefinition: (id) => components[id],
    });
    temporaryLayouts = { ...temporaryLayouts, ...temporaryLayoutPatch };
  });
  return temporaryLayouts.below.top;
};

// Fitted to 32 on mount, then grown to 60 and 116 (the heights measured in the browser): 60 + 116 + 20.
const FIT_THEN_GROW = [
  ['left', 32],
  ['right', 32],
  ['left', 60],
  ['right', 116],
];

describe('a widget under two side-by-side pack texts that grow, below a widget over its lane', () => {
  it.each(['PackComponent', 'ShadText'])(
    '[DynamicHeight-SIDE-004] %s: sits its drawn gap under the lower text',
    (textType) => {
      expect(growUnderSwitch(textType, FIT_THEN_GROW)).toBe(196);
    }
  );

  it('[DynamicHeight-SIDE-005] PackComponent: lands in the same place whichever text grows first', () => {
    expect(
      growUnderSwitch('PackComponent', [
        ['right', 32],
        ['left', 32],
        ['right', 116],
        ['left', 60],
      ])
    ).toBe(196);
  });

  // A widget above as wide as the one below (a full-width header) sets its floor from the drawn gap plus how much the
  // fitted widgets between them changed: that sum counted both side-by-side texts too.
  it('[DynamicHeight-SIDE-007] PackComponent: sits its drawn gap under the lower text below a full-width widget', () => {
    expect(growUnderSwitch('PackComponent', FIT_THEN_GROW, { switchWidth: 43 })).toBe(196);
  });

  it('[DynamicHeight-SIDE-006] native Text keeps its place, as before', () => {
    expect(
      growUnderSwitch('Text', [
        ['left', 60],
        ['right', 116],
      ])
    ).toBe(196);
  });
});
