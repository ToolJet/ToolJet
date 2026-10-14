import React, { useCallback, useEffect, useMemo } from 'react';
import { LoadingState } from './_components/LoadingState';
import { EmptyState } from './_components/EmptyState';
import { TableHeader } from './_components/TableHeader';
import { TableRow } from './_components/TableRow';
import { ExpandedRowContainer } from './_components/ExpandedRowContainer';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
import useTableStore from '../../_stores/tableStore';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DEFAULT_EXPANSION_HEIGHT } from '../../_utils/helper';

const CONDENSED_ROW_HEIGHT = 40;
const DEFAULT_ROW_HEIGHT = 46;

export const TableData = ({
  id,
  data,
  tableBodyRef,
  darkMode,
  table,
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
}) => {
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

  // Build an interleaved list of virtual items: data rows + expansion panels.
  // Use `row.id in expandedRows` (not truthy check) — rowIndex 0 is falsy.
  const rows = table.getRowModel().rows;
  const virtualItemList = useMemo(() => {
    if (!enableExpandableRows) {
      return rows.map((row) => ({ type: 'data', row, rowIndex: row.index }));
    }
    const items = [];
    rows.forEach((row) => {
      items.push({ type: 'data', row, rowIndex: row.index });
      if (row.id in (expandedRows ?? {})) {
        items.push({ type: 'expansion', row, rowIndex: row.index });
      }
    });
    return items;
  }, [rows, enableExpandableRows, expandedRows]);

  const estimateSize = useCallback(
    (i) => {
      const item = virtualItemList[i];
      if (item?.type === 'expansion') {
        return expansionHeight;
      }
      return cellHeight === 'condensed' ? CONDENSED_ROW_HEIGHT : DEFAULT_ROW_HEIGHT;
    },
    [virtualItemList, cellHeight, expansionHeight]
  );

  // Each item gets a stable cache key that does not change when rows above are inserted or removed.
  // Without stable keys, TanStack keys items by virtual index, so expanding row N shifts every subsequent index and reuses the wrong cached sizes.
  // With stable keys the itemSizeCache survives expand/collapse reorderings, which also removes the need for measure() entirely.
  const getItemKey = useCallback(
    (i) => {
      const item = virtualItemList[i];
      if (!item) return i;
      return item.type === 'expansion' ? `expansion-${item.rowIndex}` : item.row.id;
    },
    [virtualItemList]
  );

  const rowVirtualizer = useVirtualizer({
    count: virtualItemList.length,
    getScrollElement: () => tableBodyRef.current,
    estimateSize,
    getItemKey,
    overscan: 5,
    scrollMargin: 0,
  });

  // Handles row click for row selection
  const handleRowClick = (row, isCheckbox) => {
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
  };

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
          style={{
            position: 'relative',
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = virtualItemList[virtualRow.index];
            if (!item) return null;

            if (item.type === 'expansion') {
              return (
                <ExpandedRowContainer
                  key={`${item.row.id}-expansion`}
                  tableId={id}
                  rowIndex={item.rowIndex}
                  top={virtualRow.start}
                  darkMode={darkMode}
                  canvasWidth={canvasWidth}
                  expansionHeight={expansionHeight}
                  virtualizer={rowVirtualizer}
                  virtualItemIndex={virtualRow.index}
                />
              );
            }

            return (
              <TableRow
                id={id}
                key={item.row.id}
                row={item.row}
                virtualRow={virtualRow}
                cellHeight={cellHeight}
                getResolvedValue={getResolvedValue}
                handleRowClick={handleRowClick}
                allowSelection={allowSelection}
                contentWrap={contentWrap}
                highlightSelectedRow={highlightSelectedRow}
                setExposedVariables={setExposedVariables}
                fireEvent={fireEvent}
                rowStyles={rowStyles}
                measureElement={rowVirtualizer.measureElement}
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
