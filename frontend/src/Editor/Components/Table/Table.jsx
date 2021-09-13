import React, { useMemo, useState, useEffect } from 'react';
import {
  useTable,
  useFilters,
  useSortBy,
  useGlobalFilter,
  useAsyncDebounce,
  usePagination,
  useBlockLayout,
  useResizeColumns,
} from 'react-table';
import cx from 'classnames';
import { resolveReferences, resolveWidgetFieldValue, validateWidget } from '@/_helpers/utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { useExportData } from 'react-table-plugins';
import Papa from 'papaparse';
import { Pagination } from './Pagination';
import { CustomSelect } from './CustomSelect';
import { Tags } from './Tags';
import { Radio } from './Radio';
import { Toggle } from './Toggle';
import { Datepicker } from './Datepicker';

var _ = require('lodash');

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
}) {
  const color = component.definition.styles.textColor.value;
  const actions = component.definition.properties.actions || { value: [] };
  const serverSidePaginationProperty = component.definition.properties.serverSidePagination;
  const serverSidePagination = serverSidePaginationProperty ? serverSidePaginationProperty.value : false;

  const serverSideSearchProperty = component.definition.properties.serverSideSearch;
  const serverSideSearch = serverSideSearchProperty ? serverSideSearchProperty.value : false;

  const displaySearchBoxProperty = component.definition.properties.displaySearchBox;
  const displaySearchBox = displaySearchBoxProperty ? displaySearchBoxProperty.value : true;

  const showDownloadButtonProperty = component.definition.properties.showDownloadButton?.value;
  const showDownloadButton = resolveWidgetFieldValue(showDownloadButtonProperty, currentState) ?? true; // default is true for backward compatibility

  const showFilterButtonProperty = component.definition.properties.showFilterButton?.value;
  const showFilterButton = resolveWidgetFieldValue(showFilterButtonProperty, currentState) ?? true; // default is true for backward compatibility

  const showBulkUpdateActionsProperty = component.definition.properties.showBulkUpdateActions?.value;
  const showBulkUpdateActions = resolveWidgetFieldValue(showBulkUpdateActionsProperty, currentState) ?? true; // default is true for backward compatibility

  const clientSidePaginationProperty = component.definition.properties.clientSidePagination?.value;
  const clientSidePagination =
    resolveWidgetFieldValue(clientSidePaginationProperty, currentState) ?? !serverSidePagination; // default is true for backward compatibility

  const tableTypeProperty = component.definition.styles.tableType;
  let tableType = tableTypeProperty ? tableTypeProperty.value : 'table-bordered';
  tableType = tableType === '' ? 'table-bordered' : tableType;

  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;
  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    const loadingStateProperty = component.definition.properties.loadingState;
    if (loadingStateProperty && currentState) {
      const newState = resolveReferences(loadingStateProperty.value, currentState, false);
      setLoadingState(newState);
    }
  }, [currentState]);

  const [componentState, setcomponentState] = useState(currentState.components[component.component] || {});

  useEffect(() => {
    setcomponentState(currentState.components[component.name] || {});
  }, [currentState.components[component.name]]);

  const [isFiltersVisible, setFiltersVisibility] = useState(false);
  const [filters, setFilters] = useState([]);

  function showFilters() {
    setFiltersVisibility(true);
  }

  function hideFilters() {
    setFiltersVisibility(false);
  }

  function filterColumnChanged(index, value) {
    const newFilters = filters;
    newFilters[index].id = value;
    setFilters(newFilters);
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function filterOperationChanged(index, value) {
    const newFilters = filters;
    newFilters[index].value = {
      ...newFilters[index].value,
      operation: value,
    };
    setFilters(newFilters);
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function filterValueChanged(index, value) {
    const newFilters = filters;
    newFilters[index].value = {
      ...newFilters[index].value,
      value: value,
    };
    setFilters(newFilters);
    setAllFilters(newFilters.filter((filter) => filter.id !== ''));
  }

  function addFilter() {
    setFilters([...filters, { id: '', value: { operation: 'contains', value: '' } }]);
  }

  function removeFilter(index) {
    let newFilters = filters;
    newFilters.splice(index, 1);
    setFilters(newFilters);
    setAllFilters(newFilters);
  }

  function clearFilters() {
    setFilters([]);
    setAllFilters([]);
  }

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 60,
      width: 268,
    }),
    []
  );

  const columnSizes = component.definition.properties.columnSizes || {};

  function handleCellValueChange(index, key, value, rowData) {
    const changeSet = componentState.changeSet;
    const dataUpdates = componentState.dataUpdates || [];

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

    onComponentOptionsChanged(component, [
      ['dataUpdates', newDataUpdates],
      ['changeSet', newChangeset],
    ]);
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

    onComponentOptionChanged(component, 'changeSet', {});
    onComponentOptionChanged(component, 'dataUpdates', []);
  }

  function handleChangesDiscarded() {
    onComponentOptionChanged(component, 'changeSet', {});
    onComponentOptionChanged(component, 'dataUpdates', []);
  }

  function customFilter(rows, columnIds, filterValue) {
    try {
      if (filterValue.operation === 'equals') {
        return rows.filter((row) => row.values[columnIds[0]] === filterValue.value);
      }

      if (filterValue.operation === 'matches') {
        return rows.filter((row) =>
          row.values[columnIds[0]].toString().toLowerCase().includes(filterValue.value.toLowerCase())
        );
      }

      if (filterValue.operation === 'gt') {
        return rows.filter((row) => row.values[columnIds[0]] > filterValue.value);
      }

      if (filterValue.operation === 'lt') {
        return rows.filter((row) => row.values[columnIds[0]] < filterValue.value);
      }

      if (filterValue.operation === 'gte') {
        return rows.filter((row) => row.values[columnIds[0]] >= filterValue.value);
      }

      if (filterValue.operation === 'lte') {
        return rows.filter((row) => row.values[columnIds[0]] <= filterValue.value);
      }

      let value = filterValue.value;
      if (typeof value === 'string') {
        value = value.toLowerCase();
      }

      return rows.filter((row) => {
        let rowValue = row.values[columnIds[0]];
        if (typeof rowValue === 'string') {
          rowValue = rowValue.toLowerCase();
        }
        return rowValue.includes(value);
      });
    } catch {
      return rows;
    }
  }

  const changeSet = componentState ? componentState.changeSet : {};

  const columnData = component.definition.properties.columns.value.map((column) => {
    const columnSize = columnSizes[column.id] || columnSizes[column.name];
    const columnType = column.columnType;

    const columnOptions = {};
    if (
      columnType === 'dropdown' ||
      columnType === 'multiselect' ||
      columnType === 'badge' ||
      columnType === 'badges' ||
      columnType === 'radio'
    ) {
      const values = resolveReferences(column.values, currentState) || [];
      const labels = resolveReferences(column.labels, currentState, []) || [];

      if (Array.isArray(labels)) {
        columnOptions.selectOptions = labels.map((label, index) => {
          return { name: label, value: values[index] };
        });
      }
    }
    if (columnType === 'datepicker') {
      column.isTimeChecked = column.isTimeChecked ? column.isTimeChecked : false;
      column.dateFormat = column.dateFormat ? column.dateFormat : 'DD/MM/YYYY';
    }

    const width = columnSize || defaultColumn.width;

    return {
      id: column.id,
      Header: column.name,
      accessor: column.key || column.name,
      filter: customFilter,
      width: width,
      columnOptions,
      columnType,
      Cell: function (cell) {
        const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
        const cellValue = rowChangeSet ? rowChangeSet[column.name] || cell.value : cell.value;

        if (columnType === 'string' || columnType === undefined || columnType === 'default') {
          const textColor = resolveReferences(column.textColor, currentState, { cellValue });

          const cellStyles = {
            color: textColor === undefined ? (darkMode === true ? '#fff' : 'black') : textColor,
          };

          if (column.isEditable) {
            const validationData = validateWidget({
              validationObject: {
                regex: {
                  value: column.regex,
                },
                minLength: {
                  value: column.minLength,
                },
                maxLength: {
                  value: column.maxLength,
                },
                customRule: {
                  value: column.customRule,
                },
              },
              widgetValue: cellValue,
              currentState,
              customResolveObjects: { cellValue },
            });

            const { isValid, validationError } = validationData;

            return (
              <div>
                <input
                  type="text"
                  style={cellStyles}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.target.defaultValue !== e.target.value) {
                        handleCellValueChange(
                          cell.row.index,
                          column.key || column.name,
                          e.target.value,
                          cell.row.original
                        );
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.defaultValue !== e.target.value) {
                      handleCellValueChange(
                        cell.row.index,
                        column.key || column.name,
                        e.target.value,
                        cell.row.original
                      );
                    }
                  }}
                  className={`form-control-plaintext form-control-plaintext-sm ${!isValid ? 'is-invalid' : ''}`}
                  defaultValue={cellValue}
                />
                <div class="invalid-feedback">{validationError}</div>
              </div>
            );
          }
          return <span style={cellStyles}>{cellValue}</span>;
        }

        if (columnType === 'text') {
          return (
            <textarea
              rows="1"
              className="form-control-plaintext text-container text-muted"
              readOnly={!column.isEditable}
              style={{ maxWidth: width, minWidth: width - 10 }}
              onBlur={(e) => {
                handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original);
              }}
              defaultValue={cellValue}
            ></textarea>
          );
        }
        if (columnType === 'dropdown') {
          const validationData = validateWidget({
            validationObject: {
              customRule: {
                value: column.customRule,
              },
            },
            widgetValue: cellValue,
            currentState,
            customResolveObjects: { cellValue },
          });

          const { isValid, validationError } = validationData;

          return (
            <div>
              <SelectSearch
                options={columnOptions.selectOptions}
                value={cellValue}
                search={true}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
              <div className={`invalid-feedback ${isValid ? '' : 'd-flex'}`}>{validationError}</div>
            </div>
          );
        }
        if (columnType === 'multiselect') {
          return (
            <div>
              <SelectSearch
                printOptions="on-focus"
                multiple
                search={true}
                placeholder="Select.."
                options={columnOptions.selectOptions}
                value={cellValue}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        if (columnType === 'badge') {
          return (
            <div>
              <CustomSelect
                options={columnOptions.selectOptions}
                value={cellValue}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        if (columnType === 'badges') {
          return (
            <div>
              <CustomSelect
                options={columnOptions.selectOptions}
                value={cellValue}
                multiple={true}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        if (columnType === 'tags') {
          return (
            <div>
              <Tags
                value={cellValue}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        if (columnType === 'radio') {
          return (
            <div>
              <Radio
                options={columnOptions.selectOptions}
                value={cellValue}
                readOnly={!column.isEditable}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        if (columnType === 'toggle') {
          return (
            <div>
              <Toggle
                value={cellValue}
                readOnly={!column.isEditable}
                activeColor={column.activeColor}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        if (columnType === 'datepicker') {
          return (
            <div>
              <Datepicker
                dateFormat={column.dateFormat}
                isTimeChecked={column.isTimeChecked}
                value={cellValue}
                readOnly={column.isEditable}
                onChange={(value) => {
                  handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original);
                }}
              />
            </div>
          );
        }
        return cellValue || '';
      },
    };
  });

  let tableData = [];
  if (currentState) {
    tableData = resolveReferences(component.definition.properties.data.value, currentState, []);
    if (!Array.isArray(tableData)) tableData = [];
    console.log('resolved param', tableData);
  }

  tableData = tableData || [];

  const leftActions = () => actions.value.filter((action) => action.position === 'left');
  const rightActions = () => actions.value.filter((action) => [undefined, 'right'].includes(action.position));

  const leftActionsCellData =
    leftActions().length > 0
      ? [
          {
            id: 'leftActions',
            Header: 'Actions',
            accessor: 'edit',
            width: columnSizes.leftActions || defaultColumn.width,
            Cell: (cell) => {
              return leftActions().map((action) => (
                <button
                  key={action.name}
                  className="btn btn-sm m-1 btn-light"
                  style={{ background: action.backgroundColor, color: action.textColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEvent('onTableActionButtonClicked', { component, data: cell.row.original, action });
                  }}
                >
                  {action.buttonText}
                </button>
              ));
            },
          },
        ]
      : [];

  const rightActionsCellData =
    rightActions().length > 0
      ? [
          {
            id: 'rightActions',
            Header: 'Actions',
            accessor: 'edit',
            width: columnSizes.rightActions || defaultColumn.width,
            Cell: (cell) => {
              return rightActions().map((action) => (
                <button
                  key={action.name}
                  className="btn btn-sm m-1 btn-light"
                  style={{ background: action.backgroundColor, color: action.textColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEvent('onTableActionButtonClicked', { component, data: cell.row.original, action });
                  }}
                >
                  {action.buttonText}
                </button>
              ));
            },
          },
        ]
      : [];

  const optionsData = columnData.map((column) => column.columnOptions?.selectOptions);

  const columns = useMemo(
    () => [...leftActionsCellData, ...columnData, ...rightActionsCellData],
    [
      JSON.stringify(columnData),
      leftActionsCellData.length,
      rightActionsCellData.length,
      componentState.changeSet,
      JSON.stringify(optionsData),
      JSON.stringify(component.definition.properties.columns),
    ] // Hack: need to fix
  );

  const data = useMemo(() => tableData, [tableData.length, componentState.changeSet]);

  const computedStyles = {
    color,
    width: `${width}px`,
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
    state: { pageIndex, pageSize },
    exportData,
  } = useTable(
    {
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
    useExportData
  );

  React.useEffect(() => {
    if (serverSidePagination || !clientSidePagination) {
      setPageSize(-1);
    }
    if (!serverSidePagination && clientSidePagination) {
      setPageSize(10);
    }
  }, [clientSidePagination, serverSidePagination]);

  useEffect(() => {
    const pageData = page.map((row) => row.original);
    const currentData = rows.map((row) => row.original);
    onComponentOptionsChanged(component, [
      ['currentPageData', pageData],
      ['currentData', currentData],
    ]);
  }, [tableData.length, componentState.changeSet]);

  useEffect(() => {
    if (!state.columnResizing.isResizingColumn) {
      changeCanDrag(true);
      paramUpdated(id, 'columnSizes', { ...columnSizes, ...state.columnResizing.columnWidths });
    } else {
      changeCanDrag(false);
    }
  }, [state.columnResizing.isResizingColumn]);

  function GlobalFilter() {
    const count = preGlobalFilteredRows.length;
    const [value, setValue] = React.useState(state.globalFilter);
    const onChange = useAsyncDebounce((filterValue) => {
      setGlobalFilter(filterValue || undefined);
    }, 200);

    const handleSearchTextChange = (text) => {
      setValue(text);
      onChange(text);

      onComponentOptionChanged(component, 'searchText', text).then(() => {
        if (serverSideSearch === true) {
          onEvent('onSearch', { component, data: {} });
        }
      });
    };

    return (
      <div className="ms-2 d-inline-block">
        Search:{' '}
        <input
          className="global-search-field"
          defaultValue={value || ''}
          onBlur={(e) => {
            handleSearchTextChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchTextChange(e.target.value);
            }
          }}
          placeholder={`${count} records`}
          style={{
            border: '0',
          }}
        />
      </div>
    );
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      className="card jet-table"
      style={{ width: `${width}px`, height: `${height}px`, display: parsedWidgetVisibility ? '' : 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        onComponentClick(id, component);
      }}
    >
      {/* Show top bar unless search box is disabled and server pagination is enabled */}
      {displaySearchBox && (
        <div className="card-body border-bottom py-3 jet-data-table-header">
          <div className="d-flex">
            {displaySearchBox && (
              <div className="ms-auto text-muted">
                <GlobalFilter />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="table-responsive jet-data-table">
        <table {...getTableProps()} className={`table table-vcenter table-nowrap ${tableType}`} style={computedStyles}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} tabIndex="0" className="tr">
                {headerGroup.headers.map((column) => (
                  <th
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
            <tbody {...getTableBodyProps()}>
              {console.log('page', page)}
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr
                    className="table-row"
                    {...row.getRowProps()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEvent('onRowClicked', { component, data: row.original });
                    }}
                  >
                    {row.cells.map((cell) => {
                      let cellProps = cell.getCellProps();
                      if (componentState.changeSet) {
                        if (componentState.changeSet[cell.row.index]) {
                          const currentColumn = columnData.find((column) => column.id === cell.column.id);

                          if (
                            _.get(componentState.changeSet[cell.row.index], currentColumn?.accessor, undefined) !==
                            undefined
                          ) {
                            console.log('componentState.changeSet', componentState.changeSet);
                            cellProps.style.backgroundColor = '#ffffde';
                          }
                        }
                      }
                      return (
                        <td className={cx({ 'has-dropdown': cell.column.columnType === 'dropdown' })} {...cellProps}>
                          {cell.render('Cell')}
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
        Object.keys(componentState.changeSet || {}).length > 0 ||
        showFilterButton ||
        showDownloadButton) && (
        <div className="card-footer d-flex align-items-center jet-table-footer">
          <div className="table-footer row">
            <div className="col">
              {(clientSidePagination || serverSidePagination) && (
                <Pagination
                  lastActivePageIndex={currentState.components[component.name]?.pageIndex ?? 1}
                  serverSide={serverSidePagination}
                  autoGotoPage={gotoPage}
                  autoCanNextPage={canNextPage}
                  autoPageCount={pageCount}
                  autoPageOptions={pageOptions}
                  onPageIndexChanged={onPageIndexChanged}
                />
              )}
            </div>

            {showBulkUpdateActions && Object.keys(componentState.changeSet || {}).length > 0 && (
              <div className="col">
                <button
                  className={`btn btn-primary btn-sm ${componentState.isSavingChanges ? 'btn-loading' : ''}`}
                  onClick={() =>
                    onEvent('onBulkUpdate', { component }).then(() => {
                      handleChangesSaved();
                    })
                  }
                >
                  Save Changes
                </button>
                <button className="btn btn-light btn-sm mx-2" onClick={() => handleChangesDiscarded()}>
                  Discard changes
                </button>
              </div>
            )}

            <div className="col-auto">
              {showFilterButton && (
                <span data-tip="Filter data" className="btn btn-light btn-sm p-1 mx-2" onClick={() => showFilters()}>
                  <img src="/assets/images/icons/filter.svg" width="13" height="13" />
                  {filters.length > 0 && (
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
                  <img src="/assets/images/icons/download.svg" width="13" height="13" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {isFiltersVisible && (
        <div className="table-filters card">
          <div className="card-header row">
            <div className="col">
              <h4 className="text-muted">Filters</h4>
            </div>
            <div className="col-auto">
              <button onClick={() => hideFilters()} className="btn btn-light btn-sm">
                x
              </button>
            </div>
          </div>
          <div className="card-body">
            {filters.map((filter, index) => (
              <div className="row mb-2" key={index}>
                <div className="col p-2" style={{ maxWidth: '70px' }}>
                  <small>{index > 0 ? 'and' : 'where'}</small>
                </div>
                <div className="col">
                  <SelectSearch
                    options={columnData.map((column) => {
                      return { name: column.Header, value: column.id };
                    })}
                    value={filter.id}
                    search={true}
                    onChange={(value) => {
                      filterColumnChanged(index, value);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
                <div className="col" style={{ maxWidth: '180px' }}>
                  <SelectSearch
                    options={[
                      { name: 'contains', value: 'contains' },
                      { name: 'matches', value: 'matches' },
                      { name: 'equals', value: 'equals' },
                      { name: 'greater than', value: 'gt' },
                      { name: 'less than', value: 'lt' },
                      { name: 'greater than or equals', value: 'gte' },
                      { name: 'less than or equals', value: 'lte' },
                    ]}
                    value={filter.value.operation}
                    search={true}
                    onChange={(value) => {
                      filterOperationChanged(index, value);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
                <div className="col">
                  <input
                    type="text"
                    value={filter.value.value}
                    placeholder="value"
                    className="form-control"
                    onChange={(e) => filterValueChanged(index, e.target.value)}
                  />
                </div>
                <div className="col-auto">
                  <button onClick={() => removeFilter(index)} className="btn btn-light btn-sm p-2 text-danger">
                    x
                  </button>
                </div>
              </div>
            ))}
            {filters.length === 0 && (
              <div>
                <center>
                  <span className="text-muted">no filters yet.</span>
                </center>
              </div>
            )}
          </div>
          <div className="card-footer">
            <button onClick={addFilter} className="btn btn-light btn-sm text-muted">
              + add filter
            </button>
            <button onClick={() => clearFilters()} className="btn btn-light btn-sm mx-2 text-muted">
              clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
