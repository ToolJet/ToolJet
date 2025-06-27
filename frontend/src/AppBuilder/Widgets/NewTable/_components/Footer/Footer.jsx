import React, { useState, memo } from 'react';
// Store files
import useTableStore from '../../_stores/tableStore';
// Local components
import { Pagination } from './_components/Pagination/Pagination';
import { AddNewRow } from './_components/AddNewRow';
import { shallow } from 'zustand/shallow';
import { LoadingFooter } from './_components/LoadingFooter';
import { ControlButtons } from './_components/ControlButtons';
import { ChangeSetUI } from './_components/ChangeSetUI';
import { RowCount } from './_components/RowCount';

export const Footer = memo(
  ({
    id,
    darkMode,
    height,
    width,
    allColumns = [],
    table,
    pageIndex,
    componentName,
    handleChangesSaved,
    handleChangesDiscarded,
    fireEvent,
    setExposedVariables,
    pageCount,
    dataLength,
    columnVisibility, // Passed to trigger a re-render when columnVisibility changes
  }) => {
    const isFooterVisible = useTableStore((state) => state.getFooterVisibility(id), shallow);
    const loadingState = useTableStore((state) => state.getLoadingState(id), shallow);
    const editedRows = useTableStore((state) => state.getAllEditedRows(id), shallow);
    const containerBackgroundColor = useTableStore(
      (state) => state.getTableStyles(id)?.containerBackgroundColor,
      shallow
    );

    const enablePagination = useTableStore((state) => state.getTableProperties(id)?.enablePagination, shallow);
    const showBulkUpdateActions = useTableStore(
      (state) => state.getTableProperties(id)?.showBulkUpdateActions,
      shallow
    );

    const [showAddNewRowPopup, setShowAddNewRowPopup] = useState(false);

    // Hide footer if the properties are not enabled
    if (!isFooterVisible) return null;

    // Loading state for footer
    if (loadingState) {
      return <LoadingFooter />;
    }

    const hideAddNewRowPopup = () => {
      setShowAddNewRowPopup(false);
    };

    const renderRowCount = () => {
      return <RowCount dataLength={dataLength} id={id} />;
    };

    const renderChangeSetUI = () => {
      return (
        <ChangeSetUI
          id={id}
          width={width}
          handleChangesSaved={handleChangesSaved}
          handleChangesDiscarded={handleChangesDiscarded}
        />
      );
    };

    return (
      <>
        <div
          className={`card-footer d-flex align-items-center jet-table-footer table-component-footer justify-content-center ${
            darkMode && 'dark-theme'
          }`}
          style={{
            backgroundColor: containerBackgroundColor,
          }}
        >
          <div className={`table-footer row gx-0 d-flex align-items-center h-100`}>
            <div className="col d-flex justify-content-start custom-gap-4">
              {editedRows.size > 0 && showBulkUpdateActions ? renderChangeSetUI() : renderRowCount()}
            </div>
            {enablePagination && (
              <Pagination id={id} tableWidth={width} pageIndex={pageIndex} table={table} pageCount={pageCount} />
            )}
            <ControlButtons
              id={id}
              table={table}
              darkMode={darkMode}
              height={height}
              componentName={componentName}
              setShowAddNewRowPopup={setShowAddNewRowPopup}
              fireEvent={fireEvent}
              columnVisibility={columnVisibility} // Passed to trigger a re-render when columnVisibility changes
            />
          </div>
        </div>
        {showAddNewRowPopup && (
          <AddNewRow
            id={id}
            hideAddNewRowPopup={hideAddNewRowPopup}
            darkMode={darkMode}
            allColumns={allColumns}
            fireEvent={fireEvent}
            setExposedVariables={setExposedVariables}
          />
        )}
      </>
    );
  }
);
