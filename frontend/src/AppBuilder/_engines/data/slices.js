import { taskQueue } from './taskQueue';

// Time per slice of work: short enough that a frame still has room to render and handle input.
export const SLICE_MS = 8;

const defaultNow = () => performance.now();

/**
 * Runs `work` a slice at a time so the page keeps responding (typing, scrolling, painting) through work on large data.
 * `work(inTime)` does what it can while `inTime()` is true and returns true once finished; checking `inTime` every few
 * hundred items is enough. The first slice runs at once unless `inline` is false; the rest run one per task.
 *
 * Returns null when the work finished in the first slice, else a promise that resolves once it has — or once it is
 * cancelled (`promise.cancel()`), after which `work` isn't called again.
 */
export function runSliced(work, { inline = true, sliceMs = SLICE_MS, schedule = null, now = defaultNow } = {}) {
  const slice = () => {
    const end = now() + sliceMs;
    return () => now() < end;
  };
  if (inline && work(slice())) return null;

  const queue = schedule ? { schedule, close() {} } : taskQueue();
  let finish;
  let cancelled = false;
  const promise = new Promise((resolve) => (finish = resolve));
  const step = () => {
    if (cancelled) return;
    if (work(slice())) {
      queue.close();
      finish();
    } else queue.schedule(step);
  };
  queue.schedule(step);
  promise.cancel = () => {
    if (cancelled) return;
    cancelled = true;
    queue.close();
    finish();
  };
  return promise;
}

/** Calls `visit(i)` for i from 0 to `count - 1`, sliced as `runSliced` does (same options and result). */
export const forSliced = (count, visit, options) => {
  let i = 0;
  return runSliced((inTime) => {
    while (i < count) {
      visit(i++);
      if ((i & 255) === 0 && !inTime()) return false;
    }
    return true;
  }, options);
};
