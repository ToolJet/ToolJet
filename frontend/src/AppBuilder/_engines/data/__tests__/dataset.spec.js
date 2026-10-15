import { filterIndexes, filterIndexesInSlices, mergeSortSteps, rankSteps, stepsInSlices } from '../dataset';
import { allIndexes, createIndexBuilder, rowsAt, mapIndexes } from '../indexList';

const always = () => true;
const runAll = (step) => {
  let result;
  while (!(result = step(always)));
  return result;
};
// A queue whose tasks run when flushed, and a clock that advances 1 ms per reading.
const harness = () => {
  let time = 0;
  const tasks = [];
  return {
    options: { now: () => time++, schedule: (fn) => tasks.push(fn), sliceMs: 3 },
    flush: () => {
      while (tasks.length) tasks.shift()();
    },
  };
};

describe('index lists', () => {
  test('allIndexes, the builder and the readers', () => {
    expect(Array.from(allIndexes(4))).toEqual([0, 1, 2, 3]);
    const builder = createIndexBuilder(2);
    [5, 1, 9, 3].forEach((i) => builder.push(i));
    const list = builder.done();
    expect(list).toBeInstanceOf(Int32Array);
    expect(Array.from(list)).toEqual([5, 1, 9, 3]);
    const data = Array.from({ length: 10 }, (_, i) => ({ i }));
    expect(rowsAt(data, list)).toEqual([data[5], data[1], data[9], data[3]]);
    expect(mapIndexes(list, (p, k) => p * 10 + k)).toEqual([50, 11, 92, 33]);
  });
});

describe('filterIndexes', () => {
  test('keeps the passing positions in order, among candidates when given', () => {
    const odd = (i) => i % 2 === 1;
    expect(Array.from(filterIndexes(7, odd))).toEqual([1, 3, 5]);
    expect(Array.from(filterIndexes(7, odd, Int32Array.from([5, 2, 3])))).toEqual([5, 3]);
    expect(Array.from(filterIndexes(3, null))).toEqual([0, 1, 2]);
  });

  test('in slices gives the same result', async () => {
    const h = harness();
    let result;
    const passes = (i) => i % 7 === 0;
    const done = filterIndexesInSlices(5000, passes, null, (list) => (result = list), h.options);
    h.flush();
    await done;
    expect(Array.from(result)).toEqual(Array.from(filterIndexes(5000, passes)));
  });
});

describe('mergeSortSteps', () => {
  test('sorts like a stable Array sort, for arrays and Int32Arrays', () => {
    const values = Array.from({ length: 20000 }, (_, i) => (i * 7919) % 101);
    const byValue = (a, b) => values[a] - values[b];
    const expected = Array.from({ length: values.length }, (_, i) => i).sort(byValue);
    expect(Array.from(runAll(mergeSortSteps(allIndexes(values.length), byValue)))).toEqual(expected);
    expect(
      runAll(
        mergeSortSteps(
          Array.from({ length: values.length }, (_, i) => i),
          byValue
        )
      )
    ).toEqual(expected);
  });
});

describe('rankSteps', () => {
  test('ranks rows by their value, ties sharing a rank', () => {
    // 4 distinct values among 120 rows: few enough to rank.
    const values = Array.from({ length: 10 }, () => [
      'b',
      'A',
      'a',
      'c',
      'b',
      'A',
      'a',
      'c',
      'b',
      'c',
      'a',
      'b',
    ]).flat();
    const indexes = allIndexes(values.length);
    const compareRows = (a, b) => values[a].toLowerCase().localeCompare(values[b].toLowerCase());
    const { step, ranks } = rankSteps({ indexes, size: values.length, valueOf: (i) => values[i], compareRows });
    runAll(step);
    const r = ranks();
    for (let a = 0; a < values.length; a++) {
      for (let b = 0; b < values.length; b++) expect(Math.sign(r[a] - r[b])).toBe(Math.sign(compareRows(a, b)));
    }
  });

  test('a column of mostly distinct values is not ranked', () => {
    const indexes = allIndexes(100);
    const { step, ranks } = rankSteps({ indexes, size: 100, valueOf: (i) => i, compareRows: (a, b) => a - b });
    runAll(step);
    expect(ranks()).toBeNull();
  });
});

describe('stepsInSlices', () => {
  test('runs each step to the end, in order, then onDone', async () => {
    const h = harness();
    const log = [];
    let counts = [3, 2];
    const steps = counts.map((_, s) => () => {
      log.push(s);
      counts[s] -= 1;
      return counts[s] === 0;
    });
    const done = stepsInSlices(steps, () => log.push('done'), h.options);
    h.flush();
    await done;
    expect(log).toEqual([0, 0, 0, 1, 1, 'done']);
  });
});
