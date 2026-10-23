import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures currentLeakCleanupTimerProbe016 and currentLeakCleanupCanaryGlobal016): the leak
// suite let an unmount's next-tick timers (16 ms or less) off, but it did so by clearing them at once, so their work
// never ran and nothing it left behind (here a document listener added per unmount) could be seen. The suite now
// lets those timers run, a bounded number of rounds, then measures, then clears what is left; a short timer the
// probe is asked about before it could run is reported. The controls (a timer left by the mounted widget, a long
// cleanup timer) were already reported.
import { installProbes } from '@/AppBuilder/Widgets/Ui2/__tests__/leaks/leakProbes';
import { measureWidget } from '@/AppBuilder/Widgets/Ui2/__tests__/leaks/leakSuite';

jest.mock('zustand', () => require('@/AppBuilder/Widgets/Ui2/__tests__/leaks/countingZustand'));

// The Spinner's module is swapped for a canary whose unmount schedules a timer that adds a new document listener.
let mockCleanupDelay = 0;
let mockCleanupRuns = 0;
const mockListeners = [];
jest.mock('@/AppBuilder/Widgets/Ui2/Spinner/Spinner', () => {
  const R = jest.requireActual('react');
  const Canary = () => {
    R.useEffect(
      () => () => {
        globalThis.setTimeout(() => {
          mockCleanupRuns += 1;
          const listener = () => {};
          mockListeners.push(listener);
          globalThis.document.addEventListener('ui2-cleanup-canary', listener);
        }, mockCleanupDelay);
      },
      []
    );
    return null;
  };
  return { __esModule: true, default: Canary };
});
afterEach(() => {
  while (mockListeners.length) document.removeEventListener('ui2-cleanup-canary', mockListeners.pop());
});

describe('the timer probe', () => {
  const start = () => installProbes({ size: () => ({ width: 200, height: 100 }) });
  const canary = (p, listener) => window.setTimeout(() => document.addEventListener('ui2-cleanup-canary', listener), 0);
  const canaries = (p) => p.listeners.snapshot().filter((r) => r.type === 'ui2-cleanup-canary');

  test('reports a timer the mounted widget left (control)', () => {
    const p = start();
    try {
      p.timers.begin();
      window.setTimeout(() => {}, 5000);
      expect(p.timers.leftovers()).toHaveLength(1);
    } finally {
      p.restore();
    }
  });

  test('reports a long cleanup timer, settled or not (control)', async () => {
    const p = start();
    try {
      p.timers.begin();
      p.timers.unmounting();
      window.setTimeout(() => {}, 5000);
      await p.timers.settle();
      expect(p.timers.leftovers()).toHaveLength(1);
    } finally {
      p.restore();
    }
  });

  test('lets a next-tick cleanup timer run, so the listener it adds is seen', async () => {
    const p = start();
    const listener = () => {};
    try {
      p.timers.begin();
      p.timers.unmounting();
      canary(p, listener);
      await p.timers.settle();
      expect(canaries(p)).toHaveLength(1);
      expect(p.timers.leftovers()).toHaveLength(0);
    } finally {
      document.removeEventListener('ui2-cleanup-canary', listener);
      p.restore();
    }
  });

  test('reports a next-tick cleanup timer it is asked about before it could run', () => {
    const p = start();
    const listener = () => {};
    try {
      p.timers.begin();
      p.timers.unmounting();
      canary(p, listener);
      expect(p.timers.leftovers()).toHaveLength(1);
    } finally {
      document.removeEventListener('ui2-cleanup-canary', listener);
      p.restore();
    }
  });

  test('reports a cleanup that keeps scheduling next-tick work, after a bounded wait', async () => {
    const p = start();
    let runs = 0;
    try {
      p.timers.begin();
      p.timers.unmounting();
      const again = () => {
        runs += 1;
        window.setTimeout(again, 0);
      };
      window.setTimeout(again, 0);
      await p.timers.settle();
      expect(p.timers.leftovers()).toHaveLength(1);
      const settled = runs;
      await new Promise((resolve) => p.timers.realSetTimeout(resolve, 20));
      expect(runs).toBe(settled);
    } finally {
      p.restore();
    }
  });

  test('restores the real timers when done', () => {
    const real = window.setTimeout;
    start().restore();
    expect(window.setTimeout).toBe(real);
  });
});

describe('the whole leak measurement', () => {
  test('sees what a next-tick cleanup timer leaves behind', async () => {
    mockCleanupDelay = 0;
    mockCleanupRuns = 0;
    const result = await measureWidget('ShadSpinner');
    expect(mockCleanupRuns).toBeGreaterThan(0);
    expect(result.problems.join('\n')).toMatch(/window\/document listeners added and never removed/);
    expect(result.problems.join('\n')).toMatch(/document 'ui2-cleanup-canary'/);
  }, 60000);

  test('reports a long cleanup timer (control)', async () => {
    mockCleanupDelay = 5000;
    mockCleanupRuns = 0;
    const result = await measureWidget('ShadSpinner');
    expect(mockCleanupRuns).toBe(0);
    expect(result.problems.join('\n')).toMatch(/timers still scheduled after unmount/);
    expect(result.problems.join('\n')).toMatch(/setTimeout\(5000 ms\)/);
  }, 60000);
});
