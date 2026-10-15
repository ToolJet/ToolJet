import { freeze as immerFreeze, isDraft } from 'immer';
import { runSliced } from './slices';
import { estimateBytes } from './memory';

/**
 * Everything in the store is deep-frozen, so nothing but the store's own setters can change a query's or a component's
 * data: a `{{ }}` binding, a transformation or a RunJS script writing into a row is ignored (or throws, in strict code).
 * This is what Immer's auto-freeze always did; values are frozen here first because Immer's walk is slow and blocks
 * (a 5M-row result: seconds), and Immer skips what is already frozen.
 *
 * Immer's rules: plain objects, arrays, Maps, Sets and `immerable` classes are frozen; other class instances (a Date)
 * are not; an Immer draft is left alone; an object that is already frozen is taken as frozen throughout. To keep that
 * last rule true, no value the store holds for an app (queries, components, variables, resolved properties, previews)
 * is ever frozen only at its top level.
 */

const isPlain = (value) => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const needsFreezing = (value) =>
  value !== null && typeof value === 'object' && !Object.isFrozen(value) && !isDraft(value);

// Arrays longer than this are walked a slice at a time by deepFreezeInSlices, and frozen once all their items are.
const LONG_ARRAY = 1024;

/**
 * Freezes `value` and everything in it, object by object (a frozen one is skipped, so cycles end). Arrays and plain
 * objects are done here (most of every dataset); anything else Immer can freeze is left to Immer. With a `walk`
 * (deepFreezeInSlices), a long array inside isn't walked but handed to `walk.deferLong`, still unfrozen, and what is
 * frozen is counted in `walk.tally`.
 */
const freezeOne = (value, walk) => {
  if (Array.isArray(value)) {
    if (walk && value.length > LONG_ARRAY) return walk.deferLong(value);
    Object.freeze(value);
    if (walk) {
      walk.tally.objects += 1;
      walk.tally.slots += value.length;
    }
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (needsFreezing(item)) freezeOne(item, walk);
      else if (walk && typeof item === 'string') walk.tally.chars += item.length;
    }
  } else if (isPlain(value)) {
    Object.freeze(value);
    if (walk) walk.tally.objects += 1;
    for (const key in value) {
      const item = value[key];
      if (walk) walk.tally.slots += 1;
      if (needsFreezing(item)) freezeOne(item, walk);
      else if (walk && typeof item === 'string') walk.tally.chars += item.length;
    }
  } else {
    immerFreeze(value, true);
  }
};

/** Deep-freezes `value` now and returns it. Instant for a value that is already frozen. */
export const deepFreeze = (value) => {
  if (needsFreezing(value)) freezeOne(value, null);
  return value;
};

// Estimated bytes of the values deepFreezeInSlices froze (a query's result): what copying one would cost.
const footprints = new WeakMap();

/** The estimated size in bytes of a value deepFreezeInSlices froze, or undefined if it didn't. */
export const footprintOf = (value) => (value !== null && typeof value === 'object' ? footprints.get(value) : undefined);

/**
 * Deep-freezes `value` without blocking: the first slice inline, the rest a slice per task (see `runSliced`). Returns
 * null when it finished inline, else a promise that resolves once it has. Long arrays are walked a slice at a time,
 * each item frozen in one go, and frozen themselves once all their items are; everything else is frozen as `deepFreeze`
 * does. Only the code that made the value can reach it while it's being frozen (it isn't in the store yet). Records the
 * value's estimated size (`footprintOf`).
 */
export const deepFreezeInSlices = (value) => {
  if (!needsFreezing(value)) return null;

  const pending = []; // long arrays still to walk: { array, next }
  const queued = new Set(); // the same arrays, so one met again (shared, or inside itself) isn't walked twice
  const tally = { objects: 0, slots: 0, chars: 0 };
  const walk = {
    tally,
    deferLong: (array) => {
      if (queued.has(array)) return;
      queued.add(array);
      pending.push({ array, next: 0 });
    },
  };
  freezeOne(value, walk);

  const work = (inTime) => {
    while (pending.length) {
      const current = pending[pending.length - 1];
      const { array } = current;
      while (current.next < array.length) {
        const item = array[current.next++];
        if (needsFreezing(item)) freezeOne(item, walk);
        else if (typeof item === 'string') tally.chars += item.length;
        if (pending[pending.length - 1] !== current) break; // an item held a long array: walk that one first
        if ((current.next & 1023) === 0 && !inTime()) return false;
      }
      if (pending[pending.length - 1] !== current) continue;
      Object.freeze(array);
      tally.objects += 1;
      tally.slots += array.length;
      pending.pop();
      queued.delete(array);
    }
    footprints.set(value, estimateBytes(tally));
    return true;
  };

  return runSliced(work);
};
