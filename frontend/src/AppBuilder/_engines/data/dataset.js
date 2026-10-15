import { runSliced } from './slices';
import { allIndexes, createIndexBuilder } from './indexList';

/**
 * Filtering and sorting a dataset's rows by position, without copying rows and without blocking the page: the results
 * are lists of positions (see indexList.js). What passes and how rows compare is given by the caller (the Table gives
 * TanStack's own filter and sorting functions, so results are the same).
 */

/**
 * Positions among `count` rows (or among `candidates`, when given) for which `passes(position)` is true, in order. With
 * no `passes`, every position.
 */
export const filterIndexes = (count, passes, candidates = null) => {
  if (!passes) return candidates ?? allIndexes(count);
  const total = candidates ? candidates.length : count;
  const kept = createIndexBuilder(Math.min(total, 1 << 16));
  for (let k = 0; k < total; k++) {
    const index = candidates ? candidates[k] : k;
    if (passes(index)) kept.push(index);
  }
  return kept.done();
};

/** filterIndexes a slice at a time (see runSliced): `onDone(list)` gets the same result. */
export const filterIndexesInSlices = (count, passes, candidates, onDone, options) => {
  const total = candidates ? candidates.length : count;
  const kept = createIndexBuilder(Math.min(total, 1 << 16));
  let k = 0;
  return runSliced(
    (inTime) => {
      while (k < total) {
        const index = candidates ? candidates[k] : k;
        k += 1;
        if (!passes || passes(index)) kept.push(index);
        if ((k & 255) === 0 && !inTime()) return false;
      }
      onDone(kept.done());
      return true;
    },
    { inline: false, ...options }
  );
};

// Items sorted per slice before they are merged.
const SORT_RUN = 4096;

/**
 * A stable merge sort of `items` (an array or Int32Array) by `compare`, a bit at a time: `step(inTime)` sorts while
 * `inTime()` and returns the sorted items once done (else null). Runs of SORT_RUN items are sorted, then merged in
 * pairs.
 */
export const mergeSortSteps = (items, compare) => {
  const n = items.length;
  let from = items.slice();
  let to = new items.constructor(n);
  let sortedRuns = 0;
  let width = SORT_RUN;
  // The pair of runs being merged: [lo, mid) and [mid, hi), read at i and j, written at out.
  let [lo, mid, hi, i, j, out] = [0, 0, 0, 0, 0, 0];
  return (inTime) => {
    while (sortedRuns < n) {
      const run = Array.prototype.slice.call(from, sortedRuns, sortedRuns + SORT_RUN).sort(compare);
      for (let r = 0; r < run.length; r++) from[sortedRuns + r] = run[r];
      sortedRuns += SORT_RUN;
      if (!inTime()) return null;
    }
    while (width < n) {
      if (out === hi) {
        // Next pair of runs, or the next pass over runs twice as long.
        if (hi >= n) {
          [from, to] = [to, from];
          width *= 2;
          [out, hi] = [0, 0];
          continue;
        }
        lo = hi;
        mid = Math.min(lo + width, n);
        hi = Math.min(lo + 2 * width, n);
        [i, j, out] = [lo, mid, lo];
      }
      while (out < hi) {
        to[out++] = j >= hi || (i < mid && compare(from[i], from[j]) <= 0) ? from[i++] : from[j++];
        if ((out & 255) === 0 && !inTime()) return null;
      }
    }
    return from;
  };
};

// A column with at most this share of distinct values among the rows is sorted by rank (see rankSteps).
export const RANKED_DISTINCT_SHARE = 0.25;

/**
 * Ranks rows by one column, a bit at a time, when the column has few distinct values (statuses, categories, repeated
 * names): only its distinct values are sorted with `compareRows`, and each row gets its value's rank, so rows then
 * compare as numbers instead of through the sorting function (an alphanumeric sort splits both strings on every call:
 * ~30 s for 5M rows). Values `compareRows` finds equal ('A' and 'a' as text) share a rank.
 *
 * `valueOf(position)` is the row's value; `compareRows(a, b)` orders two rows by this column. `step(inTime)` returns
 * true once done; `ranks()` is then an Int32Array indexed by position (of length `size`), or null when the column has
 * too many distinct values for ranking to pay off.
 */
export const rankSteps = ({ indexes, size, valueOf, compareRows }) => {
  const n = indexes.length;
  const distinct = new Map(); // value → a row that has it
  const rankOf = new Map();
  let scanned = 0;
  let ranked = true;
  let sortDistinct = null;
  let sortedRows = null;
  let rankAt = 0;
  let ranks = null;
  let filled = 0;
  const step = (inTime) => {
    if (!ranked) return true;
    while (scanned < n) {
      const row = indexes[scanned++];
      const value = valueOf(row);
      if (!distinct.has(value)) distinct.set(value, row);
      if (distinct.size > n * RANKED_DISTINCT_SHARE) {
        ranked = false; // mostly distinct: ranking saves nothing
        return true;
      }
      if ((scanned & 255) === 0 && !inTime()) return false;
    }
    sortDistinct ??= mergeSortSteps([...distinct.values()], compareRows);
    sortedRows ??= sortDistinct(inTime);
    if (!sortedRows) return false;
    while (rankAt < sortedRows.length) {
      const row = sortedRows[rankAt];
      const tied = rankAt > 0 && compareRows(sortedRows[rankAt - 1], row) === 0;
      rankOf.set(valueOf(row), tied ? rankOf.get(valueOf(sortedRows[rankAt - 1])) : rankAt);
      rankAt += 1;
      if ((rankAt & 255) === 0 && !inTime()) return false;
    }
    ranks ??= new Int32Array(size);
    while (filled < n) {
      const row = indexes[filled++];
      ranks[row] = rankOf.get(valueOf(row));
      if ((filled & 1023) === 0 && !inTime()) return false;
    }
    return true;
  };
  return { step, ranks: () => (ranked ? ranks : null) };
};

/** Runs `steps` (each `step(inTime)` returning true once done) one after another, a slice at a time. */
export const stepsInSlices = (steps, onDone, options) => {
  const queue = steps.slice();
  return runSliced(
    (inTime) => {
      while (queue.length) {
        if (!queue[0](inTime)) return false;
        queue.shift();
      }
      onDone();
      return true;
    },
    { inline: false, ...options }
  );
};
