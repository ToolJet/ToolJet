import { createPropagationScheduler, INLINE_DEPENDENTS } from '../propagation';

// A store with `dependents[path]` dependents per path; resolving a dependent records it, through the mutation list the
// scheduler commits once per slice.
const fakeStore = (dependents, { throwOn = null } = {}) => {
  const state = { resolved: [] };
  const commits = [];
  const store = {
    getDependencies: (path) => dependents[path] ?? [],
    getAllExposedValues: () => ({}),
    applyDependencyUpdate: (dependency, path, moduleId, parentIndices, exposedValues, mutations) => {
      if (dependency === throwOn) throw new Error('bad binding');
      mutations.push((draft) => draft.resolved.push(dependency));
    },
  };
  const set = (recipe) => {
    commits.push(state.resolved.length);
    recipe(state);
  };
  return { state, commits, set, get: () => store, store };
};
const names = (prefix, count) => Array.from({ length: count }, (_, i) => `${prefix}${i}`);
// A clock that moves 1 ms per reading, and a task queue the test runs by hand.
const clock = () => {
  let t = 0;
  return () => (t += 1);
};
const manualQueue = () => {
  const tasks = [];
  return { tasks, queue: { schedule: (fn) => tasks.push(fn), close: () => {} } };
};

describe('createPropagationScheduler', () => {
  test('a small change resolves at once, in one store write', () => {
    const { state, commits, set, get } = fakeStore({ a: names('d', 10) });
    const scheduler = createPropagationScheduler({ set, get, now: clock() });
    expect(scheduler.propagate(['a'])).toBeNull();
    expect(state.resolved).toEqual(names('d', 10));
    expect(commits).toHaveLength(1);
  });

  test('a large change resolves in slices, one store write each, and settles when done', async () => {
    const count = INLINE_DEPENDENTS * 4;
    const { state, commits, set, get } = fakeStore({ a: names('d', count) });
    const { tasks, queue } = manualQueue();
    const scheduler = createPropagationScheduler({ set, get, now: clock(), queue });
    let settled = false;
    scheduler.propagate(['a']).then(() => (settled = true));
    expect(state.resolved.length).toBeGreaterThanOrEqual(INLINE_DEPENDENTS);
    expect(state.resolved.length).toBeLessThan(count);
    while (tasks.length) tasks.shift()();
    await Promise.resolve();
    expect(settled).toBe(true);
    expect(state.resolved).toEqual(names('d', count));
    expect(commits.length).toBeGreaterThan(1);
  });

  test('without slicing (kill switch) a large change resolves at once', () => {
    const count = INLINE_DEPENDENTS * 4;
    const { state, set, get } = fakeStore({ a: names('d', count) });
    const scheduler = createPropagationScheduler({ set, get, now: clock(), isSliced: () => false });
    expect(scheduler.propagate(['a'])).toBeNull();
    expect(state.resolved).toHaveLength(count);
  });

  test('a dependent of several changed paths resolves once', () => {
    const { state, set, get } = fakeStore({ a: ['x', 'y'], b: ['y', 'z'] });
    createPropagationScheduler({ set, get, now: clock() }).propagate(['a', 'b']);
    expect(state.resolved).toEqual(['x', 'y', 'z']);
  });

  test('a failing dependent does not stop the others', () => {
    const onError = jest.fn();
    const { state, set, get } = fakeStore({ a: ['x', 'bad', 'z'] }, { throwOn: 'bad' });
    createPropagationScheduler({ set, get, now: clock(), onError }).propagate(['a']);
    expect(state.resolved).toEqual(['x', 'z']);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('deferred changes made in the same turn resolve together, in a microtask', async () => {
    const { state, commits, set, get } = fakeStore({ a: ['x'], b: ['y'] });
    const scheduler = createPropagationScheduler({ set, get, now: clock() });
    scheduler.propagate(['a'], 'canvas', [], { defer: true });
    scheduler.propagate(['b'], 'canvas', [], { defer: true });
    expect(state.resolved).toEqual([]);
    await scheduler.settled();
    expect(state.resolved).toEqual(['x', 'y']);
    expect(commits).toHaveLength(1);
  });

  test('a change made while resolving (a render reacting) is picked up by the same run', () => {
    const fake = fakeStore({ a: ['x'], b: ['y'] });
    let scheduler;
    const set = (recipe) => {
      fake.set(recipe);
      if (fake.state.resolved.length === 1) scheduler.propagate(['b']);
    };
    scheduler = createPropagationScheduler({ set, get: fake.get, now: clock() });
    expect(scheduler.propagate(['a'])).toBeNull();
    expect(fake.state.resolved).toEqual(['x', 'y']);
  });

  test('flushSync finishes a sliced run at once; reset releases waiters', async () => {
    const count = INLINE_DEPENDENTS * 4;
    const { state, set, get } = fakeStore({ a: names('d', count) });
    const { queue } = manualQueue();
    const scheduler = createPropagationScheduler({ set, get, now: clock(), queue });
    const done = scheduler.propagate(['a']);
    scheduler.flushSync();
    await done;
    expect(state.resolved).toHaveLength(count);

    scheduler.propagate(['a']);
    const waiting = scheduler.settled();
    scheduler.reset();
    await waiting;
    expect(scheduler.isIdle()).toBe(true);
  });
});
