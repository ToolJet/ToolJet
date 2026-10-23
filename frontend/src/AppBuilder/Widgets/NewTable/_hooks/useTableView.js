import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  filterRowIndexes,
  filterRowIndexesInSlices,
  hasRowFilter,
  SLICED_ROWS,
  sortRowIndexes,
  sortRowIndexesInSlices,
  hasRowSorter,
  pageRowIndexes,
  autoSortingFn,
  autoSortDir,
  createRowCache,
  selectionHelpers,
  searchCandidates,
} from '../_utils/tableView';

const NO_ROWS = new Int32Array(0);

/**
 * How far a search or filter that runs in slices has got: a whole percent (0–99), or null when none runs. Only what
 * subscribes re-renders (the search box, through useSyncExternalStore), once per percent: not the Table on every
 * slice. `set` returns whether the percent changed.
 */
const createSearchProgress = () => {
  let percent = null;
  const listeners = new Set();
  const set = (fraction) => {
    const next = fraction === null ? null : Math.min(99, Math.floor(fraction * 100));
    if (next === percent) return false;
    percent = next;
    listeners.forEach((listener) => listener());
    return true;
  };
  return {
    get: () => percent,
    set,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

/**
 * The result for `inputs`: `compute(lastFinished)` returns `{ value }` (computed while rendering) or
 * `{ start(onDone) → cancel }` (computed in slices after rendering). Returns the last finished `{ inputs, value }`, kept
 * until a newer run finishes, and whether a run for `inputs` is still going.
 */
export function useResult(inputs, compute) {
  const finished = useRef(null);
  const [, finishedRun] = useReducer((n) => n + 1, 0);
  const run = useMemo(() => {
    const result = compute(finished.current);
    if (!result.start) {
      finished.current = { inputs, value: result.value };
      return null;
    }
    return { inputs, start: result.start };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);
  const current = useRef(run);
  current.current = run;
  useEffect(() => {
    if (!run) return undefined;
    return run.start((value) => {
      // A newer render may have replaced this run before its cleanup cancelled it: its result is stale.
      if (current.current !== run) return;
      finished.current = { inputs: run.inputs, value };
      finishedRun();
    });
  }, [run]);
  return [finished.current, run !== null && finished.current?.inputs !== inputs];
}

/**
 * The rows the Table shows, worked out from its data without TanStack row models (see `_utils/tableView.js`):
 * `filtered` (data order), `sorted` (view order) and `page` (current page) as positions in `data`, `getRow(position)`
 * for the TanStack row of a row on screen, the selection helpers over positions, and `isFiltering` / `isSorting` while
 * that runs in slices on large data. Until it finishes, the previous rows stay (none for new data: positions only fit
 * the data they were worked out for); `searchProgress` (createSearchProgress) tells how far filtering has got.
 * `shownPage` / `shownCount` / `shownPageIndex` / `shownPageCount` are what the Table draws, counts and pages: while a
 * search or filter runs in slices on an unsorted Table (`isProgressive`), the matches found so far, filling in.
 */
export function useTableView(table, data) {
  const { columnFilters, globalFilter, sorting, pagination } = table.getState();
  const { manualFiltering, manualSorting, manualPagination } = table.options;
  const columns = table.getAllLeafColumns();
  const searchProgress = useMemo(createSearchProgress, []);
  // The rows a search or filter running in slices has found so far (data order), shown while it runs; null otherwise.
  const [found, setFound] = useState(null);

  // What TanStack's filtered rows depend on (its core rows are rebuilt when the columns change).
  const filterInputs = useMemo(
    () => ({ data, columns, columnFilters, globalFilter, manualFiltering }),
    [data, columns, columnFilters, globalFilter, manualFiltering]
  );
  const [filterDone, isFiltering] = useResult(filterInputs, (last) => {
    const candidates = searchCandidates(last && { ...last.inputs, filtered: last.value }, filterInputs);
    if ((candidates ?? data).length > SLICED_ROWS && hasRowFilter(table)) {
      return {
        start: (onDone) => {
          searchProgress.set(0);
          let shownLength = 0;
          const cancel = filterRowIndexesInSlices(
            table,
            data,
            candidates,
            (value) => {
              searchProgress.set(null);
              setFound(null);
              onDone(value);
            },
            // The matches so far, at most once per percent and only when there are new ones: each render re-renders the
            // rows in view and the header.
            {
              onProgress: (fraction, soFar) => {
                if (!searchProgress.set(fraction)) return;
                const rows = soFar();
                if (rows.length === shownLength) return;
                shownLength = rows.length;
                setFound(rows);
              },
            }
          );
          return () => {
            cancel();
            searchProgress.set(null);
            setFound(null);
          };
        },
      };
    }
    return { value: filterRowIndexes(table, data, candidates) };
  });
  const filtered = filterDone?.inputs.data === data ? filterDone.value : NO_ROWS;

  // TanStack picks a column's automatic sorting function and first sort direction from its rows; it holds none, so the
  // columns ask the data instead (same rules).
  columns.forEach((column) => {
    column.getAutoSortingFn = () => autoSortingFn(table, data, column.id, filtered);
    column.getAutoSortDir = () => autoSortDir(table, data, column.id, filtered);
  });

  const sortInputs = useMemo(
    () => ({ data, filtered, sorting, manualSorting }),
    [data, filtered, sorting, manualSorting]
  );
  const [sortDone, isSorting] = useResult(sortInputs, () =>
    filtered.length > SLICED_ROWS && hasRowSorter(table)
      ? { start: (onDone) => sortRowIndexesInSlices(table, data, filtered, onDone) }
      : { value: sortRowIndexes(table, data, filtered) }
  );
  const sorted = sortDone?.inputs.data === data ? sortDone.value : NO_ROWS;
  const page = useMemo(
    () => pageRowIndexes(table, sorted),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, sorted, pagination?.pageIndex, pagination?.pageSize, manualPagination]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getRow = useMemo(() => createRowCache(table, data), [table, data, columns]);
  // Page count and next/previous come from the row count (TanStack would count its rows).
  table.options.rowCount = sorted.length;

  // Back to the first page when the rows change (data, filters, search, sorting), as TanStack does by default.
  const autoResetPageIndex = table.options.autoResetAll ?? table.options.autoResetPageIndex ?? !manualPagination;

  // What's on screen: the rows found so far while a search or filter runs in slices, unless a sort applies (those rows
  // aren't in its order yet); else the result. Exposed values and the exposed selection keep to the result (`filtered`,
  // `sorted`, `page`): app logic never sees a partial one. From the render that starts it (none found yet), so the rows
  // and the search box's spinner change together. Its page is the one the result lands on (the first, when the page
  // resets on new rows), and the footer counts its pages.
  const isProgressive = isFiltering && !hasRowSorter(table);
  const soFar = found ?? NO_ROWS;
  const pageIndex = pagination?.pageIndex ?? 0;
  const pageSize = pagination?.pageSize;
  const paged = !manualPagination && pageSize > 0;
  const shownPageIndex = isProgressive && autoResetPageIndex ? 0 : pageIndex;
  const shownPage = useMemo(() => {
    if (!isProgressive) return page;
    if (!paged) return soFar;
    return soFar.subarray(shownPageIndex * pageSize, (shownPageIndex + 1) * pageSize);
  }, [isProgressive, soFar, page, paged, shownPageIndex, pageSize]);
  const shownCount = isProgressive ? soFar.length : filtered.length;
  // What the running scan is, as the Table says it: a search when search text applies (not the box's unsent text).
  const searchActivity = globalFilter ? 'Searching' : 'Filtering';
  const shownPageCount =
    isProgressive && paged ? Math.max(1, Math.ceil(soFar.length / pageSize)) : table.getPageCount();
  // The header's select-all works on the rows on screen; the exposed selection on the result (`filtered`).
  const selection = useMemo(() => selectionHelpers(table, filtered, shownPage), [table, filtered, shownPage]);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (autoResetPageIndex) table.resetPageIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sorted]);

  return useMemo(
    () => ({
      data,
      filtered,
      sorted,
      page,
      getRow,
      isFiltering,
      isSorting,
      searchProgress,
      isProgressive,
      shownPage,
      shownPageIndex,
      shownPageCount,
      shownCount,
      searchActivity,
      ...selection,
    }),
    [
      data,
      filtered,
      sorted,
      page,
      getRow,
      isFiltering,
      isSorting,
      searchProgress,
      isProgressive,
      shownPage,
      shownPageIndex,
      shownPageCount,
      shownCount,
      searchActivity,
      selection,
    ]
  );
}
