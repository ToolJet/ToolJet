import { runSliced, forSliced } from '../slices';

// A clock that advances 1 ms per reading, and a queue whose tasks run when flushed.
const harness = () => {
  let time = 0;
  const tasks = [];
  return {
    now: () => time++,
    schedule: (fn) => tasks.push(fn),
    flush: () => {
      while (tasks.length) tasks.shift()();
    },
    tasks,
  };
};

describe('runSliced', () => {
  test('finishes inline and returns null when the work fits in the first slice', () => {
    const { now, schedule } = harness();
    expect(runSliced(() => true, { now, schedule })).toBeNull();
  });

  test('continues one slice per task until the work is done', async () => {
    const h = harness();
    let calls = 0;
    const done = runSliced(() => ++calls === 3, { now: h.now, schedule: h.schedule });
    expect(done).toBeInstanceOf(Promise);
    expect(calls).toBe(1);
    h.flush();
    await done;
    expect(calls).toBe(3);
  });

  test('without inline, nothing runs before the first task', () => {
    const h = harness();
    let calls = 0;
    runSliced(() => ++calls > 0, { inline: false, now: h.now, schedule: h.schedule });
    expect(calls).toBe(0);
    h.flush();
    expect(calls).toBe(1);
  });

  test('cancel stops further slices and settles the promise', async () => {
    const h = harness();
    let calls = 0;
    const done = runSliced(() => (calls++, false), { now: h.now, schedule: h.schedule });
    done.cancel();
    h.flush();
    await done;
    expect(calls).toBe(1);
  });

  test('inTime turns false once the slice is spent', () => {
    const h = harness();
    let readings = 0;
    runSliced(
      (inTime) => {
        while (inTime()) readings++;
        return true;
      },
      { now: h.now, schedule: h.schedule, sliceMs: 5 }
    );
    expect(readings).toBe(4);
  });
});

describe('forSliced', () => {
  test('visits every index once, in order, across slices', async () => {
    const h = harness();
    const seen = [];
    const done = forSliced(2000, (i) => seen.push(i), { now: h.now, schedule: h.schedule, sliceMs: 2 });
    h.flush();
    await done;
    expect(seen).toEqual(Array.from({ length: 2000 }, (_, i) => i));
  });
});
