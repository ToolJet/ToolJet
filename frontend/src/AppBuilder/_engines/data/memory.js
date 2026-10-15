import { isFeatureEnabled } from '../features';

/**
 * How much memory the tab has left, so work that would run it out (a copy of a 3 GB dataset, a row of state for each of
 * millions of rows) is refused with a message instead of crashing the tab ("Aw, Snap!"). Chrome caps a tab's JavaScript
 * heap (about 4 GB) and reports it in `performance.memory`; where that isn't available (Firefox, Safari) nothing is
 * refused, as before.
 */

const MB = 1024 * 1024;

// Kept free below the limit: near it the garbage collector runs back to back and the page freezes for seconds.
const reserveFor = (limit) => Math.max(512 * MB, limit * 0.12);

const memoryInfo = () => {
  const info = typeof performance !== 'undefined' ? performance.memory : undefined;
  return info && info.jsHeapSizeLimit > 0 ? info : null;
};

/**
 * Estimated bytes taken by `objects` objects and arrays holding `slots` properties or elements and `chars` characters
 * of strings: a dataset parsed from JSON comes to about this (a 21-key row of short strings and numbers, ~800 B).
 */
export const estimateBytes = ({ objects = 0, slots = 0, chars = 0 }) => objects * 24 + slots * 20 + chars;

/** Bytes that can still be allocated before the tab gets near its limit; Infinity when it can't be told. */
export const headroom = () => {
  const info = memoryInfo();
  if (!info || !isFeatureEnabled('memory')) return Infinity;
  return info.jsHeapSizeLimit - reserveFor(info.jsHeapSizeLimit) - info.usedJSHeapSize;
};

/** Whether `bytes` more can be allocated without nearing the tab's limit. */
export const canAllocate = (bytes) => !(bytes > headroom());

const formatBytes = (bytes) =>
  bytes >= 1024 * MB ? `${(bytes / (1024 * MB)).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / MB))} MB`;

export class MemoryBudgetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MemoryBudgetError';
  }
}

/** Throws a MemoryBudgetError saying why when `bytes` more for `what` (a phrase: "a copy of queries.q") don't fit. */
export const ensure = (bytes, what) => {
  const free = headroom();
  if (!(bytes > free)) return;
  const needed = formatBytes(bytes);
  const available = formatBytes(Math.max(0, free));
  throw new MemoryBudgetError(
    `${what} needs about ${needed} of memory, but only about ${available} is free in this browser tab. ` +
      'Work with less data at a time (eg. paginate the query).'
  );
};

const reported = new Set();

/** True the first time it's called with `key`: a refusal is reported once, not on every render or keystroke. */
export const firstReport = (key) => {
  if (reported.has(key)) return false;
  reported.add(key);
  return true;
};
