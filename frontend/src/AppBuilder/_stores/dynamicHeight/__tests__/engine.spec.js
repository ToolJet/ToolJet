import { flushDynamicHeight } from '../engine';

const widget = (id, type, top, left, width, height, { parent = null, properties = {} } = {}) => ({
  id,
  component: { component: type, parent, definition: { styles: {}, properties: {} } },
  layouts: { desktop: { top, left, width, height } },
  properties,
});

const createState = (widgets, temporaryLayouts = {}) => {
  const components = Object.fromEntries(widgets.map((w) => [w.id, w]));
  const state = {
    currentLayout: 'desktop',
    temporaryLayouts,
    getCurrentPageComponents: () => components,
    getResolvedComponent: (id) => ({ properties: components[id]?.properties ?? {} }),
    getComponentTypeFromId: (id) => components[id]?.component?.component,
    getExposedPropertyForAdditionalActions: () => undefined,
    getComponentDefinition: (id) => components[id],
    getResolvedValue: (value) => value,
    calculateMoveableBoxHeightWithId: (id) => components[id].layouts.desktop.height,
    getBaseParentId: (parentId) => parentId?.match(/^([^-]+)-.+$/)?.[1] ?? parentId,
    getContainerChildrenMapping: (id) => widgets.filter((w) => w.component.parent === id).map((w) => w.id),
    setTemporaryLayouts: (patch) => {
      state.temporaryLayouts = { ...state.temporaryLayouts, ...patch };
    },
    incrementCanvasUpdater: jest.fn(),
  };
  return state;
};

const dynamic = { dynamicHeight: true };

describe('dynamic height engine', () => {
  it('pushes the widgets below a grown widget and updates the canvas once', () => {
    const state = createState([
      widget('text', 'Text', 0, 0, 43, 100, { properties: dynamic }),
      widget('button', 'Button', 110, 0, 43, 40),
    ]);
    flushDynamicHeight(() => state, {
      requests: [{ id: 'text', layout: 'desktop', isContainer: false, contextIndices: null, moduleId: 'canvas' }],
      measuredHeights: new Map([['text', 140]]),
    });
    expect(state.temporaryLayouts.text).toMatchObject({ top: 0, height: 140 });
    expect(state.temporaryLayouts.button).toMatchObject({ top: 150, height: 40 });
    expect(state.incrementCanvasUpdater).toHaveBeenCalledTimes(1);
  });

  it('grows a dynamic container from its solved children and pushes its siblings', () => {
    const state = createState([
      widget('box', 'Container', 0, 0, 43, 200, { properties: dynamic }),
      widget('text', 'Text', 10, 0, 43, 100, { parent: 'box', properties: dynamic }),
      widget('footer', 'Button', 210, 0, 43, 40),
    ]);
    flushDynamicHeight(() => state, {
      requests: [{ id: 'text', layout: 'desktop', isContainer: false, contextIndices: null, moduleId: 'canvas' }],
      measuredHeights: new Map([['text', 400]]),
    });
    const boxHeight = state.temporaryLayouts.box.height;
    expect(boxHeight).toBeGreaterThan(410);
    expect(state.temporaryLayouts.footer.top).toBe(boxHeight + 10);
  });

  it('writes nothing when every widget is at its saved size', () => {
    const state = createState([
      widget('text', 'Text', 0, 0, 43, 100, { properties: dynamic }),
      widget('button', 'Button', 110, 0, 43, 40),
    ]);
    const patch = flushDynamicHeight(() => state, { fullModules: ['canvas'] });
    expect(patch).toEqual({});
  });

  it('places widgets again after a saved-layout change, from the heights it already knows', () => {
    const state = createState(
      [widget('text', 'Text', 0, 0, 43, 100, { properties: dynamic }), widget('button', 'Button', 300, 0, 43, 40)],
      { text: { top: 0, left: 0, width: 43, height: 140 }, button: { top: 150 } }
    );
    flushDynamicHeight(() => state, { fullModules: ['canvas'] });
    expect(state.temporaryLayouts.button.top).toBe(340);
  });
});
