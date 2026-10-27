import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  applyFilters,
  cellStyleFor,
  cleanFilters,
  downloadFile,
  isSet,
  looseMatcher,
  matchesSearch,
  normalizeColumns,
  pageOf,
  readCell,
  rowKey,
  sortEntries,
  toCsv,
} from '../lib/ui2/table/model';
import type { Entry, Paged, Row, Sort, TableColumn, TableFilter } from '../lib/ui2/table/model';
import { CellBoundary, renderCell } from '../lib/ui2/table/cells';
import type { OnAction } from '../lib/ui2/table/cells';
import { TableCheckbox, Toolbar } from '../lib/ui2/table/Toolbar';
import { useRowResolver } from '../lib/ui2/table/rowResolver';
import { TOKEN, useDrawnNumber, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import { useLiveState } from '../lib/useLiveState';
import { sameValue } from '../lib/sameValue';
import '../styles/ui2-table.css';

// ToolJet UI 2.0's Table (ShadTable) in the pack: its property, style, event, action and exposed-value names and
// defaults, its typed columns, search, sort, filters, paging, single and bulk selection, row actions and looks. Each user
// action publishes its state first and then fires its event, so a handler reads the new value.

const ROW_HEIGHT: Record<string, number> = { condensed: 36, regular: 44, spacious: 56 };
// An empty table shorter than this drops its footer (toolbar, header, a 28px message line, footer and gaps: about 150px).
const COMPACT_EMPTY_BELOW = 160;
const SEARCH_DEBOUNCE_MS = 300;

// The page numbers around the current one (1 … 4 5 6 … 20) when the page count is known, else previous / next only.
const pageWindow = (page: number, count: number | null): (number | string)[] => {
  if (!count) return [page];
  const pages = [...new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))].sort((a, b) => a - b);
  const out: (number | string)[] = [];
  pages.forEach((p, i) => {
    if (i && p - pages[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
};

const Pager = ({ paged, disabled, onPage }: { paged: Paged; disabled: boolean; onPage: (page: number) => void }) => (
  <div className="t2-pager">
    <button
      type="button"
      className="ui-btn ui-btn--outline ui-btn--sm t2-square"
      aria-label="Previous page"
      disabled={!paged.hasPrevious || disabled}
      onClick={() => onPage(paged.page - 1)}
    >
      <ChevronLeft size={16} />
    </button>
    {pageWindow(paged.page, paged.pageCount).map((p) =>
      typeof p === 'string' ? (
        <span key={p} className="t2-pager-gap">
          …
        </span>
      ) : (
        <button
          key={p}
          type="button"
          className={cn('ui-btn ui-btn--sm t2-page', p === paged.page ? 'ui-btn--outline is-current' : 'ui-btn--ghost')}
          aria-current={p === paged.page ? 'page' : undefined}
          disabled={disabled}
          onClick={() => p !== paged.page && onPage(p)}
        >
          {p}
        </button>
      )
    )}
    <button
      type="button"
      className="ui-btn ui-btn--outline ui-btn--sm t2-square"
      aria-label="Next page"
      disabled={!paged.hasNext || disabled}
      onClick={() => onPage(paged.page + 1)}
    >
      <ChevronRight size={16} />
    </button>
  </div>
);

const toKeySet = (entries: Entry[]) => new Set(entries.map((e) => e.key));
const vars = (pairs: [string, unknown][]): CSSProperties =>
  Object.fromEntries(pairs.filter(([, v]) => isSet(v)).map(([k, v]) => [k, String(v)])) as CSSProperties;
const px = (v: unknown) => (isSet(v) && Number.isFinite(Number(v)) ? `${Number(v)}px` : undefined);

// The footer's row count from its template: the English default says "1 row" for one; any other text is the app's own.
const rowCountText = (template: unknown, count: number): string => {
  const t = typeof template === 'string' && template.trim() ? template : '{count} rows';
  if (t === '{count} rows' && count === 1) return '1 row';
  return t.includes('{count}') ? t.split('{count}').join(String(count)) : `${count} ${t}`;
};

export const DataTable = () => {
  // ---- properties (UI 2.0 names and defaults) ---------------------------------------------------------------------
  const [rawData] = ToolJet.useStateArray({
    name: 'data',
    label: 'Table data',
    description: 'Array of row objects, e.g. {{queries.getOrders.data}}.',
    initialValue: [
      { id: 1, name: 'Ada Lovelace', status: 'Paid', amount: 1250, date: '2026-09-14' },
      { id: 2, name: 'Alan Turing', status: 'Pending', amount: 980.5, date: '2026-09-21' },
      { id: 3, name: 'Grace Hopper', status: 'Overdue', amount: 3120, date: '2026-08-30' },
    ],
  });
  const [rawColumns] = ToolJet.useStateArray({
    name: 'columns',
    label: 'Columns (empty: from the data)',
    inspector: 'columns',
    description:
      'Array of { key, name, columnType, horizontalAlignment, columnSize, columnVisibility, sortable, searchable, wrap, decimalPlaces, currency, locale, dateFormat, prefix, suffix, badgeColors, options, buttons, textColor, cellBackgroundColor, fontWeight, conditionalStyles }. columnType: string, number, currency, date, datetime, badge, tags, boolean, link, image, avatar, progress, button, json, html.',
    placeholder:
      "[{ key: 'name', name: 'Name' }, { key: 'status', name: 'Status', columnType: 'badge' }, { key: 'amount', name: 'Amount', columnType: 'currency' }]",
    initialValue: [
      { key: 'name', name: 'Name' },
      { key: 'status', name: 'Status', columnType: 'badge' },
      { key: 'date', name: 'Date', columnType: 'date' },
      { key: 'amount', name: 'Amount', columnType: 'currency' },
    ],
  });
  const [rawIdField] = ToolJet.useStateString({ name: 'idField', label: 'Row id field', initialValue: 'id' });

  const [enablePagination] = ToolJet.useStateBoolean({ name: 'enablePagination', label: 'Pagination', initialValue: true, section: 'Pagination' });
  const [rowsPerPage] = ToolJet.useStateNumber({
    name: 'rowsPerPage',
    label: 'Rows per page',
    initialValue: 10,
    min: 1,
    max: 1000,
    section: 'Pagination',
    visibleWhen: { key: 'enablePagination', value: true },
  });
  const [serverSidePagination] = ToolJet.useStateBoolean({
    name: 'serverSidePagination',
    label: 'Server-side pagination (data is one page)',
    initialValue: false,
    section: 'Pagination',
    visibleWhen: { key: 'enablePagination', value: true },
  });
  const [totalRecords] = ToolJet.useStateNumber({
    name: 'totalRecords',
    label: 'Total records (server-side)',
    initialValue: 0,
    section: 'Pagination',
    visibleWhen: { key: 'serverSidePagination', value: true },
  });
  const [enablePrevButton] = ToolJet.useStateBoolean({
    name: 'enablePrevButton',
    label: 'Previous page enabled (server-side)',
    initialValue: true,
    section: 'Pagination',
    visibleWhen: { key: 'serverSidePagination', value: true },
  });
  const [enableNextButton] = ToolJet.useStateBoolean({
    name: 'enableNextButton',
    label: 'Next page enabled (server-side)',
    initialValue: true,
    section: 'Pagination',
    visibleWhen: { key: 'serverSidePagination', value: true },
  });

  const [displaySearchBox] = ToolJet.useStateBoolean({ name: 'displaySearchBox', label: 'Search box', initialValue: true, section: 'Search, sort and filters' });
  const [searchPlaceholder] = ToolJet.useStateString({
    name: 'searchPlaceholder',
    label: 'Search placeholder',
    initialValue: 'Search…',
    section: 'Search, sort and filters',
    visibleWhen: { key: 'displaySearchBox', value: true },
  });
  // The toolbar and footer text, so an app in another language reads its own words ("Filtrer", "23 lignes").
  const [filterLabel] = ToolJet.useStateString({ name: 'filterLabel', label: 'Filter button text', initialValue: 'Filter', section: 'Toolbar and footer' });
  const [columnsLabel] = ToolJet.useStateString({ name: 'columnsLabel', label: 'Columns button text', initialValue: 'Columns', section: 'Toolbar and footer' });
  const [rowCountLabel] = ToolJet.useStateString({
    name: 'rowCountLabel',
    label: 'Row count text',
    description: '{count} is the number of rows, e.g. "{count} lignes".',
    initialValue: '{count} rows',
    section: 'Toolbar and footer',
  });
  const [noMatchText] = ToolJet.useStateString({ name: 'noMatchText', label: 'No matching rows message', initialValue: 'No matching rows.', section: 'Empty and loading' });
  const [serverSideSearch] = ToolJet.useStateBoolean({ name: 'serverSideSearch', label: 'Server-side search', initialValue: false, section: 'Search, sort and filters' });
  const [enabledSort] = ToolJet.useStateBoolean({ name: 'enabledSort', label: 'Column sorting', initialValue: true, section: 'Search, sort and filters' });
  const [serverSideSort] = ToolJet.useStateBoolean({ name: 'serverSideSort', label: 'Server-side sort', initialValue: false, section: 'Search, sort and filters' });
  const [showFilterButton] = ToolJet.useStateBoolean({ name: 'showFilterButton', label: 'Filter button', initialValue: true, section: 'Search, sort and filters' });
  const [serverSideFilter] = ToolJet.useStateBoolean({ name: 'serverSideFilter', label: 'Server-side filters', initialValue: false, section: 'Search, sort and filters' });

  const [allowSelectionProp] = ToolJet.useStateBoolean({ name: 'allowSelection', label: 'Row selection', initialValue: true, section: 'Row selection' });
  const [showBulkSelector] = ToolJet.useStateBoolean({
    name: 'showBulkSelector',
    label: 'Bulk selection (checkboxes)',
    initialValue: false,
    section: 'Row selection',
    visibleWhen: { key: 'allowSelection', value: true },
  });
  const [highlightSelectedRow] = ToolJet.useStateBoolean({
    name: 'highlightSelectedRow',
    label: 'Highlight selected row',
    initialValue: true,
    section: 'Row selection',
    visibleWhen: { key: 'allowSelection', value: true },
  });
  const [disableRowDeselection] = ToolJet.useStateBoolean({
    name: 'disableRowDeselection',
    label: 'Keep a row selected (no deselect)',
    initialValue: true,
    section: 'Row selection',
    visibleWhen: { key: 'allowSelection', value: true },
  });
  const [defaultSelectedRow] = ToolJet.useStateObject({
    name: 'defaultSelectedRow',
    label: 'Default selected row ({ key: value })',
    initialValue: {},
    section: 'Row selection',
    visibleWhen: { key: 'allowSelection', value: true },
  });

  const [hideColumnSelectorButton] = ToolJet.useStateBoolean({ name: 'hideColumnSelectorButton', label: 'Hide column chooser', initialValue: false, section: 'Toolbar and footer' });
  const [showDownloadButton] = ToolJet.useStateBoolean({ name: 'showDownloadButton', label: 'Download button', initialValue: false, section: 'Toolbar and footer' });
  const [showRefreshButton] = ToolJet.useStateBoolean({ name: 'showRefreshButton', label: 'Refresh button', initialValue: false, section: 'Toolbar and footer' });
  const [showRowCount] = ToolJet.useStateBoolean({ name: 'showRowCount', label: 'Row count in the footer', initialValue: true, section: 'Toolbar and footer' });

  const [cellSize] = ToolJet.useStateEnumeration({
    name: 'cellSize',
    label: 'Row height',
    enumDefinition: ['condensed', 'regular', 'spacious'],
    enumLabels: { condensed: 'Condensed', regular: 'Regular', spacious: 'Spacious' },
    initialValue: 'regular',
    inspector: 'switch',
    section: 'Appearance',
  });
  const [tableType] = ToolJet.useStateEnumeration({
    name: 'tableType',
    label: 'Rows',
    enumDefinition: ['regular', 'striped', 'bordered'],
    enumLabels: { regular: 'Regular', striped: 'Striped', bordered: 'Bordered' },
    initialValue: 'regular',
    inspector: 'switch',
    section: 'Appearance',
  });
  const [stickyHeader] = ToolJet.useStateBoolean({ name: 'stickyHeader', label: 'Sticky header (scrolls inside)', initialValue: true, section: 'Appearance' });

  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency (currency columns)', initialValue: 'USD', section: 'Formats' });
  const [locale] = ToolJet.useStateString({ name: 'locale', label: 'Number locale', initialValue: 'en-US', section: 'Formats' });
  const [dateFormat] = ToolJet.useStateString({ name: 'dateFormat', label: 'Date format (date columns)', initialValue: 'DD MMM YYYY', section: 'Formats' });
  const [badgeColors] = ToolJet.useStateObject({
    name: 'badgeColors',
    label: 'Badge colours by value',
    initialValue: {},
    placeholder: "{ Paid: '#16a34a', Overdue: '#dc2626' }",
    section: 'Formats',
  });

  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty message', initialValue: 'No results.', section: 'Empty and loading' });
  const [emptyDescription] = ToolJet.useStateString({ name: 'emptyDescription', label: 'Empty description', initialValue: '', section: 'Empty and loading' });
  const [loadingIndicator] = ToolJet.useStateEnumeration({
    name: 'loadingIndicator',
    label: 'Loading look',
    enumDefinition: ['spinner', 'skeleton'],
    enumLabels: { spinner: 'Spinner', skeleton: 'Skeleton' },
    initialValue: 'spinner',
    inspector: 'switch',
    section: 'Empty and loading',
  });

  // ---- exposed values ---------------------------------------------------------------------------------------------
  const hidden = { inspector: 'hidden' as const };
  const [, setSelectedRow] = ToolJet.useStateObject({ name: 'selectedRow', initialValue: {}, ...hidden });
  const [, setSelectedRowId] = ToolJet.useStateNumber({ name: 'selectedRowId', initialValue: null as unknown as number, ...hidden });
  const [, setSelectedRows] = ToolJet.useStateArray({ name: 'selectedRows', initialValue: [], ...hidden });
  const [, setSelectedRowsId] = ToolJet.useStateArray({ name: 'selectedRowsId', initialValue: [], ...hidden });
  const [, setPageIndex] = ToolJet.useStateNumber({ name: 'pageIndex', initialValue: 1, ...hidden });
  const [, setSearchTextExposed] = ToolJet.useStateString({ name: 'searchText', initialValue: '', ...hidden });
  const [, setSortApplied] = ToolJet.useStateArray({ name: 'sortApplied', initialValue: [], ...hidden });
  const [, setFiltersExposed] = ToolJet.useStateArray({ name: 'filters', initialValue: [], ...hidden });
  const [, setCurrentData] = ToolJet.useStateArray({ name: 'currentData', initialValue: [], ...hidden });
  const [, setCurrentPageData] = ToolJet.useStateArray({ name: 'currentPageData', initialValue: [], ...hidden });
  const [, setFilteredData] = ToolJet.useStateArray({ name: 'filteredData', initialValue: [], ...hidden });
  const [, setLastActionClicked] = ToolJet.useStateObject({ name: 'lastActionClicked', initialValue: {}, ...hidden });
  const [, setHoveredRow] = ToolJet.useStateObject({ name: 'hoveredRow', initialValue: {}, ...hidden });
  const [, setHoveredRowId] = ToolJet.useStateNumber({ name: 'hoveredRowId', initialValue: null as unknown as number, ...hidden });
  const [, setSelectedColumnHeader] = ToolJet.useStateObject({ name: 'selectedColumnHeader', initialValue: {}, ...hidden });

  // ---- events -----------------------------------------------------------------------------------------------------
  const onRowClicked = ToolJet.useEventCallback({ name: 'onRowClicked', displayName: 'Row clicked' });
  const onSelectionChanged = ToolJet.useEventCallback({ name: 'onSelectionChanged', displayName: 'Selection changed' });
  const onActionButtonClicked = ToolJet.useEventCallback({ name: 'onActionButtonClicked', displayName: 'Action button clicked' });
  const onSearch = ToolJet.useEventCallback({ name: 'onSearch', displayName: 'Search' });
  const onSort = ToolJet.useEventCallback({ name: 'onSort', displayName: 'Sort applied' });
  const onFilterChanged = ToolJet.useEventCallback({ name: 'onFilterChanged', displayName: 'Filter changed' });
  const onPageChanged = ToolJet.useEventCallback({ name: 'onPageChanged', displayName: 'Page changed' });
  const onRefresh = ToolJet.useEventCallback({ name: 'onRefresh', displayName: 'Refresh' });
  const onRowHovered = ToolJet.useEventCallback({ name: 'onRowHovered', displayName: 'Row hovered' });
  const onHeaderClick = ToolJet.useEventCallback({ name: 'onHeaderClick', displayName: 'Header clicked' });
  const onTableDataDownload = ToolJet.useEventCallback({ name: 'onTableDataDownload', displayName: 'Table data downloaded' });

  // ---- styles (UI 2.0 names; unset reads the app theme) -----------------------------------------------------------
  // The table's own (rounded) box: the host's boxShadow, in the Container section, would draw a second, square one.
  const boxShadow = ToolJet.useStyleString({ name: 'cardShadow', label: 'Table shadow', inspector: 'boxShadow', initialValue: '0px 0px 0px 0px #00000040' });
  const accentColor = useThemeColor('accentColor', 'Accent (checkboxes, focus, active page)', TOKEN.brand);
  const backgroundColor = useThemeColor('backgroundColor', 'Table background', TOKEN.surface);
  const headerBackgroundColor = useThemeColor('headerBackgroundColor', 'Header row background', TOKEN.surface);
  const headerTextColor = useThemeColor('headerTextColor', 'Header text color', TOKEN.mutedText);
  const textColor = useThemeColor('textColor', 'Cell text color', TOKEN.text);
  const mutedTextColor = useThemeColor('mutedTextColor', 'Secondary text color (footer, empty state)', TOKEN.mutedText);
  const borderColor = useThemeColor('borderColor', 'Border and row divider color', TOKEN.border);
  const rowHoverColor = useThemeColor('rowHoverColor', 'Row hover background', TOKEN.muted);
  const selectedRowColor = useThemeColor('selectedRowColor', 'Selected row background', TOKEN.brand);
  const stripedRowColor = useThemeColor('stripedRowColor', 'Striped row background', TOKEN.muted);
  const borderRadius = useThemeRadius('borderRadius', 'Table radius');
  const fontSize = useDrawnNumber('fontSize', 'Font size (px)', 14);
  const headerCasing = ToolJet.useStyleEnumeration({
    name: 'headerCasing',
    label: 'Header casing',
    enumDefinition: ['none', 'uppercase'],
    enumLabels: { none: 'As typed', uppercase: 'UPPERCASE' },
    initialValue: 'none',
  });
  const showBorder = ToolJet.useStyleBoolean({ name: 'showBorder', label: 'Border around the table', initialValue: true });

  const { disabled, loading } = ToolJet.useControlState();
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 44 });
  // Column options may be per-row bindings, as on UI 2.0's Table: textColor, cellBackgroundColor, transformation, link
  // text and a button's label, visibility and disable, written with rowData, cellValue and rowIndex. The host keeps them
  // unresolved in `columns` and resolves each for its row.
  const resolve = useRowResolver({ props: ['columns'] });

  // ---- data and columns -------------------------------------------------------------------------------------------
  const data = useMemo<Row[]>(
    () => (Array.isArray(rawData) ? rawData : []).filter((r): r is Row => !!r && typeof r === 'object' && !Array.isArray(r)),
    [rawData]
  );
  const idField = isSet(rawIdField) ? String(rawIdField) : 'id';
  // The data types the columns that set no type (money, shares, dates and statuses read from the values and the
  // field's words) and makes the columns when none are set.
  const columns = useMemo(() => normalizeColumns(rawColumns, data, idField), [rawColumns, data, idField]);
  // The columns the viewer turned on or off in the chooser, against each column's default (an id column starts off).
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const shownColumns = useMemo(() => columns.filter((c) => c.visible && hiddenIds.has(c.id) === c.hiddenByDefault), [columns, hiddenIds]);
  const entries = useMemo<Entry[]>(() => data.map((row, index) => ({ row, index, key: rowKey(row, idField, index) })), [data, idField]);

  // ---- search, sort, filters, page --------------------------------------------------------------------------------
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  // Live: an action reads the sort and filters as the last one left them, ahead of the next render.
  const [sort, setSort, sortRef] = useLiveState<Sort | null>(null);
  const [filters, setFilters, filtersRef] = useLiveState<TableFilter[]>([]);
  const [page, setPage] = useState(1);
  const serverPaging = serverSidePagination === true && enablePagination !== false;

  // The rows for a search, filter list and sort: a pure step, so an action publishes the rows it leads to before its
  // event fires (a handler reading filteredData saw the rows from before the change).
  const process = (text: string, list: TableFilter[], order: Sort | null): Entry[] => {
    let out = entries;
    if (text && serverSideSearch !== true) out = out.filter((e) => matchesSearch(e.row, shownColumns, text));
    if (list.length && serverSideFilter !== true) out = applyFilters(out, list, columns);
    if (order && serverSideSort !== true) out = sortEntries(out, columns.find((c) => c.key === order.key), order.direction);
    return out;
  };
  const pageFor = (rows: Entry[], target: number): Paged => {
    const result = pageOf(rows, {
      enablePagination: enablePagination !== false,
      serverSidePagination: serverPaging,
      rowsPerPage,
      totalRecords,
      page: target,
    });
    if (serverPaging) {
      result.hasNext = result.pageCount ? result.hasNext && enableNextButton !== false : enableNextButton !== false;
      result.hasPrevious = result.hasPrevious && enablePrevButton !== false;
    }
    return result;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const processed = useMemo(() => process(searchText, filters, sort), [entries, searchText, filters, sort, columns, shownColumns, serverSideSearch, serverSideFilter, serverSideSort]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paged = useMemo(() => pageFor(processed, page), [processed, page, enablePagination, serverPaging, rowsPerPage, totalRecords, enableNextButton, enablePrevButton]);
  // A page past the end (fewer rows after a filter) moves back to the last page.
  useEffect(() => {
    if (!serverPaging && paged.page !== page) {
      setPage(paged.page);
      setPageIndex(paged.page);
    }
  }, [serverPaging, paged.page, page, setPageIndex]);

  const publishRows = (rows: Entry[], pg: Paged) => {
    setFilteredData(rows.map((e) => e.row));
    setCurrentPageData(pg.items.map((e) => e.row));
  };
  useEffect(() => {
    setCurrentData(data);
  }, [data, setCurrentData]);
  useEffect(() => {
    setFilteredData(processed.map((e) => e.row));
    setCurrentPageData(paged.items.map((e) => e.row));
  }, [processed, paged.items, setFilteredData, setCurrentPageData]);

  // ---- selection --------------------------------------------------------------------------------------------------
  const allowSelection = allowSelectionProp !== false;
  const bulk = allowSelection && showBulkSelector === true;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [focusKey, setFocusKey] = useState<string | null>(null);
  // What actions and handlers read later, without going stale.
  const live = useRef({ entries, processed, selected, focusKey, columns });
  live.current = { entries, processed, selected, focusKey, columns };

  const exposeSelection = (keys: Set<string>, focus: string | null) => {
    const all = live.current.entries;
    const picked = all.filter((e) => keys.has(e.key));
    const focusEntry = all.find((e) => e.key === focus);
    setSelectedRow(focusEntry ? focusEntry.row : {});
    setSelectedRowId(focusEntry ? focusEntry.index : (null as unknown as number));
    setSelectedRows(picked.map((e) => e.row));
    setSelectedRowsId(picked.map((e) => e.index));
  };
  const select = (keys: Set<string>, focus: string | null) => {
    setSelected(keys);
    setFocusKey(focus);
    exposeSelection(keys, focus);
  };

  // The default selected row, and keeping the selection on the same records across a reload. It runs for new rows
  // only, so a re-evaluated default does not reselect a row.
  const latest = useRef({ defaultSelectedRow, allowSelection, exposeSelection });
  latest.current = { defaultSelectedRow, allowSelection, exposeSelection };
  useEffect(() => {
    const { defaultSelectedRow: wanted, allowSelection: selectable, exposeSelection: expose } = latest.current;
    if (!entries.length) {
      // Nothing to show yet: the selection is kept for the rows that come back.
      expose(new Set(), null);
      return;
    }
    const keys = toKeySet(entries);
    const kept = new Set([...live.current.selected].filter((key) => keys.has(key)));
    let focus = live.current.focusKey !== null && keys.has(live.current.focusKey) ? live.current.focusKey : null;
    if (!kept.size && wanted && typeof wanted === 'object' && Object.keys(wanted).length && selectable) {
      const [k, v] = Object.entries(wanted)[0];
      const match = entries.find((e) => readCell(e.row, k) == v); // eslint-disable-line eqeqeq
      if (match) {
        kept.add(match.key);
        focus = match.key;
      }
    }
    setSelected(kept);
    setFocusKey(focus);
    expose(kept, focus);
  }, [entries]);

  // `keep` never deselects: pressing a button on the selected row is not a click to deselect it.
  const clickRow = (entry: Entry, { keep = false }: { keep?: boolean } = {}) => {
    if (disabled) return;
    if (allowSelection && !bulk) {
      const already = selected.has(entry.key);
      if (already && (keep || disableRowDeselection !== false)) {
        onRowClicked();
        return;
      }
      select(already ? new Set() : new Set([entry.key]), already ? null : entry.key);
      // A deselecting click is a selection change, not a row click.
      if (!already) onRowClicked();
      onSelectionChanged();
      return;
    }
    // Bulk mode or no selection: the clicked row is still exposed for the handler.
    setFocusKey(entry.key);
    setSelectedRow(entry.row);
    setSelectedRowId(entry.index);
    onRowClicked();
  };
  const toggleBulk = (entry: Entry) => {
    const keys = new Set(selected);
    if (keys.has(entry.key)) keys.delete(entry.key);
    else keys.add(entry.key);
    select(keys, entry.key);
    onSelectionChanged();
  };
  const pageKeys = paged.items.map((e) => e.key);
  const allOnPage = pageKeys.length > 0 && pageKeys.every((key) => selected.has(key));
  const someOnPage = pageKeys.some((key) => selected.has(key));
  const togglePage = () => {
    const keys = new Set(selected);
    pageKeys.forEach((key) => (allOnPage ? keys.delete(key) : keys.add(key)));
    select(keys, focusKey);
    onSelectionChanged();
  };

  // ---- user actions that publish state, then fire their event -----------------------------------------------------
  const sortAppliedOf = (next: Sort | null) =>
    next ? [{ column: columns.find((c) => c.key === next.key)?.name ?? next.key, columnKey: next.key, direction: next.direction }] : [];
  const exposedFilters = (list: TableFilter[]) =>
    list.map((f) => ({ column: columns.find((c) => c.key === f.column)?.name ?? f.column, condition: f.condition, value: f.value ?? '' }));

  const applySort = (next: Sort | null, fire = true) => {
    setSort(next);
    setSortApplied(sortAppliedOf(next));
    const rows = process(searchText, filters, next);
    publishRows(rows, pageFor(rows, page));
    if (fire) onSort();
  };
  const applyFilterList = (list: unknown, fire = true) => {
    const clean = cleanFilters(list, columns);
    setFilters(clean);
    setPage(1);
    setFiltersExposed(exposedFilters(clean));
    setPageIndex(1);
    const rows = process(searchText, clean, sort);
    publishRows(rows, pageFor(rows, 1));
    if (fire) onFilterChanged();
  };
  // From an action: the filters it already has change nothing and fire nothing (lib/sameValue).
  const setFilterList = (list: unknown) => {
    if (!sameValue(filtersRef.current, cleanFilters(list, columns))) applyFilterList(list);
  };
  const applySearch = (text: string) => {
    setSearchText(text);
    setPage(1);
    setSearchTextExposed(text);
    setPageIndex(1);
    const rows = process(text, filters, sort);
    publishRows(rows, pageFor(rows, 1));
    onSearch();
  };
  const applyLatest = useRef(applySearch);
  applyLatest.current = applySearch;
  useEffect(() => {
    if (searchInput === searchText) return undefined;
    const timer = setTimeout(() => applyLatest.current(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, searchText]);

  const goTo = (target: unknown, fire = true) => {
    const n = Math.floor(Number(target));
    if (!Number.isFinite(n) || n < 1) return;
    const next = paged.pageCount ? Math.min(n, paged.pageCount) : n;
    setPage(next);
    setPageIndex(next);
    setCurrentPageData(pageFor(processed, next).items.map((e) => e.row));
    if (fire) onPageChanged();
  };

  const pressHeader = (column: TableColumn) => {
    if (disabled) return;
    setSelectedColumnHeader({ name: column.name, key: column.key });
    onHeaderClick();
  };
  const clickHeader = (column: TableColumn) => {
    if (enabledSort === false || !column.sortable || disabled) return;
    const current = sort?.key === column.key ? sort.direction : null;
    applySort(current === 'asc' ? { key: column.key, direction: 'desc' } : current === 'desc' ? null : { key: column.key, direction: 'asc' });
  };
  // Once per row entered.
  const hoveredRef = useRef<string | null>(null);
  const hoverRow = (entry: Entry) => {
    if (hoveredRef.current === entry.key) return;
    hoveredRef.current = entry.key;
    setHoveredRow(entry.row);
    setHoveredRowId(entry.index);
    onRowHovered();
  };
  // An action acts on its row as a click on the row does. The row is selected BEFORE onActionButtonClicked, so a
  // handler reading selectedRow gets the row its button is on: selected after, a "Mark resolved" query resolved the
  // row selected before (codex lifecycle audit, 2026-10-26). onRowClicked still follows the action, as before.
  const onAction: OnAction = (buttonId, column, row, rowIndex) => {
    if (disabled) return;
    const entry = live.current.entries.find((e) => e.index === rowIndex);
    const selectable = allowSelection && !bulk;
    // A button on the selected row never deselects it (clickRow's `keep`).
    const newlySelected = !!entry && selectable && !selected.has(entry.key);
    if (entry && newlySelected) select(new Set([entry.key]), entry.key);
    else if (entry && !selectable) {
      setFocusKey(entry.key);
      setSelectedRow(entry.row);
      setSelectedRowId(entry.index);
    }
    setLastActionClicked({ buttonId, columnKey: column.key, columnName: column.name, row });
    onActionButtonClicked();
    if (!entry) return;
    onRowClicked();
    if (newlySelected) onSelectionChanged();
  };
  const runDownload = (type: 'csv' | 'json') => {
    const rows = live.current.processed.map((e) => e.row);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    if (type === 'json') downloadFile(`table_${stamp}.json`, JSON.stringify(rows, null, 2), 'application/json');
    else downloadFile(`table_${stamp}.csv`, toCsv(rows, live.current.columns), 'text/csv;charset=utf-8');
  };

  // ---- component actions ------------------------------------------------------------------------------------------
  const isKey = (key: unknown): key is string | number => (typeof key === 'string' && key !== '') || typeof key === 'number';
  const byKeyValues = (key: unknown, values: unknown[]): Entry[] => {
    if (!isKey(key)) return [];
    const matches = looseMatcher(values);
    return live.current.entries.filter((e) => matches(readCell(e.row, key)));
  };
  const asList = (values: unknown) => (Array.isArray(values) ? values : [values]);

  // As on the native Table, setPage does not fire onPageChanged.
  ToolJet.useAction(
    { name: 'setPage', displayName: 'Set page', params: [{ handle: 'page', displayName: 'Page (1-based)', defaultValue: '{{1}}' }] },
    (target: unknown) => goTo(target, false)
  );
  ToolJet.useAction(
    {
      name: 'selectRow',
      displayName: 'Select row',
      params: [
        { handle: 'key', displayName: 'Key', defaultValue: 'id' },
        { handle: 'value', displayName: 'Value' },
      ],
    },
    (key: unknown, value: unknown) => {
      const [match] = byKeyValues(key, [value]);
      if (match) select(new Set([match.key]), match.key);
    }
  );
  ToolJet.useAction({ name: 'deselectRow', displayName: 'Deselect row' }, () => select(new Set(), null));
  ToolJet.useAction(
    {
      name: 'selectRows',
      displayName: 'Select rows',
      params: [
        { handle: 'key', displayName: 'Key', defaultValue: 'id' },
        { handle: 'values', displayName: 'Values', defaultValue: '{{[]}}' },
      ],
    },
    (key: unknown, values: unknown) => {
      const keys = new Set(live.current.selected);
      byKeyValues(key, asList(values)).forEach((e) => keys.add(e.key));
      select(keys, live.current.focusKey);
    }
  );
  ToolJet.useAction(
    {
      name: 'deselectRows',
      displayName: 'Deselect rows',
      params: [
        { handle: 'key', displayName: 'Key', defaultValue: 'id' },
        { handle: 'values', displayName: 'Values', defaultValue: '{{[]}}' },
      ],
    },
    (key: unknown, values: unknown) => {
      const keys = new Set(live.current.selected);
      byKeyValues(key, asList(values)).forEach((e) => keys.delete(e.key));
      select(keys, live.current.focusKey);
    }
  );
  ToolJet.useAction({ name: 'selectAllRows', displayName: 'Select all rows' }, () =>
    select(toKeySet(live.current.processed), live.current.focusKey)
  );
  ToolJet.useAction({ name: 'deselectAllRows', displayName: 'Deselect all rows' }, () => select(new Set(), null));
  ToolJet.useAction(
    {
      name: 'setFilters',
      displayName: 'Set filters',
      params: [{ handle: 'parameters', displayName: 'Filters', defaultValue: "{{[{ column: 'status', condition: 'equals', value: 'Paid' }]}}" }],
    },
    (list: unknown) => setFilterList(list)
  );
  ToolJet.useAction({ name: 'clearFilters', displayName: 'Clear filters' }, () => setFilterList([]));
  ToolJet.useAction(
    {
      name: 'setSort',
      displayName: 'Set sort',
      params: [
        { handle: 'columnKey', displayName: 'Column key' },
        { handle: 'direction', displayName: 'Direction (asc, desc)', defaultValue: 'asc' },
      ],
    },
    (columnKey: unknown, direction: unknown) => {
      const next: Sort | null = isSet(columnKey) && (direction === 'asc' || direction === 'desc') ? { key: String(columnKey), direction } : null;
      // The sort it already has: nothing changes and nothing fires (lib/sameValue).
      if (!sameValue(sortRef.current, next)) applySort(next);
    }
  );
  ToolJet.useAction(
    { name: 'setSearchText', displayName: 'Set search text', params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }] },
    (text: unknown) => {
      const next = String(text ?? '');
      setSearchInput(next);
      applySearch(next);
    }
  );
  ToolJet.useAction(
    { name: 'downloadTableData', displayName: 'Download table data', params: [{ handle: 'type', displayName: 'Type (csv or json)', defaultValue: 'csv' }] },
    (type: unknown) => runDownload(String(type ?? 'csv').toLowerCase().includes('json') ? 'json' : 'csv')
  );

  // ---- layout -----------------------------------------------------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const boxWidth = box.width;
  const [edges, setEdges] = useState({ right: false, below: false });
  // Columns wider than the table together: each text column is capped at a fair share of the width, so long text ends in
  // an ellipsis and every column fits; when they still do not, the table scrolls sideways with a scrollbar shown.
  const [tight, setTight] = useState(false);
  const lastWidth = useRef(-1);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => {
      const head = el.querySelector('thead');
      const width = el.clientWidth;
      const height = el.clientHeight - (head ? head.getBoundingClientRect().height : 0);
      setBox((b) => (b.width === width && b.height === height ? b : { width, height }));
      // A new width measures the columns again uncapped; a table still wider than its box caps them.
      const over = el.scrollWidth > el.clientWidth + 1;
      if (lastWidth.current !== width) {
        lastWidth.current = width;
        setTight(over);
      } else if (over) setTight(true);
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setEdges((e) => (e.right === right && e.below === below ? e : { right, below }));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    if (el.firstElementChild) observer?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, []);
  // The whole table's height, for the compact empty state: in a short box (116px) the toolbar, the header and the
  // footer left no room under the header and "No results." was cut.
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootHeight, setRootHeight] = useState(0);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setRootHeight(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowHeight = ROW_HEIGHT[cellSize] ?? ROW_HEIGHT.regular;
  const striped = tableType === 'striped';
  const bordered = tableType === 'bordered';
  // Column widths are preferences: when they add up to more than the table's width, the table shares its width instead.
  const requestedWidth = shownColumns.reduce((sum, c) => sum + (Number(c.width) || 0), 0);
  const fitWidths = !boxWidth || requestedWidth <= boxWidth;
  const showColumnSelector = hideColumnSelectorButton !== true;
  const toolbar = displaySearchBox !== false || showFilterButton !== false || showColumnSelector || showDownloadButton === true || showRefreshButton === true;
  const colCount = shownColumns.length + (bulk ? 1 : 0) || 1;
  // Each column's share of the width, less its padding; never below 96px.
  const cellCap = tight && boxWidth ? Math.max(96, Math.floor((boxWidth - (bulk ? 40 : 0)) / Math.max(1, shownColumns.length)) - 24) : null;
  const skeletonRows = Math.min(5, Math.max(1, Number(rowsPerPage) || 5));
  const empty = !loading && !paged.items.length;
  // Rows a short page is missing from a full page, on a table with more than one page (see the filler row).
  const multiPage = enablePagination !== false && (paged.pageCount === null || paged.pageCount > 1 || paged.page > 1);
  // An empty table in a short box drops its footer (it reads "0 rows"; a later page past the end keeps its pager) and closes up, so the message has the room
  // under the header. Decided by the whole table's height, which the footer does not change.
  const compactEmpty = empty && rootHeight > 0 && rootHeight < COMPACT_EMPTY_BELOW && !multiPage;
  const fillerRows = multiPage && paged.items.length ? Math.max(0, Math.min(Number(rowsPerPage) || 0, 200) - paged.items.length) : 0;
  const defaults = { currency, locale, dateFormat, badgeColors };

  const accent = isSet(accentColor) ? String(accentColor) : undefined;
  const look = vars([
    ['--ui-primary', accent],
    ['--ui-ring', accent ? `color-mix(in srgb, ${accent} 35%, transparent)` : undefined],
    ['--t2-bg', backgroundColor],
    ['--t2-head-bg', headerBackgroundColor],
    ['--t2-head-fg', headerTextColor],
    ['--t2-fg', textColor],
    ['--t2-muted', mutedTextColor],
    ['--t2-border', borderColor],
    ['--t2-hover', rowHoverColor],
    ['--t2-selected', selectedRowColor],
    ['--t2-striped', stripedRowColor],
    ['--t2-radius', px(borderRadius)],
    ['--t2-shadow', boxShadow],
    ['--t2-cell-max', cellCap ? `${cellCap}px` : undefined],
  ]);
  const rootStyle: CSSProperties = { ...look, ...(px(fontSize) ? { fontSize: px(fontSize) } : {}) };
  const count = serverPaging && Number(totalRecords) ? Number(totalRecords) : processed.length;
  const showPager = enablePagination !== false && (paged.pageCount === null || paged.pageCount > 1 || paged.page > 1);

  return (
    <div
      ref={rootRef}
      className={cn('ui t2-table', headerCasing === 'uppercase' && 't2-upper', disabled && 'is-disabled', compactEmpty && 'is-compact-empty')}
      style={rootStyle}
      aria-disabled={disabled || undefined}
    >
      {toolbar ? (
        <Toolbar
          displaySearchBox={displaySearchBox !== false}
          searchPlaceholder={String(searchPlaceholder ?? 'Search…')}
          filterLabel={String(filterLabel ?? '')}
          columnsLabel={String(columnsLabel ?? '')}
          showFilterButton={showFilterButton !== false}
          showColumnSelector={showColumnSelector}
          showDownloadButton={showDownloadButton === true}
          showRefreshButton={showRefreshButton === true}
          disabled={disabled}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          filters={filters}
          columns={columns}
          applyFilterList={applyFilterList}
          hiddenIds={hiddenIds}
          setHiddenIds={setHiddenIds}
          onDownload={(type) => {
            runDownload(type);
            onTableDataDownload();
          }}
          onRefresh={() => onRefresh()}
          vars={look}
        />
      ) : null}

      <div
        ref={scrollRef}
        className={cn('t2-box', showBorder !== false && 'has-border', empty && 'is-empty', edges.right && 'more-right')}
      >
        <table className={cn('t2-grid', bordered && 'is-bordered')}>
          <thead className={cn(stickyHeader !== false && 'is-sticky')}>
            <tr>
              {bulk ? (
                <th className="t2-check-cell">
                  <TableCheckbox
                    label="Select all on this page"
                    checked={allOnPage ? true : someOnPage ? 'indeterminate' : false}
                    disabled={disabled || !pageKeys.length}
                    onChange={togglePage}
                  />
                </th>
              ) : null}
              {shownColumns.map((column) => {
                const active = sort?.key === column.key ? sort.direction : null;
                const sortable = enabledSort !== false && column.sortable;
                const SortIcon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ArrowUpDown;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    onClick={() => pressHeader(column)}
                    aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : undefined}
                    className={cn(column.align === 'right' && 'is-right', column.align === 'center' && 'is-center')}
                    style={{ width: fitWidths ? column.width : undefined, minWidth: column.minWidth }}
                  >
                    {sortable ? (
                      <button type="button" className={cn('t2-sort', active && 'is-active')} onClick={() => clickHeader(column)}>
                        <span>{column.name}</span>
                        <SortIcon size={12} />
                      </button>
                    ) : (
                      column.name
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && loadingIndicator !== 'skeleton' ? (
              <tr className="t2-plain">
                <td colSpan={colCount} className="t2-loading" style={{ height: rowHeight * skeletonRows }}>
                  <span className="t2-spinner" role="status" aria-label="Loading" />
                </td>
              </tr>
            ) : loading ? (
              Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i} className="t2-plain">
                  {Array.from({ length: colCount }, (__, j) => (
                    <td key={j} style={{ height: rowHeight }}>
                      <span className="t2-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.items.length ? (
              paged.items.map((entry, i) => {
                const row = entry.row;
                const isSelected = selected.has(entry.key);
                // As natively, only a selectable table marks rows.
                const showSelected = allowSelection && isSelected && (bulk || highlightSelectedRow !== false);
                return (
                  <tr
                    key={entry.key}
                    data-state={showSelected ? 'selected' : undefined}
                    className={cn(allowSelection && 'is-selectable', striped && i % 2 === 1 && 'is-striped')}
                    onClick={() => clickRow(entry)}
                    onMouseEnter={() => hoverRow(entry)}
                    onMouseLeave={() => {
                      hoveredRef.current = null;
                    }}
                  >
                    {bulk ? (
                      <td className="t2-check-cell" onClick={(e) => e.stopPropagation()}>
                        <TableCheckbox label="Select row" checked={isSelected} disabled={disabled} onChange={() => toggleBulk(entry)} />
                      </td>
                    ) : null}
                    {shownColumns.map((column) => {
                      const value = readCell(row, column.key);
                      const at = { rowData: row, cellValue: value, rowIndex: entry.index };
                      const color = isSet(column.textColor) ? resolve(column.textColor, at) : undefined;
                      const background = isSet(column.cellBackgroundColor) ? resolve(column.cellBackgroundColor, at) : undefined;
                      const style: CSSProperties = {
                        height: rowHeight,
                        ...(isSet(color) && typeof color === 'string' ? { color } : {}),
                        ...(isSet(background) && typeof background === 'string' ? { background } : {}),
                        ...(column.fontWeight ? { fontWeight: column.fontWeight } : {}),
                        ...cellStyleFor(column, row),
                      };
                      return (
                        <td
                          key={column.id}
                          className={cn(
                            column.wrap ? 'is-wrap' : 'is-nowrap',
                            column.align === 'right' && 'is-right',
                            column.align === 'center' && 'is-center',
                            column.type === 'button' && 'is-actions'
                          )}
                          style={style}
                        >
                          <CellBoundary resetKey={value}>
                            {column.wrap || column.type === 'button' ? (
                              renderCell({ value, row, column, defaults, onAction, rowIndex: entry.index, disabled, resolve })
                            ) : (
                              // A table cell takes no max-width: the content's own box caps and ellipses it.
                              <div className="t2-clip">
                                {renderCell({ value, row, column, defaults, onAction, rowIndex: entry.index, disabled, resolve })}
                              </div>
                            )}
                          </CellBoundary>
                        </td>
                      );
                    })}
                  </tr>
                );
              }).concat(
                // A short last page keeps the table a full page tall: the blank sits inside the table, under its rows,
                // instead of the table (and a card fitted to it) shrinking and leaving a gap below on the page.
                fillerRows > 0
                  ? [
                      <tr key="t2-page-filler" aria-hidden="true" className="t2-plain t2-page-filler">
                        <td colSpan={colCount} style={{ height: rowHeight * fillerRows, padding: 0, border: 0 }} />
                      </tr>,
                    ]
                  : []
              )
            ) : (
              <tr className="t2-plain">
                {/* The empty state fills the body: in a short table the icon goes, then the description. */}
                <td colSpan={colCount} className="t2-empty-cell" style={{ height: Math.max(28, box.height - 1) }}>
                  {/* Sized as the cell once the body is measured: its 130px intrinsic height (the unmeasured fallback)
                      made a short body's cell that tall, the message scrolled out under the header. */}
                  <div className="t2-empty" style={box.height > 0 ? { containIntrinsicHeight: `${Math.max(28, box.height - 1)}px` } : undefined}>
                    <Inbox size={24} className="t2-empty-icon" />
                    <p className="t2-empty-title">{searchText || filters.length ? String(noMatchText || 'No matching rows.') : String(emptyText || 'No results.')}</p>
                    {emptyDescription && !searchText && !filters.length ? <p className="t2-empty-note">{String(emptyDescription)}</p> : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {edges.below ? <div aria-hidden="true" className="t2-fade-below" /> : null}
      </div>

      {(showRowCount !== false || enablePagination !== false) && !loading && !compactEmpty ? (
        <div className="t2-foot">
          <span className="t2-foot-count">
            {showRowCount === false
              ? ''
              : bulk && selected.size
                ? `${selected.size} of ${count} selected`
                : rowCountText(rowCountLabel, count)}
          </span>
          {showPager ? <Pager paged={paged} disabled={disabled} onPage={(p) => goTo(p)} /> : null}
        </div>
      ) : null}
    </div>
  );
};
