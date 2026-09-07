/**
 * Pure unit tests for createBatchManager — no store, no React. A minimal fake
 * set()/get() stands in for zustand+immer: a mutation mutates the passed state
 * object directly (as an Immer draft would); an updater that returns a value
 * replaces state instead (the useShallowReturn path).
 */
import { createBatchManager } from '../batchManager';

function createFakeStore(initial: Record<string, unknown> = {}) {
  let state = { updateDependencyValues: jest.fn(), ...initial } as any;
  const get = () => state;
  const set = (updater: (s: any) => any) => {
    const returned = updater(state);
    if (returned !== undefined) state = returned;
  };
  return { get, set };
}

describe('createBatchManager', () => {
  test('buffered mutations are applied in one flush, not as they are buffered', () => {
    const store = createFakeStore({ count: 0 });
    const batch = createBatchManager(store.set, store.get);

    batch.startBatch();
    batch.bufferMutation((s) => {
      s.count += 1;
    }, 'canvas');
    batch.bufferMutation((s) => {
      s.count += 1;
    }, 'canvas');
    expect(store.get().count).toBe(0);

    batch.flush();
    expect(store.get().count).toBe(2);
  });

  test('nested start/flush — only the outermost flush applies', () => {
    const store = createFakeStore({ count: 0 });
    const batch = createBatchManager(store.set, store.get);

    batch.startBatch();
    batch.startBatch();
    batch.bufferMutation((s) => {
      s.count += 1;
    }, 'canvas');

    batch.flush(); // depth 2 -> 1, inner flush is a no-op
    expect(store.get().count).toBe(0);
    expect(batch.isBatching()).toBe(true);

    batch.flush(); // depth 1 -> 0
    expect(store.get().count).toBe(1);
    expect(batch.isBatching()).toBe(false);
  });

  test('bufferDepPath entries are deduped by path+moduleId and trigger one recompute each', () => {
    const store = createFakeStore();
    const batch = createBatchManager(store.set, store.get);

    batch.startBatch();
    batch.bufferDepPath('components.c1.value', 'canvas');
    batch.bufferDepPath('components.c1.value', 'canvas'); // duplicate
    batch.bufferDepPath('components.c1.value', 'm1'); // same path, different owner
    batch.flush();

    expect(store.get().updateDependencyValues).toHaveBeenCalledTimes(2);
    expect(store.get().updateDependencyValues).toHaveBeenCalledWith('components.c1.value', 'canvas');
    expect(store.get().updateDependencyValues).toHaveBeenCalledWith('components.c1.value', 'm1');
  });

  test('cancelBatch(moduleId) discards only that moduleId’s mutations and settles the rest', () => {
    const store = createFakeStore({ canvasCount: 0, m1Count: 0 });
    const batch = createBatchManager(store.set, store.get);

    batch.startBatch();
    batch.bufferMutation((s) => {
      s.canvasCount += 1;
    }, 'canvas');
    batch.bufferMutation((s) => {
      s.m1Count += 1;
    }, 'm1');

    batch.cancelBatch('canvas'); // depth 1 -> 0: canvas's entry discarded, m1's survives and settles

    expect(store.get().canvasCount).toBe(0);
    expect(store.get().m1Count).toBe(1);
    expect(batch.isBatching()).toBe(false);
  });

  test('cancelBatch leaves the batch open while another owner still holds depth', () => {
    const store = createFakeStore({ canvasCount: 0, m1Count: 0 });
    const batch = createBatchManager(store.set, store.get);

    batch.startBatch(); // canvas's own open
    batch.startBatch(); // m1's concurrent open — depth 2
    batch.bufferMutation((s) => {
      s.canvasCount += 1;
    }, 'canvas');
    batch.bufferMutation((s) => {
      s.m1Count += 1;
    }, 'm1');

    batch.cancelBatch('canvas'); // depth 2 -> 1: canvas's entry gone, m1's survives but unapplied
    expect(batch.isBatching()).toBe(true);
    expect(store.get().m1Count).toBe(0);

    batch.flush(); // m1's own flush, depth 1 -> 0
    expect(store.get().m1Count).toBe(1);
    expect(store.get().canvasCount).toBe(0); // discarded by the cancel, never applied
  });

  test('a post-flush callback discarded by cancelBatch does not run, and its dedupe key is free again', () => {
    const store = createFakeStore();
    const batch = createBatchManager(store.set, store.get);
    const discarded = jest.fn();
    const replacement = jest.fn();

    batch.startBatch(); // canvas's own open
    batch.startBatch(); // another owner keeps depth open past canvas's cancel
    batch.bufferPostFlushCallback(discarded, 'canvas', 'guard');

    batch.cancelBatch('canvas'); // depth 2 -> 1: discards `discarded`, un-arms 'guard'

    // Without the un-arm, this registration under the same key would be silently dropped.
    batch.bufferPostFlushCallback(replacement, 'canvas', 'guard');
    batch.flush(); // the other owner's flush, depth 1 -> 0

    expect(discarded).not.toHaveBeenCalled();
    expect(replacement).toHaveBeenCalledTimes(1);
  });

  test('useShallowReturn skips the dependency-path cascade (graph construction only)', () => {
    const store = createFakeStore({ graph: 'original' });
    const batch = createBatchManager(store.set, store.get, { useShallowReturn: true });

    batch.startBatch();
    batch.bufferMutation(
      (s) => {
        s.graph = 'rebuilt';
      },
      'canvas',
      [{ path: 'components.c1.value', moduleId: 'canvas' }]
    );
    batch.flush();

    expect(store.get().graph).toBe('rebuilt');
    expect(store.get().updateDependencyValues).not.toHaveBeenCalled();
  });
});
