import React from 'react';
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

export const Footer = React.memo(
  ({ id, darkMode, height, width, exportData, allColumns, getToggleHideAllColumnsProps }) => {
    const { getFooterVisibility, getLoadingState, getTableProperties } = useTableStore();
    const loadingState = getLoadingState(id);
    const {
      showBulkUpdateActions,
      totalRecords,
      clientSidePagination,
      serverSidePagination,
      enablePagination,
      showAddNewRowButton,
      showDownloadButton,
      hideColumnSelectorButton,
    } = getTableProperties(id);

    // Hide footer if the properties are not enabled
    if (!getFooterVisibility(id)) return null;

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
              <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} />
              <span className="hide-column-name tj-text-xsm" data-cy={`options-select-all-coloumn`}>
                Select All
              </span>
            </div>
            {allColumns.map(
              (column) =>
                typeof column?.Header === 'string' && (
                  <div key={column.id}>
                    <div>
                      <label className="dropdown-item d-flex cursor-pointer">
                        <input
                          type="checkbox"
                          data-cy={`checkbox-coloumn-${String(column.Header).toLowerCase().replace(/\s+/g, '-')}`}
                          {...column.getToggleHiddenProps()}
                        />
                        <span
                          className="hide-column-name tj-text-xsm"
                          data-cy={`options-coloumn-${String(column.Header).toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {` ${column.Header}`}
                        </span>
                      </label>
                    </div>
                  </div>
                )
            )}
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
              <span data-cy={`option-download-CSV`} className="cursor-pointer" onClick={() => exportData('csv', true)}>
                Download as CSV
              </span>
              <span
                data-cy={`option-download-execel`}
                className="pt-2 cursor-pointer"
                onClick={() => exportData('xlsx', true)}
              >
                Download as Excel
              </span>
              <span
                data-cy={`option-download-pdf`}
                className="pt-2 cursor-pointer"
                onClick={() => exportData('pdf', true)}
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
          {/* {clientSidePagination && !serverSidePagination && `${rowCount} Records`} */}
          {clientSidePagination && !serverSidePagination && `10 Records`}
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
            // onClick={() => {
            //   onEvent('onBulkUpdate', tableEvents, { component }).then(() => {
            //     handleChangesSaved();
            //   });
            // }}
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
            // onClick={() => {
            //   handleChangesDiscarded();
            // }}
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
            {/* {!1 ? renderChangeSetUI() : renderRowCount()} */}
            {renderRowCount()}
          </div>
          {enablePagination && <Pagination id={id} tableWidth={width} loadingState={loadingState} />}
          {renderControlButtons()}
        </div>
      </div>
    );
  }
);
