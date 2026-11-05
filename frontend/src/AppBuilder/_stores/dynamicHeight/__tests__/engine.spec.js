import { flushDynamicHeight } from '../engine';

const widget = (id, type, top, left, width, height, { parent = null, properties = {} } = {}) => ({
  id,
  component: { component: type, parent, definition: { styles: {}, properties: {} } },
  layouts: { desktop: { top, left, width, height } },
  properties,
});

// The store freezes its state, as Immer does.
const deepFreeze = (value) => {
  if (value && typeof value === 'object') Object.values(Object.freeze(value)).forEach(deepFreeze);
  return value;
};

const createState = (widgets, temporaryLayouts = {}) => {
  const components = Object.fromEntries(widgets.map((w) => [w.id, w]));
  const state = {
    currentLayout: 'desktop',
    temporaryLayouts: deepFreeze(temporaryLayouts),
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
      state.temporaryLayouts = deepFreeze({ ...state.temporaryLayouts, ...patch });
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

  it('sizes a list view from rows that report after the list view itself', () => {
    const listProperties = {
      ...dynamic,
      dataSourceSelector: 'rawJson',
      data: [{}, {}],
      showBorder: true,
      rowHeight: 30,
    };
    const state = createState(
      [
        widget('list', 'Listview', 0, 0, 43, 100, { properties: listProperties }),
        widget('body', 'Text', 0, 0, 43, 30, { parent: 'list', properties: dynamic }),
        widget('below', 'Button', 110, 0, 43, 40),
      ],
      { 'body-0': { top: 0, height: 50 }, 'body-1': { top: 0, height: 70 } }
    );
    const listRequest = (contextIndices) => ({
      id: 'list',
      layout: 'desktop',
      isContainer: true,
      contextIndices,
      moduleId: 'canvas',
    });
    flushDynamicHeight(() => state, { requests: [listRequest(null), listRequest([0]), listRequest([1])] });
    expect(state.temporaryLayouts.list.height).toBe(50 + 70 + 20);
    expect(state.temporaryLayouts.below.top).toBe(150);
  });

  it('resizes a list view again when rows it already sized grow', () => {
    const listProperties = { ...dynamic, dataSourceSelector: 'rawJson', data: [{}, {}], rowHeight: 30 };
    const state = createState(
      [
        widget('list', 'Listview', 0, 0, 43, 100, { properties: listProperties }),
        widget('body', 'Text', 0, 0, 43, 30, { parent: 'list', properties: dynamic }),
        widget('below', 'Button', 110, 0, 43, 40),
      ],
      {
        'body-0': { top: 0, height: 30 },
        'body-1': { top: 0, height: 30 },
        'list-0': { top: 0, height: 30 },
        'list-1': { top: 0, height: 30 },
        list: { top: 0, height: 100 },
      }
    );
    const bodyRequest = (row) => ({
      id: 'body',
      layout: 'desktop',
      isContainer: false,
      contextIndices: [row],
      moduleId: 'canvas',
    });
    flushDynamicHeight(() => state, {
      requests: [bodyRequest(0), bodyRequest(1)],
      measuredHeights: new Map([
        ['body-0', 90],
        ['body-1', 110],
      ]),
    });
    expect(state.temporaryLayouts.list.height).toBe(90 + 110 + 20);
    expect(state.temporaryLayouts.below.top).toBe(230);
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
