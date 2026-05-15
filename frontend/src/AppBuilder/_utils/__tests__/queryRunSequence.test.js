const {
  nextQueryRunId,
  isLatestQueryRun,
  clearQueryRunSequence,
  __resetQueryRunSequence,
} = require('../queryRunSequence');

describe('queryRunSequence helpers', () => {
  beforeEach(() => {
    __resetQueryRunSequence();
  });

  describe('nextQueryRunId', () => {
    test('returns 1 for the first call on a new (moduleId, queryId) pair', () => {
      expect(nextQueryRunId('canvas', 'q1')).toBe(1);
    });

    test('returns monotonically increasing ids for the same pair', () => {
      expect(nextQueryRunId('canvas', 'q1')).toBe(1);
      expect(nextQueryRunId('canvas', 'q1')).toBe(2);
      expect(nextQueryRunId('canvas', 'q1')).toBe(3);
      expect(nextQueryRunId('canvas', 'q1')).toBe(4);
    });

    test('keeps independent sequences per queryId within the same module', () => {
      nextQueryRunId('canvas', 'q1');
      nextQueryRunId('canvas', 'q1');
      expect(nextQueryRunId('canvas', 'q2')).toBe(1);
      expect(nextQueryRunId('canvas', 'q1')).toBe(3);
    });

    test('keeps independent sequences per moduleId for the same queryId', () => {
      nextQueryRunId('canvas', 'q1');
      expect(nextQueryRunId('module-a', 'q1')).toBe(1);
      expect(nextQueryRunId('canvas', 'q1')).toBe(2);
    });
  });

  describe('isLatestQueryRun', () => {
    test('returns true for the most recently issued id', () => {
      const r1 = nextQueryRunId('canvas', 'q1');
      expect(isLatestQueryRun('canvas', 'q1', r1)).toBe(true);
    });

    test('returns false for any superseded id', () => {
      const r1 = nextQueryRunId('canvas', 'q1');
      const r2 = nextQueryRunId('canvas', 'q1');
      const r3 = nextQueryRunId('canvas', 'q1');
      expect(isLatestQueryRun('canvas', 'q1', r1)).toBe(false);
      expect(isLatestQueryRun('canvas', 'q1', r2)).toBe(false);
      expect(isLatestQueryRun('canvas', 'q1', r3)).toBe(true);
    });

    test('returns false when no run has ever been issued for the pair', () => {
      // A caller asking "am I still latest?" with an id of 1 when nothing has
      // been registered should not be told yes.
      expect(isLatestQueryRun('canvas', 'never-run', 1)).toBe(false);
    });

    test('treats moduleId as part of the key (no cross-module leakage)', () => {
      const r1 = nextQueryRunId('canvas', 'q1');
      // A newer run in a different module must not invalidate the canvas run.
      nextQueryRunId('module-a', 'q1');
      expect(isLatestQueryRun('canvas', 'q1', r1)).toBe(true);
    });
  });

  describe('clearQueryRunSequence', () => {
    test('drops the entry so the next nextQueryRunId restarts at 1', () => {
      nextQueryRunId('canvas', 'q1');
      nextQueryRunId('canvas', 'q1');
      clearQueryRunSequence('canvas', 'q1');
      expect(nextQueryRunId('canvas', 'q1')).toBe(1);
    });

    test('is safe to call when no entry exists', () => {
      expect(() => clearQueryRunSequence('canvas', 'never-run')).not.toThrow();
    });
  });
});

describe('queryRunSequence — race regression: older response cannot overwrite newer', () => {
  // This test simulates the bug we are fixing. Two `runQuery` calls fire
  // rapidly for the same query; the first one's slow response would otherwise
  // arrive AFTER the second's response and overwrite it in the resolved store.
  // With the sequencer-guarded write, the older response is dropped.

  beforeEach(() => {
    __resetQueryRunSequence();
  });

  test('without the sequencer guard, the stale response wins (demonstrates the bug)', async () => {
    // Naive setStateFromResponse: any caller can write at any time.
    let store = null;
    const naiveSetStateFromResponse = (data) => {
      store = data;
    };

    // Two responses for the same query. The "old" one is slower than the "new" one.
    const oldResponse = new Promise((resolve) => setTimeout(() => resolve('old-data'), 30));
    const newResponse = new Promise((resolve) => setTimeout(() => resolve('new-data'), 5));

    await Promise.all([
      oldResponse.then(naiveSetStateFromResponse),
      newResponse.then(naiveSetStateFromResponse),
    ]);

    // The bug: the older response, arriving last, overwrote the newer one.
    expect(store).toBe('old-data');
  });

  test('with the sequencer guard, the newer response wins regardless of arrival order', async () => {
    let store = null;
    const moduleId = 'canvas';
    const queryId = 'qA';

    // Helper that mirrors how runQuery now writes state: capture runId at
    // request time, drop the write if a newer runId has superseded us.
    const guardedHandle = (responsePromise) => {
      const runId = nextQueryRunId(moduleId, queryId);
      return responsePromise.then((data) => {
        if (!isLatestQueryRun(moduleId, queryId, runId)) {
          // Superseded — drop the write, return a sentinel so awaited chains
          // don't hang.
          return { status: 'superseded' };
        }
        store = data;
        return { status: 'ok', data };
      });
    };

    // Run #1 fires (slow). Then run #2 fires (fast). Run #2's response arrives
    // first and writes "new-data"; run #1's response arrives second but is
    // superseded so it does NOT overwrite.
    const oldResponse = new Promise((resolve) => setTimeout(() => resolve('old-data'), 30));
    const oldHandle = guardedHandle(oldResponse);

    const newResponse = new Promise((resolve) => setTimeout(() => resolve('new-data'), 5));
    const newHandle = guardedHandle(newResponse);

    const [oldResult, newResult] = await Promise.all([oldHandle, newHandle]);

    // The newer response is what landed in the store.
    expect(store).toBe('new-data');
    // The older run's promise was resolved (so awaited chains don't hang),
    // but its result is the superseded sentinel rather than a data write.
    expect(oldResult).toEqual({ status: 'superseded' });
    expect(newResult).toEqual({ status: 'ok', data: 'new-data' });
  });

  test('the guard isolates races per (moduleId, queryId) — unrelated queries are unaffected', async () => {
    let storeA = null;
    let storeB = null;

    const guardedHandle = (moduleId, queryId, responsePromise, writeTo) => {
      const runId = nextQueryRunId(moduleId, queryId);
      return responsePromise.then((data) => {
        if (!isLatestQueryRun(moduleId, queryId, runId)) {
          return { status: 'superseded' };
        }
        writeTo(data);
        return { status: 'ok', data };
      });
    };

    // queryA: two races. queryB: a single, unrelated run that must NOT be
    // marked superseded by queryA's later run.
    const aSlow = guardedHandle(
      'canvas',
      'queryA',
      new Promise((r) => setTimeout(() => r('a-old'), 30)),
      (d) => (storeA = d)
    );
    const bOnly = guardedHandle(
      'canvas',
      'queryB',
      new Promise((r) => setTimeout(() => r('b-only'), 10)),
      (d) => (storeB = d)
    );
    const aFast = guardedHandle(
      'canvas',
      'queryA',
      new Promise((r) => setTimeout(() => r('a-new'), 5)),
      (d) => (storeA = d)
    );

    const [aSlowResult, bResult, aFastResult] = await Promise.all([aSlow, bOnly, aFast]);

    expect(storeA).toBe('a-new');
    expect(storeB).toBe('b-only');
    expect(aSlowResult).toEqual({ status: 'superseded' });
    expect(aFastResult).toEqual({ status: 'ok', data: 'a-new' });
    expect(bResult).toEqual({ status: 'ok', data: 'b-only' });
  });

  test('a reset (sequence bump) supersedes an in-flight run', async () => {
    let store = 'before-anything';
    const moduleId = 'canvas';
    const queryId = 'qReset';

    const guardedHandle = (responsePromise) => {
      const runId = nextQueryRunId(moduleId, queryId);
      return responsePromise.then((data) => {
        if (!isLatestQueryRun(moduleId, queryId, runId)) {
          return { status: 'superseded' };
        }
        store = data;
        return { status: 'ok', data };
      });
    };

    // Run starts.
    const inFlight = guardedHandle(new Promise((r) => setTimeout(() => r('run-data'), 20)));

    // User invokes resetQuery, which bumps the sequence and writes the reset
    // state directly. This mirrors what resetQuery does in queryPanelSlice.js.
    nextQueryRunId(moduleId, queryId);
    store = '__reset__';

    const result = await inFlight;

    // The in-flight run's response was dropped — reset state is preserved.
    expect(store).toBe('__reset__');
    expect(result).toEqual({ status: 'superseded' });
  });
});
