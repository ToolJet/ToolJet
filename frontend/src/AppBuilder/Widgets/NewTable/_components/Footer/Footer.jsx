import React, { useState } from 'react';
// Store files
import useTableStore from '../../_stores/tableStore';
// Local components
import Loader from '../Loader';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Pagination from '../Pagination';
import { Tooltip } from 'react-tooltip';
import OverlayTriggerComponent from '../OverlayTriggerComponent';
import IndeterminateCheckbox from '../IndeterminateCheckbox';
import Popover from 'react-bootstrap/Popover';
import { exportToCSV, exportToExcel, exportToPDF } from '@/AppBuilder/Widgets/NewTable/_utils/exportData';
import AddNewRow from '../AddNewRow';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

let count = 0;

export const Footer = React.memo(
  ({
    id,
    darkMode,
    height,
    width,
    allColumns = [],
    table,
    pageIndex,
    pageSize,
    pageCount,
    canPreviousPage,
    canNextPage,
    onPageChange,
    onPageSizeChange,
    componentName,
    handleChangesSaved,
    handleChangesDiscarded,
    fireEvent,
    dataLength,
    columnVisibility,
  }) => {
    const onEvent = useStore((state) => state.eventsSlice.onEvent);

    const isFooterVisible = useTableStore((state) => state.getFooterVisibility(id), shallow);
    const loadingState = useTableStore((state) => state.getLoadingState(id), shallow);
    const editedRows = useTableStore((state) => state.getAllEditedRows(id), shallow);
    const tableComponentEvents = useTableStore((state) => state.getTableComponentEvents(id), shallow);
    const showAddNewRowButton = useTableStore((state) => state.getTableProperties(id)?.showAddNewRowButton, shallow);
    const showDownloadButton = useTableStore((state) => state.getTableProperties(id)?.showDownloadButton, shallow);
    const hideColumnSelectorButton = useTableStore(
      (state) => state.getTableProperties(id)?.hideColumnSelectorButton,
      shallow
    );
    const enablePagination = useTableStore((state) => state.getTableProperties(id)?.enablePagination, shallow);
    const clientSidePagination = useTableStore((state) => state.getTableProperties(id)?.clientSidePagination, shallow);
    const serverSidePagination = useTableStore((state) => state.getTableProperties(id)?.serverSidePagination, shallow);
    const totalRecords = useTableStore((state) => state.getTableProperties(id)?.totalRecords, shallow);
    const showBulkUpdateActions = useTableStore(
      (state) => state.getTableProperties(id)?.showBulkUpdateActions,
      shallow
    );

    const [showAddNewRowPopup, setShowAddNewRowPopup] = useState(false);

    // Hide footer if the properties are not enabled
    if (!isFooterVisible) return null;

    const hideAddNewRowPopup = () => {
      setShowAddNewRowPopup(false);
    };

    // Loading state for footer
    if (loadingState) {
      return (
        <div className="card-footer d-flex align-items-center jet-table-footer justify-content-center">
          <div className={`table-footer row gx-0 d-flex align-items-center h-100`}>
            <div className="col d-flex justify-content-start custom-gap-4">
              <Loader width={83} height={28} />
            </div>
            <div className={'col d-flex justify-content-center h-100 w-100 pagination-loader'}>
              <Loader width={'100%'} height={28} />
            </div>
            <div className="col d-flex justify-content-end ">
              <Loader width={83} height={28} />
            </div>
          </div>
        </div>
      );
    }

    const hideColumnsPopover = () => {
      return (
        <Popover className={`${darkMode && 'dark-theme'}`} style={{ maxHeight: `${height - 79}px`, overflowY: 'auto' }}>
          <div
            data-cy={`dropdown-hide-column`}
            className={`dropdown-table-column-hide-common ${
              darkMode ? 'dropdown-table-column-hide-dark-themed dark-theme' : 'dropdown-table-column-hide'
            } `}
            placement="top-end"
          >
            <div className="dropdown-item cursor-pointer">
              <IndeterminateCheckbox
                checked={table.getIsAllColumnsVisible()}
                onChange={table.getToggleAllColumnsVisibilityHandler()}
              />
              <span className="hide-column-name tj-text-xsm" data-cy={`options-select-all-coloumn`}>
                Selects All
              </span>
            </div>
            {table.getAllLeafColumns().map((column) => {
              const header = column?.columnDef?.header;
              return (
                typeof header === 'string' && (
                  <div key={column.id}>
                    <div>
                      <label className="dropdown-item d-flex cursor-pointer">
                        <input
                          type="checkbox"
                          data-cy={`checkbox-coloumn-${String(header).toLowerCase().replace(/\s+/g, '-')}`}
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                        />
                        <span
                          className="hide-column-name tj-text-xsm"
                          data-cy={`options-coloumn-${String(header).toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {` ${header}`}
                        </span>
                      </label>
                    </div>
                  </div>
                )
              );
            })}
          </div>
        </Popover>
      );
    };

    const downlaodPopover = () => {
      return (
        <Popover
          id="popover-basic"
          data-cy="popover-card"
          className={`${darkMode && 'dark-theme'} shadow table-widget-download-popup`}
          placement="top-end"
        >
          <Popover.Body className="p-0">
            <div className="table-download-option cursor-pointer">
              <span
                data-cy={`option-download-CSV`}
                className="cursor-pointer"
                onClick={() => exportToCSV(table, componentName)}
              >
                Download as CSV
              </span>
              <span
                data-cy={`option-download-execel`}
                className="pt-2 cursor-pointer"
                onClick={() => exportToExcel(table, componentName)}
              >
                Download as Excel
              </span>
              <span
                data-cy={`option-download-pdf`}
                className="pt-2 cursor-pointer"
                onClick={() => exportToPDF(table, componentName)}
              >
                Download as PDF
              </span>
            </div>
          </Popover.Body>
        </Popover>
      );
    };

    const renderRowCount = () => {
      return (
        <span
          data-cy={`footer-number-of-records`}
          className="font-weight-500"
          style={{ color: 'var(--text-placeholder)' }}
        >
          {clientSidePagination && !serverSidePagination && `${dataLength} Records`}
          {serverSidePagination && totalRecords ? `${totalRecords} Records` : ''}
        </span>
      );
    };

    const renderChangeSetUI = () => {
      return (
        <>
          <ButtonSolid
            variant="primary"
            className={`tj-text-xsm`}
            onClick={() => {
              onEvent('onBulkUpdate', tableComponentEvents).then(() => {
                handleChangesSaved();
              });
            }}
            data-cy={`table-button-save-changes`}
            size="md"
            // isLoading={tableDetails.isSavingChanges ? true : false}
            customStyles={{ minWidth: '32px', padding: width > 650 ? '6px 16px' : 0 }}
            leftIcon={width > 650 ? '' : 'save'}
            fill="#FDFDFE"
            iconWidth="16"
          >
            {width > 650 ? <span>Save changes</span> : ''}
          </ButtonSolid>
          <ButtonSolid
            variant="tertiary"
            className={`tj-text-xsm`}
            onClick={handleChangesDiscarded}
            data-cy={`table-button-discard-changes`}
            size="md"
            customStyles={{ minWidth: '32px', padding: width > 650 ? '6px 16px' : 0 }}
            leftIcon={width > 650 ? '' : 'cross'}
            fill={'var(--slate11)'}
            iconWidth="16"
          >
            {width > 650 ? <span>Discard</span> : ''}
          </ButtonSolid>
        </>
      );
    };

    const renderOverlay = (id, icon, callBack, tooltipId, tooltipContent) => {
      return (
        <>
          <Tooltip id={tooltipId} className="tooltip" />
          <OverlayTriggerComponent trigger="click" overlay={callBack()} rootClose={true} placement={'top-end'}>
            <ButtonSolid
              variant="ghostBlack"
              className={`tj-text-xsm `}
              customStyles={{
                minWidth: '32px',
              }}
              leftIcon={icon}
              fill={`var(--icons-default)`}
              iconWidth="16"
              size="md"
              data-tooltip-id={tooltipId}
              data-tooltip-content={tooltipContent}
              onClick={(e) => {
                if (document.activeElement === e.currentTarget) {
                  e.currentTarget.blur();
                }
              }}
            ></ButtonSolid>
          </OverlayTriggerComponent>
        </>
      );
    };

    const renderControlButtons = () => {
      return (
        <div className="col d-flex justify-content-end ">
          {showAddNewRowButton && (
            <>
              <Tooltip id="tooltip-for-add-new-row" className="tooltip" />
              <ButtonSolid
                variant="ghostBlack"
                fill={`var(--icons-default)`}
                className={'tj-text-xsm'}
                //   ${
                //   tableDetails.addNewRowsDetails.addingNewRows && 'cursor-not-allowed always-active-btn'
                // }
                // }
                customStyles={{ minWidth: '32px' }}
                leftIcon="plus"
                iconWidth="16"
                onClick={() => {
                  setShowAddNewRowPopup(true);
                  // if (!tableDetails.addNewRowsDetails.addingNewRows) {
                  //   showAddNewRowPopup();
                  // }
                }}
                size="md"
                data-tooltip-id="tooltip-for-add-new-row"
                data-tooltip-content="Add new row"
              ></ButtonSolid>
            </>
          )}
          {showDownloadButton && renderOverlay(id, 'filedownload', downlaodPopover, 'tooltip-for-download', 'Download')}
          {!hideColumnSelectorButton &&
            renderOverlay(id, 'eye1', hideColumnsPopover, 'tooltip-for-manage-columns', 'Manage columns')}
        </div>
      );
    };

    return (
      <>
        <div
          className={`card-footer d-flex align-items-center jet-table-footer justify-content-center ${
            darkMode && 'dark-theme'
          }`}
          // ${
          //   (tableDetails.addNewRowsDetails.addingNewRows || tableDetails.filterDetails.filtersVisible) && 'disabled'
          // }`}
        >
          <div className={`table-footer row gx-0 d-flex align-items-center h-100`}>
            <div className="col d-flex justify-content-start custom-gap-4">
              {editedRows.size > 0 && showBulkUpdateActions ? renderChangeSetUI() : renderRowCount()}
            </div>
            {enablePagination && (
              <Pagination
                id={id}
                tableWidth={width}
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={pageCount}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                table={table}
              />
            )}
            {renderControlButtons()}
          </div>
        </div>
        {showAddNewRowPopup && (
          <AddNewRow
            id={id}
            hideAddNewRowPopup={hideAddNewRowPopup}
            darkMode={darkMode}
            allColumns={allColumns}
            fireEvent={fireEvent}
          />
        )}
      </>
    );
  }
);
