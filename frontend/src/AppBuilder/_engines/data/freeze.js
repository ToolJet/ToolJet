import { freeze as immerFreeze, isDraft } from 'immer';
import { runSliced } from './slices';
import { estimateBytes, OBJECT_BYTES, SLOT_BYTES } from './memory';

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
 * objects are done here (most of every dataset); anything else Immer can freeze is left to Immer. A long array inside is
 * frozen counting what it holds, to profile its rows (freezeLong).
 */
const freezeOne = (value) => {
  if (Array.isArray(value)) {
    if (value.length > LONG_ARRAY) {
      freezeLong(value, { skips: 0, deferLong: null });
      return;
    }
    Object.freeze(value);
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (needsFreezing(item)) freezeOne(item);
    }
  } else if (isPlain(value)) {
    Object.freeze(value);
    for (const key in value) {
      const item = value[key];
      if (needsFreezing(item)) freezeOne(item);
    }
  } else {
    immerFreeze(value, true);
  }
};

/**
 * Freezes `item` as freezeOne does and returns the estimated bytes of what it froze (estimateBytes' rule, sizeOf's): an
 * object frozen before (or an Immer draft) counts nothing, and is counted in `walk.skips` instead. With
 * `walk.deferLong` (deepFreezeInSlices), a long array inside isn't walked but handed to it, still unfrozen (it counts
 * there, as it is walked).
 */
const freezeCounted = (item, walk) => {
  if (typeof item === 'string') return item.length;
  return item !== null && typeof item === 'object' ? freezeObjectCounted(item, walk) : 0;
};

function freezeObjectCounted(value, walk) {
  if (Object.isFrozen(value) || isDraft(value)) {
    walk.skips += 1;
    return 0;
  }
  if (Array.isArray(value)) {
    if (value.length > LONG_ARRAY) return walk.deferLong ? walk.deferLong(value) : freezeLong(value, walk);
    Object.freeze(value);
    let bytes = OBJECT_BYTES + value.length * SLOT_BYTES;
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (typeof item === 'string') bytes += item.length;
      else if (item !== null && typeof item === 'object') bytes += freezeObjectCounted(item, walk);
    }
    return bytes;
  }
  if (isPlain(value)) {
    Object.freeze(value);
    let bytes = OBJECT_BYTES;
    for (const key in value) {
      const item = value[key];
      bytes += SLOT_BYTES;
      if (typeof item === 'string') bytes += item.length;
      else if (item !== null && typeof item === 'object') bytes += freezeObjectCounted(item, walk);
    }
    return bytes;
  }
  immerFreeze(value, true);
  return 0;
}

// ─── Row profiles ───────────────────────────────────────────────────────────────────────────────────────────────────

// How many of the largest items a profile keeps.
const LONGEST = 5;

// Long arrays frozen here → { totalBytes, longest: [{ index, bytes }] }: what freezing them counted, item by item.
const profiles = new WeakMap();

/** An empty rows profile (rowsProfileOf), to fill with addRowToProfile. */
export const newRowsProfile = () => ({ totalBytes: 0, longest: [] });

// The bytes an item must exceed to be one of a profile's 5 largest (-1 while it has fewer).
const floorOf = ({ longest }) => (longest.length < LONGEST ? -1 : longest[LONGEST - 1].bytes);

// Puts an item larger than floorOf's among a profile's 5 largest (largest first; the first on ties).
const rankItem = ({ longest }, index, bytes) => {
  let at = longest.length;
  while (at > 0 && longest[at - 1].bytes < bytes) at--;
  longest.splice(at, 0, { index, bytes });
  if (longest.length > LONGEST) longest.pop();
};

/** Adds an item of `bytes` to a rows profile: its total, and its 5 largest items (largest first; the first on ties). */
export const addRowToProfile = (profile, index, bytes) => {
  profile.totalBytes += bytes;
  if (bytes > floorOf(profile)) rankItem(profile, index, bytes);
};

/**
 * The rows profile of an array longer than LONG_ARRAY that deepFreeze or deepFreezeInSlices froze: `{ totalBytes,
 * longest: [{ index, bytes }] }`, an item's bytes being the estimated size of what freezing it counted (as sizeOf
 * measures it), and `longest` the 5 largest items, largest first. Recorded as the array is frozen, at no extra pass.
 * Undefined for an array frozen before it was handed in, or holding at any depth an object that was (or one met twice:
 * shared, or inside itself), since freezing counted nothing of it: sizeOf measures one.
 */
export const rowsProfileOf = (array) => (Array.isArray(array) ? profiles.get(array) : undefined);

/** The estimated size in bytes of `value` by the rule rowsProfileOf's items are counted with, without freezing it. */
export const sizeOf = (value) => {
  const tally = { objects: 0, slots: 0, chars: 0 };
  const seen = new Set();
  const visit = (item) => {
    if (typeof item === 'string') tally.chars += item.length;
    if (item === null || typeof item !== 'object' || seen.has(item)) return;
    if (Array.isArray(item)) {
      seen.add(item);
      tally.objects += 1;
      tally.slots += item.length;
      for (let i = 0; i < item.length; i++) visit(item[i]);
    } else if (isPlain(item)) {
      seen.add(item);
      tally.objects += 1;
      for (const key in item) {
        tally.slots += 1;
        visit(item[key]);
      }
    }
  };
  visit(value);
  return estimateBytes(tally);
};

// Freezes a long array outside deepFreezeInSlices, item by item, and records its rows profile; returns its bytes. A
// string item adds its length and a number nothing: only an item larger than the 5th largest so far is ranked.
function freezeLong(array, walk) {
  Object.freeze(array);
  const { skips } = walk;
  const profile = newRowsProfile();
  let total = 0;
  let floor = -1;
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    let bytes = 0;
    if (typeof item === 'string') bytes = item.length;
    else if (item !== null && typeof item === 'object') bytes = freezeObjectCounted(item, walk);
    total += bytes;
    if (bytes > floor) {
      rankItem(profile, i, bytes);
      floor = floorOf(profile);
    }
  }
  profile.totalBytes = total;
  if (walk.skips === skips) profiles.set(array, profile);
  return OBJECT_BYTES + array.length * SLOT_BYTES + total;
}

/** Deep-freezes `value` now and returns it. Instant for a value that is already frozen. */
export const deepFreeze = (value) => {
  if (needsFreezing(value)) freezeOne(value);
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
 * value's estimated size (`footprintOf`), and each long array's rows profile (`rowsProfileOf`). What throws while it is
 * frozen (a getter) throws, or rejects the promise when it is in a later slice.
 */
export const deepFreezeInSlices = (value) => {
  if (!needsFreezing(value)) return null;

  // Long arrays still to walk: { array, next, profile, skips, open }. `skips`: walk.skips when its walk began (-1:
  // not yet). `open`: the bytes counted when the item at `next - 1` began, while the long arrays it holds are walked.
  const pending = [];
  const queued = new Set(); // the same arrays, so one met again (shared, or inside itself) isn't walked twice
  const walk = {
    skips: 0,
    deferLong: (array) => {
      if (queued.has(array)) walk.skips += 1;
      else {
        queued.add(array);
        pending.push({ array, next: 0, profile: newRowsProfile(), skips: -1, open: -1 });
      }
      return 0;
    },
  };
  let bytes = freezeCounted(value, walk);

  const work = (inTime) => {
    while (pending.length) {
      const current = pending[pending.length - 1];
      const { array, profile } = current;
      if (current.skips < 0) current.skips = walk.skips;
      if (current.open >= 0) {
        addRowToProfile(profile, current.next - 1, bytes - current.open);
        current.open = -1;
      }
      let floor = floorOf(profile);
      while (current.next < array.length) {
        const index = current.next++;
        const item = array[index];
        let itemBytes = 0;
        if (typeof item === 'string') itemBytes = item.length;
        else if (item !== null && typeof item === 'object') {
          const start = bytes;
          itemBytes = freezeObjectCounted(item, walk);
          if (pending[pending.length - 1] !== current) {
            bytes += itemBytes;
            current.open = start; // the item held a long array: walk that one first
            break;
          }
        }
        bytes += itemBytes;
        profile.totalBytes += itemBytes;
        if (itemBytes > floor) {
          rankItem(profile, index, itemBytes);
          floor = floorOf(profile);
        }
        if ((current.next & 1023) === 0 && !inTime()) return false;
      }
      if (pending[pending.length - 1] !== current) continue;
      Object.freeze(array);
      bytes += OBJECT_BYTES + array.length * SLOT_BYTES;
      if (walk.skips === current.skips) profiles.set(array, profile);
      pending.pop();
      queued.delete(array);
    }
    footprints.set(value, bytes);
    return true;
  };

  // A throw ends the work, and is its result: thrown from the first slice, else rejecting the promise.
  let failure = null;
  const sliced = runSliced((inTime) => {
    try {
      return work(inTime);
    } catch (error) {
      failure = error;
      return true;
    }
  });
  if (failure) throw failure;
  return (
    sliced &&
    sliced.then(() => {
      if (failure) throw failure;
    })
  );
};
