import { flushDynamicHeight } from '../engine';
import {
  expectMeasurement,
  measurementArrived,
  scheduleDynamicHeight,
  scheduleMeasuredHeights,
  watchEditMode,
} from '../scheduler';

jest.mock('../engine', () => ({ flushDynamicHeight: jest.fn() }));

let frames = [];
global.requestAnimationFrame = (callback) => frames.push(callback);
const nextFrame = () => {
  const current = frames;
  frames = [];
  current.forEach((callback) => callback());
};

const state = { modeStore: { modules: { canvas: { currentMode: 'view' } } } };
const get = () => state;
const rowRequest = { id: 'list', layout: 'desktop', isContainer: true, contextIndices: [4], moduleId: 'canvas' };

describe('dynamic height scheduler', () => {
  beforeEach(() => {
    frames = [];
    flushDynamicHeight.mockClear();
  });

  it('waits for a newly observed widget to report its height before sizing its container', () => {
    expectMeasurement('body-4');
    scheduleDynamicHeight(get, rowRequest);
    nextFrame();
    expect(flushDynamicHeight).not.toHaveBeenCalled();

    measurementArrived('body-4');
    scheduleMeasuredHeights(get, [
      { key: 'body-4', id: 'body', contextIndices: [4], moduleId: 'canvas', layout: 'desktop', height: 90 },
    ]);
    nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(1);
    const [, { requests, measuredHeights }] = flushDynamicHeight.mock.calls[0];
    expect(requests).toHaveLength(2);
    expect(measuredHeights.get('body-4')).toBe(90);
  });

  it('stops waiting after a few frames when a widget never reports', () => {
    expectMeasurement('body-7');
    scheduleDynamicHeight(get, rowRequest);
    for (let i = 0; i < 10 && frames.length; i++) nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(1);
    measurementArrived('body-7');
  });

  it('runs on the next frame when every observed widget has reported', () => {
    scheduleDynamicHeight(get, rowRequest);
    nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(1);
  });

  it('does not keep waiting on later flushes for a widget that never reported', () => {
    expectMeasurement('ghost');
    scheduleDynamicHeight(get, rowRequest);
    for (let i = 0; i < 10 && frames.length; i++) nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(1);

    scheduleDynamicHeight(get, rowRequest);
    nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(2);
  });

  it('solves the whole module again, once, after a pass that reported a failure', () => {
    flushDynamicHeight.mockImplementation((_, { onError }) => onError?.('canvas', new Error('boom')));
    scheduleDynamicHeight(get, rowRequest);
    nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(1);

    nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(2);
    expect(flushDynamicHeight.mock.calls[1][1].fullModules).toEqual(['canvas']);

    nextFrame();
    expect(flushDynamicHeight).toHaveBeenCalledTimes(2);
    flushDynamicHeight.mockReset();
  });

  it('does not solve a module the editor shows in edit mode, even when the request was queued in view mode', () => {
    scheduleDynamicHeight(get, rowRequest);
    state.modeStore.modules.canvas.currentMode = 'edit';
    nextFrame();
    state.modeStore.modules.canvas.currentMode = 'view';
    const [, { requests, fullModules }] = flushDynamicHeight.mock.calls[0];
    expect(requests).toEqual([]);
    expect(fullModules).toEqual([]);
  });

  describe('when the canvas switches to edit mode', () => {
    const modes = (canvas) => ({ modeStore: { modules: { canvas: { currentMode: canvas } } } });
    const storeWith = (temporaryLayouts) => {
      const store = { ...modes('edit'), temporaryLayouts, clearTemporaryLayouts: jest.fn() };
      return store;
    };

    beforeEach(() => {
      window.public_config = { ENABLE_DYNAMIC_HEIGHT_V2: 'true' };
    });
    afterEach(() => {
      delete window.public_config;
    });

    it('drops the positions the engine rendered while the page was loading in view mode', () => {
      const store = storeWith({ text1: { top: 120, height: 64 } });
      watchEditMode(() => store)(store, modes('view'));
      expect(store.clearTemporaryLayouts).toHaveBeenCalledTimes(1);
    });

    it('leaves the store alone when the canvas was already in edit mode', () => {
      const store = storeWith({ text1: { top: 120, height: 64 } });
      watchEditMode(() => store)(store, modes('edit'));
      expect(store.clearTemporaryLayouts).not.toHaveBeenCalled();
    });

    it('does not write to the store when there are no rendered positions', () => {
      const store = storeWith({});
      watchEditMode(() => store)(store, modes('view'));
      expect(store.clearTemporaryLayouts).not.toHaveBeenCalled();
    });
  });
});
