import React, { useEffect, useMemo } from 'react';
import { LoadingState } from './_components/LoadingState';
import { EmptyState } from './_components/EmptyState';
import { TableHeader } from './_components/TableHeader';
import { TableRow } from './_components/TableRow';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
import useTableStore from '../../_stores/tableStore';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

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
}) => {
  const getResolvedValue = useStore((state) => state.getResolvedValue);
  const loadingState = useTableStore((state) => state.getLoadingState(id), shallow);

  const isMaxRowHeightAuto = useTableStore((state) => state.getTableStyles(id)?.isMaxRowHeightAuto, shallow);
  const rowStyle = useTableStore((state) => state.getTableStyles(id)?.rowStyle, shallow);
  const cellHeight = useTableStore((state) => state.getTableStyles(id)?.cellHeight, shallow);
  const maxRowHeightValue = useTableStore((state) => state.getTableStyles(id)?.maxRowHeightValue, shallow);
  const contentWrap = useTableStore((state) => state.getTableStyles(id)?.contentWrap, shallow);

  const allowSelection = useTableStore((state) => state.getTableProperties(id)?.allowSelection, shallow);
  const highlightSelectedRow = useTableStore((state) => state.getTableProperties(id)?.highlightSelectedRow, shallow);

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
      calculatedCellHeight = cellHeight === 'condensed' ? 40 : 46;
      styles.maxHeight = `${calculatedCellHeight}px`;
      styles.height = `${calculatedCellHeight}px`;
    }
    return styles;
  }, [cellHeight, contentWrap, isMaxRowHeightAuto, maxRowHeightValue]);

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableBodyRef.current,
    estimateSize: () => (cellHeight === 'condensed' ? 40 : 46),
    overscan: 5,
    scrollMargin: 0,
  });

  // Handles row click for row selection
  const handleRowClick = (row) => {
    if (!allowSelection) return;
    lastClickedRowRef.current = row.original;

    // Update row selection
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
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={`table-responsive jet-data-table`} style={{ maxHeight: '100%' }} ref={tableBodyRef}>
      <table className={`table ${rowStyle} ${darkMode && 'table-dark'}`}>
        {renderTableHeader()}
        <tbody
          style={{
            position: 'relative',
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = table.getRowModel().rows[virtualRow.index];
            return (
              <TableRow
                id={id}
                key={row.id}
                row={row}
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
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
