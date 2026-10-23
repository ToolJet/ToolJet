/**
 * Materialization engine: every row of a long ListView at once.
 *
 * materializeAll builds what a windowed ListView's `children` and `data` would hold if it drew every row: keyed by data
 * row, `children` with the row action wrappers readRow gives (rows.js), `data` without functions. Estimated and decided
 * first (estimate.js): one that would take too long, need more memory than the tab has free, or (as JSON) be longer
 * than a string can hold is refused with a MaterializationError saying so. In the background its rows are built in
 * batches of `batchRows` (estimate.js buildRow, the function its time was measured with), sliced so the page keeps
 * responding (slices.js); rows with a child that can't be computed are drawn a batch at a time (held drawn while read,
 * then let go). At once (`mode: 'sync'`) only rows that can all be computed are read, in one loop. Before every batch,
 * and once all are built, what the estimate took for granted is checked against what the rows really come to: memory
 * still free for what is left, the JSON length so far (each row's measured, `json`: what the children read may have
 * grown since the rows were measured), and the pace (once a tenth of the time allowed is spent, the rows left at that
 * pace must still fit in it). The result is deep-frozen and not kept in the store. A ListView that draws every row gives
 * its children/data as they are (inside another ListView's row: by outer row, as it exposes them). A read in the
 * background stops (rejects) at the next batch, and once all are built, when its ListView's rows change, it unmounts or
 * stops windowing; at once when it is cancelled, or a row of a batch fails (the rows waiting to be drawn are let go).
 */
import { deepFreeze, sizeOf } from '@/AppBuilder/_engines/data/freeze';
import { canAllocate } from '@/AppBuilder/_engines/data/memory';
import { runSliced } from '@/AppBuilder/_engines/data/slices';
import {
  buildRow,
  decide,
  estimate,
  JSON_BYTES_PER_CHAR,
  JSON_WRAPPER_CHARS,
  LIMITS,
  MaterializationError,
  memoryRefusal,
  sizeRefusal,
  timeRefusal,
} from './estimate';
import { handleOf, holdRowMounted, listviewRows, rowScopeBase, slotsOf } from './rows';

export { MaterializationError };

/**
 * Every row of the ListView: `{ children, data }`, keyed by data row as its exposed children/data are. `mode`:
 * 'background' (a promise, with `cancel()`) or 'sync' (the value). `json`: the result is to be serialized (its JSON
 * length is checked). Throws (rejects, in the background) a MaterializationError when it can't, or no longer can, be
 * done: `reason` as decide() gives it, or 'changed' / 'cancelled' while it runs.
 */
export const materializeAll = (
  get,
  subscribe,
  listviewId,
  moduleId = 'canvas',
  { mode = 'background', json = false } = {}
) => {
  const sync = mode === 'sync';
  if (!slotsOf(get, listviewId, moduleId)) {
    const exposed = get().resolvedStore.modules[moduleId]?.exposedValues?.components?.[listviewId];
    // Inside another ListView's row, it exposes its children/data for each outer row.
    const all = deepFreeze(
      Array.isArray(exposed)
        ? { children: exposed.map((outer) => outer?.children ?? {}), data: exposed.map((outer) => outer?.data ?? {}) }
        : { children: exposed?.children ?? {}, data: exposed?.data ?? {} }
    );
    return sync ? all : Promise.resolve(all);
  }

  const est = estimate(get, listviewId, moduleId, { json });
  const decision = decide(est, { mode, json });
  if (!decision.ok) {
    const error = new MaterializationError(decision.reason, decision.message, est);
    if (sync) throw error;
    return Promise.reject(error);
  }

  const rows = listviewRows(get, listviewId, moduleId);
  const total = rows.length;
  const limitMs = sync ? LIMITS.syncMs : LIMITS.backgroundMs;
  const { batchRows } = decision;
  const children = {};
  const data = {};
  let jsonChars = JSON_WRAPPER_CHARS;
  // The largest row built so far, as measured: the rows left are projected from it too, so a row costing more than the
  // estimate said (something it reads changed since it was measured, or it isn't among the 5 longest by data) is seen.
  let largestRowBytes = 0;
  const put = (dataRow, built) => {
    if (!built) return;
    children[dataRow] = built.row;
    data[dataRow] = built.values;
    largestRowBytes = Math.max(largestRowBytes, sizeOf({ children: built.row, data: built.values }));
    // In children and in data: the row's values (JSON leaves functions out), `"<row>":` and a comma.
    if (json) jsonChars += 2 * (JSON.stringify(built.values).length + String(dataRow).length + 4);
  };
  const refuse = ({ reason, message }) => {
    throw new MaterializationError(reason, message, est);
  };

  // Before each batch (`next`: the rows built so far) and once all are: not cancelled, the ListView still shown and
  // windowed over the rows decided on, and what is left still fits: its JSON (built so far, the rest as estimated) under
  // the limit, its memory (and its JSON string's) in what is free, and its time at the pace kept so far (`spentMs()`).
  let cancelled = false;
  let spentMs = () => 0;
  const check = (next) => {
    if (cancelled) throw new MaterializationError('cancelled', `Reading ${est.listview}'s rows was cancelled.`, est);
    if (!handleOf(moduleId, listviewId) || !slotsOf(get, listviewId, moduleId)) {
      throw new MaterializationError(
        'changed',
        `${est.listview} stopped showing its rows while they were being read.`,
        est
      );
    }
    if (listviewRows(get, listviewId, moduleId) !== rows) {
      throw new MaterializationError(
        'changed',
        `${est.listview}'s rows changed while they were being read. Read them again.`,
        est
      );
    }
    const left = total ? (total - next) / total : 0;
    const chars = json ? jsonChars + (est.jsonChars - JSON_WRAPPER_CHARS) * left : 0;
    if (chars >= LIMITS.jsonChars) refuse(sizeRefusal(est, chars));
    const bytes = Math.max(est.resultBytes * left, largestRowBytes * (total - next)) + JSON_BYTES_PER_CHAR * chars;
    // Nothing left to build needs nothing more: a result already built isn't refused for the memory it took.
    if (bytes > 0 && !canAllocate(bytes)) refuse(memoryRefusal(est, bytes, undefined, json));
    const spent = spentMs();
    if (next > 0 && next < total && spent >= limitMs / 10 && (spent * total) / next > limitMs) {
      refuse(timeRefusal(est, (spent * total) / next, mode, true));
    }
  };
  const finish = () => {
    check(total);
    Object.freeze(children);
    Object.freeze(data);
    return Object.freeze({ children, data });
  };

  if (sync) {
    const start = performance.now();
    spentMs = () => performance.now() - start;
    const base = rowScopeBase(get, listviewId, moduleId);
    for (let next = 0; next < total; next += batchRows) {
      check(next);
      const end = Math.min(total, next + batchRows);
      for (let dataRow = next; dataRow < end; dataRow++)
        put(dataRow, buildRow(get, listviewId, dataRow, moduleId, base));
    }
    return finish();
  }

  // Cancelling also lets go of the rows a batch is waiting to have drawn (rows.js holdRowMounted).
  const aborts = new AbortController();
  const cancellable = (promise) =>
    Object.assign(promise, {
      cancel: () => {
        cancelled = true;
        aborts.abort(new MaterializationError('cancelled', `Reading ${est.listview}'s rows was cancelled.`, est));
      },
    });

  if (est.drawnWidgets > 0) {
    const start = performance.now();
    spentMs = () => performance.now() - start;
    return cancellable(
      (async () => {
        for (let next = 0; next < total; next += batchRows) {
          check(next);
          const batch = [];
          for (let dataRow = next; dataRow < Math.min(total, next + batchRows); dataRow++) batch.push(dataRow);
          try {
            await Promise.all(
              batch.map((dataRow) =>
                holdRowMounted(get, subscribe, listviewId, dataRow, moduleId, aborts.signal).then((release) => {
                  try {
                    put(dataRow, buildRow(get, listviewId, dataRow, moduleId));
                  } finally {
                    release();
                  }
                })
              )
            );
          } catch (error) {
            aborts.abort(error); // the batch's other rows are let go, not drawn for nothing
            check(next); // cancelled, or a row couldn't be drawn because the ListView unmounted or its rows changed
            throw error;
          }
        }
        return finish();
      })()
    );
  }

  // The time spent in slices (not the tasks between them), the one running included.
  let spent = 0;
  let sliceStart = null;
  spentMs = () => spent + (sliceStart === null ? 0 : performance.now() - sliceStart);
  let next = 0;
  let error = null;
  const work = (inTime) => {
    sliceStart = performance.now();
    try {
      // A row scope a slice: nothing changes the store while one runs.
      let base = null;
      while (next < total) {
        check(next);
        base ??= rowScopeBase(get, listviewId, moduleId);
        const end = Math.min(total, next + batchRows);
        for (; next < end; next++) put(next, buildRow(get, listviewId, next, moduleId, base));
        if (!inTime()) return false;
      }
    } catch (failure) {
      error = failure;
    } finally {
      spent += performance.now() - sliceStart;
      sliceStart = null;
    }
    return true;
  };
  return cancellable(
    runSliced(work, { inline: false }).then(() => {
      if (error) throw error;
      return finish();
    })
  );
};
