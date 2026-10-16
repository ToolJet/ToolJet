import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useAutoHeight } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { pageOf } from '@/AppBuilder/Widgets/Ui2/_shared/listModel';
import { applyFilters, matchesSearch, normalizeColumns, rowKey, sortRows } from './tableModel';
import { ROW_BORDER, useCellResolver } from './TableCells';
import { TableToolbar } from './TableToolbar';
import { TableHead } from './TableHead';
import { TableBody } from './TableBody';
import { TableFooter } from './TableFooter';
import { useTableActions } from './useTableActions';
import { useTableEdits } from './useTableEdits';
import { useTableSelection } from './useTableSelection';
import { useTableScroll } from './useTableScroll';

// shadcn/ui pack Table (experiment). Native Table conventions (property, event, exposed and action names; server-side
// pagination, search, sort and filters), the shadcn data-table look, and none of the native table's known failure
// modes: rows have a stable identity (idField), search text is never a regex, a cell that fails renders a dash instead
// of taking the app down, large data is virtualised, and each user action publishes its state once and then fires its
// event, so handlers read the new value.

const ROW_HEIGHT = { condensed: 36, regular: 44, spacious: 56 };
const VIRTUALIZE_ABOVE = 150;
const SEARCH_DEBOUNCE_MS = 300;

const RIGHT_FADE = {
  maskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent)',
  WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent)',
};

const MAX_FILTERS = 50;

export const ShadTable = (props) => {
  const { id, height, properties, styles, setExposedVariable, setExposedVariables, fireEvent, componentName, dataCy } =
    props;
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState === true,
    properties.visibility !== false,
    properties.disabledState === true,
    setExposedVariables,
    setExposedVariable
  );
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useDisableInert(ref, isDisabled);
  const resolve = useCellResolver();

  // ---- data and columns ---------------------------------------------------------------------------------------------
  const data = useMemo(
    () => (Array.isArray(properties.data) ? properties.data.filter((row) => row && typeof row === 'object') : []),
    [properties.data]
  );
  const idField = isSet(properties.idField) ? String(properties.idField) : 'id';
  const autogen = !(Array.isArray(properties.columns) && properties.columns.length);
  const columns = useMemo(
    () => normalizeColumns(properties.columns, data),
    [properties.columns, autogen ? data : null] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const shownColumns = columns.filter((c) => c.visible && !hiddenIds.has(c.id));
  const entries = useMemo(
    () => data.map((row, index) => ({ row, index, key: rowKey(row, idField, index) })),
    [data, idField]
  );

  // ---- edits (overlay on the data until it changes) -------------------------------------------------------------------
  // Everything the actions and handlers read later, without going stale.
  const live = useRef({});
  const { edits, withEdits, editing, setEditing, commitEdit, discard } = useTableEdits({
    data,
    live,
    setExposedVariables,
    fireEvent,
  });

  // ---- search, sort, filters, page ------------------------------------------------------------------------------------
  const serverPaging = properties.serverSidePagination === true;
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState([]);
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    let list = entries;
    if (searchText && properties.serverSideSearch !== true) {
      list = list.filter((entry) => matchesSearch(withEdits(entry), shownColumns, searchText));
    }
    if (filters.length && properties.serverSideFilter !== true) {
      const passing = new Set(applyFilters(list.map(withEdits), filters, columns));
      list = list.filter((entry) => passing.has(withEdits(entry)));
    }
    if (sort && properties.serverSideSort !== true) {
      const column = columns.find((c) => c.key === sort.key);
      if (column) {
        const order = new Map(sortRows(list.map(withEdits), column, sort.direction).map((row, i) => [row, i]));
        list = [...list].sort((a, b) => order.get(withEdits(a)) - order.get(withEdits(b)));
      }
    }
    return list;
  }, [
    entries,
    searchText,
    filters,
    sort,
    edits,
    columns,
    hiddenIds,
    properties.serverSideSearch,
    properties.serverSideFilter,
    properties.serverSideSort,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const paged = pageOf(processed, {
    enablePagination: properties.enablePagination !== false,
    serverSidePagination: serverPaging,
    rowsPerPage: properties.rowsPerPage,
    totalRecords: properties.totalRecords,
    page,
  });
  if (serverPaging && properties.enablePagination !== false) {
    paged.hasNext = paged.pageCount
      ? paged.hasNext && properties.enableNextButton !== false
      : properties.enableNextButton !== false;
    paged.hasPrevious = paged.hasPrevious && properties.enablePrevButton !== false;
  }
  useEffect(() => {
    if (!serverPaging && paged.page !== page) setPage(paged.page);
  }, [paged.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- selection ------------------------------------------------------------------------------------------------------
  const {
    allowSelection,
    bulk,
    selected,
    focusKey,
    select,
    clickRow,
    toggleBulk,
    pageKeys,
    allOnPage,
    someOnPage,
    togglePage,
  } = useTableSelection({ properties, entries, paged, isDisabled, live, withEdits, fireEvent, setExposedVariables });
  live.current = { entries, processed, paged, selected, edits, columns, filters, sort, searchText, data, focusKey };

  // ---- user actions that publish state, then fire their event ----------------------------------------------------------
  useEffect(() => {
    if (searchInput === searchText) return undefined;
    const timer = setTimeout(() => {
      setSearchText(searchInput);
      setPage(1);
      setExposedVariables({ searchText: searchInput, pageIndex: 1 });
      fireEvent('onSearch');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortApplied = (next) => {
    if (!next) return [];
    const column = columns.find((c) => c.key === next.key);
    return [{ column: column?.name ?? next.key, columnKey: next.key, direction: next.direction }];
  };
  const applySort = (next, { fire = true } = {}) => {
    setSort(next);
    setExposedVariable('sortApplied', sortApplied(next));
    if (fire) fireEvent('onSort');
  };
  // The native Table's onHeaderClick, with the column in selectedColumnHeader, on any header press (sortable or not).
  const pressHeader = (column) => {
    if (isDisabled) return;
    setExposedVariable('selectedColumnHeader', { name: column.name, key: column.key });
    fireEvent('onHeaderClick');
  };
  // The native Table's onRowHovered, with the row in hoveredRow and its index in hoveredRowId, once per row entered.
  const hoveredRef = useRef(null);
  const hoverRow = (entry) => {
    if (hoveredRef.current === entry.key) return;
    hoveredRef.current = entry.key;
    setExposedVariables({ hoveredRow: withEdits(entry), hoveredRowId: entry.index });
    fireEvent('onRowHovered');
  };
  const clickHeader = (column) => {
    if (properties.enabledSort === false || !column.sortable || isDisabled) return;
    const current = sort?.key === column.key ? sort.direction : null;
    applySort(
      current === 'asc'
        ? { key: column.key, direction: 'desc' }
        : current === 'desc'
        ? null
        : { key: column.key, direction: 'asc' }
    );
  };
  const exposedFilters = (list) =>
    list.map((f) => ({
      column: columns.find((c) => c.key === f.column)?.name ?? f.column,
      condition: f.condition,
      value: f.value ?? '',
    }));
  const applyFilterList = (list, { fire = true } = {}) => {
    // Every filter is checked on every row: past MAX_FILTERS, a bound list is a mistake, not a filter set.
    const clean = (Array.isArray(list) ? list : [])
      .filter((f) => f && typeof f === 'object' && isSet(f.column) && isSet(f.condition))
      .slice(0, MAX_FILTERS);
    // Accept header names as well as keys, as the native setFilters does.
    const normalized = clean.map((f) => ({
      ...f,
      column: (columns.find((c) => c.key === f.column || c.name === f.column) ?? {}).key ?? f.column,
    }));
    setFilters(normalized);
    setPage(1);
    setExposedVariables({ filters: exposedFilters(normalized), pageIndex: 1 });
    if (fire) fireEvent('onFilterChanged');
  };
  const goTo = (target, { fire = true } = {}) => {
    const next = Math.max(1, Math.floor(Number(target)) || 1);
    setPage(next);
    setExposedVariable('pageIndex', next);
    if (fire) fireEvent('onPageChanged');
  };
  const onAction = (buttonId, column, row, rowIndex) => {
    setExposedVariables({
      selectedRow: row,
      selectedRowId: rowIndex,
      lastActionClicked: { buttonId, columnKey: column.key, columnName: column.name, row },
    });
    fireEvent('onActionButtonClicked');
  };

  // ---- exported data and actions --------------------------------------------------------------------------------------
  useEffect(() => {
    setExposedVariables({
      currentData: data,
      filteredData: processed.map(withEdits),
      currentPageData: paged.items.map(withEdits),
    });
  }, [data, processed, paged.page, paged.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const runDownload = useTableActions({
    live,
    componentName,
    withEdits,
    setExposedVariables,
    goTo,
    select,
    applyFilterList,
    applySort,
    setSearchInput,
    discard,
  });

  // ---- layout ---------------------------------------------------------------------------------------------------------
  const rowHeight = ROW_HEIGHT[properties.cellSize] ?? ROW_HEIGHT.regular;
  const visibleRows = paged.items;
  const virtual = visibleRows.length > VIRTUALIZE_ABOVE;
  const fixedHeight = props.properties?.dynamicHeight === false || virtual;
  const { scrollRef, moreBelow, moreRight, boxWidth, virtualItems, padTop, padBottom, rendered } = useTableScroll({
    fixedHeight,
    virtual,
    visibleRows,
    rowHeight,
  });

  const striped = properties.tableType === 'striped';
  const bordered = properties.tableType === 'bordered';
  // Column widths are preferences: when they add up to more than the table's width (a narrow card), they are dropped
  // and the table shares its width among the columns instead of cutting the last one off.
  const requestedWidth = shownColumns.reduce((sum, column) => sum + (Number(column.width) || 0), 0);
  const fitWidths = !boxWidth || requestedWidth <= boxWidth;
  const toolbar =
    properties.displaySearchBox !== false ||
    properties.showFilterButton !== false ||
    properties.hideColumnSelectorButton !== true ||
    properties.showDownloadButton === true ||
    properties.showRefreshButton === true;
  const colCount = shownColumns.length + (bulk ? 1 : 0) || 1;
  const fontSize = isSet(styles?.fontSize) ? `${Number(styles.fontSize) || 14}px` : undefined;
  const pendingEdits = edits.size;

  return (
    <Shell {...props} properties={{ ...properties, visibility: isVisible }} innerRef={ref}>
      <div className="flex flex-col gap-3" style={{ fontSize }}>
        {toolbar ? (
          <TableToolbar
            properties={properties}
            styles={styles}
            isDisabled={isDisabled}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            filters={filters}
            columns={columns}
            applyFilterList={applyFilterList}
            hiddenIds={hiddenIds}
            setHiddenIds={setHiddenIds}
            runDownload={runDownload}
            fireEvent={fireEvent}
          />
        ) : null}

        <div
          ref={scrollRef}
          className={cn(
            'relative w-full overflow-auto bg-[color:var(--lk-bg,transparent)]',
            styles?.showBorder !== false && 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] border',
            ROW_BORDER
          )}
          style={{
            ...(fixedHeight ? { maxHeight: Math.max(160, (Number(height) || 440) - (toolbar ? 56 : 0) - 52) } : {}),
            ...(moreRight ? RIGHT_FADE : {}),
          }}
        >
          <table className="w-full caption-bottom border-collapse text-[length:inherit]">
            <TableHead
              properties={properties}
              styles={styles}
              fixedHeight={fixedHeight}
              bulk={bulk}
              allOnPage={allOnPage}
              someOnPage={someOnPage}
              isDisabled={isDisabled}
              pageKeys={pageKeys}
              togglePage={togglePage}
              shownColumns={shownColumns}
              sort={sort}
              pressHeader={pressHeader}
              clickHeader={clickHeader}
              bordered={bordered}
              fitWidths={fitWidths}
            />
            <TableBody
              properties={properties}
              isLoading={isLoading}
              isDisabled={isDisabled}
              colCount={colCount}
              rowHeight={rowHeight}
              rendered={rendered}
              virtual={virtual}
              virtualItems={virtualItems}
              padTop={padTop}
              padBottom={padBottom}
              shownColumns={shownColumns}
              withEdits={withEdits}
              selected={selected}
              bulk={bulk}
              allowSelection={allowSelection}
              striped={striped}
              bordered={bordered}
              clickRow={clickRow}
              hoverRow={hoverRow}
              hoveredRef={hoveredRef}
              toggleBulk={toggleBulk}
              editing={editing}
              setEditing={setEditing}
              edits={edits}
              commitEdit={commitEdit}
              resolve={resolve}
              onAction={onAction}
              searchText={searchText}
              filters={filters}
            />
          </table>
          {moreBelow ? (
            <div
              aria-hidden="true"
              className="pointer-events-none sticky bottom-0 -mt-8 h-8 w-full bg-gradient-to-t from-[color:var(--lk-bg,var(--sc-background))] to-transparent"
            />
          ) : null}
        </div>

        <TableFooter
          properties={properties}
          isLoading={isLoading}
          isDisabled={isDisabled}
          pendingEdits={pendingEdits}
          discard={discard}
          fireEvent={fireEvent}
          bulk={bulk}
          selected={selected}
          serverPaging={serverPaging}
          processed={processed}
          paged={paged}
          goTo={goTo}
        />
      </div>
    </Shell>
  );
};

export default ShadTable;
