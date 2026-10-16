import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { taskQueue } from '@/AppBuilder/_engines/data/taskQueue';

// Time per task spent mounting: the page still paints and answers input between tasks.
export const MOUNT_BUDGET_MS = 12;

/**
 * The containers still mounting their children, first come first served: one task mounts what fits in its budget,
 * from the first container's children on. A child that is itself a container joins the end of the queue when it
 * mounts, so a page mounts top-down, a level at a time: every container's own children before its grandchildren.
 */
const waiting = [];
let queue = null;
let scheduled = false;
// How many children one task mounts, adjusted to what the last task's took.
let perTask = 8;

const schedule = () => {
  if (scheduled) return;
  scheduled = true;
  queue ??= taskQueue();
  queue.schedule(pump);
};

// Mounts the next children, of as many containers as it takes, in one render: one commit and one layout per task.
function pump() {
  scheduled = false;
  const start = performance.now();
  const want = Math.max(1, Math.round(perTask));
  let mounted = 0;
  flushSync(() => {
    while (waiting.length > 0 && mounted < want) {
      const entry = waiting[0];
      mounted += entry.grow(want - mounted);
      if (entry.done()) waiting.shift();
    }
  });
  const spent = Math.max(1, performance.now() - start);
  if (mounted > 0) perTask = Math.min(mounted * 2, Math.max(mounted / 2, (mounted * MOUNT_BUDGET_MS) / spent));
  if (waiting.length > 0) schedule();
  else {
    queue?.close();
    queue = null;
  }
}

/**
 * How many of a container's `count` children to render: all of them, unless `enabled()` on its first render (asked
 * once), when they mount over the following tasks through the queue above. `hold` keeps the page from counting as
 * loaded meanwhile: `hold.increment()` when it starts, `hold.decrement()` once all have mounted, after their own effects
 * ran (a child that is still loading holds the page itself by then).
 */
export function useMountBatches(count, enabled, hold) {
  const [batching] = useState(enabled);
  const [shown, setShown] = useState(0);
  const live = useRef({ shown, count, holding: false });
  live.current.count = count;
  live.current.hold = hold;
  // Once all have mounted, children added later render at once.
  const finished = useRef(!batching);
  if (!finished.current && shown >= count) finished.current = true;
  const complete = finished.current;

  useLayoutEffect(() => {
    if (complete) return undefined;
    const state = live.current;
    const entry = {
      grow: (n) => {
        const from = state.shown;
        const to = Math.min(state.count, from + n);
        state.shown = to;
        if (to > from) setShown(to);
        return to - from;
      },
      done: () => state.shown >= state.count,
    };
    state.holding = true;
    state.hold?.increment();
    waiting.push(entry);
    schedule();
    return () => {
      const at = waiting.indexOf(entry);
      if (at >= 0) waiting.splice(at, 1);
      if (state.holding) {
        state.holding = false;
        state.hold?.decrement();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!complete || !live.current.holding) return;
    live.current.holding = false;
    live.current.hold?.decrement();
  }, [complete]);

  return complete ? count : shown;
}
