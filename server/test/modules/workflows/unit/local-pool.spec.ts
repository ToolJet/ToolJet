import { LocalPool, PoolWaitAbortedError, SingleFlight } from '@modules/workflows/admission/local-pool';

/** Work that finishes only when the test says so. */
const gate = () => {
  let open: () => void;
  const opened = new Promise<void>((resolve) => (open = resolve));
  return { opened, open: () => open() };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Per-pod pools for heavy local work (Python processes, bundle builds).
 *
 * @group workflows
 */
describe('LocalPool', () => {
  it('should run at most `size` jobs at once and start the next as one finishes, in order', async () => {
    const pool = new LocalPool('python', 2);
    const gates = [gate(), gate(), gate()];
    const started: number[] = [];
    const jobs = gates.map((g, i) =>
      pool.run(async () => {
        started.push(i);
        await g.opened;
        return i;
      })
    );
    await tick();

    expect(started).toEqual([0, 1]);
    expect(pool.stats()).toEqual({ active: 2, waiting: 1 });

    gates[0].open();
    await jobs[0];
    await tick();
    expect(started).toEqual([0, 1, 2]);

    gates[1].open();
    gates[2].open();
    await expect(Promise.all(jobs)).resolves.toEqual([0, 1, 2]);
    expect(pool.stats()).toEqual({ active: 0, waiting: 0 });
  });

  it('should free the slot when the job fails', async () => {
    const pool = new LocalPool('build', 1);

    await expect(pool.run(async () => Promise.reject(new Error('npm failed')))).rejects.toThrow('npm failed');

    await expect(pool.run(async () => 'next')).resolves.toBe('next');
  });

  it('should let a waiter give up when its signal fires, without taking a slot', async () => {
    const pool = new LocalPool('python', 1);
    const busy = gate();
    const first = pool.run(() => busy.opened);
    const stop = new AbortController();

    const waiting = pool.run(async () => 'never', stop.signal);
    stop.abort(new Error("Step stopped: the run's time limit was reached"));

    await expect(waiting).rejects.toBeInstanceOf(PoolWaitAbortedError);
    await expect(waiting).rejects.toThrow("Step stopped: the run's time limit was reached");
    expect(pool.stats()).toEqual({ active: 1, waiting: 0 });
    busy.open();
    await first;
    expect(pool.stats()).toEqual({ active: 0, waiting: 0 });
  });
});

describe('SingleFlight', () => {
  it('should share one run between concurrent calls with the same key, then forget it', async () => {
    const flight = new SingleFlight<string>();
    const work = jest.fn(async () => 'bundle');

    const [a, b] = await Promise.all([flight.run('js:v1', work), flight.run('js:v1', work)]);
    await flight.run('js:v1', work);

    expect([a, b]).toEqual(['bundle', 'bundle']);
    expect(work).toHaveBeenCalledTimes(2);
  });

  it('should run different keys separately', async () => {
    const flight = new SingleFlight<string>();
    const work = jest.fn(async () => 'x');

    await Promise.all([flight.run('js:v1', work), flight.run('python:v1', work)]);

    expect(work).toHaveBeenCalledTimes(2);
  });
});
