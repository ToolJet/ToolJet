import { lazyCopies } from '../clone';
import { deepFreezeInSlices } from '../freeze';
import { MemoryBudgetError } from '../memory';

const GB = 1024 * 1024 * 1024;

describe('lazyCopies', () => {
  const source = () => ({ q1: { data: [{ id: 1 }] }, q2: { data: [{ id: 2 }] } });

  afterEach(() => {
    delete performance.memory;
    delete window.public_config;
  });

  test('reads like a deep copy, and changing it never touches the source', () => {
    const original = source();
    const copy = lazyCopies(original, 'queries');
    expect(copy).toEqual(original);
    copy.q1.data.push({ id: 3 });
    copy.q1.data[0].id = 9;
    expect(original.q1.data).toEqual([{ id: 1 }]);
    expect(copy.q1.data).toEqual([{ id: 9 }, { id: 3 }]);
  });

  test('copies a value only when it is read, once', () => {
    const original = source();
    const copy = lazyCopies(original, 'queries');
    expect(Object.keys(copy)).toEqual(['q1', 'q2']);
    const first = copy.q1;
    expect(copy.q1).toBe(first);
    expect(first).not.toBe(original.q1);
  });

  test('top-level writes and deletes behave as on a plain object', () => {
    const copy = lazyCopies(source(), 'queries');
    copy.q2 = 'replaced';
    expect(copy.q2).toBe('replaced');
    delete copy.q1;
    expect('q1' in copy).toBe(false);
  });

  test('works on frozen state', () => {
    const frozen = Object.freeze({ q1: Object.freeze({ data: Object.freeze([1, 2]) }) });
    const copy = lazyCopies(frozen, 'queries');
    copy.q1.data.push(3);
    expect(copy.q1.data).toEqual([1, 2, 3]);
  });

  test("a copy that wouldn't fit in the tab's memory throws, naming what it copies", async () => {
    const rows = Array.from({ length: 3000 }, (_, i) => ({ id: i, name: `row ${i}` }));
    await deepFreezeInSlices(rows);
    const queries = { big: Object.freeze({ data: rows }) };
    Object.defineProperty(performance, 'memory', {
      value: { jsHeapSizeLimit: 4 * GB, usedJSHeapSize: 4 * GB },
      configurable: true,
    });
    const copy = lazyCopies(queries, 'queries');
    expect(() => copy.big).toThrow(MemoryBudgetError);
    expect(() => copy.big).toThrow(/queries.big/);
  });

  test('the user-copies switch copies everything at once, as before', () => {
    window.public_config = { DISABLE_BACKGROUND_DATA: 'user-copies' };
    const original = source();
    const copy = lazyCopies(original, 'queries');
    expect(Object.getOwnPropertyDescriptor(copy, 'q1').get).toBeUndefined();
    expect(copy).toEqual(original);
  });
});
