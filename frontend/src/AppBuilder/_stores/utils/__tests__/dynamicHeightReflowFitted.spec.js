import { buildReflowPatch } from '../dynamicHeightReflow';

// A widget 'above' (drawn 40 tall) grows to 64 and moves 'list' (drawn 260 tall at top 60), whose own reflow already
// fitted it to 236. A pack widget (LibraryComponent) keeps that fitted height when it moves; a native widget is floored at its drawn
// height, as before. Flooring a pack's List view made its height depend on which reflow came last (236 or 260).
const move = (listType) => {
  const components = {
    above: {
      component: { component: 'Text', parent: null },
      layouts: { desktop: { top: 0, left: 0, width: 20, height: 40 } },
    },
    list: {
      component: { component: listType, parent: null },
      layouts: { desktop: { top: 60, left: 0, width: 20, height: 260 } },
    },
  };
  const { temporaryLayoutPatch } = buildReflowPatch({
    changedComponentId: 'above',
    componentIds: ['above', 'list'],
    currentLayout: 'desktop',
    currentPageComponents: components,
    temporaryLayouts: { list: { top: 60, height: 236 } },
    contextIndices: null,
    inFlowMap: { above: true, list: true },
    resolvedHeights: { above: 64, list: 236 },
    collapseWhenHiddenMap: {},
    calculateMoveableBoxHeightWithId: (id) => components[id].layouts.desktop.height,
    getComponentDefinition: (id) => components[id],
  });
  return temporaryLayoutPatch.list;
};

describe('a widget moved by a sibling above it', () => {
  it('keeps the height a pack widget fitted to its content', () => {
    expect(move('LibraryComponent')).toEqual(expect.objectContaining({ top: 84, height: 236 }));
  });

  it('floors a native widget at its drawn height', () => {
    expect(move('Text')).toEqual(expect.objectContaining({ top: 84, height: 260 }));
  });
});
