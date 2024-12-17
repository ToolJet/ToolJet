import React from 'react';
// Store files
import useTableStore from '../../_stores/tableStore';
// Local components
import Loader from '../Loader';

export const Footer = React.memo(({ id }) => {
  const { getFooterVisibility, getLoadingState, getTableProperties } = useTableStore();
  const loadingState = getLoadingState(id);

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
          <div className="col d-flex justify-content-end ">
            <Loader width={83} height={28} />
          </div>
        </div>
      </div>
    );
  }

  //   function hideColumnsPopover() {
  //     return (
  //       <Popover className={`${darkMode && 'dark-theme'}`} style={{ maxHeight: `${height - 79}px`, overflowY: 'auto' }}>
  //         <div
  //           data-cy={`dropdown-hide-column`}
  //           className={`dropdown-table-column-hide-common ${
  //             darkMode ? 'dropdown-table-column-hide-dark-themed dark-theme' : 'dropdown-table-column-hide'
  //           } `}
  //           placement="top-end"
  //         >
  //           <div className="dropdown-item cursor-pointer">
  //             <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} />
  //             <span className="hide-column-name tj-text-xsm" data-cy={`options-select-all-coloumn`}>
  //               Select All
  //             </span>
  //           </div>
  //           {allColumns.map(
  //             (column) =>
  //               typeof column?.Header === 'string' && (
  //                 <div key={column.id}>
  //                   <div>
  //                     <label className="dropdown-item d-flex cursor-pointer">
  //                       <input
  //                         type="checkbox"
  //                         data-cy={`checkbox-coloumn-${String(column.Header).toLowerCase().replace(/\s+/g, '-')}`}
  //                         {...column.getToggleHiddenProps()}
  //                       />
  //                       <span
  //                         className="hide-column-name tj-text-xsm"
  //                         data-cy={`options-coloumn-${String(column.Header).toLowerCase().replace(/\s+/g, '-')}`}
  //                       >
  //                         {` ${column.Header}`}
  //                       </span>
  //                     </label>
  //                   </div>
  //                 </div>
  //               )
  //           )}
  //         </div>
  //       </Popover>
  //     );
  //   }

  return (
    <>
      Footer
      {/* {(enablePagination ||
        Object.keys(tableDetails?.changeSet || {}).length > 0 ||
        showAddNewRowButton ||
        showDownloadButton) && (
        <div
          className={`card-footer d-flex align-items-center jet-table-footer justify-content-center ${
            darkMode && 'dark-theme'
          } ${
            (tableDetails.addNewRowsDetails.addingNewRows || tableDetails.filterDetails.filtersVisible) && 'disabled'
          }`}
        >
          <div className={`table-footer row gx-0 d-flex align-items-center h-100`}>
            <div className="col d-flex justify-content-start custom-gap-4">
              {loadingState && (
                <SkeletonTheme baseColor="var(--slate3)" width="100%">
                  <Skeleton count={1} width={83} height={28} className="mb-1" />
                </SkeletonTheme>
              )}
              {!loadingState &&
                (showBulkUpdateActions && Object.keys(tableDetails.changeSet || {}).length > 0 ? (
                  <>
                    <ButtonSolid
                      variant="primary"
                      className={`tj-text-xsm`}
                      onClick={() => {
                        onEvent('onBulkUpdate', tableEvents, { component }).then(() => {
                          handleChangesSaved();
                        });
                      }}
                      data-cy={`table-button-save-changes`}
                      size="md"
                      isLoading={tableDetails.isSavingChanges ? true : false}
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
                      onClick={() => {
                        handleChangesDiscarded();
                      }}
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
                ) : (
                  !loadingState && (
                    <span
                      data-cy={`footer-number-of-records`}
                      className="font-weight-500"
                      style={{ color: 'var(--text-placeholder)' }}
                    >
                      {clientSidePagination && !serverSidePagination && `${rowCount} Records`}
                      {serverSidePagination && totalRecords ? `${totalRecords} Records` : ''}
                    </span>
                  )
                ))}
            </div>
            <div className={`col d-flex justify-content-center h-100 ${loadingState && 'w-100'}`}>
              {enablePagination && (
                <Pagination
                  lastActivePageIndex={pageIndex}
                  serverSide={serverSidePagination}
                  autoGotoPage={gotoPage}
                  autoCanNextPage={canNextPage}
                  autoPageCount={pageCount}
                  autoPageOptions={pageOptions}
                  onPageIndexChanged={onPageIndexChanged}
                  pageIndex={paginationInternalPageIndex}
                  setPageIndex={setPaginationInternalPageIndex}
                  enableNextButton={enableNextButton}
                  enablePrevButton={enablePrevButton}
                  darkMode={darkMode}
                  tableWidth={width}
                  loadingState={loadingState}
                />
              )}
            </div>
            <div className="col d-flex justify-content-end ">
              {loadingState && (
                <SkeletonTheme baseColor="var(--slate3)" width="100%">
                  <Skeleton count={1} width={83} height={28} className="mb-1" />
                </SkeletonTheme>
              )}
              {!loadingState && showAddNewRowButton && (
                <>
                  <Tooltip id="tooltip-for-add-new-row" className="tooltip" />
                  <ButtonSolid
                    variant="ghostBlack"
                    fill={`var(--icons-default)`}
                    className={`tj-text-xsm ${
                      tableDetails.addNewRowsDetails.addingNewRows && 'cursor-not-allowed always-active-btn'
                    }`}
                    customStyles={{ minWidth: '32px' }}
                    leftIcon="plus"
                    iconWidth="16"
                    onClick={() => {
                      if (!tableDetails.addNewRowsDetails.addingNewRows) {
                        showAddNewRowPopup();
                      }
                    }}
                    size="md"
                    data-tooltip-id="tooltip-for-add-new-row"
                    data-tooltip-content="Add new row"
                  ></ButtonSolid>
                </>
              )}
              {!loadingState && showDownloadButton && (
                <div>
                  <Tooltip id="tooltip-for-download" className="tooltip" />
                  <OverlayTriggerComponent
                    trigger="click"
                    overlay={downlaodPopover()}
                    rootClose={true}
                    placement={'top-end'}
                  >
                    <ButtonSolid
                      variant="ghostBlack"
                      className={`tj-text-xsm `}
                      customStyles={{
                        minWidth: '32px',
                      }}
                      leftIcon="filedownload"
                      fill={`var(--icons-default)`}
                      iconWidth="16"
                      size="md"
                      data-tooltip-id="tooltip-for-download"
                      data-tooltip-content="Download"
                      onClick={(e) => {
                        if (document.activeElement === e.currentTarget) {
                          e.currentTarget.blur();
                        }
                      }}
                    ></ButtonSolid>
                  </OverlayTriggerComponent>
                </div>
              )}
              {!loadingState && !hideColumnSelectorButton && (
                <>
                  <Tooltip id="tooltip-for-manage-columns" className="tooltip" />
                  <OverlayTriggerComponent
                    trigger="click"
                    rootClose={true}
                    overlay={hideColumnsPopover()}
                    placement={'top-end'}
                  >
                    <ButtonSolid
                      variant="ghostBlack"
                      className={`tj-text-xsm `}
                      customStyles={{ minWidth: '32px' }}
                      leftIcon="eye1"
                      fill={`var(--icons-default)`}
                      iconWidth="16"
                      size="md"
                      data-cy={`select-column-icon`}
                      onClick={(e) => {
                        if (document.activeElement === e.currentTarget) {
                          e.currentTarget.blur();
                        }
                      }}
                      data-tooltip-id="tooltip-for-manage-columns"
                      data-tooltip-content="Manage columns"
                    ></ButtonSolid>
                  </OverlayTriggerComponent>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <Filter
        hideFilters={hideFilters}
        filters={tableDetails.filterDetails.filters}
        columns={columnData.map((column) => {
          return { name: column.Header, value: column.id };
        })}
        mergeToFilterDetails={mergeToFilterDetails}
        filterDetails={tableDetails.filterDetails}
        darkMode={darkMode}
        setAllFilters={setAllFilters}
        fireEvent={fireEvent}
        setExposedVariables={setExposedVariables}
      />
      {tableDetails.addNewRowsDetails.addingNewRows && (
        <AddNewRowComponent
          hideAddNewRowPopup={hideAddNewRowPopup}
          tableType={tableType}
          darkMode={darkMode}
          mergeToAddNewRowsDetails={mergeToAddNewRowsDetails}
          onEvent={onEvent}
          component={component}
          setExposedVariables={setExposedVariables}
          allColumns={allColumns}
          defaultColumn={defaultColumn}
          columns={columnsForAddNewRow}
          addNewRowsDetails={tableDetails.addNewRowsDetails}
          utilityForNestedNewRow={utilityForNestedNewRow}
          tableEvents={tableEvents}
        />
      )} */}
    </>
  );
});
