import { flushDynamicHeight } from '../engine';
import { expectMeasurement, measurementArrived, scheduleDynamicHeight, scheduleMeasuredHeights } from '../scheduler';

jest.mock('../engine', () => ({ flushDynamicHeight: jest.fn() }));

let frames = [];
global.requestAnimationFrame = (callback) => frames.push(callback);
const nextFrame = () => {
  const current = frames;
  frames = [];
  current.forEach((callback) => callback());
};

const state = {};
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
});
