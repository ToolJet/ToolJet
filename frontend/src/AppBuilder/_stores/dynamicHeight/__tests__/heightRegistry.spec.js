import { scheduleMeasuredHeights } from '../scheduler';

jest.mock('../scheduler', () => ({ scheduleMeasuredHeights: jest.fn() }));

let reportSizes;
global.ResizeObserver = class {
  constructor(callback) {
    reportSizes = (entries) => callback(entries);
  }
  observe() {}
  unobserve() {}
};

// Imported after the ResizeObserver stub, since the registry creates its observer on load.
const { observeHeight, setHeightFrozen, unobserveHeight } = require('../heightRegistry');

const report = (target, blockSize) => reportSizes([{ target, borderBoxSize: [{ blockSize }] }]);

describe('height registry', () => {
  const get = () => ({});
  let element;

  beforeEach(() => {
    scheduleMeasuredHeights.mockClear();
    element = document.createElement('div');
    observeHeight(element, {
      key: 'text1',
      id: 'text1',
      contextIndices: null,
      moduleId: 'canvas',
      layout: 'desktop',
      get,
    });
  });

  afterEach(() => unobserveHeight(element, 'text1'));

  it('sends a rounded height for the reporting widget', () => {
    report(element, 120.4);
    expect(scheduleMeasuredHeights).toHaveBeenCalledWith(get, [expect.objectContaining({ id: 'text1', height: 120 })]);
  });

  it('drops a report when the height did not change', () => {
    report(element, 120);
    report(element, 120);
    expect(scheduleMeasuredHeights).toHaveBeenCalledTimes(1);
  });

  it('ignores a 0 px report from a widget inside a hidden parent', () => {
    report(element, 0);
    expect(scheduleMeasuredHeights).not.toHaveBeenCalled();
  });

  it('ignores reports while the widget is frozen', () => {
    setHeightFrozen('text1', true);
    report(element, 300);
    setHeightFrozen('text1', false);
    expect(scheduleMeasuredHeights).not.toHaveBeenCalled();
  });
});
