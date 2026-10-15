import { canAllocate, ensure, headroom, MemoryBudgetError, estimateBytes, firstReport } from '../memory';

const GB = 1024 * 1024 * 1024;
const setMemory = (memory) => Object.defineProperty(performance, 'memory', { value: memory, configurable: true });

describe('memory', () => {
  afterEach(() => {
    delete performance.memory;
    delete window.public_config;
  });

  test('nothing is refused where the browser does not report memory', () => {
    setMemory(undefined);
    expect(headroom()).toBe(Infinity);
    expect(canAllocate(100 * GB)).toBe(true);
    expect(() => ensure(100 * GB, 'a copy')).not.toThrow();
  });

  test('refuses what would come within the reserve of the limit, with a message', () => {
    setMemory({ jsHeapSizeLimit: 4 * GB, usedJSHeapSize: 3 * GB });
    // 4 GB limit, 12% reserve (0.48 GB), 3 GB used: ~0.52 GB free.
    expect(canAllocate(0.4 * GB)).toBe(true);
    expect(canAllocate(0.6 * GB)).toBe(false);
    expect(() => ensure(2 * GB, 'a copy of queries.q')).toThrow(MemoryBudgetError);
    expect(() => ensure(2 * GB, 'a copy of queries.q')).toThrow(/a copy of queries.q needs about 2.0 GB/);
  });

  test('the memory switch turns refusals off', () => {
    setMemory({ jsHeapSizeLimit: 4 * GB, usedJSHeapSize: 3.9 * GB });
    window.public_config = { DISABLE_BACKGROUND_DATA: 'memory' };
    expect(canAllocate(10 * GB)).toBe(true);
  });

  test('estimates a 21-key row of short strings at roughly what it takes', () => {
    const row = estimateBytes({ objects: 3, slots: 25, chars: 250 });
    expect(row).toBeGreaterThan(600);
    expect(row).toBeLessThan(1000);
  });

  test('a refusal is reported once per key', () => {
    expect(firstReport('k')).toBe(true);
    expect(firstReport('k')).toBe(false);
  });
});
