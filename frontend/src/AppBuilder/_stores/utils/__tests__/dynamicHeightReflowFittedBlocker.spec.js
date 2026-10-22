import { buildReflowPatch } from '../dynamicHeightReflow';

// A widget 'above' (drawn 40 tall) grows to 135 after 'grid' (drawn 620 tall) has fitted itself to 160. 'marker' sits
// 20 under the grid. A UI 2.0 grid's fitted height decides where the marker goes: reading it at its drawn 620 put the
// marker 480 too low whenever the grid fitted itself before 'above' did. A native grid keeps its drawn floor.
const reflow = (gridType) => {
  const components = {
    above: {
      component: { component: 'Text', parent: null },
      layouts: { desktop: { top: 0, left: 0, width: 43, height: 40 } },
    },
    grid: {
      component: { component: gridType, parent: null },
      layouts: { desktop: { top: 60, left: 0, width: 43, height: 620 } },
    },
    marker: {
      component: { component: 'Text', parent: null },
      layouts: { desktop: { top: 700, left: 0, width: 20, height: 30 } },
    },
  };
  const { temporaryLayoutPatch } = buildReflowPatch({
    changedComponentId: 'above',
    componentIds: ['above', 'grid', 'marker'],
    currentLayout: 'desktop',
    currentPageComponents: components,
    temporaryLayouts: { grid: { top: 60, height: 160 }, marker: { top: 240, height: 30 } },
    contextIndices: null,
    inFlowMap: { above: true, grid: true, marker: true },
    resolvedHeights: { above: 135, grid: 160, marker: 30 },
    collapseWhenHiddenMap: {},
    calculateMoveableBoxHeightWithId: (id) => components[id].layouts.desktop.height,
    getComponentDefinition: (id) => components[id],
  });
  return temporaryLayoutPatch;
};

describe('a widget below a fitted widget, moved by a reflow above both', () => {
  it('sits under the UI 2.0 widget at its fitted height', () => {
    const patch = reflow('ShadCardGrid');
    expect(patch.grid).toEqual(expect.objectContaining({ top: 155, height: 160 }));
    expect(patch.marker).toEqual(expect.objectContaining({ top: 335 }));
  });

  it('sits under a native widget at its drawn height', () => {
    const patch = reflow('Container');
    expect(patch.marker.top).toBe(155 + 620 + 20);
  });
});
