import { flushDynamicHeight } from '../engine';

const widget = (id, type, top, left, width, height, { parent = null, properties = {}, mobile = null } = {}) => ({
  id,
  component: { component: type, parent, definition: { styles: {}, properties: {} } },
  layouts: { desktop: { top, left, width, height }, ...(mobile ? { mobile } : {}) },
  properties,
});

// The store freezes its state, as Immer does.
const deepFreeze = (value) => {
  if (value && typeof value === 'object') Object.values(Object.freeze(value)).forEach(deepFreeze);
  return value;
};

// `widgets`: the canvas's widgets, or { [moduleId]: widgets } for embedded
// modules. `exposed`: { [id]: { [property]: value } } exposed values.
const createState = (widgets, temporaryLayouts = {}, { exposed = {}, currentLayout = 'desktop' } = {}) => {
  const modules = Array.isArray(widgets) ? { canvas: widgets } : widgets;
  const componentsOf = Object.fromEntries(
    Object.entries(modules).map(([moduleId, list]) => [moduleId, Object.fromEntries(list.map((w) => [w.id, w]))])
  );
  const all = Object.values(modules).flat();
  const find = (id) => all.find((w) => w.id === id);
  const state = {
    currentLayout,
    temporaryLayouts: deepFreeze(temporaryLayouts),
    getCurrentPageComponents: (moduleId = 'canvas') => componentsOf[moduleId],
    getResolvedComponent: (id) => ({ properties: find(id)?.properties ?? {} }),
    getComponentTypeFromId: (id) => find(id)?.component?.component,
    getExposedPropertyForAdditionalActions: (id, contextIndices, property) => exposed[id]?.[property],
    getComponentDefinition: (id) => find(id),
    getResolvedValue: (value) => value,
    calculateMoveableBoxHeightWithId: (id, layout = 'desktop') => find(id).layouts[layout].height,
    getBaseParentId: (parentId) => parentId?.match(/^([^-]+)-.+$/)?.[1] ?? parentId,
    getContainerChildrenMapping: (id) => all.filter((w) => w.component.parent === id).map((w) => w.id),
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

  it('keeps the last known height of a leaf that reports without a measurement, without reading the DOM', () => {
    const state = createState(
      [widget('text', 'Text', 0, 0, 43, 100, { properties: dynamic }), widget('button', 'Button', 110, 0, 43, 40)],
      { text: { top: 0, left: 0, width: 43, height: 140 }, button: { top: 150 } }
    );
    const querySelector = jest.spyOn(document, 'querySelector');
    flushDynamicHeight(() => state, {
      requests: [{ id: 'text', layout: 'desktop', isContainer: false, contextIndices: null, moduleId: 'canvas' }],
    });
    expect(querySelector).not.toHaveBeenCalled();
    expect(state.temporaryLayouts.text.height).toBe(140);
    expect(state.temporaryLayouts.button.top).toBe(150);
    querySelector.mockRestore();
  });

  describe('when a widget cannot be processed', () => {
    // `bad` sits in its own container, so only that container's slot is lost.
    const brokenState = () => {
      const state = createState([
        widget('box', 'Container', 0, 0, 43, 100, { properties: dynamic }),
        widget('bad', 'Text', 0, 0, 43, 50, { parent: 'box', properties: dynamic }),
        widget('text', 'Text', 110, 0, 43, 100, { properties: dynamic }),
        widget('button', 'Button', 220, 0, 43, 40),
      ]);
      const resolve = state.getResolvedComponent;
      state.getResolvedComponent = (id, context) => {
        if (id === 'bad') throw new Error('boom');
        return resolve(id, context);
      };
      return state;
    };
    const request = (id) => ({ id, layout: 'desktop', isContainer: false, contextIndices: null, moduleId: 'canvas' });

    it('throws outside production, so a broken pass is never silent', () => {
      const state = brokenState();
      expect(() =>
        flushDynamicHeight(() => state, { requests: [request('bad')], measuredHeights: new Map([['bad', 140]]) })
      ).toThrow('boom');
    });

    it('in production still applies the rest of the pass, logs, and reports the module', () => {
      const nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onError = jest.fn();
      try {
        const state = brokenState();
        flushDynamicHeight(() => state, {
          requests: [request('bad'), request('text')],
          measuredHeights: new Map([
            ['bad', 140],
            ['text', 140],
          ]),
          onError,
        });
        expect(state.temporaryLayouts.button.top).toBe(260);
        expect(state.temporaryLayouts.box).toBeUndefined();
        expect(error).toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith('canvas', expect.any(Error));
      } finally {
        process.env.NODE_ENV = nodeEnv;
        error.mockRestore();
      }
    });
  });

  describe('containers by height contract', () => {
    const leafRequest = (id, contextIndices = null, moduleId = 'canvas') => ({
      id,
      layout: 'desktop',
      isContainer: false,
      contextIndices,
      moduleId,
    });

    it('sizes tabs from the active pane only', () => {
      const tabs = { ...dynamic, tabItems: [{ id: '0' }, { id: '1' }] };
      const build = (currentTab) =>
        createState(
          [
            widget('tabs', 'Tabs', 0, 0, 43, 300, { properties: tabs }),
            widget('short', 'Text', 0, 0, 43, 50, { parent: 'tabs-0' }),
            widget('tall', 'Text', 0, 0, 43, 50, { parent: 'tabs-1', properties: dynamic }),
            widget('btn', 'Button', 310, 0, 43, 40),
          ],
          {},
          { exposed: { tabs: { currentTab } } }
        );
      const run = (state) =>
        flushDynamicHeight(() => state, { requests: [leafRequest('tall')], measuredHeights: new Map([['tall', 400]]) });

      const showingTall = build('1');
      run(showingTall);
      expect(showingTall.temporaryLayouts.tabs.height).toBeGreaterThan(400);
      expect(showingTall.temporaryLayouts.btn.top).toBe(showingTall.temporaryLayouts.tabs.height + 10);

      const showingShort = build('0');
      run(showingShort);
      expect(showingShort.temporaryLayouts.tabs).toBeUndefined();
      expect(showingShort.temporaryLayouts.btn).toBeUndefined();
    });

    it('lets a collapsed accordion shrink below its drawn height and pulls the widgets below it up', () => {
      const build = (isExpanded) =>
        createState(
          [
            widget('acc', 'Accordion', 0, 0, 43, 400, { properties: dynamic }),
            widget('text', 'Text', 0, 0, 43, 100, { parent: 'acc', properties: dynamic }),
            widget('btn', 'Button', 410, 0, 43, 40),
          ],
          {},
          { exposed: { acc: { isExpanded } } }
        );
      const run = (state) =>
        flushDynamicHeight(() => state, { requests: [leafRequest('text')], measuredHeights: new Map([['text', 500]]) });

      const collapsed = build(false);
      run(collapsed);
      expect(collapsed.temporaryLayouts.acc.height).toBeLessThan(400);
      expect(collapsed.temporaryLayouts.btn.top).toBe(collapsed.temporaryLayouts.acc.height + 10);

      const expanded = build(true);
      run(expanded);
      expect(expanded.temporaryLayouts.acc.height).toBeGreaterThan(500);
      expect(expanded.temporaryLayouts.btn.top).toBe(expanded.temporaryLayouts.acc.height + 10);
    });

    it('sizes a modal body without moving anything on the canvas', () => {
      const state = createState([
        widget('modal', 'ModalV2', 0, 0, 43, 300, { properties: dynamic }),
        widget('text', 'Text', 0, 0, 43, 100, { parent: 'modal', properties: dynamic }),
        widget('btn', 'Button', 310, 0, 43, 40),
      ]);
      flushDynamicHeight(() => state, { requests: [leafRequest('text')], measuredHeights: new Map([['text', 400]]) });
      expect(state.temporaryLayouts['modal-body'].height).toBeGreaterThanOrEqual(400);
      expect(state.temporaryLayouts.modal).toBeUndefined();
      expect(state.temporaryLayouts.btn).toBeUndefined();
      expect(state.incrementCanvasUpdater).not.toHaveBeenCalled();
    });

    it('carries growth out through two levels of list view rows', () => {
      const rows = { ...dynamic, dataSourceSelector: 'rawJson', data: [{}, {}], rowHeight: 60 };
      const state = createState(
        [
          widget('outer', 'Listview', 0, 0, 43, 150, { properties: rows }),
          widget('inner', 'Listview', 0, 0, 43, 60, { parent: 'outer', properties: rows }),
          widget('leaf', 'Text', 0, 0, 43, 20, { parent: 'inner', properties: dynamic }),
          widget('btn', 'Button', 160, 0, 43, 40),
        ],
        {
          'leaf-0.0': { top: 0, height: 20 },
          'leaf-0.1': { top: 0, height: 20 },
          'leaf-1.0': { top: 0, height: 20 },
          'leaf-1.1': { top: 0, height: 20 },
        }
      );
      flushDynamicHeight(() => state, {
        requests: [leafRequest('leaf', [0, 1])],
        measuredHeights: new Map([['leaf-0.1', 200]]),
      });
      const temps = state.temporaryLayouts;
      expect(temps['inner-0.1'].height).toBeGreaterThanOrEqual(200);
      expect(temps['inner-0'].height).toBeGreaterThan(temps['inner-0.1'].height);
      expect(temps['outer-0'].height).toBeGreaterThanOrEqual(temps['inner-0'].height);
      expect(temps.outer.height).toBeGreaterThan(temps['outer-0'].height);
      expect(temps.btn.top).toBe(temps.outer.height + 10);
    });

    it('writes only heights for the children of a flex container', () => {
      const state = createState([
        widget('flex', 'FlexContainer', 0, 0, 43, 200, { properties: dynamic }),
        widget('a', 'Text', 0, 0, 43, 50, { parent: 'flex', properties: dynamic }),
        widget('b', 'Text', 60, 0, 43, 50, { parent: 'flex' }),
      ]);
      flushDynamicHeight(() => state, { requests: [leafRequest('a')], measuredHeights: new Map([['a', 300]]) });
      expect(state.temporaryLayouts.a).toMatchObject({ top: 0, height: 300 });
      expect(state.temporaryLayouts.b).toBeUndefined();
    });

    it('pins an embedded module root to the top and fits it to its content', () => {
      const state = createState({
        canvas: [],
        mod1: [
          widget('root', 'ModuleContainer', 50, 0, 43, 400, { properties: dynamic }),
          widget('text', 'Text', 0, 0, 43, 100, { parent: 'root', properties: dynamic }),
        ],
      });
      flushDynamicHeight(() => state, {
        requests: [leafRequest('text', null, 'mod1')],
        measuredHeights: new Map([['mod1::text', 100]]),
      });
      const root = state.temporaryLayouts['mod1::root'];
      expect(root.top).toBe(0);
      expect(root.height).toBeLessThan(400);
      expect(root.height).toBeGreaterThanOrEqual(100);
    });
  });

  it('places widgets from the mobile layout when that is the current layout', () => {
    const state = createState(
      [
        widget('text', 'Text', 0, 0, 43, 100, {
          properties: dynamic,
          mobile: { top: 0, left: 0, width: 43, height: 60 },
        }),
        widget('btn', 'Button', 300, 0, 43, 40, { mobile: { top: 70, left: 0, width: 43, height: 40 } }),
      ],
      {},
      { currentLayout: 'mobile' }
    );
    flushDynamicHeight(() => state, {
      requests: [{ id: 'text', layout: 'mobile', isContainer: false, contextIndices: null, moduleId: 'canvas' }],
      measuredHeights: new Map([['text', 200]]),
    });
    expect(state.temporaryLayouts.btn.top).toBe(210);
  });
});
