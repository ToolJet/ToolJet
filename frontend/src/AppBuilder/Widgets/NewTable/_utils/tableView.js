/**
 * The Table's rows: which pass the filters, in what order, and which are on the current page, as lists of row positions
 * in the data (Int32Arrays; see `_engines/data/indexList.js`).
 *
 * TanStack Table builds a row object (with dozens of methods) for every row of the data before it can filter, sort or
 * paginate: ~6 KB and ~8 µs per row, so 100k rows cost ~600 MB and seconds, and 500k crash the tab. Here TanStack keeps
 * what it is good at (columns, sorting, filter and selection state, cells) and is given no rows. The rows are worked
 * out here with TanStack's own filter and sorting functions, giving the same results in the same order, and real
 * TanStack rows are made only for the rows on screen (`createRowCache`).
 */
import { createRow, sortingFns, reSplitAlphaNumeric } from '@tanstack/table-core';
import {
  filterIndexes,
  filterIndexesInSlices,
  mergeSortSteps,
  rankSteps,
  stepsInSlices,
} from '@/AppBuilder/_engines/data/dataset';
import { allIndexes } from '@/AppBuilder/_engines/data/indexList';

const noop = () => {};

/**
 * What filter functions need of a row (its position, data and cell values), as one object pointed at each row in turn:
 * nothing is made per row. Columns are looked up once per run.
 */
const rowCursor = (table, data) => {
  const accessors = new Map();
  const accessorOf = (columnId) => {
    if (!accessors.has(columnId)) accessors.set(columnId, table.getColumn(columnId)?.accessorFn ?? null);
    return accessors.get(columnId);
  };
  const row = {
    index: 0,
    depth: 0,
    subRows: [],
    columnFilters: {},
    columnFiltersMeta: {},
    get id() {
      return String(row.index);
    },
    get original() {
      return data[row.index];
    },
    getValue(columnId) {
      const accessor = accessorOf(columnId);
      return accessor ? accessor(data[row.index], row.index) : undefined;
    },
    renderValue(columnId) {
      return row.getValue(columnId) ?? table.options.renderFallbackValue;
    },
    getUniqueValues(columnId) {
      return [row.getValue(columnId)];
    },
  };
  return row;
};

/**
 * Whether row `index` passes the column filters and the global filter (TanStack's getFilteredRowModel), or null when
 * nothing filters: every row passes.
 */
const rowTest = (table, data) => {
  if (table.options.manualFiltering) return null;
  const { columnFilters = [], globalFilter } = table.getState();

  const resolvedColumnFilters = [];
  for (const { id, value } of columnFilters) {
    const filterFn = table.getColumn(id)?.getFilterFn();
    if (filterFn) resolvedColumnFilters.push({ id, filterFn, value: filterFn.resolveFilterValue?.(value) ?? value });
  }
  const globalFilterFn = globalFilter ? table.getGlobalFilterFn() : null;
  const globalColumns = globalFilterFn
    ? table
        .getAllLeafColumns()
        .filter((column) => column.getCanGlobalFilter())
        .map((column) => column.id)
    : [];
  const globalValue = globalFilterFn ? (globalFilterFn.resolveFilterValue?.(globalFilter) ?? globalFilter) : null;
  const useGlobal = globalFilterFn && globalColumns.length > 0;

  if (!resolvedColumnFilters.length && !useGlobal) return null;

  const row = rowCursor(table, data);
  return (index) => {
    row.index = index;
    let pass = true;
    for (let f = 0; pass && f < resolvedColumnFilters.length; f++) {
      const { id, filterFn, value } = resolvedColumnFilters[f];
      pass = filterFn(row, id, value, noop);
    }
    if (pass && useGlobal) {
      pass = false;
      for (let c = 0; !pass && c < globalColumns.length; c++)
        pass = globalFilterFn(row, globalColumns[c], globalValue, noop);
    }
    return pass;
  };
};

/** Whether anything filters the rows (a search or a column filter, applied on the client). */
export const hasRowFilter = (table) => rowTest(table, []) !== null;

/**
 * Positions of the rows that pass the column filters and the global filter, in data order: what TanStack's
 * getFilteredRowModel keeps. Only `candidates` are checked when given (see `searchCandidates`).
 */
export const filterRowIndexes = (table, data, candidates = null) =>
  filterIndexes(data.length, rowTest(table, data), candidates);

/** Filtering or sorting more rows than this runs in slices (…InSlices) instead of while rendering. */
export const SLICED_ROWS = 100000;

/** filterRowIndexes a slice at a time: `onDone` gets the same result. Returns a function that cancels it. */
export const filterRowIndexesInSlices = (table, data, candidates, onDone, options) => {
  const run = filterIndexesInSlices(data.length, rowTest(table, data), candidates, onDone, options);
  return () => run?.cancel();
};

/**
 * The rows a search has to check: when only the term changed, and the new term contains the previous one, just the
 * rows the previous one kept. The search is a case-insensitive "contains" (useTable), so no other row can match, and
 * typing a word checks fewer rows on each keystroke. Otherwise null: every row.
 */
export const searchCandidates = (previous, next) => {
  if (!previous?.globalFilter || !next.globalFilter) return null;
  for (const key of ['data', 'columns', 'columnFilters', 'manualFiltering']) {
    if (previous[key] !== next[key]) return null;
  }
  const term = String(next.globalFilter).toLowerCase();
  return term.includes(String(previous.globalFilter).toLowerCase()) ? previous.filtered : null;
};

/** TanStack's automatic sorting function for a column, decided from the filtered rows the way TanStack decides it. */
export const autoSortingFn = (table, data, columnId, indexes) => {
  const column = table.getColumn(columnId);
  let isString = false;
  // TanStack looks at the filtered rows from the 11th on (`flatRows.slice(10)`).
  for (let k = 10; k < indexes.length; k++) {
    const i = indexes[k];
    const value = column?.accessorFn ? column.accessorFn(data[i], i) : undefined;
    if (Object.prototype.toString.call(value) === '[object Date]') return sortingFns.datetime;
    if (typeof value === 'string') {
      isString = true;
      if (value.split(reSplitAlphaNumeric).length > 1) return sortingFns.alphanumeric;
    }
  }
  return isString ? sortingFns.text : sortingFns.basic;
};

/** TanStack's automatic first sort direction for a column: ascending for text, from the first filtered row. */
export const autoSortDir = (table, data, columnId, indexes) => {
  const column = table.getColumn(columnId);
  const i = indexes[0];
  const value = i === undefined || !column?.accessorFn ? undefined : column.accessorFn(data[i], i);
  return typeof value === 'string' ? 'asc' : 'desc';
};

/**
 * How the table's sorting orders rows, or null when it doesn't sort: `read(i)` reads row i's sorted-column values (once
 * per row, before comparing) and `compare(a, b)` orders two read rows in TanStack's getSortedRowModel order, including
 * its tie-break on position. Comparisons go through two reusable row cursors.
 */
const rowSorter = (table, data) => {
  if (table.options.manualSorting) return null;
  const sorting = (table.getState().sorting ?? []).filter((sort) => table.getColumn(sort.id)?.getCanSort());
  if (!sorting.length) return null;

  const values = {};
  const info = sorting.map((sort) => {
    const column = table.getColumn(sort.id);
    values[sort.id] = new Array(data.length);
    return {
      id: sort.id,
      accessorFn: column.accessorFn,
      desc: sort.desc ?? false,
      sortUndefined: column.columnDef.sortUndefined,
      invertSorting: column.columnDef.invertSorting,
      sortingFn: column.getSortingFn(),
    };
  });
  const cursor = () => {
    const row = {
      index: 0,
      depth: 0,
      subRows: [],
      get id() {
        return String(row.index);
      },
      get original() {
        return data[row.index];
      },
      getValue: (columnId) =>
        values[columnId]
          ? values[columnId][row.index]
          : table.getColumn(columnId)?.accessorFn?.(data[row.index], row.index),
    };
    return row;
  };
  const rowA = cursor();
  const rowB = cursor();

  const ranks = {}; // column → Int32Array of each row's value rank, when ranked (see sortRowIndexesInSlices)
  return {
    columns: info,
    values,
    ranks,
    read: (i) => {
      for (let c = 0; c < info.length; c++)
        if (info[c].accessorFn) values[info[c].id][i] = info[c].accessorFn(data[i], i);
    },
    /** One column's own order of rows a and b (its sorting function, nothing else). */
    compareColumn: (id, sortingFn, a, b) => {
      rowA.index = a;
      rowB.index = b;
      return sortingFn(rowA, rowB, id);
    },
    compare: (a, b) => {
      rowA.index = a;
      rowB.index = b;
      for (const { id, desc, sortUndefined, invertSorting, sortingFn } of info) {
        let sortInt = 0;
        if (sortUndefined) {
          const aUndefined = values[id][a] === undefined;
          const bUndefined = values[id][b] === undefined;
          if (aUndefined || bUndefined) {
            if (sortUndefined === 'first') return aUndefined ? -1 : 1;
            if (sortUndefined === 'last') return aUndefined ? 1 : -1;
            sortInt = aUndefined && bUndefined ? 0 : aUndefined ? sortUndefined : -sortUndefined;
          }
        }
        if (sortInt === 0) sortInt = ranks[id] ? Math.sign(ranks[id][a] - ranks[id][b]) : sortingFn(rowA, rowB, id);
        if (sortInt !== 0) {
          if (desc) sortInt *= -1;
          if (invertSorting) sortInt *= -1;
          return sortInt;
        }
      }
      return a - b;
    },
  };
};

/** Whether the rows are sorted on the client. */
export const hasRowSorter = (table) => rowSorter(table, []) !== null;

/**
 * The filtered positions in sorted order (TanStack's getSortedRowModel). Sorted with Array.prototype.sort, as TanStack
 * sorts: some sorting functions aren't consistent (the Table's date columns call two empty dates each "after" the
 * other), and then the order depends on the sort algorithm.
 */
export const sortRowIndexes = (table, data, indexes) => {
  const sorter = indexes.length ? rowSorter(table, data) : null;
  if (!sorter) return indexes;
  for (let k = 0; k < indexes.length; k++) sorter.read(indexes[k]);
  return Int32Array.from(Array.from(indexes).sort(sorter.compare));
};

/**
 * sortRowIndexes a slice at a time (used above SLICED_ROWS, where sorting at once blocks the page for seconds). Same
 * order for consistent sorting functions; where one isn't (see sortRowIndexes), rows it can't order (two empty dates)
 * may come in another order among themselves. Each sorted column's values are read once; a column with few
 * distinct values is ranked first (rankSteps), so rows compare as numbers; then the rows are merge-sorted. Returns a
 * function that cancels it.
 */
export const sortRowIndexesInSlices = (table, data, indexes, onDone, options) => {
  const sorter = rowSorter(table, data);
  const steps = [];
  let sorted = indexes;
  if (sorter) {
    const n = indexes.length;
    let k = 0;
    steps.push((inTime) => {
      while (k < n) {
        sorter.read(indexes[k++]);
        if ((k & 255) === 0 && !inTime()) return false;
      }
      return true;
    });
    sorter.columns.forEach(({ id, sortingFn }) => {
      const values = sorter.values[id];
      const ranking = rankSteps({
        indexes,
        size: data.length,
        valueOf: (row) => values[row],
        compareRows: (a, b) => sorter.compareColumn(id, sortingFn, a, b),
      });
      steps.push((inTime) => {
        if (!ranking.step(inTime)) return false;
        const ranks = ranking.ranks();
        if (ranks) sorter.ranks[id] = ranks;
        return true;
      });
    });
    let sortRows = null;
    steps.push((inTime) => {
      sortRows ??= mergeSortSteps(indexes, sorter.compare);
      const result = sortRows(inTime);
      if (result === null) return false;
      sorted = result;
      return true;
    });
  }
  const run = stepsInSlices(steps, () => onDone(sorted), options);
  return () => run?.cancel();
};

/** The positions on the current page (TanStack's getPaginationRowModel; all of them with manual pagination). */
export const pageRowIndexes = (table, indexes) => {
  if (table.options.manualPagination || !indexes.length) return indexes;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageStart = pageSize * pageIndex;
  const pageEnd = pageStart + pageSize;
  // The same list when the page is all of it: no copy of every position.
  if (pageStart <= 0 && pageEnd >= indexes.length) return indexes;
  return indexes.slice(pageStart, pageEnd);
};

/**
 * Real TanStack rows for the rows on screen, made on demand and kept for the most recently used ones. Selection is done
 * here, on the row, because TanStack's own toggle looks rows up in the row model it no longer has.
 */
export const createRowCache = (table, data, limit = 2000) => {
  const rows = new Map();
  const toggleSelected = (row, value) => {
    const isSelected = row.getIsSelected();
    table.setRowSelection((old) => {
      const next = typeof value !== 'undefined' ? value : !isSelected;
      if (row.getCanSelect() && isSelected === next) return old;
      const selection = { ...old };
      if (next) {
        if (!row.getCanMultiSelect()) Object.keys(selection).forEach((key) => delete selection[key]);
        if (row.getCanSelect()) selection[row.id] = true;
      } else {
        delete selection[row.id];
      }
      return selection;
    });
  };
  return (index) => {
    let row = rows.get(index);
    if (row) {
      rows.delete(index);
      rows.set(index, row);
      return row;
    }
    row = createRow(table, String(index), data[index], index, 0);
    row.toggleSelected = (value) => toggleSelected(row, value);
    row.getToggleSelectedHandler = () => (e) => {
      if (row.getCanSelect()) row.toggleSelected(e?.target?.checked);
    };
    rows.set(index, row);
    if (rows.size > limit) rows.delete(rows.keys().next().value);
    return row;
  };
};

/** TanStack's selection helpers, over positions (TanStack's own read row models it doesn't have). */
export const selectionHelpers = (table, filtered, page) => {
  const selected = () => table.getState().rowSelection ?? {};
  const canSelect = () => table.options.enableRowSelection !== false;
  const canMultiSelect = () => table.options.enableMultiRowSelection !== false;
  const isAllPageRowsSelected = () => {
    if (!canSelect() || !page.length) return false;
    const current = selected();
    for (let k = 0; k < page.length; k++) if (!current[page[k]]) return false;
    return true;
  };
  const isAllRowsSelected = () => {
    const current = selected();
    if (!filtered.length || !Object.keys(current).length) return false;
    if (!canSelect()) return true;
    for (let k = 0; k < filtered.length; k++) if (!current[filtered[k]]) return false;
    return true;
  };
  return {
    getIsAllPageRowsSelected: isAllPageRowsSelected,
    getIsSomePageRowsSelected: () => {
      if (isAllPageRowsSelected() || !canSelect()) return false;
      const current = selected();
      for (let k = 0; k < page.length; k++) if (current[page[k]]) return true;
      return false;
    },
    toggleAllPageRowsSelected: (value) =>
      table.setRowSelection((old) => {
        const next = typeof value !== 'undefined' ? value : !isAllPageRowsSelected();
        const selection = { ...old };
        for (let k = 0; k < page.length; k++) {
          const id = String(page[k]);
          if (next) {
            if (!canMultiSelect()) Object.keys(selection).forEach((key) => delete selection[key]);
            if (canSelect()) selection[id] = true;
          } else {
            delete selection[id];
          }
        }
        return selection;
      }),
    toggleAllRowsSelected: (value) =>
      table.setRowSelection((old) => {
        const next = typeof value !== 'undefined' ? value : !isAllRowsSelected();
        const selection = { ...old };
        if (next) {
          if (canSelect()) for (let k = 0; k < filtered.length; k++) selection[filtered[k]] = true;
        } else {
          for (let k = 0; k < filtered.length; k++) delete selection[filtered[k]];
        }
        return selection;
      }),
    /** Selected positions that pass the filters, in data order (TanStack's getFilteredSelectedRowModel). */
    selectedIndexes: () => {
      const current = selected();
      // Nothing selected (the usual case): no pass over every filtered row.
      return Object.keys(current).length ? filtered.filter((i) => current[i]) : new Int32Array(0);
    },
  };
};

export { allIndexes };
