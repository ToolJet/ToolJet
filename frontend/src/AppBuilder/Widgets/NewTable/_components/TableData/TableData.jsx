import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { LoadingState } from './_components/LoadingState';
import { EmptyState } from './_components/EmptyState';
import { TableHeader } from './_components/TableHeader';
import { TableRow } from './_components/TableRow';
import { ExpandedRowContainer } from './_components/ExpandedRowContainer';
import { useWindow } from '@/AppBuilder/_engines/rendering/useWindow';
import useTableStore from '../../_stores/tableStore';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DEFAULT_EXPANSION_HEIGHT } from '../../_utils/helper';

const CONDENSED_ROW_HEIGHT = 40;
const DEFAULT_ROW_HEIGHT = 46;
// Rows rendered beyond each edge of the view, so a scroll that starts fast still has rows ready.
const OVERSCAN_ROWS = 10;
// Once the table is on screen, rows new to the window mount within about this much time per frame (nearest the view
// first), so scrolling fast never blocks the page; placeholder rows show until the rest mount.
const MOUNT_BUDGET_MS = 8;

// Placeholder rows, drawn as the body's background so they are wherever the browser scrolls before rows render (it
// scrolls on its own thread): each row's bottom border (Regular, Bordered), or the stripes (Striped, where rows are
// striped by their position among the rendered rows: the first rendered row is plain). Under a rendered row they fall on
// the row's own border and stripe.
const placeholderBackground = (rowStyle, rowHeight) => {
  if (rowStyle === 'table-striped') {
    const stripe = 'var(--cc-table-striped-row-bg-color)';
    return `repeating-linear-gradient(to bottom, transparent 0, transparent ${rowHeight}px, ${stripe} ${rowHeight}px, ${stripe} ${
      2 * rowHeight
    }px)`;
  }
  return `repeating-linear-gradient(to bottom, transparent 0, transparent ${rowHeight - 1}px, var(--cc-weak-border) ${
    rowHeight - 1
  }px, var(--cc-weak-border) ${rowHeight}px)`;
};

export const TableData = (props) => {
  const {
    id,
    data,
    tableBodyRef,
    darkMode,
    table,
    view,
    columnOrder,
    setColumnOrder,
    setExposedVariables,
    fireEvent,
    lastClickedRowRef,
    componentName,
    loadingState,
    enableExpandableRows,
    expandedRows,
    expansionHeight = DEFAULT_EXPANSION_HEIGHT,
    canvasWidth,
  } = props;
  const getResolvedValue = useStore((state) => state.getResolvedValue);

  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const rowStyle = useTableStore((state) => state.getTableStyles(id)?.rowStyle, shallow);
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
  const contentWrap = useTableStore((state) => state.getTableStyles(id)?.contentWrap, shallow);
  const containerBackgroundColor = useTableStore(
    (state) => state.getTableStyles(id)?.containerBackgroundColor,
    shallow
  );

  const allowSelection = useTableStore((state) => state.getTableProperties(id)?.allowSelection, shallow);
  const highlightSelectedRow = useTableStore((state) => state.getTableProperties(id)?.highlightSelectedRow, shallow);
  const disableRowDeselection = useTableStore((state) => state.getTableProperties(id)?.disableRowDeselection, shallow);

  useEffect(() => {
    if (allowSelection) {
      if (highlightSelectedRow) {
        table.getColumn('selection')?.toggleVisibility(false);
      } else {
        table.getColumn('selection')?.toggleVisibility(true);
      }
    } else {
      table.getColumn('selection')?.toggleVisibility(false);
    }
  }, [allowSelection, highlightSelectedRow, table]);

  const rowStyles = useMemo(() => {
    let styles = {
      minHeight: cellHeight === 'condensed' ? '39px' : '45px',
      display: 'flex',
    };

    let cellMaxHeight;
    let calculatedCellHeight;
    if (contentWrap) {
      cellMaxHeight = isMaxRowHeightAuto ? 'fit-content' : maxRowHeightValue + 'px';
      styles.maxHeight = cellMaxHeight;
    } else {
      calculatedCellHeight = cellHeight === 'condensed' ? CONDENSED_ROW_HEIGHT : DEFAULT_ROW_HEIGHT;
      styles.maxHeight = `${calculatedCellHeight}px`;
      styles.height = `${calculatedCellHeight}px`;
    }
    return styles;
  }, [cellHeight, contentWrap, isMaxRowHeightAuto, maxRowHeightValue, containerBackgroundColor]);

  // The rows of this page, as positions in the data (see _utils/tableView.js). A TanStack row is made only for a row
  // on screen (view.getRow). With expandable rows, expanded panels are interleaved; otherwise list position i is page
  // row i, with nothing built per row. `in expandedRows` (not a truthy check): row 0's key is falsy.
  const page = view.page;
  const virtualItemList = useMemo(() => {
    if (!enableExpandableRows) return null;
    const items = [];
    page.forEach((rowIndex) => {
      items.push({ type: 'data', rowIndex });
      if (String(rowIndex) in (expandedRows ?? {})) items.push({ type: 'expansion', rowIndex });
    });
    return items;
  }, [page, enableExpandableRows, expandedRows]);
  const itemCount = virtualItemList ? virtualItemList.length : page.length;
  const itemAt = useCallback(
    (i) => (virtualItemList ? virtualItemList[i] : i < page.length ? { type: 'data', rowIndex: page[i] } : undefined),
    [virtualItemList, page]
  );

  const rowHeight = cellHeight === 'condensed' ? CONDENSED_ROW_HEIGHT : DEFAULT_ROW_HEIGHT;
  const estimateSize = useMemo(
    () =>
      virtualItemList ? (i) => (virtualItemList[i].type === 'expansion' ? expansionHeight : rowHeight) : rowHeight,
    [virtualItemList, expansionHeight, rowHeight]
  );

  // Each item has a key that doesn't change when rows above are inserted or removed, so a measured height stays with
  // its row when rows are expanded, collapsed or sorted.
  const getItemKey = useCallback(
    (i) => {
      const item = itemAt(i);
      if (!item) return i;
      return item.type === 'expansion' ? `expansion-${item.rowIndex}` : item.rowIndex;
    },
    [itemAt]
  );
  // Where a key is in the list now (built only when there are measured heights to place again).
  const indexOfKey = useMemo(() => {
    let positions = null;
    return (key) => {
      if (!positions) {
        positions = new Map();
        for (let i = 0; i < itemCount; i++) positions.set(getItemKey(i), i);
      }
      return positions.get(key) ?? -1;
    };
  }, [itemCount, getItemKey]);

  // Only the rows in view (and a margin) are rendered; the list is as tall as all of them, so the scrollbar is too.
  // Rows are measured only when their height can vary (wrapped content); expanded panels report their own height.
  const listRef = useRef(null);
  const rowWindow = useWindow({
    count: itemCount,
    scrollRef: tableBodyRef,
    listRef,
    estimateSize,
    getItemKey,
    indexOfKey,
    overscan: OVERSCAN_ROWS * rowHeight,
    measure: !!contentWrap,
    mountBudgetMs: MOUNT_BUDGET_MS,
  });

  // Rows are memoized: scrolling renders only the rows coming into view. Anything else that re-renders the table (new
  // props, a table setting, its state) re-renders every row, as before.
  const lastRender = useRef({ props: null, tick: -1, version: 0 });
  if (lastRender.current.props !== props || lastRender.current.tick === rowWindow.tick) lastRender.current.version += 1;
  lastRender.current.props = props;
  lastRender.current.tick = rowWindow.tick;
  const renderVersion = lastRender.current.version;
  const tableState = table.getState();

  // Handles row click for row selection
  const handleRowClick = useCallback(
    (row, isCheckbox) => {
      lastClickedRowRef.current = { row: row?.original, index: row.index };
      if (!allowSelection) {
        setExposedVariables({
          selectedRow: row?.original ?? {},
          selectedRowId: isNaN(row.index) ? String(row.index) : row.index,
        });
        fireEvent('onRowClicked');
        return;
      }
      if (disableRowDeselection && row.getIsSelected() && !isCheckbox) {
        return;
      }
      row.toggleSelected();
    },
    [allowSelection, disableRowDeselection, fireEvent, lastClickedRowRef, setExposedVariables]
  );

  const renderTableHeader = () => {
    return (
      <TableHeader
        id={id}
        table={table}
        darkMode={darkMode}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        fireEvent={fireEvent}
        setExposedVariables={setExposedVariables}
      />
    );
  };

  if (loadingState) {
    return (
      <div className={'table-responsive jet-data-table overflow-hidden'}>
        {renderTableHeader()}
        <LoadingState />
      </div>
    );
  } else if (data.length === 0) {
    return (
      <div className={'table-responsive jet-data-table overflow-hidden position-relative'}>
        {renderTableHeader()}
        <EmptyState />
      </div>
    );
  }

  // Placeholder rows for rows of one height, lined up with the rows: the pattern starts at the first rendered row.
  const placeholderStyle =
    !contentWrap && !enableExpandableRows
      ? {
          backgroundImage: placeholderBackground(rowStyle, rowHeight),
          backgroundPosition: `0 ${rowWindow.itemTop(rowWindow.items[0]?.start ?? 0)}`,
        }
      : null;

  return (
    <div
      className={`table-responsive jet-data-table`}
      style={{ maxHeight: '100%', position: 'relative' }}
      ref={tableBodyRef}
    >
      <table className={`table ${rowStyle} ${darkMode && 'table-dark'}`}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: containerBackgroundColor }}>
          {renderTableHeader()}
        </thead>
        <tbody
          ref={listRef}
          style={{
            position: 'relative',
            height: `${rowWindow.height}px`,
            ...placeholderStyle,
          }}
        >
          {rowWindow.items.map((item) => {
            const entry = itemAt(item.index);
            if (!entry) return null;

            if (entry.type === 'expansion') {
              return (
                <ExpandedRowContainer
                  key={`${entry.rowIndex}-expansion`}
                  tableId={id}
                  rowIndex={entry.rowIndex}
                  top={rowWindow.itemTop(item.start)}
                  darkMode={darkMode}
                  canvasWidth={canvasWidth}
                  expansionHeight={expansionHeight}
                  resizeItem={rowWindow.resizeItem}
                  virtualItemIndex={item.index}
                />
              );
            }

            const row = view.getRow(entry.rowIndex);
            return (
              <TableRow
                id={id}
                key={row.id}
                row={row}
                index={item.index}
                top={rowWindow.itemTop(item.start)}
                isSelected={row.getIsSelected()}
                tableState={tableState}
                renderVersion={renderVersion}
                cellHeight={cellHeight}
                getResolvedValue={getResolvedValue}
                handleRowClick={handleRowClick}
                allowSelection={allowSelection}
                contentWrap={contentWrap}
                highlightSelectedRow={highlightSelectedRow}
                setExposedVariables={setExposedVariables}
                fireEvent={fireEvent}
                rowStyles={rowStyles}
                measureElement={rowWindow.measureElement}
                componentName={componentName}
                table={table}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
