/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useState, useEffect, useCallback, useContext, useReducer, useRef } from 'react';
import {
  useTable,
  useFilters,
  useSortBy,
  useGlobalFilter,
  usePagination,
  useBlockLayout,
  useResizeColumns,
  useRowSelect,
  useColumnOrder,
} from 'react-table';
import { useExportData } from 'react-table-plugins';
import Papa from 'papaparse';
import { set, get, merge, isArray, isEmpty, isEqual, toString } from 'lodash';
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
// eslint-disable-next-line import/no-unresolved
import * as XLSX from 'xlsx/xlsx.mjs';
import Popover from 'react-bootstrap/Popover';
import { useMounted } from '@/_hooks/use-mount';
import { useAppInfo } from '@/_stores/appDataStore';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { isRowInValid } from './tableUtils';
import moment from 'moment';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useEvents } from '@/AppBuilder/_stores/slices/eventsSlice';
import { Footer } from './Components/Footer';
import { Header } from './Components/Header';
import { TableHeader } from './Components/TableHeader';
import { TableRow } from './Components/TableRow';
import { EmptyState } from './Components/EmptyState';
import { LoadingState } from './Components/LoadingState';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';

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

export const Table = React.memo(
  ({
    id,
    width,
    height,
    currentState = { components: {} },
    darkMode,
    fireEvent,
    setExposedVariables,
    styles,
    properties,
    variablesExposedForPreview,
    exposeToCodeHinter,
    // events,
    // setProperty,
  }) => {
    const component = useStore((state) => state.getComponentDefinition(id), shallow);
    const exposedNewRows = useStore((state) => state.getExposedValueOfComponent(id)?.newRows || [], shallow);
    const validateWidget = useStore((state) => state.validateWidget, shallow);
    const validateDates = useStore((state) => state.validateDates, shallow);
    const mode = useStore((state) => state.currentMode);

    const {
      color,
      serverSidePagination,
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
      enablePagination,
      maxRowHeight,
      autoHeight,
      selectRowOnCellEdit,
      contentWrapProperty,
      boxShadow,
      maxRowHeightValue,
      borderColor,
      isMaxRowHeightAuto,
      columnHeaderWrap,
      headerCasing,
    } = loadPropertiesAndStyles(properties, styles, darkMode);
    const updatedDataReference = useRef([]);
    const preSelectRow = useRef(false);
    const initialPageCountRef = useRef(null);
    const allAppEvents = useEvents();
    // const { events: allAppEvents } = useAppInfo();
    const tableEvents = allAppEvents.filter((event) => event.target === 'component' && event.sourceId === id);
    const onEvent = useStore((state) => state.eventsSlice.onEvent);
    const getResolvedValue = useStore((state) => state.getResolvedValue);
    const tableColumnEvents = allAppEvents.filter((event) => event.target === 'table_column' && event.sourceId === id);
    const tableActionEvents = allAppEvents.filter((event) => event.target === 'table_action' && event.sourceId === id);
    const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);

    const { t } = useTranslation();

    const [tableDetails, dispatch] = useReducer(reducer, initialState());
    const [hoverAdded, setHoverAdded] = useState(false);
    const [generatedColumn, setGeneratedColumn] = useState([]);
    const [isDownloadTableDataEventAssociated, setIsDownloadTableDataEventAssociated] = useState(false);

    const mergeToTableDetails = useCallback((payload) => dispatch(reducerActions.mergeToTableDetails(payload)), []);
    const mergeToFilterDetails = (payload) => dispatch(reducerActions.mergeToFilterDetails(payload));
    const mergeToAddNewRowsDetails = (payload) => dispatch(reducerActions.mergeToAddNewRowsDetails(payload));
    const mounted = useMounted();
    const [resizingColumnId, setResizingColumnId] = useState(null);

    const prevDataFromProps = useRef();
    useEffect(() => {
      if (mounted) prevDataFromProps.current = properties.data;
    }, [properties.data]);

    useEffect(() => {
      setExposedVariables({
        filters: tableDetails.filterDetails.filters.map((filter) => filter.value),
      });
    }, [JSON.stringify(tableDetails?.filterDetails?.filters)]);

    useEffect(() => mergeToTableDetails({ columnProperties: properties?.columns }), [properties?.columns]);

    useEffect(() => {
      const isDownloadTableDataEventAssociated = tableEvents.some((event) => event?.name === 'onTableDataDownload');
      if (isDownloadTableDataEventAssociated) setIsDownloadTableDataEventAssociated(true);
      else setIsDownloadTableDataEventAssociated(false);
      const hoverEvent = tableEvents?.find(({ event }) => {
        return event?.eventId == 'onRowHovered';
      });

      if (hoverEvent?.event?.eventId) {
        setHoverAdded(true);
      }
    }, [JSON.stringify(tableEvents)]);

    const showFilters = useCallback(() => {
      mergeToFilterDetails({ filtersVisible: true });
    }, []);

    const hideFilters = useCallback(() => {
      mergeToFilterDetails({ filtersVisible: false });
    }, []);

    function showAddNewRowPopup() {
      mergeToAddNewRowsDetails({ addingNewRows: true });
    }

    function hideAddNewRowPopup() {
      mergeToAddNewRowsDetails({ addingNewRows: false });
    }

    const defaultColumn = React.useMemo(
      () => ({
        minWidth: 60,
        width: 150,
      }),
      []
    );

    function handleExistingRowCellValueChange(index, key, value, rowData) {
      const changeSet = tableDetails.changeSet;

      const dataUpdates = tableDetails.dataUpdates || [];
      const clonedTableData = deepClone(tableData);

      let obj = changeSet ? changeSet[index] || {} : {};
      obj = { ...obj, [key]: value };

      let newChangeset = {
        ...changeSet,
        [index]: {
          ...obj,
        },
      };
      obj = set({ ...rowData }, key, value);

      let newDataUpdates = {
        ...dataUpdates,
        [index]: { ...obj },
      };

      Object.keys(newChangeset).forEach((key) => {
        clonedTableData[key] = {
          ...merge(clonedTableData[key], newChangeset[key]),
        };
      });
      const changesToBeSavedAndExposed = { dataUpdates: newDataUpdates, changeSet: newChangeset };
      mergeToTableDetails(changesToBeSavedAndExposed);
      setExposedVariables({ ...changesToBeSavedAndExposed, updatedData: clonedTableData });
      // Need to add a timeout here as changes are happening in the next render
      setTimeout(() => fireEvent('onCellValueChanged'), 0);
      return;
    }

    const copyOfTableDetails = useRef(tableDetails);
    useEffect(() => {
      copyOfTableDetails.current = deepClone(tableDetails);
    }, [JSON.stringify(tableDetails)]);

    function handleNewRowCellValueChange(index, key, value, rowData) {
      const changeSet = copyOfTableDetails.current.addNewRowsDetails.newRowsChangeSet || {};
      const dataUpdates = copyOfTableDetails.current.addNewRowsDetails.newRowsDataUpdates || {};
      let obj = changeSet ? changeSet[index] || {} : {};
      obj = set(obj, key, value);
      let newChangeset = {
        ...changeSet,
        [index]: {
          ...obj,
        },
      };

      if (Object.keys(rowData).find((key) => key.includes('.'))) {
        rowData = utilityForNestedNewRow(rowData);
      }
      obj = merge({}, rowData, obj);

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
        return { exportValue: String(column?.exportValue), key: column.key ? String(column.key) : column?.key };
      });
      let data = globalFilteredRows.map((row) => {
        return headers.reduce((accumulator, header) => {
          let value = undefined;
          if (header.key && header.key !== header.exportValue) {
            value = get(row.original, header.key);
          } else {
            value = get(row.original, header.exportValue);
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

    function getExportFileName() {
      return `${component?.component?.name}_${moment().format('DD-MM-YYYY_HH-mm')}`;
    }

    function onPageIndexChanged(page) {
      setExposedVariables({ pageIndex: page });
      onEvent('onPageChanged', tableEvents, { component });
    }

    function handleChangesSaved() {
      const clonedTableData = deepClone(tableData);
      Object.keys(changeSet).forEach((key) => {
        clonedTableData[key] = {
          ...merge(clonedTableData[key], changeSet[key]),
        };
      });
      updatedDataReference.current = deepClone(clonedTableData);

      // setExposedVariables({
      //   dataUpdates: [],
      // });
      mergeToTableDetails({ dataUpdates: {}, changeSet: {} });
    }

    function handleChangesDiscarded() {
      // setExposedVariables({
      //   dataUpdates: [],
      // });
      mergeToTableDetails({ dataUpdates: {}, changeSet: {} });
      fireEvent('onCancelChanges');
    }

    const changeSet = tableDetails?.changeSet ?? {};

    const computeFontColor = useCallback(() => {
      if (color !== undefined) {
        return color;
      } else {
        return darkMode ? '#ffffff' : '#000000';
      }
    }, [color, darkMode]);

    // let tableData = [],
    //   dynamicColumn = [];

    // const useDynamicColumn = resolveWidgetFieldValue(properties?.useDynamicColumn);
    // if (currentState) {
    //   tableData = resolveWidgetFieldValue(properties.data);
    //   dynamicColumn = useDynamicColumn ? resolveWidgetFieldValue(properties?.columnData) ?? [] : [];
    //   if (!Array.isArray(tableData)) {
    //     tableData = [];
    //   } else {
    //     tableData = tableData.filter((data) => data !== null && data !== undefined);
    //   }
    // }

    // tableData = isArray(tableData) ? tableData : [];

    const removeNullValues = (arr) => arr.filter((element) => element !== null);

    const useDynamicColumn = getResolvedValue(properties?.useDynamicColumn);
    const dynamicColumn = useDynamicColumn ? getResolvedValue(properties?.columnData) ?? [] : [];

    const columnProperties = useMemo(() => {
      return useDynamicColumn ? generatedColumn : removeNullValues(deepClone(properties.columns));
    }, [useDynamicColumn, generatedColumn, properties.columns]);

    const transformations = useMemo(() => {
      return columnProperties
        .filter((column) => column.transformation && column.transformation != '{{cellValue}}')
        .map((column) => ({
          key: column.key ? column.key : column.name,
          transformation: column.transformation,
        }));
    }, [JSON.stringify(columnProperties)]);

    const tableData = useMemo(() => {
      const resolvedData = getResolvedValue(properties.data);
      if (!Array.isArray(resolvedData) && !isArray(resolvedData)) {
        return [];
      } else {
        return resolvedData
          .filter((data) => data !== null && data !== undefined)
          .map((row) => {
            const transformedObject = {};

            transformations.forEach(({ key, transformation }) => {
              const nestedKeys = key.includes('.') && key.split('.');
              if (nestedKeys) {
                // Single-level nested property
                const [nestedKey, subKey] = nestedKeys;
                const nestedObject = transformedObject?.[nestedKey] || { ...row[nestedKey] }; // Retain existing nested object
                const newValue =
                  getResolvedValue(transformation, {
                    cellValue: row?.[nestedKey]?.[subKey],
                    rowData: row,
                  }) ?? row[key];

                // Apply transformation to subKey
                nestedObject[subKey] = newValue;

                // Update transformedObject with the new nested object
                transformedObject[nestedKey] = nestedObject;
              } else {
                // Non-nested property
                transformedObject[key] =
                  getResolvedValue(transformation, {
                    cellValue: row[key],
                    rowData: row,
                  }) ?? row[key];
              }
            });

            return {
              ...row,
              ...transformedObject,
            };
          });
      }
    }, [properties.data, transformations]);

    useEffect(() => {
      setExposedVariables({
        currentData: tableData,
        updatedData: tableData,
      });
    }, [tableData]);

    const tableRef = useRef();

    let columnData = generateColumnsData({
      columnProperties,
      columnSizes,
      currentState,
      getResolvedValue,
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
      tableColumnEvents: tableColumnEvents,
      cellSize: cellSize,
      maxRowHeightValue: maxRowHeightValue,
      isMaxRowHeightAuto: isMaxRowHeightAuto,
      validateWidget,
      validateDates,
    });

    columnData = useMemo(
      () =>
        columnData?.filter((column) => {
          if (getResolvedValue(column?.columnVisibility)) {
            return column;
          }
        }),
      [columnData, currentState]
    );

    const columnDataForAddNewRows = generateColumnsData({
      columnProperties: useDynamicColumn ? generatedColumn : properties.columns,
      columnSizes,
      currentState,
      getResolvedValue,
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
      validateWidget,
      validateDates,
    });
    const [leftActionsCellData, rightActionsCellData] = useMemo(
      () =>
        generateActionsData({
          actions,
          columnSizes,
          defaultColumn,
          fireEvent,
          setExposedVariables,
          tableActionEvents,
        }),
      [JSON.stringify(actions), tableActionEvents]
    );

    const optionsData = columnData.map((column) => column?.columnOptions?.selectOptions);
    const columns = useMemo(
      () => {
        return [...leftActionsCellData, ...columnData, ...rightActionsCellData];
      },
      [
        JSON.stringify(columnData),
        tableData,
        JSON.stringify(actions),
        leftActionsCellData.length,
        rightActionsCellData.length,
        tableDetails.changeSet,
        JSON.stringify(optionsData),
        JSON.stringify(properties.columns),
        showBulkSelector,
        JSON.stringify(variablesExposedForPreview && variablesExposedForPreview[id]),
        darkMode,
        allowSelection,
        highlightSelectedRow,
        JSON.stringify(tableActionEvents),
        JSON.stringify(tableColumnEvents),
        maxRowHeightValue,
        isMaxRowHeightAuto,
      ] // Hack: need to fix
    );

    const columnsForAddNewRow = useMemo(() => {
      return [...columnDataForAddNewRows];
    }, [JSON.stringify(columnDataForAddNewRows), darkMode, tableDetails.addNewRowsDetails.addingNewRows]);

    const data = useMemo(() => {
      if (!isEqual(properties.data, prevDataFromProps.current)) {
        if (!isEmpty(updatedDataReference.current)) updatedDataReference.current = [];
        if (
          !isEmpty(exposedNewRows) ||
          !isEmpty(tableDetails.addNewRowsDetails.newRowsDataUpdates) ||
          tableDetails.addNewRowsDetails.addingNewRows
        ) {
          setExposedVariables({ newRows: [] });
          mergeToAddNewRowsDetails({ newRowsDataUpdates: {}, newRowsChangeSet: {}, addingNewRows: false });
        }
      }
      return isEmpty(updatedDataReference.current) ? tableData : updatedDataReference.current;
    }, [properties.data, tableData]);

    useEffect(() => {
      if (
        properties.data.length != 0 &&
        properties.autogenerateColumns &&
        (useDynamicColumn || mode === 'edit' || mode === 'view')
      ) {
        const generatedColumnFromData = autogenerateColumns(
          properties.data,
          properties.columns,
          properties?.columnDeletionHistory ?? [],
          useDynamicColumn,
          dynamicColumn,
          setComponentProperty,
          properties.autogenerateColumns ?? false,
          id
        );
        if (useDynamicColumn) {
          const dynamicColumnHasId = dynamicColumn && dynamicColumn.every((column) => 'id' in column);
          if (!dynamicColumnHasId) {
            // if dynamic columns do not have an id then we need to manually compare the generated columns with the columns in the state because the id that we generate for columns without id is a uuid and it will be different every time
            const generatedColumnsWithoutIds = generatedColumnFromData.map(({ id, ...rest }) => ({
              ...rest,
            }));
            const columnsFromStateWithoutIds = generatedColumn.map(({ id, ...rest }) => ({
              ...rest,
            }));
            !isEqual(generatedColumnsWithoutIds, columnsFromStateWithoutIds) &&
              setGeneratedColumn(generatedColumnFromData);
            return;
          }
          setGeneratedColumn(generatedColumnFromData);
        }
      }
      // }, [tableData, JSON.stringify(dynamicColumn)]);
    }, [JSON.stringify(properties.data), JSON.stringify(dynamicColumn)]);

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
        initialState: { pageIndex: 0, pageSize: 1 },
        pageCount: -1,
        manualPagination: false,
        getExportFileBlob,
        getExportFileName,
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
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} fireEvent={fireEvent} />
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
    const clientSidePagination = enablePagination && !serverSidePagination;
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
        setExposedVariables({ sortApplied: [] });
      }
      if (mounted) {
        setExposedVariables({ sortApplied: sortOptions });
        fireEvent('onSort');
      }
    }, [JSON.stringify(sortOptions)]);

    useEffect(() => {
      function setPage(targetPageIndex) {
        setPaginationInternalPageIndex(targetPageIndex);
        setExposedVariables({ pageIndex: targetPageIndex });
        if (!serverSidePagination && clientSidePagination) gotoPage(targetPageIndex - 1);
      }
      setExposedVariables({ setPage });
    }, [serverSidePagination, clientSidePagination, setPaginationInternalPageIndex]);

    useEffect(() => {
      function selectRow(key, value) {
        const item = tableData.filter((item) => item[key] == value);
        const row = rows.find((item, index) => item.original[key] == value);
        if (row != undefined) {
          const selectedRowDetails = { selectedRow: item[0], selectedRowId: row.id };
          setExposedVariables(selectedRowDetails);
          toggleRowSelected(row.id);
          mergeToTableDetails(selectedRowDetails);
          fireEvent('onRowClicked');
        }
      }
      setExposedVariables({ selectRow });
    }, [tableData, JSON.stringify(tableDetails.selectedRow)]);

    useEffect(() => {
      function deselectRow() {
        if (!isEmpty(tableDetails.selectedRow)) {
          const selectedRowDetails = { selectedRow: {}, selectedRowId: {} };
          setExposedVariables(selectedRowDetails);
          if (allowSelection && !showBulkSelector) toggleRowSelected(tableDetails.selectedRowId, false);
          mergeToTableDetails(selectedRowDetails);
        }
        return;
      }
      setExposedVariables({ deselectRow });
    }, [tableData, JSON.stringify(tableDetails.selectedRow)]);

    useEffect(() => {
      function discardChanges() {
        if (Object.keys(tableDetails.changeSet || {}).length > 0) {
          // setExposedVariables({
          //   // changeSet: {},
          //   dataUpdates: [],
          // });
          mergeToTableDetails({ dataUpdates: {}, changeSet: {} });
        }
      }
      setExposedVariables({ discardChanges });
    }, [tableData, JSON.stringify(tableDetails.changeSet)]);

    useEffect(() => {
      function discardNewlyAddedRows() {
        if (
          !isEmpty(exposedNewRows) ||
          !isEmpty(tableDetails.addNewRowsDetails.newRowsChangeSet) ||
          !isEmpty(tableDetails.addNewRowsDetails.newRowsChangeSet)
        ) {
          setExposedVariables({
            newRows: [],
          });
          mergeToAddNewRowsDetails({ newRowsChangeSet: {}, newRowsDataUpdates: {}, addingNewRows: false });
        }
      }
      setExposedVariables({ discardNewlyAddedRows });
    }, [
      JSON.stringify(tableDetails.addNewRowsDetails.newRowsChangeSet),
      tableDetails.addNewRowsDetails.addingNewRows,
      JSON.stringify(tableDetails.addNewRowsDetails.newRowsDataUpdates),
    ]);

    useEffect(() => {
      if (!showBulkSelector) {
        setExposedVariables({ selectedRows: [] });
      }
      if (showBulkSelector) {
        const selectedRowsOriginalData = selectedFlatRows.map((row) => row.original);
        const selectedRowsId = selectedFlatRows.map((row) => row.id);
        setExposedVariables({ selectedRows: selectedRowsOriginalData || [], selectedRowsId: selectedRowsId });
        const selectedRowsDetails = selectedFlatRows.reduce((accumulator, row) => {
          accumulator.push({ selectedRowId: row.id, selectedRow: row.original });
          return accumulator;
        }, []);
        mergeToTableDetails({ selectedRowsDetails });
      }
      if (
        allowSelection &&
        ((!showBulkSelector && !highlightSelectedRow) ||
          (showBulkSelector && !highlightSelectedRow && preSelectRow.current))
      ) {
        const selectedRow = selectedFlatRows?.[0]?.original ?? {};
        const selectedRowId = selectedFlatRows?.[0]?.id ?? null;
        setExposedVariables({ selectedRow, selectedRowId });
        mergeToTableDetails({ selectedRow, selectedRowId });
      }
    }, [selectedFlatRows.length, selectedFlatRows]);

    useEffect(() => {
      function downloadTableData(format) {
        exportData(format);
      }
      setExposedVariables({ downloadTableData });
    }, [globalFilteredRows, columns]);

    useEffect(() => {
      if (mounted) {
        setExposedVariables({ selectedRows: [], selectedRowsId: [], selectedRow: {}, selectedRowId: null });
        mergeToTableDetails({ selectedRowsDetails: [], selectedRow: {}, selectedRowId: null });
        toggleAllRowsSelected(false);
      }
    }, [showBulkSelector, highlightSelectedRow, allowSelection]);

    React.useEffect(() => {
      if (enablePagination) {
        if (serverSidePagination || !clientSidePagination) {
          setPageSize(rows?.length || 10);
        }
        if (!serverSidePagination && clientSidePagination) {
          setPageSize(rowsPerPage || 10);
        }
      } else {
        setPageSize(rows?.length || 10);
      }
    }, [clientSidePagination, serverSidePagination, rows, rowsPerPage]);

    // useEffect(() => {
    //   if (!initialPageCountRef.current && serverSidePagination && data?.length && totalRecords) {
    //     initialPageCountRef.current = Math.ceil(totalRecords / data?.length);
    //   }
    //   if (!serverSidePagination) {
    //     initialPageCountRef.current = Math.ceil(data?.length / rowsPerPage);
    //   }
    // }, [serverSidePagination, totalRecords, data?.length, rowsPerPage]);

    useEffect(() => {
      const pageData = page.map((row) => row.original);
      if (preSelectRow.current) {
        preSelectRow.current = false;
      } else {
        setExposedVariables({
          currentPageData: pageData,
          currentData: data,
          selectedRow: [],
          selectedRowId: null,
        });
        if (tableDetails.selectedRowId || !isEmpty(tableDetails.selectedRowDetails)) {
          toggleAllRowsSelected(false);
          mergeToTableDetails({ selectedRow: {}, selectedRowId: null, selectedRowDetails: [] });
        }
      }
    }, [tableData.length, toString(page), pageIndex, toString(data)]);

    useEffect(() => {
      const newColumnSizes = { ...columnSizes, ...state.columnResizing.columnWidths };

      const isColumnSizeChanged = !isEmpty(diff(columnSizes, newColumnSizes));

      if (isColumnSizeChanged && !state.columnResizing.isResizingColumn && !isEmpty(newColumnSizes)) {
        setComponentProperty(id, 'columnSizes', newColumnSizes, 'properties');
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

    const memoizedGlobalFilteredRows = useMemo(() => {
      return globalFilteredRows.map((row) => row.original);
    }, [globalFilteredRows]);

    useEffect(() => {
      setExposedVariables({
        filteredData: memoizedGlobalFilteredRows,
      });
    }, [memoizedGlobalFilteredRows]);

    const rowHover = () => {
      mergeToTableDetails(rowDetails);
      setExposedVariables(rowDetails);
      fireEvent('onRowHovered');
    };
    useEffect(() => {
      if (isEmpty(changeSet)) {
        setExposedVariables({
          updatedData: isEmpty(updatedDataReference.current) ? tableData : updatedDataReference.current,
        });
        setExposedVariables({ changeSet });
      }
    }, [JSON.stringify(changeSet)]);

    useEffect(() => {
      if (allowSelection && typeof defaultSelectedRow === 'object' && !isEmpty(defaultSelectedRow) && !isEmpty(data)) {
        const preSelectedRowDetails = getDetailsOfPreSelectedRow();
        if (isEmpty(preSelectedRowDetails)) return;
        const selectedRow = preSelectedRowDetails?.original ?? {};
        const selectedRowIndex = preSelectedRowDetails?.index ?? null;
        const selectedRowId = preSelectedRowDetails?.id ?? null;
        const pageNumber = Math.floor(selectedRowIndex / rowsPerPage) + 1;

        preSelectRow.current = true;
        if (highlightSelectedRow) {
          setExposedVariables({ selectedRow: selectedRow, selectedRowId });
          toggleRowSelected(selectedRowId, true);
          mergeToTableDetails({ selectedRow: selectedRow, selectedRowId });
        } else {
          toggleRowSelected(selectedRowId, true);
        }
        if (pageIndex >= 0 && pageNumber !== pageIndex + 1) {
          gotoPage(pageNumber - 1);
          setPaginationInternalPageIndex(pageNumber);
        }
      }

      //hack : in the initial render, data is undefined since, upon feeding data to the table from some query, query inside current state is {}. Hence we added data in the dependency array, now question is should we add data or rows?
    }, [JSON.stringify(defaultSelectedRow), data]);

    useEffect(() => {
      // csa for select all rows in table
      async function selectAllRows() {
        if (showBulkSelector) {
          await toggleAllRowsSelected(true);
        }
      }

      // csa for deselect all rows in table
      async function deselectAllRows() {
        if (showBulkSelector) {
          await toggleAllRowsSelected(true);
        }
      }

      setExposedVariables({
        selectAllRows,
        deselectAllRows,
      });
    }, [JSON.stringify(tableDetails.selectedRowsDetails)]);

    useEffect(() => {
      setExposedVariables({ dataUpdates: tableDetails.dataUpdates || [] });
    }, [JSON.stringify(tableDetails.dataUpdates)]);

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

    const tableBodyRef = React.useRef(null);

    const rowVirtualizer = useVirtualizer({
      count: page.length,
      getScrollElement: () => tableBodyRef.current,
      estimateSize: () => 45, // Adjust based on your average row height
      overscan: 5,
    });

    const items = rowVirtualizer.getVirtualItems();

    return (
      <div
        data-cy={`draggable-widget-${String(component?.component?.name).toLowerCase()}`}
        data-disabled={parsedDisabledState}
        className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{
          width: `100%`,
          height: `${height}px`,
          display: parsedWidgetVisibility ? '' : 'none',
          overflow: 'hidden',
          borderRadius: Number.parseFloat(borderRadius),
          boxShadow,
          padding: '8px',
          borderColor: borderColor,
        }}
      >
        {(displaySearchBox || showFilterButton) && (
          <Header
            tableDetails={tableDetails}
            displaySearchBox={displaySearchBox}
            showFilterButton={showFilterButton}
            loadingState={loadingState}
            hideFilters={hideFilters}
            showFilters={showFilters}
            darkMode={darkMode}
            fireEvent={fireEvent}
            setExposedVariables={setExposedVariables}
            component={component}
            state={state}
            setGlobalFilter={setGlobalFilter}
          />
        )}
        <div
          className={`table-responsive jet-data-table ${(loadingState || page.length === 0) && 'overflow-hidden'} ${
            page.length === 0 && 'position-relative'
          }`}
          ref={tableBodyRef}
        >
          <table
            {...getTableProps()}
            className={`table table-vcenter table-nowrap ${tableType} ${darkMode && 'table-dark'} ${
              tableDetails.addNewRowsDetails.addingNewRows && 'disabled'
            } ${!loadingState && page.length !== 0 && 'h-100'} ${
              state?.columnResizing?.isResizingColumn ? 'table-resizing' : ''
            }`}
            style={{ ...computedStyles }}
          >
            <TableHeader
              headerGroups={headerGroups}
              allColumns={allColumns}
              currentColOrder={currentColOrder}
              setColumnOrder={setColumnOrder}
              loadingState={loadingState}
              darkMode={darkMode}
              getResolvedValue={getResolvedValue}
              columnHeaderWrap={columnHeaderWrap}
              setResizingColumnId={setResizingColumnId}
              resizingColumnId={resizingColumnId}
              headerCasing={headerCasing}
            />
            {page.length > 0 && !loadingState && (
              <tbody
                style={{
                  height: rowVirtualizer.getTotalSize(),
                  width: '100%',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: `${items[0]?.start ?? 0}px`,
                    left: 0,
                    width: '100%',
                  }}
                >
                  {items.map((virtualRow) => {
                    const row = page[virtualRow.index];
                    return (
                      <div key={virtualRow.index} data-index={virtualRow.index} ref={rowVirtualizer.measureElement}>
                        <TableRow
                          key={virtualRow.index}
                          index={virtualRow.index}
                          row={row}
                          prepareRow={prepareRow}
                          getResolvedValue={getResolvedValue}
                          contentWrapProperty={contentWrapProperty}
                          maxRowHeight={maxRowHeight}
                          cellSize={cellSize}
                          changeSet={changeSet}
                          currentState={currentState}
                          validateWidget={validateWidget}
                          validateDates={validateDates}
                          actions={actions}
                          toggleRowSelected={toggleRowSelected}
                          setExposedVariables={setExposedVariables}
                          fireEvent={fireEvent}
                          rowDetails={rowDetails}
                          setRowDetails={setRowDetails}
                          hoverRef={hoverRef}
                          allowSelection={allowSelection}
                          highlightSelectedRow={highlightSelectedRow}
                          showBulkSelector={showBulkSelector}
                          tableDetails={tableDetails}
                          mergeToTableDetails={mergeToTableDetails}
                          darkMode={darkMode}
                          state={state}
                          hoverAdded={hoverAdded}
                          columnData={columnData}
                          tableData={tableData}
                          isRowInValid={isRowInValid}
                          autoHeight={autoHeight}
                          isMaxRowHeightAuto={isMaxRowHeightAuto}
                          maxRowHeightValue={maxRowHeightValue}
                          selectRowOnCellEdit={selectRowOnCellEdit}
                          resizingColumnId={resizingColumnId}
                        />
                      </div>
                    );
                  })}
                </div>
              </tbody>
            )}
          </table>
          {loadingState ? <LoadingState /> : page.length === 0 ? <EmptyState /> : null}
        </div>
        <Footer
          isDownloadTableDataEventAssociated={isDownloadTableDataEventAssociated}
          enablePagination={enablePagination}
          tableDetails={tableDetails}
          loadingState={loadingState}
          darkMode={darkMode}
          fireEvent={fireEvent}
          setExposedVariables={setExposedVariables}
          component={component}
          state={state}
          showAddNewRowButton={showAddNewRowButton}
          showDownloadButton={showDownloadButton}
          hideColumnSelectorButton={hideColumnSelectorButton}
          showBulkUpdateActions={showBulkUpdateActions}
          handleChangesSaved={handleChangesSaved}
          handleChangesDiscarded={handleChangesDiscarded}
          onEvent={onEvent}
          tableEvents={tableEvents}
          width={width}
          height={height}
          pageIndex={pageIndex}
          canNextPage={canNextPage}
          pageCount={pageCount}
          pageOptions={pageOptions}
          onPageIndexChanged={onPageIndexChanged}
          paginationInternalPageIndex={paginationInternalPageIndex}
          setPaginationInternalPageIndex={setPaginationInternalPageIndex}
          enableNextButton={enableNextButton}
          enablePrevButton={enablePrevButton}
          clientSidePagination={clientSidePagination}
          serverSidePagination={serverSidePagination}
          rowCount={globalFilteredRows.length}
          totalRecords={totalRecords}
          columnData={columnData}
          allColumns={allColumns}
          defaultColumn={defaultColumn}
          columnsForAddNewRow={columnsForAddNewRow}
          utilityForNestedNewRow={utilityForNestedNewRow}
          tableType={tableType}
          hideAddNewRowPopup={hideAddNewRowPopup}
          mergeToAddNewRowsDetails={mergeToAddNewRowsDetails}
          hideFilters={hideFilters}
          setAllFilters={setAllFilters}
          mergeToFilterDetails={mergeToFilterDetails}
          gotoPage={gotoPage}
          showAddNewRowPopup={showAddNewRowPopup}
          downlaodPopover={downlaodPopover}
          getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
        />
      </div>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);
