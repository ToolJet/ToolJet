/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState, useEffect, useCallback, useContext, useReducer, useRef } from 'react';
import {
  useTable,
  useFilters,
  useSortBy,
  useGlobalFilter,
  useAsyncDebounce,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
} from 'react-table';
import cx from 'classnames';
import { resolveReferences, validateWidget } from '@/_helpers/utils';
import { useExportData } from 'react-table-plugins';
import Papa from 'papaparse';
import { Pagination } from './Pagination';
import { Filter } from './Filter';
import { GlobalFilter } from './GlobalFilter';
var _ = require('lodash');
import loadPropertiesAndStyles from './load-properties-and-styles';
import { reducer, reducerActions, initialState } from './reducer';
import customFilter from './custom-filter';
import generateColumnsData from './columns';
import generateActionsData from './columns/actions';
import IndeterminateCheckbox from './IndeterminateCheckbox';
import { useTranslation } from 'react-i18next';

export function Table({
  id,
  width,
  height,
  component,
  onComponentClick,
  currentState = { components: {} },
  onEvent,
  paramUpdated,
  changeCanDrag,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  darkMode,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  registerAction,
  styles,
  properties,
  variablesExposedForPreview,
  exposeToCodeHinter,
}) {
  const {
    color,
    serverSidePagination,
    clientSidePagination,
    serverSideSearch,
    displaySearchBox,
    showDownloadButton,
    showFilterButton,
    showBulkUpdateActions,
    showBulkSelector,
    highlightSelectedRow,
    loadingState,
    columnSizes,
    tableType,
    cellSize,
    borderRadius,
    parsedWidgetVisibility,
    parsedDisabledState,
    actionButtonRadius,
    actions,
  } = loadPropertiesAndStyles(properties, styles, darkMode, component);

  const { t } = useTranslation();

  const [tableDetails, dispatch] = useReducer(reducer, initialState());

  const mergeToTableDetails = (payload) => dispatch(reducerActions.mergeToTableDetails(payload));
  const mergeToFilterDetails = (payload) => dispatch(reducerActions.mergeToFilterDetails(payload));

  useEffect(() => {
    setExposedVariable(
      'filters',
      tableDetails.filterDetails.filters.map((filter) => filter.value)
    );
  }, [JSON.stringify(tableDetails.filterDetails.filters)]);

  useEffect(
    () => mergeToTableDetails({ columnProperties: component?.definition?.properties?.columns?.value }),
    [component?.definition?.properties]
  );

  function showFilters() {
    mergeToFilterDetails({ filtersVisible: true });
  }

  function hideFilters() {
    mergeToFilterDetails({ filtersVisible: false });
  }

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 60,
      width: 268,
    }),
    []
  );

  function handleCellValueChange(index, key, value, rowData) {
    const changeSet = tableDetails.changeSet;
    const dataUpdates = tableDetails.dataUpdates || [];

    let obj = changeSet ? changeSet[index] || {} : {};
    obj = _.set(obj, key, value);

    let newChangeset = {
      ...changeSet,
      [index]: {
        ...obj,
      },
    };

    obj = _.set(rowData, key, value);

    let newDataUpdates = {
      ...dataUpdates,
      [index]: { ...obj },
    };
    const changesToBeSavedAndExposed = { dataUpdates: newDataUpdates, changeSet: newChangeset };
    mergeToTableDetails(changesToBeSavedAndExposed);
    fireEvent('onCellValueChanged');
    return setExposedVariables(changesToBeSavedAndExposed);
  }

  function getExportFileBlob({ columns, data }) {
    const headerNames = columns.map((col) => col.exportValue);
    const csvString = Papa.unparse({ fields: headerNames, data });
    return new Blob([csvString], { type: 'text/csv' });
  }

  function onPageIndexChanged(page) {
    onComponentOptionChanged(component, 'pageIndex', page).then(() => {
      onEvent('onPageChanged', { component, data: {} });
    });
  }

  function handleChangesSaved() {
    Object.keys(changeSet).forEach((key) => {
      tableData[key] = {
        ..._.merge(tableData[key], changeSet[key]),
      };
    });

    setExposedVariables({
      changeSet: {},
      dataUpdates: [],
    }).then(() => mergeToTableDetails({ dataUpdates: {}, changeSet: {} }));
  }

  function handleChangesDiscarded() {
    setExposedVariables({
      changeSet: {},
      dataUpdates: [],
    }).then(() => mergeToTableDetails({ dataUpdates: {}, changeSet: {} }));
  }

  const changeSet = tableDetails?.changeSet ?? {};

  const computeFontColor = useCallback(() => {
    if (color !== undefined) {
      return color;
    } else {
      return darkMode ? '#ffffff' : '#000000';
    }
  }, [color, darkMode]);

  let tableData = [];
  if (currentState) {
    tableData = resolveReferences(component.definition.properties.data.value, currentState, []);
    if (!Array.isArray(tableData)) tableData = [];
    console.log('resolved param', tableData);
  }

  tableData = tableData || [];

  const tableRef = useRef();

  const columnData = generateColumnsData({
    columnProperties: component.definition.properties.columns.value,
    columnSizes,
    currentState,
    handleCellValueChange,
    customFilter,
    defaultColumn,
    changeSet: tableDetails.changeSet,
    tableData,
    variablesExposedForPreview,
    exposeToCodeHinter,
    id,
    fireEvent,
    tableRef,
    t,
  });

  const [leftActionsCellData, rightActionsCellData] = useMemo(
    () =>
      generateActionsData({
        actions,
        columnSizes,
        defaultColumn,
        actionButtonRadius,
        fireEvent,
        setExposedVariables,
      }),
    [JSON.stringify(actions)]
  );

  const textWrapActions = (id) => {
    let wrapOption = tableDetails.columnProperties?.find((item) => {
      return item?.id == id;
    });
    return wrapOption?.textWrap;
  };

  const optionsData = columnData.map((column) => column.columnOptions?.selectOptions);

  const columns = useMemo(
    () => [...leftActionsCellData, ...columnData, ...rightActionsCellData],
    [
      JSON.stringify(columnData),
      JSON.stringify(tableData),
      JSON.stringify(actions),
      leftActionsCellData.length,
      rightActionsCellData.length,
      tableDetails.changeSet,
      JSON.stringify(optionsData),
      JSON.stringify(component.definition.properties.columns),
      showBulkSelector,
      JSON.stringify(variablesExposedForPreview && variablesExposedForPreview[id]),
    ] // Hack: need to fix
  );

  const data = useMemo(
    () => tableData,
    [
      tableData.length,
      tableDetails.changeSet,
      component.definition.properties.data.value,
      JSON.stringify(properties.data),
    ]
  );

  const computedStyles = {
    // width: `${width}px`,
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    pageCount,
    nextPage,
    previousPage,
    setPageSize,
    state,
    rows,
    prepareRow,
    setAllFilters,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, globalFilter },
    exportData,
    selectedFlatRows,
    globalFilteredRows,
  } = useTable(
    {
      autoResetPage: false,
      autoResetGlobalFilter: false,
      autoResetFilters: false,
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 0, pageSize: -1 },
      pageCount: -1,
      manualPagination: false,
      getExportFileBlob,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useBlockLayout,
    useResizeColumns,
    useExportData,
    useRowSelect,
    (hooks) => {
      showBulkSelector &&
        hooks.visibleColumns.push((columns) => [
          {
            id: 'selection',
            Header: ({ getToggleAllPageRowsSelectedProps }) => (
              <div className="d-flex flex-column align-items-center">
                <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
              </div>
            ),
            Cell: ({ row }) => (
              <div className="d-flex flex-column align-items-center">
                <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
              </div>
            ),
            width: 1,
            columnType: 'selector',
          },
          ...columns,
        ]);
    }
  );

  registerAction(
    'setPage',
    async function (targetPageIndex) {
      setPaginationInternalPageIndex(targetPageIndex);
      setExposedVariable('pageIndex', targetPageIndex);
      if (!serverSidePagination && clientSidePagination) gotoPage(targetPageIndex - 1);
    },
    [serverSidePagination, clientSidePagination, setPaginationInternalPageIndex]
  );

  useEffect(() => {
    const selectedRowsOriginalData = selectedFlatRows.map((row) => row.original);
    onComponentOptionChanged(component, 'selectedRows', selectedRowsOriginalData);
  }, [selectedFlatRows.length]);

  React.useEffect(() => {
    if (serverSidePagination || !clientSidePagination) {
      setPageSize(rows?.length || 10);
    }
    if (!serverSidePagination && clientSidePagination) {
      setPageSize(10);
    }
  }, [clientSidePagination, serverSidePagination, rows]);

  useEffect(() => {
    const pageData = page.map((row) => row.original);
    const currentData = rows.map((row) => row.original);
    onComponentOptionsChanged(component, [
      ['currentPageData', pageData],
      ['currentData', currentData],
      ['selectedRow', []],
      ['selectedRowId', null],
    ]);
  }, [tableData.length, tableDetails.changeSet]);

  useEffect(() => {
    const newColumnSizes = { ...columnSizes, ...state.columnResizing.columnWidths };
    if (!state.columnResizing.isResizingColumn && !_.isEmpty(newColumnSizes)) {
      changeCanDrag(true);
      paramUpdated(id, 'columnSizes', {
        value: newColumnSizes,
      });
    } else {
      changeCanDrag(false);
    }
  }, [state.columnResizing.isResizingColumn]);

  const [paginationInternalPageIndex, setPaginationInternalPageIndex] = useState(pageIndex ?? 1);

  useEffect(() => {
    if (pageCount <= pageIndex) gotoPage(pageCount - 1);
  }, [pageCount]);

  useEffect(() => {
    setExposedVariable(
      'filteredData',
      globalFilteredRows.map((row) => row.original)
    );
  }, [JSON.stringify(globalFilteredRows.map((row) => row.original))]);

  return (
    <div
      data-disabled={parsedDisabledState}
      className="card jet-table"
      style={{
        width: `100%`,
        height: `${height}px`,
        display: parsedWidgetVisibility ? '' : 'none',
        overflow: 'hidden',
        borderRadius: Number.parseFloat(borderRadius),
      }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component, event);
      }}
      ref={tableRef}
    >
      {/* Show top bar unless search box is disabled and server pagination is enabled */}
      {(displaySearchBox || showDownloadButton || showFilterButton) && (
        <div className="card-body border-bottom py-3 ">
          <div
            className={`d-flex align-items-center ms-auto text-muted ${
              displaySearchBox ? 'justify-content-between' : 'justify-content-end'
            }`}
          >
            {displaySearchBox && (
              <GlobalFilter
                globalFilter={state.globalFilter}
                useAsyncDebounce={useAsyncDebounce}
                setGlobalFilter={setGlobalFilter}
                onComponentOptionChanged={onComponentOptionChanged}
                component={component}
                serverSideSearch={serverSideSearch}
                onEvent={onEvent}
              />
            )}
            <div>
              {showFilterButton && (
                <span data-tip="Filter data" className="btn btn-light btn-sm p-1 mx-1" onClick={() => showFilters()}>
                  <img src="/assets/images/icons/filter.svg" width="15" height="15" />
                  {tableDetails.filterDetails.filters.length > 0 && (
                    <a className="badge bg-azure" style={{ width: '4px', height: '4px', marginTop: '5px' }}></a>
                  )}
                </span>
              )}
              {showDownloadButton && (
                <span
                  data-tip="Download as CSV"
                  className="btn btn-light btn-sm p-1"
                  onClick={() => exportData('csv', true)}
                >
                  <img src="assets/images/icons/download.svg" width="15" height="15" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive jet-data-table">
        <table {...getTableProps()} className={`table table-vcenter table-nowrap ${tableType}`} style={computedStyles}>
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <tr key={index} {...headerGroup.getHeaderGroupProps()} tabIndex="0" className="tr">
                {headerGroup.headers.map((column, index) => (
                  <th
                    key={index}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className={column.isSorted ? (column.isSortedDesc ? 'sort-desc th' : 'sort-asc th') : 'th'}
                  >
                    {column.render('Header')}
                    <div
                      draggable="true"
                      {...column.getResizerProps()}
                      className={`resizer ${column.isResizing ? 'isResizing' : ''}`}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {!loadingState && page.length === 0 && (
            <center className="w-100">
              <div className="py-5"> no data </div>
            </center>
          )}

          {!loadingState && (
            <tbody {...getTableBodyProps()} style={{ color: computeFontColor() }}>
              {page.map((row, index) => {
                prepareRow(row);
                return (
                  <tr
                    key={index}
                    className={`table-row ${
                      highlightSelectedRow && row.id === tableDetails.selectedRowId ? 'selected' : ''
                    }`}
                    {...row.getRowProps()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const selectedRowDetails = { selectedRowId: row.id, selectedRow: row.original };
                      mergeToTableDetails(selectedRowDetails);
                      setExposedVariables(selectedRowDetails).then(() => {
                        fireEvent('onRowClicked');
                      });
                    }}
                  >
                    {row.cells.map((cell, index) => {
                      let cellProps = cell.getCellProps();
                      if (tableDetails.changeSet) {
                        if (tableDetails.changeSet[cell.row.index]) {
                          const currentColumn = columnData.find((column) => column.id === cell.column.id);
                          if (
                            _.get(tableDetails.changeSet[cell.row.index], currentColumn?.accessor, undefined) !==
                            undefined
                          ) {
                            cellProps.style.backgroundColor = darkMode ? '#1c252f' : '#ffffde';
                            cellProps.style['--tblr-table-accent-bg'] = darkMode ? '#1c252f' : '#ffffde';
                          }
                        }
                      }
                      const wrapAction = textWrapActions(cell.column.id);
                      const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
                      const cellValue = rowChangeSet ? rowChangeSet[cell.column.name] || cell.value : cell.value;
                      const rowData = tableData[cell.row.index];
                      const cellBackgroundColor = resolveReferences(
                        cell.column?.cellBackgroundColor,
                        currentState,
                        '',
                        {
                          cellValue,
                          rowData,
                        }
                      );
                      return (
                        // Does not require key as its already being passed by react-table via cellProps
                        // eslint-disable-next-line react/jsx-key
                        <td
                          className={cx(`${wrapAction ? wrapAction : 'wrap'}-wrapper`, {
                            'has-actions': cell.column.id === 'rightActions' || cell.column.id === 'leftActions',
                            'has-text': cell.column.columnType === 'text' || cell.column.isEditable,
                            'has-dropdown': cell.column.columnType === 'dropdown',
                            'has-multiselect': cell.column.columnType === 'multiselect',
                            'has-datepicker': cell.column.columnType === 'datepicker',
                            'align-items-center flex-column': cell.column.columnType === 'selector',
                            [cellSize]: true,
                          })}
                          {...cellProps}
                          style={{ ...cellProps.style, backgroundColor: cellBackgroundColor ?? 'inherit' }}
                        >
                          <div className="td-container">{cell.render('Cell')}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
        {loadingState === true && (
          <div style={{ width: '100%' }} className="p-2">
            <center>
              <div className="spinner-border mt-5" role="status"></div>
            </center>
          </div>
        )}
      </div>
      {(clientSidePagination ||
        serverSidePagination ||
        Object.keys(tableDetails.changeSet || {}).length > 0 ||
        showFilterButton ||
        showDownloadButton) && (
        <div className="card-footer d-flex align-items-center jet-table-footer justify-content-center">
          <div className="table-footer row gx-0">
            <div className="col">
              {(clientSidePagination || serverSidePagination) && (
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
                />
              )}
            </div>

            <div className="col d-flex justify-content-end">
              {showBulkUpdateActions && Object.keys(tableDetails.changeSet || {}).length > 0 ? (
                <>
                  <button
                    className={`btn btn-primary btn-sm mx-2 ${tableDetails.isSavingChanges ? 'btn-loading' : ''}`}
                    onClick={() =>
                      onEvent('onBulkUpdate', { component }).then(() => {
                        handleChangesSaved();
                      })
                    }
                  >
                    Save Changes
                  </button>
                  <button className="btn btn-light btn-sm" onClick={() => handleChangesDiscarded()}>
                    Discard changes
                  </button>
                </>
              ) : (
                <span>{`${globalFilteredRows.length} Records`}</span>
              )}
            </div>
          </div>
        </div>
      )}
      {tableDetails.filterDetails.filtersVisible && (
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
        />
      )}
    </div>
  );
}
