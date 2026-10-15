import { useEffect, useMemo, useReducer, useRef } from 'react';
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
 * the data they were worked out for).
 */
export function useTableView(table, data) {
  const { columnFilters, globalFilter, sorting, pagination } = table.getState();
  const { manualFiltering, manualSorting, manualPagination } = table.options;
  const columns = table.getAllLeafColumns();

  // What TanStack's filtered rows depend on (its core rows are rebuilt when the columns change).
  const filterInputs = useMemo(
    () => ({ data, columns, columnFilters, globalFilter, manualFiltering }),
    [data, columns, columnFilters, globalFilter, manualFiltering]
  );
  const [filterDone, isFiltering] = useResult(filterInputs, (last) => {
    const candidates = searchCandidates(last && { ...last.inputs, filtered: last.value }, filterInputs);
    if ((candidates ?? data).length > SLICED_ROWS && hasRowFilter(table)) {
      return { start: (onDone) => filterRowIndexesInSlices(table, data, candidates, onDone) };
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
  const selection = useMemo(() => selectionHelpers(table, filtered, page), [table, filtered, page]);

  // Page count and next/previous come from the row count (TanStack would count its rows).
  table.options.rowCount = sorted.length;

  // Back to the first page when the rows change (data, filters, search, sorting), as TanStack does by default.
  const autoResetPageIndex = table.options.autoResetAll ?? table.options.autoResetPageIndex ?? !manualPagination;
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
    () => ({ data, filtered, sorted, page, getRow, isFiltering, isSorting, ...selection }),
    [data, filtered, sorted, page, getRow, isFiltering, isSorting, selection]
  );
}
