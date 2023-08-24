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
  useColumnOrder,
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
import autogenerateColumns from './columns/autogenerateColumns';
import IndeterminateCheckbox from './IndeterminateCheckbox';
// eslint-disable-next-line import/no-unresolved
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line import/no-unresolved
import JsPDF from 'jspdf';
// eslint-disable-next-line import/no-unresolved
import 'jspdf-autotable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// eslint-disable-next-line import/no-unresolved
import { IconEyeOff } from '@tabler/icons-react';
import * as XLSX from 'xlsx/xlsx.mjs';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useMounted } from '@/_hooks/use-mount';
import GenerateEachCellValue from './GenerateEachCellValue';
// eslint-disable-next-line import/no-unresolved
import { toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import { AddNewRowComponent } from './AddNewRowComponent';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

// utilityForNestedNewRow function is used to construct nested object while adding or updating new row when '.' is present in column key for adding new row
const utilityForNestedNewRow = (row) => {
  let arr = Object.keys(row);
  let obj = {};
  arr.forEach((key) => {
    let nestedKeys = key.split('.');
    let tempObj = obj;

    for (let i = 0; i < nestedKeys.length; i++) {
      let nestedKey = nestedKeys[i];

      if (!tempObj.hasOwnProperty(nestedKey)) {
        tempObj[nestedKey] = i === nestedKeys.length - 1 ? '' : {};
      }

      tempObj = tempObj[nestedKey];
    }
  });
  return obj;
};

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
  events,
  setProperty,
  mode,
  exposedVariables,
}) {
  const {
    color,
    serverSidePagination,
    clientSidePagination,
    serverSideSearch,
    serverSideSort,
    serverSideFilter,
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
    enableNextButton,
    enablePrevButton,
    totalRecords,
    rowsPerPage,
    enabledSort,
    hideColumnSelectorButton,
    defaultSelectedRow,
    showAddNewRowButton,
    allowSelection,
  } = loadPropertiesAndStyles(properties, styles, darkMode, component);

  const updatedDataReference = useRef([]);
  const preSelectRow = useRef(false);

  const getItemStyle = ({ isDragging, isDropAnimating }, draggableStyle) => ({
    ...draggableStyle,
    userSelect: 'none',
    background: isDragging ? 'rgba(77, 114, 250, 0.2)' : '',
    top: 'auto',
    borderRadius: '4px',
    ...(isDragging && {
      marginLeft: '-120px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '10px',
      height: '30px',
    }),
    ...(!isDragging && { transform: 'translate(0,0)', width: '100%' }),
    ...(isDropAnimating && { transitionDuration: '0.001s' }),
  });
  const { t } = useTranslation();

  const [tableDetails, dispatch] = useReducer(reducer, initialState());
  const [hoverAdded, setHoverAdded] = useState(false);
  const [generatedColumn, setGeneratedColumn] = useState([]);
  const mergeToTableDetails = (payload) => dispatch(reducerActions.mergeToTableDetails(payload));
  const mergeToFilterDetails = (payload) => dispatch(reducerActions.mergeToFilterDetails(payload));
  const mergeToAddNewRowsDetails = (payload) => dispatch(reducerActions.mergeToAddNewRowsDetails(payload));
  const mounted = useMounted();

  const prevDataFromProps = useRef();
  useEffect(() => {
    if (mounted) prevDataFromProps.current = properties.data;
  }, [JSON.stringify(properties.data)]);

  useEffect(() => {
    setExposedVariable(
      'filters',
      tableDetails.filterDetails.filters.map((filter) => filter.value)
    );
  }, [JSON.stringify(tableDetails?.filterDetails?.filters)]);

  useEffect(
    () => mergeToTableDetails({ columnProperties: component?.definition?.properties?.columns?.value }),
    [component?.definition?.properties]
  );

  useEffect(() => {
    const hoverEvent = component?.definition?.events?.find((event) => {
      return event?.eventId == 'onRowHovered';
    });
    if (hoverEvent?.eventId) {
      setHoverAdded(true);
    }
  }, [JSON.stringify(component.definition.events)]);

  function showFilters() {
    mergeToFilterDetails({ filtersVisible: true });
  }

  function hideFilters() {
    mergeToFilterDetails({ filtersVisible: false });
  }

  function showAddNewRowPopup() {
    mergeToAddNewRowsDetails({ addingNewRows: true });
  }

  function hideAddNewRowPopup() {
    mergeToAddNewRowsDetails({ addingNewRows: false });
  }

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 60,
      width: 268,
    }),
    []
  );

  function handleExistingRowCellValueChange(index, key, value, rowData) {
    const changeSet = tableDetails.changeSet;
    const dataUpdates = tableDetails.dataUpdates || [];
    const clonedTableData = _.cloneDeep(tableData);

    let obj = changeSet ? changeSet[index] || {} : {};
    obj = _.set(obj, key, value);

    let newChangeset = {
      ...changeSet,
      [index]: {
        ...obj,
      },
    };

    obj = _.set({ ...rowData }, key, value);

    let newDataUpdates = {
      ...dataUpdates,
      [index]: { ...obj },
    };

    Object.keys(newChangeset).forEach((key) => {
      clonedTableData[key] = {
        ..._.merge(clonedTableData[key], newChangeset[key]),
      };
    });

    const changesToBeSavedAndExposed = { dataUpdates: newDataUpdates, changeSet: newChangeset };
    mergeToTableDetails(changesToBeSavedAndExposed);
    fireEvent('onCellValueChanged');
    return setExposedVariables({ ...changesToBeSavedAndExposed, updatedData: clonedTableData });
  }

  const copyOfTableDetails = useRef(tableDetails);
  useEffect(() => {
    copyOfTableDetails.current = _.cloneDeep(tableDetails);
  }, [JSON.stringify(tableDetails)]);

  function handleNewRowCellValueChange(index, key, value, rowData) {
    const changeSet = copyOfTableDetails.current.addNewRowsDetails.newRowsChangeSet || {};
    const dataUpdates = copyOfTableDetails.current.addNewRowsDetails.newRowsDataUpdates || {};
    let obj = changeSet ? changeSet[index] || {} : {};
    obj = _.set(obj, key, value);
    let newChangeset = {
      ...changeSet,
      [index]: {
        ...obj,
      },
    };

    if (Object.keys(rowData).find((key) => key.includes('.'))) {
      rowData = utilityForNestedNewRow(rowData);
    }
    obj = _.merge({}, rowData, obj);

    let newDataUpdates = {
      ...dataUpdates,
      [index]: { ...obj },
    };
    const changesToBeSaved = { newRowsDataUpdates: newDataUpdates, newRowsChangeSet: newChangeset };
    const changesToBeExposed = Object.keys(newDataUpdates).reduce((accumulator, row) => {
      accumulator.push({ ...newDataUpdates[row] });
      return accumulator;
    }, []);
    mergeToAddNewRowsDetails(changesToBeSaved);
    return setExposedVariables({ newRows: changesToBeExposed });
  }

  function getExportFileBlob({ columns, fileType, fileName }) {
    let headers = columns.map((column) => {
      return { exportValue: String(column.exportValue), key: column.key ? String(column.key) : column.key };
    });
    let data = globalFilteredRows.map((row) => {
      return headers.reduce((accumulator, header) => {
        let value = undefined;
        if (header.key && header.key !== header.exportValue) {
          value = _.get(row.original, header.key);
        } else {
          value = _.get(row.original, header.exportValue);
        }
        accumulator.push(value);
        return accumulator;
      }, []);
    });
    headers = headers.map((header) => header.exportValue.toUpperCase());
    if (fileType === 'csv') {
      const csvString = Papa.unparse({ fields: headers, data });
      return new Blob([csvString], { type: 'text/csv' });
    } else if (fileType === 'pdf') {
      const pdfData = data.map((obj) => Object.values(obj));
      const doc = new JsPDF();
      doc.autoTable({
        head: [headers],
        body: pdfData,
        styles: {
          minCellHeight: 9,
          minCellWidth: 20,
          fontSize: 11,
          color: 'black',
        },
        theme: 'grid',
      });
      doc.save(`${fileName}.pdf`);
      return;
    } else if (fileType === 'xlsx') {
      data.unshift(headers); //adding headers array at the beginning of data
      let wb = XLSX.utils.book_new();
      let ws1 = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws1, 'React Table Data');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      // Returning false as downloading of file is already taken care of
      return false;
    }
  }

  function onPageIndexChanged(page) {
    onComponentOptionChanged(component, 'pageIndex', page).then(() => {
      onEvent('onPageChanged', { component, data: {} });
    });
  }

  function handleChangesSaved() {
    const clonedTableData = _.cloneDeep(tableData);
    Object.keys(changeSet).forEach((key) => {
      clonedTableData[key] = {
        ..._.merge(clonedTableData[key], changeSet[key]),
      };
    });
    updatedDataReference.current = _.cloneDeep(clonedTableData);

    setExposedVariables({
      changeSet: {},
      dataUpdates: [],
    }).then(() => mergeToTableDetails({ dataUpdates: {}, changeSet: {} }));
  }

  function handleChangesDiscarded() {
    setExposedVariables({
      changeSet: {},
      dataUpdates: [],
    }).then(() => {
      mergeToTableDetails({ dataUpdates: {}, changeSet: {} });
      fireEvent('onCancelChanges');
    });
  }

  const changeSet = tableDetails?.changeSet ?? {};

  const computeFontColor = useCallback(() => {
    if (color !== undefined) {
      return color;
    } else {
      return darkMode ? '#ffffff' : '#000000';
    }
  }, [color, darkMode]);

  let tableData = [],
    dynamicColumn = [];

  const useDynamicColumn = resolveReferences(component.definition.properties?.useDynamicColumn?.value, currentState);
  if (currentState) {
    tableData = resolveReferences(component.definition.properties.data.value, currentState, []);
    dynamicColumn = useDynamicColumn
      ? resolveReferences(component.definition.properties?.columnData?.value, currentState, []) ?? []
      : [];
    if (!Array.isArray(tableData)) tableData = [];
  }

  tableData = tableData || [];

  const tableRef = useRef();

  let columnData = generateColumnsData({
    columnProperties: useDynamicColumn ? generatedColumn : component.definition.properties.columns.value,
    columnSizes,
    currentState,
    handleCellValueChange: handleExistingRowCellValueChange,
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
    darkMode,
  });

  columnData = useMemo(
    () =>
      columnData.filter((column) => {
        if (resolveReferences(column.columnVisibility, currentState)) {
          return column;
        }
      }),
    [columnData, currentState]
  );

  const columnDataForAddNewRows = generateColumnsData({
    columnProperties: useDynamicColumn ? generatedColumn : component.definition.properties.columns.value,
    columnSizes,
    currentState,
    handleCellValueChange: handleNewRowCellValueChange,
    customFilter,
    defaultColumn,
    changeSet: tableDetails.addNewRowsDetails.newRowsChangeSet,
    tableData,
    variablesExposedForPreview,
    exposeToCodeHinter,
    id,
    fireEvent,
    tableRef,
    t,
    darkMode,
  });

  const [leftActionsCellData, rightActionsCellData] = useMemo(
    () =>
      generateActionsData({
        actions,
        columnSizes,
        defaultColumn,
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
    () => {
      return [...leftActionsCellData, ...columnData, ...rightActionsCellData];
    },
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
      darkMode,
      allowSelection,
      highlightSelectedRow,
    ] // Hack: need to fix
  );

  const columnsForAddNewRow = useMemo(() => {
    return [...columnDataForAddNewRows];
  }, [JSON.stringify(columnDataForAddNewRows), darkMode, tableDetails.addNewRowsDetails.addingNewRows]);

  const data = useMemo(() => {
    if (!_.isEqual(properties.data, prevDataFromProps.current)) {
      if (!_.isEmpty(updatedDataReference.current)) updatedDataReference.current = [];
      if (
        !_.isEmpty(exposedVariables.newRows) ||
        !_.isEmpty(tableDetails.addNewRowsDetails.newRowsDataUpdates) ||
        tableDetails.addNewRowsDetails.addingNewRows
      ) {
        setExposedVariable('newRows', []).then(() => {
          mergeToAddNewRowsDetails({ newRowsDataUpdates: {}, newRowsChangeSet: {}, addingNewRows: false });
        });
      }
    }
    return _.isEmpty(updatedDataReference.current) ? tableData : updatedDataReference.current;
  }, [tableData.length, component.definition.properties.data.value, JSON.stringify(properties.data)]);

  useEffect(() => {
    if (
      tableData.length != 0 &&
      component.definition.properties.autogenerateColumns?.value &&
      (useDynamicColumn || mode === 'edit')
    ) {
      const generatedColumnFromData = autogenerateColumns(
        tableData,
        component.definition.properties.columns.value,
        component.definition.properties?.columnDeletionHistory?.value ?? [],
        useDynamicColumn,
        dynamicColumn,
        setProperty,
        component.definition.properties.autogenerateColumns?.generateNestedColumns ?? false
      );

      useDynamicColumn && setGeneratedColumn(generatedColumnFromData);
    }
  }, [JSON.stringify(tableData), JSON.stringify(dynamicColumn)]);

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
    allColumns,
    setColumnOrder,
    state: { pageIndex, globalFilter },
    exportData,
    selectedFlatRows,
    globalFilteredRows,
    getToggleHideAllColumnsProps,
    toggleRowSelected,
    toggleAllRowsSelected,
  } = useTable(
    {
      autoResetPage: false,
      autoResetGlobalFilter: false,
      autoResetHiddenColumns: false,
      autoResetFilters: false,
      manualGlobalFilter: serverSideSearch,
      manualFilters: serverSideFilter,
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 0, pageSize: -1 },
      pageCount: -1,
      manualPagination: false,
      getExportFileBlob,
      disableSortBy: !enabledSort,
      manualSortBy: serverSideSort,
      stateReducer: (newState, action, prevState) => {
        const newStateWithPrevSelectedRows = showBulkSelector
          ? { ...newState, selectedRowId: { ...prevState.selectedRowIds, ...newState.selectedRowIds } }
          : { ...newState.selectedRowId };
        if (action.type === 'toggleRowSelected') {
          prevState.selectedRowIds[action.id]
            ? (newState.selectedRowIds = {
                ...newStateWithPrevSelectedRows.selectedRowIds,
                [action.id]: false,
              })
            : (newState.selectedRowIds = {
                ...newStateWithPrevSelectedRows.selectedRowIds,
                [action.id]: true,
              });
        }
        return newState;
      },
    },
    useColumnOrder,
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useBlockLayout,
    useResizeColumns,
    useExportData,
    useRowSelect,
    (hooks) => {
      allowSelection &&
        !highlightSelectedRow &&
        hooks.visibleColumns.push((columns) => [
          {
            id: 'selection',
            Header: ({ getToggleAllPageRowsSelectedProps }) => {
              return (
                <div className="d-flex flex-column align-items-center">
                  {showBulkSelector && <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />}
                </div>
              );
            },
            Cell: ({ row }) => {
              return (
                <div className="d-flex flex-column align-items-center">
                  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                </div>
              );
            },
            width: 1,
            columnType: 'selector',
          },
          ...columns,
        ]);
    }
  );
  const currentColOrder = React.useRef();

  const sortOptions = useMemo(() => {
    if (state?.sortBy?.length === 0) {
      return;
    }

    const columnName = columns.find((column) => column.id === state?.sortBy?.[0]?.id).accessor;

    return [
      {
        column: columnName,
        direction: state?.sortBy?.[0]?.desc ? 'desc' : 'asc',
      },
    ];
  }, [JSON.stringify(state)]);

  const getDetailsOfPreSelectedRow = () => {
    const key = Object?.keys(defaultSelectedRow)[0] ?? '';
    const value = defaultSelectedRow?.[key] ?? undefined;
    const preSelectedRowDetails = rows.find((row) => row?.original?.[key] === value);
    return preSelectedRowDetails;
  };

  useEffect(() => {
    if (!sortOptions) {
      setExposedVariable('sortApplied', []);
    }
    if (mounted) setExposedVariable('sortApplied', sortOptions).then(() => fireEvent('onSort'));
  }, [sortOptions]);

  registerAction(
    'setPage',
    async function (targetPageIndex) {
      setPaginationInternalPageIndex(targetPageIndex);
      setExposedVariable('pageIndex', targetPageIndex);
      if (!serverSidePagination && clientSidePagination) gotoPage(targetPageIndex - 1);
    },
    [serverSidePagination, clientSidePagination, setPaginationInternalPageIndex]
  );
  registerAction(
    'selectRow',
    async function (key, value) {
      const item = tableData.filter((item) => item[key] == value);
      const row = rows.find((item, index) => item.original[key] == value);
      if (row != undefined) {
        const selectedRowDetails = { selectedRow: item[0], selectedRowId: row.id };
        setExposedVariables(selectedRowDetails).then(() => {
          toggleRowSelected(row.id);
          mergeToTableDetails(selectedRowDetails);
          fireEvent('onRowClicked');
        });
      }
    },
    [JSON.stringify(tableData), JSON.stringify(tableDetails.selectedRow)]
  );
  registerAction(
    'deselectRow',
    async function () {
      if (!_.isEmpty(tableDetails.selectedRow)) {
        const selectedRowDetails = { selectedRow: {}, selectedRowId: {} };
        setExposedVariables(selectedRowDetails).then(() => {
          if (allowSelection && !showBulkSelector) toggleRowSelected(tableDetails.selectedRowId, false);
          mergeToTableDetails(selectedRowDetails);
        });
      }
      return;
    },
    [JSON.stringify(tableData), JSON.stringify(tableDetails.selectedRow)]
  );
  registerAction(
    'discardChanges',
    async function () {
      if (Object.keys(tableDetails.changeSet || {}).length > 0) {
        setExposedVariables({
          changeSet: {},
          dataUpdates: [],
        }).then(() => {
          mergeToTableDetails({ dataUpdates: {}, changeSet: {} });
        });
      }
    },
    [JSON.stringify(tableData), JSON.stringify(tableDetails.changeSet)]
  );
  registerAction(
    'discardNewlyAddedRows',
    async function () {
      if (
        tableDetails.addNewRowsDetails.addingNewRows &&
        (Object.keys(tableDetails.addNewRowsDetails.newRowsChangeSet || {}).length > 0 ||
          Object.keys(tableDetails.addNewRowsDetails.newRowsDataUpdates || {}).length > 0)
      ) {
        setExposedVariables({
          newRows: [],
        }).then(() => {
          mergeToAddNewRowsDetails({ newRowsChangeSet: {}, newRowsDataUpdates: {}, addingNewRows: false });
        });
      }
    },
    [
      JSON.stringify(tableDetails.addNewRowsDetails.newRowsChangeSet),
      tableDetails.addNewRowsDetails.addingNewRows,
      JSON.stringify(tableDetails.addNewRowsDetails.newRowsDataUpdates),
    ]
  );
  useEffect(() => {
    if (showBulkSelector) {
      const selectedRowsOriginalData = selectedFlatRows.map((row) => row.original);
      const selectedRowsId = selectedFlatRows.map((row) => row.id);
      setExposedVariables({ selectedRows: selectedRowsOriginalData, selectedRowsId: selectedRowsId }).then(() => {
        const selectedRowsDetails = selectedFlatRows.reduce((accumulator, row) => {
          accumulator.push({ selectedRowId: row.id, selectedRow: row.original });
          return accumulator;
        }, []);
        mergeToTableDetails({ selectedRowsDetails });
      });
    }
    if (
      (!showBulkSelector && !highlightSelectedRow) ||
      (showBulkSelector && !highlightSelectedRow && preSelectRow.current)
    ) {
      const selectedRow = selectedFlatRows?.[0]?.original ?? {};
      const selectedRowId = selectedFlatRows?.[0]?.id ?? null;
      setExposedVariables({ selectedRow, selectedRowId }).then(() => {
        mergeToTableDetails({ selectedRow, selectedRowId });
      });
    }
  }, [selectedFlatRows.length, selectedFlatRows]);

  registerAction(
    'downloadTableData',
    async function (format) {
      exportData(format, true);
    },
    [_.toString(globalFilteredRows), columns]
  );

  useEffect(() => {
    if (mounted) {
      setExposedVariables({ selectedRows: [], selectedRowsId: [], selectedRow: {}, selectedRowId: null }).then(() => {
        mergeToTableDetails({ selectedRowsDetails: [], selectedRow: {}, selectedRowId: null });
        toggleAllRowsSelected(false);
      });
    }
  }, [showBulkSelector, highlightSelectedRow, allowSelection]);

  React.useEffect(() => {
    if (serverSidePagination || !clientSidePagination) {
      setPageSize(rows?.length || 10);
    }
    if (!serverSidePagination && clientSidePagination) {
      setPageSize(rowsPerPage || 10);
    }
  }, [clientSidePagination, serverSidePagination, rows, rowsPerPage]);
  useEffect(() => {
    const pageData = page.map((row) => row.original);
    if (preSelectRow.current) {
      preSelectRow.current = false;
    } else {
      onComponentOptionsChanged(component, [
        ['currentPageData', pageData],
        ['currentData', data],
        ['selectedRow', []],
        ['selectedRowId', null],
      ]).then(() => {
        if (tableDetails.selectedRowId || !_.isEmpty(tableDetails.selectedRowDetails)) {
          toggleAllRowsSelected(false);
          mergeToTableDetails({ selectedRow: {}, selectedRowId: null, selectedRowDetails: [] });
        }
      });
    }
  }, [tableData.length, _.toString(page), pageIndex, _.toString(data)]);

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
  const [rowDetails, setRowDetails] = useState();
  useEffect(() => {
    if (pageCount <= pageIndex) gotoPage(pageCount - 1);
  }, [pageCount]);

  const hoverRef = useRef();

  useEffect(() => {
    if (rowDetails?.hoveredRowId !== '' && hoverRef.current !== rowDetails?.hoveredRowId) rowHover();
  }, [rowDetails]);

  useEffect(() => {
    setExposedVariable(
      'filteredData',
      globalFilteredRows.map((row) => row.original)
    );
  }, [JSON.stringify(globalFilteredRows.map((row) => row.original))]);

  const rowHover = () => {
    mergeToTableDetails(rowDetails);
    setExposedVariables(rowDetails).then(() => {
      fireEvent('onRowHovered');
    });
  };
  useEffect(() => {
    if (_.isEmpty(changeSet)) {
      setExposedVariable(
        'updatedData',
        _.isEmpty(updatedDataReference.current) ? tableData : updatedDataReference.current
      );
    }
  }, [JSON.stringify(changeSet)]);
  useEffect(() => {
    if (
      allowSelection &&
      typeof defaultSelectedRow === 'object' &&
      !_.isEmpty(defaultSelectedRow) &&
      !_.isEmpty(data)
    ) {
      const preSelectedRowDetails = getDetailsOfPreSelectedRow();
      if (_.isEmpty(preSelectedRowDetails)) return;

      const selectedRow = preSelectedRowDetails?.original ?? {};
      const selectedRowId = preSelectedRowDetails?.id ?? null;
      const pageNumber = Math.floor(selectedRowId / rowsPerPage) + 1;
      preSelectRow.current = true;
      if (highlightSelectedRow) {
        setExposedVariables({ selectedRow: selectedRow, selectedRowId: selectedRowId }).then(() => {
          toggleRowSelected(selectedRowId, true);
          mergeToTableDetails({ selectedRow: selectedRow, selectedRowId: selectedRowId });
        });
      } else {
        toggleRowSelected(selectedRowId, true);
      }
      if (pageIndex >= 0 && pageNumber !== pageIndex + 1) {
        gotoPage(pageNumber - 1);
      }
    }

    //hack : in the initial render, data is undefined since, upon feeding data to the table from some query, query inside current state is {}. Hence we added data in the dependency array, now question is should we add data or rows?
  }, [JSON.stringify(defaultSelectedRow), JSON.stringify(data)]);

  function downlaodPopover() {
    const options = [
      { dataCy: 'option-download-CSV', text: 'Download as CSV', value: 'csv' },
      { dataCy: 'option-download-execel', text: 'Download as Excel', value: 'xlsx' },
      { dataCy: 'option-download-pdf', text: 'Download as PDF', value: 'pdf' },
    ];
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
  }

  function hideColumnsPopover() {
    const heightOfTableComponent = document.querySelector('.card.jet-table.table-component')?.offsetHeight;
    return (
      <Popover
        className={`${darkMode && 'dark-theme'}`}
        style={{ maxHeight: `${heightOfTableComponent - 79}px`, overflowY: 'auto' }}
      >
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
              typeof column.Header === 'string' && (
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
  }
  const calculateWidthOfActionColumnHeader = (position) => {
    let totalWidth = null;
    if (position === 'rightActions') {
      const rightActionBtn = document.querySelector('.has-right-actions');
      totalWidth = rightActionBtn?.offsetWidth;
    }
    if (position === 'leftActions') {
      const leftActionBtn = document.querySelector('.has-left-actions');
      totalWidth = leftActionBtn?.offsetWidth;
    }
    return totalWidth;
  };
  return (
    <div
      data-cy={`draggable-widget-${String(component.name).toLowerCase()}`}
      data-disabled={parsedDisabledState}
      className={`card jet-table table-component ${darkMode && 'dark-theme'}`}
      style={{
        width: `100%`,
        height: `${height}px`,
        display: parsedWidgetVisibility ? '' : 'none',
        overflow: 'hidden',
        borderRadius: Number.parseFloat(borderRadius),
        boxShadow: styles.boxShadow,
        padding: '8px',
      }}
      onClick={(event) => {
        onComponentClick(id, component, event);
      }}
      ref={tableRef}
    >
      {(displaySearchBox || showFilterButton) && (
        <div
          className="table-card-header d-flex justify-content-between align-items-center"
          style={{ padding: '12px', height: 56 }}
        >
          <div>
            {loadingState && (
              <SkeletonTheme baseColor="var(--slate3)">
                <Skeleton count={1} width={83} height={28} className="mb-1" />
              </SkeletonTheme>
            )}
            {showFilterButton && !loadingState && (
              <>
                <Tooltip id="tooltip-for-filter-data" className="tooltip" />
                <ButtonSolid
                  variant="tertiary"
                  className={`tj-text-xsm ${tableDetails?.filterDetails?.filtersVisible && 'cursor-not-allowed'}`}
                  style={{ minWidth: '32px' }}
                  leftIcon="filter"
                  fill={`var(--slate12)`}
                  iconWidth="16"
                  onClick={() => {
                    showFilters();
                  }}
                  size="md"
                  data-tooltip-id="tooltip-for-filter-data"
                  data-tooltip-content="Filter data"
                ></ButtonSolid>
              </>
            )}
          </div>
          <div className="d-flex custom-gap-8" style={{ maxHeight: 32 }}>
            {loadingState && (
              <SkeletonTheme baseColor="var(--slate3)">
                <Skeleton count={1} width={100} height={28} className="mb-1" />
              </SkeletonTheme>
            )}
            {displaySearchBox && !loadingState && (
              <GlobalFilter
                globalFilter={state.globalFilter}
                useAsyncDebounce={useAsyncDebounce}
                setGlobalFilter={setGlobalFilter}
                onComponentOptionChanged={onComponentOptionChanged}
                component={component}
                onEvent={onEvent}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      )}
      <div className={`table-responsive jet-data-table ${loadingState && 'overflow-hidden'}`}>
        <table
          {...getTableProps()}
          className={`table table-vcenter table-nowrap ${tableType} ${darkMode && 'table-dark'} ${
            tableDetails.addNewRowsDetails.addingNewRows && 'disabled'
          } ${!loadingState && page.length === 0 && 'h-100'}`}
          style={computedStyles}
        >
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <DragDropContext
                key={index}
                onDragStart={() => {
                  currentColOrder.current = allColumns?.map((o) => o.id);
                }}
                onDragUpdate={(dragUpdateObj) => {
                  const colOrder = [...currentColOrder.current];
                  const sIndex = dragUpdateObj.source.index;
                  const dIndex = dragUpdateObj.destination && dragUpdateObj.destination.index;

                  if (typeof sIndex === 'number' && typeof dIndex === 'number') {
                    colOrder.splice(sIndex, 1);
                    colOrder.splice(dIndex, 0, dragUpdateObj.draggableId);
                    setColumnOrder(colOrder);
                  }
                }}
              >
                <Droppable droppableId="droppable" direction="horizontal">
                  {(droppableProvided, snapshot) => (
                    <tr
                      ref={droppableProvided.innerRef}
                      key={index}
                      {...headerGroup.getHeaderGroupProps()}
                      className="tr"
                    >
                      {loadingState && (
                        <div className="w-100">
                          <SkeletonTheme baseColor="var(--slate3)" width="100%">
                            <Skeleton count={1} width={'100%'} height={28} className="mb-1" />
                          </SkeletonTheme>
                        </div>
                      )}
                      {!loadingState &&
                        headerGroup.headers.map((column, index) => {
                          return (
                            <Draggable
                              key={column.id}
                              draggableId={column.id}
                              index={index}
                              isDragDisabled={!column.accessor}
                            >
                              {(provided, snapshot) => {
                                let headerProps = { ...column.getHeaderProps() };
                                if (column.columnType === 'selector') {
                                  headerProps = {
                                    ...headerProps,
                                    style: {
                                      ...headerProps.style,
                                      width: 40,
                                      padding: 0,
                                      display: 'flex',
                                      'align-items': 'center',
                                      'justify-content': 'center',
                                    },
                                  };
                                }
                                if (column.Header === 'Actions') {
                                  headerProps = {
                                    ...headerProps,
                                    style: {
                                      ...headerProps.style,
                                      width: calculateWidthOfActionColumnHeader(column.id),
                                      maxWidth: calculateWidthOfActionColumnHeader(column.id),
                                      padding: 0,
                                      display: 'flex',
                                      'align-items': 'center',
                                      'justify-content': 'center',
                                    },
                                  };
                                }
                                if (
                                  headerGroup?.headers?.[headerGroup?.headers?.length - 1]?.Header === 'Actions' &&
                                  index === headerGroup?.headers?.length - 2
                                ) {
                                  headerProps = {
                                    ...headerProps,
                                    style: {
                                      ...headerProps.style,
                                      flex: '1 1 auto',
                                    },
                                  };
                                }
                                const isEditable = resolveReferences(column?.isEditable ?? false, currentState);
                                return (
                                  <th
                                    key={index}
                                    {...headerProps}
                                    className={`th tj-text-xsm font-weight-400 ${
                                      column.isSorted && (column.isSortedDesc ? '' : '')
                                    } ${column.isResizing && 'resizing-column'} ${
                                      column.Header === 'Actions' && 'has-actions'
                                    }`}
                                  >
                                    <div
                                      className={`${
                                        column.columnType !== 'selector' &&
                                        'd-flex justify-content-between custom-gap-12'
                                      }`}
                                      {...column.getSortByToggleProps()}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      // {...extraProps}
                                      ref={provided.innerRef}
                                      style={{ ...getItemStyle(snapshot, provided.draggableProps.style) }}
                                    >
                                      <div
                                        className={`${
                                          column.columnType !== 'selector' && isEditable && 'd-flex custom-gap-4'
                                        }`}
                                      >
                                        <div>
                                          {column.columnType !== 'selector' && isEditable && (
                                            <SolidIcon
                                              name="editable"
                                              width="16px"
                                              height="16px"
                                              fill={darkMode ? '#4C5155' : '#C1C8CD'}
                                              vievBox="0 0 16 16"
                                            />
                                          )}
                                        </div>
                                        <div
                                          data-cy={`column-header-${String(column.exportValue)
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')}`}
                                          className={`header-text ${
                                            column.id === 'selection' &&
                                            column.columnType === 'selector' &&
                                            'selector-column'
                                          }`}
                                        >
                                          {column.render('Header')}
                                        </div>
                                      </div>
                                      <div>
                                        {column.columnType !== 'selector' &&
                                          column.isSorted &&
                                          (column.isSortedDesc ? (
                                            <SolidIcon
                                              name="arrowdown"
                                              width="16"
                                              height="16"
                                              fill={darkMode ? '#ECEDEE' : '#11181C'}
                                            />
                                          ) : (
                                            <SolidIcon
                                              name="arrowup"
                                              width="16"
                                              height="16"
                                              fill={darkMode ? '#ECEDEE' : '#11181C'}
                                            />
                                          ))}
                                      </div>
                                    </div>
                                    <div
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      draggable="true"
                                      {...column.getResizerProps()}
                                      className={`${
                                        (column.id === 'selection' && column.columnType === 'selector') ||
                                        column.Header === 'Actions'
                                          ? ''
                                          : 'resizer'
                                      }  ${column.isResizing ? 'isResizing' : ''}`}
                                    >
                                      {/* {column.isResizing && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="25"
                                        height="24"
                                        viewBox="0 0 25 24"
                                        fill="none"
                                      >
                                        <rect
                                          width="24"
                                          height="24"
                                          transform="translate(0.00195312)"
                                          fill=""
                                          // style="mix-blend-mode:multiply"
                                        />
                                        <path
                                          d="M12.498 13.5015H12.4981H14.5191V15.5875V16.7996L15.3737 15.94L18.9387 12.354L19.2892 12.0014L18.9387 11.6489L15.3737 8.06393L14.5191 7.20459V8.41649V10.5215H12.4981H9.49811V8.41449V7.20714L8.64451 8.06099L5.05851 11.648L4.70505 12.0015L5.05856 12.355L8.64456 15.941L9.49811 16.7946V15.5875V13.5006L12.498 13.5015Z"
                                          fill="black"
                                          stroke="white"
                                        />
                                      </svg>
                                    )} */}
                                    </div>
                                  </th>
                                );
                              }}
                            </Draggable>
                          );
                        })}
                    </tr>
                  )}
                </Droppable>
              </DragDropContext>
            ))}
          </thead>

          {!loadingState && page.length === 0 && (
            <div className="d-flex flex-column align-items-center custom-gap-8 justify-content-center h-100">
              <div className="warning-no-data">
                <div className="warning-svg-wrapper">
                  <SolidIcon name="warning" width="16" />
                </div>
              </div>
              <div className="warning-no-data-text">No data</div>
            </div>
          )}

          {!loadingState && (
            <tbody {...getTableBodyProps()} style={{ color: computeFontColor() }}>
              {page.map((row, index) => {
                prepareRow(row);
                return (
                  <tr
                    key={index}
                    className={`table-row table-editor-component-row ${
                      allowSelection &&
                      highlightSelectedRow &&
                      ((row.isSelected && row.id === tableDetails.selectedRowId) ||
                        (showBulkSelector &&
                          row.isSelected &&
                          tableDetails?.selectedRowsDetails?.some((singleRow) => singleRow.selectedRowId === row.id)))
                        ? 'selected'
                        : ''
                    }`}
                    {...row.getRowProps()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      // toggleRowSelected will triggered useRededcuer function in useTable and in result will get the selectedFlatRows consisting row which are selected
                      if (allowSelection) {
                        await toggleRowSelected(row.id);
                      }
                      const selectedRow = row.original;
                      const selectedRowId = row.id;
                      setExposedVariables({ selectedRow, selectedRowId }).then(() => {
                        mergeToTableDetails({ selectedRow, selectedRowId });
                        fireEvent('onRowClicked');
                      });
                    }}
                    onMouseOver={(e) => {
                      if (hoverAdded) {
                        const hoveredRowDetails = { hoveredRowId: row.id, hoveredRow: row.original };
                        setRowDetails(hoveredRowDetails);
                        hoverRef.current = rowDetails?.hoveredRowId;
                      }
                    }}
                    onMouseLeave={(e) => {
                      hoverAdded && setRowDetails({ hoveredRowId: '', hoveredRow: '' });
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
                            cellProps.style.backgroundColor = darkMode ? '#391A03' : '#FFF1E7';
                            cellProps.style['--tblr-table-accent-bg'] = darkMode ? '#391A03' : '#FFF1E7';
                          }
                        }
                      }
                      if (cell.column.columnType === 'selector') {
                        cellProps.style.width = 40;
                        cellProps.style.padding = 0;
                      }
                      if (cell.column.Header === 'Actions') {
                        cellProps.style.width = 'fit-content';
                        cellProps.style.maxWidth = 'fit-content';
                      }
                      if (
                        row.cells?.[row.cells?.length - 1]?.column.Header === 'Actions' &&
                        index === row?.cells?.length - 2
                      ) {
                        cellProps.style.flex = '1 1 auto';
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
                      const cellTextColor = resolveReferences(cell.column?.textColor, currentState, '', {
                        cellValue,
                        rowData,
                      });
                      const actionButtonsArray = actions.map((action) => {
                        return {
                          ...action,
                          isDisabled: resolveReferences(action?.disableActionButton ?? false, currentState, '', {
                            cellValue,
                            rowData,
                          }),
                        };
                      });
                      const isEditable = resolveReferences(cell.column?.isEditable ?? false, currentState, '', {
                        cellValue,
                        rowData,
                      });
                      return (
                        // Does not require key as its already being passed by react-table via cellProps
                        // eslint-disable-next-line react/jsx-key
                        <td
                          data-cy={`${cell.column.columnType ?? ''}${String(
                            cell.column.id === 'rightActions' || cell.column.id === 'leftActions' ? cell.column.id : ''
                          )}${String(cellValue ?? '').toLocaleLowerCase()}-cell-${index}`}
                          className={cx(
                            `${wrapAction ? wrapAction : cell?.column?.Header === 'Actions' ? '' : 'wrap'}-wrapper`,
                            {
                              'has-actions': cell.column.id === 'rightActions' || cell.column.id === 'leftActions',
                              'has-left-actions': cell.column.id === 'leftActions',
                              'has-right-actions': cell.column.id === 'rightActions',
                              'has-text': cell.column.columnType === 'text' || isEditable,
                              'has-dropdown': cell.column.columnType === 'dropdown',
                              'has-multiselect': cell.column.columnType === 'multiselect',
                              'has-datepicker': cell.column.columnType === 'datepicker',
                              'align-items-center flex-column': cell.column.columnType === 'selector',
                              [cellSize]: true,
                              'selector-column':
                                cell.column.columnType === 'selector' && cell.column.id === 'selection',
                              'resizing-column': cell.column.isResizing,
                            }
                          )}
                          {...cellProps}
                          style={{ ...cellProps.style, backgroundColor: cellBackgroundColor ?? 'inherit' }}
                          onClick={(e) => {
                            setExposedVariable('selectedCell', {
                              columnName: cell.column.exportValue,
                              columnKey: cell.column.key,
                              value: cellValue,
                            });
                          }}
                        >
                          <div
                            className={`td-container ${
                              cell.column.columnType === 'image' && 'jet-table-image-column'
                            } ${cell.column.columnType !== 'image' && `w-100 h-100`}`}
                          >
                            <GenerateEachCellValue
                              cellValue={cellValue}
                              globalFilter={state.globalFilter}
                              cellRender={cell.render('Cell', { cell, actionButtonsArray, isEditable })}
                              rowChangeSet={rowChangeSet}
                              isEditable={isEditable}
                              columnType={cell.column.columnType}
                              isColumnTypeAction={['rightActions', 'leftActions'].includes(cell.column.id)}
                              cellTextColor={cellTextColor}
                              cell={cell}
                              currentState={currentState}
                            />
                          </div>
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
          <div style={{ width: '100%' }} className="p-2 h-100 ">
            <div className="d-flex align-items-center justify-content-center h-100">
              <svg
                className="loading-spinner-table-component"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="var(--indigo6)"
              >
                <style>.spinner_ajPY{}</style>
                <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" />
                <path
                  d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
                  class="spinner_ajPY"
                  fill="var(--indigo9)"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      {(clientSidePagination ||
        serverSidePagination ||
        Object.keys(tableDetails.changeSet || {}).length > 0 ||
        showAddNewRowButton ||
        showDownloadButton) && (
        <div
          className={`card-footer d-flex align-items-center jet-table-footer justify-content-center ${
            darkMode && 'dark-theme'
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
                        onEvent('onBulkUpdate', { component }).then(() => {
                          handleChangesSaved();
                        });
                      }}
                      data-cy={`table-button-save-changes`}
                      size="md"
                      isLoading={tableDetails.isSavingChanges ? true : false}
                      style={{ minWidth: '32px' }}
                      leftIcon={width > 650 ? '' : 'save'}
                      fill={'var(--indigo1)'}
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
                      style={{ minWidth: '32px' }}
                      leftIcon={width > 650 ? '' : 'cross'}
                      fill={'var(--slate12)'}
                      iconWidth="16"
                    >
                      {width > 650 ? <span>Discard</span> : ''}
                    </ButtonSolid>
                  </>
                ) : (
                  !loadingState && (
                    <span data-cy={`footer-number-of-records`} className="font-weight-500 text-black-000">
                      {clientSidePagination && !serverSidePagination && `${globalFilteredRows.length} Records`}
                      {serverSidePagination && totalRecords ? `${totalRecords} Records` : ''}
                    </span>
                  )
                ))}
            </div>
            <div className={`col d-flex justify-content-center h-100 ${loadingState && 'w-100'}`}>
              {loadingState && (
                <div className="w-100">
                  <SkeletonTheme baseColor="var(--slate3)" width="100%">
                    <Skeleton count={1} width={'100%'} height={28} className="mb-1" />
                  </SkeletonTheme>
                </div>
              )}

              {(clientSidePagination || serverSidePagination) && !loadingState && (
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
                <ButtonSolid
                  variant="ghostBlack"
                  className={`tj-text-xsm ${tableDetails.addNewRowsDetails.addingNewRows && 'cursor-not-allowed'}`}
                  style={{ minWidth: '32px' }}
                  leftIcon="plus"
                  fill={`var(--slate12)`}
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
              )}
              {!loadingState && showDownloadButton && (
                <div>
                  <OverlayTrigger trigger="click" overlay={downlaodPopover()} rootClose={true} placement={'top-end'}>
                    <span>
                      {' '}
                      <ButtonSolid
                        variant="ghostBlack"
                        className="tj-text-xsm"
                        style={{
                          minWidth: '32px',
                        }}
                        leftIcon="filedownload"
                        fill={`var(--slate12)`}
                        iconWidth="16"
                        size="md"
                        data-tooltip-id="tooltip-for-download"
                        data-tooltip-content="Download"
                      ></ButtonSolid>
                    </span>
                  </OverlayTrigger>
                </div>
              )}
              {!loadingState && !hideColumnSelectorButton && (
                <OverlayTrigger trigger="click" rootClose={true} overlay={hideColumnsPopover()} placement={'top-end'}>
                  <span>
                    {' '}
                    <ButtonSolid
                      variant="ghostBlack"
                      className="tj-text-xsm"
                      style={{ minWidth: '32px' }}
                      leftIcon="eye1"
                      fill={`var(--slate12)`}
                      iconWidth="16"
                      size="md"
                      data-cy={`select-column-icon`}
                    ></ButtonSolid>
                  </span>
                </OverlayTrigger>
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
      {tableDetails.addNewRowsDetails.addingNewRows && (
        <AddNewRowComponent
          hideAddNewRowPopup={hideAddNewRowPopup}
          tableType={tableType}
          darkMode={darkMode}
          mergeToAddNewRowsDetails={mergeToAddNewRowsDetails}
          onEvent={onEvent}
          component={component}
          setExposedVariable={setExposedVariable}
          allColumns={allColumns}
          defaultColumn={defaultColumn}
          columns={columnsForAddNewRow}
          addNewRowsDetails={tableDetails.addNewRowsDetails}
          utilityForNestedNewRow={utilityForNestedNewRow}
        />
      )}
    </div>
  );
}
