import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import cx from 'classnames';
import { useTable, useRowSelect } from 'react-table';
import { isBoolean, isEmpty } from 'lodash';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { toast } from 'react-hot-toast';
import { TablePopover } from './ActionsPopover';
import { CellEditMenu } from '../Menu/CellEditMenu';
import { ConfirmDialog } from '@/_components';
import { ToolTip } from '@/_components/ToolTip';
import Skeleton from 'react-loading-skeleton';
import IndeterminateCheckbox from '@/_ui/IndeterminateCheckbox';
import Drawer from '@/_ui/Drawer';
import EditColumnForm from '../Forms/EditColumnForm';
import TableFooter from './Footer';
import { renderDatatypeIcon, listAllPrimaryKeyColumns, getColumnDataType } from '../constants';
import Menu from '../Icons/Menu.svg';
import Warning from '../Icons/warning.svg';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import WarningDark from '../Icons/warning-dark.svg';
import DeleteIcon from '../Table/ActionsPopover/Icons/DeleteColumn.svg';
import TjdbTableHeader from './Header';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { AddNewDataPopOver } from '../Table/ActionsPopover/AddNewDataPopOver';
import ArrowRight from '../Icons/ArrowRight.svg';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import {
  convertDateToTimeZoneFormatted,
  getLocalTimeZone,
  getUTCOffset,
} from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/util';
import './styles.scss';

const Table = ({ collapseSidebar }) => {
  const {
    organizationId,
    columns,
    selectedTable,
    selectedTableData,
    setSelectedTableData,
    setColumns,
    queryFilters,
    setQueryFilters,
    sortFilters,
    setSortFilters,
    resetAll,
    pageSize,
    pageCount,
    handleRefetchQuery,
    loadingState,
    setForeignKeys,
    foreignKeys,
    configurations,
    setConfigurations,
    getConfigurationProperty,
  } = useContext(TooljetDatabaseContext);
  const [isEditColumnDrawerOpen, setIsEditColumnDrawerOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState();
  const [loading, _setLoading] = useState(false);

  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
  const [isBulkUploadDrawerOpen, setIsBulkUploadDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [isAddNewDataMenuOpen, setIsAddNewDataMenuOpen] = useState(false);
  const [editColumnHeader, setEditColumnHeader] = useState({
    hoveredColumn: null,
    clickedColumn: null,
    columnHeaderValue: null,
    deletePopupModal: false,
    columnEditPopover: false,
  });

  const [isEditRowDrawerOpen, setIsEditRowDrawerOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [cellClick, setCellClick] = useState({
    rowIndex: null,
    cellIndex: null,
    editable: false,
    errorState: false,
  });
  const [filterEnable, setFilterEnable] = useState(false);
  const selectedCellRef = useRef({
    rowIndex: null,
    columnIndex: null,
    editable: false,
  });

  const [cellVal, setCellVal] = useState('');
  const [editPopover, setEditPopover] = useState(false);
  const [defaultValue, setDefaultValue] = useState(false);
  const [nullValue, setNullValue] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCellUpdateInProgress, setIsCellUpdateInProgress] = useState(false);
  const [isDirectRowExpand, setIsDirectRowExpand] = useState(false);
  const [referencedColumnDetails, setReferencedColumnDetails] = useState([]);

  const [cachedOptions, setCahedOptions] = useState({});

  const fetchFkDataForColumn = (foreignKey, currentIndex) => {
    // responsible to fetch the fk column details for all available fk's and cache them
    return new Promise((resolve, reject) => {
      if (!foreignKey?.referenced_column_names?.length) return resolve();
      const selectQuery = new PostgrestQueryBuilder();
      const filterQuery = new PostgrestQueryBuilder();
      const orderQuery = new PostgrestQueryBuilder();

      filterQuery.is(foreignKey?.referenced_column_names[0], 'notNull');
      orderQuery.order(foreignKey?.referenced_column_names[0], 'nullsfirst');
      selectQuery.select(foreignKey?.referenced_column_names[0]);

      tooljetDatabaseService
        .findOne(
          organizationId,
          foreignKeys?.length > 0 && foreignKey?.referenced_table_id,
          `${selectQuery.url.toString()}&limit=${15}&offset=${0}&${filterQuery.url.toString()}&${orderQuery.url.toString()}`
        )
        .then(({ headers, data = [], error }) => {
          if (error) {
            toast.error(
              error?.message ??
                `Failed to fetch table "${foreignKeys?.length > 0 && foreignKeys[currentIndex].referenced_table_name}"`
            );
            return reject(error);
          }
          const totalFKRecords = headers['content-range'].split('/')[1] || 0;

          if (Array.isArray(data) && data.length > 0) {
            const dataToCache = data.map((item) => {
              const [key, _value] = Object.entries(item);
              return {
                label: key[1] === null ? 'Null' : key[1],
                value: key[1] === null ? 'Null' : key[1],
              };
            });
            resolve({
              key: foreignKey.column_names[0],
              value: {
                data: [...dataToCache],
                totalFKRecords,
              },
            });
          } else {
            resolve();
          }
        });
    });
  };

  const fetchAllFkData = async () => {
    const dataToCache = {};

    const results = await Promise.allSettled(
      foreignKeys.map((foreignKey, currentIndex) => fetchFkDataForColumn(foreignKey, currentIndex))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value && result.value.value) {
        dataToCache[result.value.key] = result.value.value;
      } else if (result.status === 'rejected') {
        const foreignKey = foreignKeys[index];
        console.error(`Error fetching data for column ${foreignKey?.referenced_column_names[0]}:`, result.reason);
      }
    });

    return dataToCache;
  };

  useEffect(() => {
    // This use effect runs whenever fk's are changed the result we get from fetchALlFkData we cache it in state so that we can persist it.
    fetchAllFkData().then((dataToCache) => {
      setCahedOptions(dataToCache);
    });
  }, [foreignKeys]);

  const prevSelectedTableRef = useRef({});
  const tooljetDbTableRef = useRef(null);
  const duration = 300;
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const updateCellNavigationRefToDefault = () => {
    if (selectedCellRef.current.rowIndex !== null && selectedCellRef.current.columnIndex !== null)
      removeCellSelectionClassNames(selectedCellRef.current.rowIndex, selectedCellRef.current.columnIndex);
    selectedCellRef.current = {
      rowIndex: null,
      columnIndex: null,
      editable: false,
    };
  };

  const toggleSelectOrDeSelectAllRows = (totalRowsCount) => {
    if (!totalRowsCount) return;
    setCellClick({
      rowIndex: null,
      cellIndex: null,
      editable: false,
      errorState: false,
    });
    updateCellNavigationRefToDefault();

    const shouldDeselect = Object.keys(selectedRowIds).length > 0 && Object.keys(selectedRowIds).length < rows.length;
    const shouldSelectAll =
      Object.keys(selectedRowIds).length !== totalRowsCount && Object.keys(selectedRowIds).length < totalRowsCount;
    if (!shouldSelectAll || shouldDeselect) {
      setSelectedRowIds({});
      return;
    }

    const newSelectedRowIds = {};
    new Array(totalRowsCount).fill(true).forEach((value, index) => (newSelectedRowIds[index] = value));
    setSelectedRowIds(newSelectedRowIds);
    return;
  };

  const toggleRowSelection = (uniqueRowId) => {
    if (!uniqueRowId) return;
    const selectedRowIdsRef = { ...selectedRowIds };
    selectedRowIdsRef[uniqueRowId] ? delete selectedRowIdsRef[uniqueRowId] : (selectedRowIdsRef[uniqueRowId] = true);
    setCellClick({
      rowIndex: null,
      cellIndex: null,
      editable: false,
      errorState: false,
    });
    updateCellNavigationRefToDefault();
    setSelectedRowIds(selectedRowIdsRef);
    return;
  };

  const replaceToggleSelectedRow = (rowIdSelected) => {
    const newSelectedIdRef = {};
    if (rowIdSelected) newSelectedIdRef[`${rowIdSelected}`] = true;
    setSelectedRowIds(newSelectedIdRef);
    setIsDirectRowExpand(true);
    return;
  };

  const manageScrollWhileNavigation = () => {
    // Table Scroll based on Content overlfow is handled here
    const selectedCellElem = document.querySelector('.tjdb-selected-cell');
    if (selectedCellElem && tooljetDbTableRef.current) {
      const tableBoundingRect = tooljetDbTableRef?.current?.getBoundingClientRect();
      const cellBoundingRect = selectedCellElem.getBoundingClientRect();

      // Scroll when we reach the bottom of the table and when content overflows
      if (cellBoundingRect.bottom > tableBoundingRect.bottom) {
        tooljetDbTableRef.current.scrollTo({
          top: tooljetDbTableRef.current.scrollTop + (cellBoundingRect.bottom - tableBoundingRect.bottom),
          behavior: 'instant',
        });
      }

      // Scroll when we reach the top of the table. Added 32 for considering table header space
      if (cellBoundingRect.top < tableBoundingRect.top + 32) {
        tooljetDbTableRef.current.scrollTo({
          top: tooljetDbTableRef.current.scrollTop + (cellBoundingRect.top - (tableBoundingRect.top + 32)),
          behavior: 'instant',
        });
      }

      // Scroll when we reach right end of the table and if content gets overflow
      if (cellBoundingRect.right > tableBoundingRect.right) {
        tooljetDbTableRef.current.scrollTo({
          left: tooljetDbTableRef.current.scrollLeft + (cellBoundingRect.right - tableBoundingRect.right),
          behavior: 'instant',
        });
      }

      // Scroll when we reach left end of the table and if content gets overflow. Added 296 for width of two sticky columns
      if (cellBoundingRect.left < tableBoundingRect.left + 296) {
        tooljetDbTableRef.current.scrollTo({
          left: tooljetDbTableRef.current.scrollLeft + (cellBoundingRect.left - (tableBoundingRect.left + 296)),
          behavior: 'instant',
        });
      }
    }
  };

  const updateCellNavigationRef = (rowIndex, columnIndex, cellEditable) => {
    if (selectedCellRef.current.rowIndex !== null && selectedCellRef.current.columnIndex !== null) {
      toggleCellSelectionClassNames(
        selectedCellRef.current.rowIndex,
        selectedCellRef.current.columnIndex,
        rowIndex,
        columnIndex
      );
    }

    selectedCellRef.current = {
      rowIndex: rowIndex,
      columnIndex: columnIndex,
      editable: cellEditable,
    };
  };

  const removeCellSelectionClassNames = (prevRowIndex, prevColumnIndex) => {
    const selectedElementTd = document.getElementById(`tjdb-td-row${prevRowIndex}-column${prevColumnIndex}`);
    const selectedElementCell = document.getElementById(`tjdb-cell-row${prevRowIndex}-column${prevColumnIndex}`);

    if (selectedElementCell) selectedElementCell.classList.remove('tjdb-selected-cell');
    if (selectedElementTd) {
      selectedElementTd.classList.remove('table-editable-parent-cell');
      selectedElementTd.classList.add('table-cell');
    }
  };

  const toggleCellSelectionClassNames = (prevRowIndex, prevColumnIndex, currentRowIndex, currentColumnIndex) => {
    const selectedElementTd = document.getElementById(`tjdb-td-row${prevRowIndex}-column${prevColumnIndex}`);
    const selectedElementCell = document.getElementById(`tjdb-cell-row${prevRowIndex}-column${prevColumnIndex}`);
    const elementToBeSelectedTd = document.getElementById(`tjdb-td-row${currentRowIndex}-column${currentColumnIndex}`);
    const elementToBeSelectedCell = document.getElementById(
      `tjdb-cell-row${currentRowIndex}-column${currentColumnIndex}`
    );

    if (selectedElementCell) selectedElementCell.classList.remove('tjdb-selected-cell');
    if (selectedElementTd) {
      selectedElementTd.classList.remove('table-editable-parent-cell');
      selectedElementTd.classList.add('table-cell');
    }

    if (elementToBeSelectedCell) elementToBeSelectedCell.classList.add('tjdb-selected-cell');
    if (elementToBeSelectedTd) {
      elementToBeSelectedTd.classList.add('table-editable-parent-cell');
      elementToBeSelectedTd.classList.remove('table-cell');
    }
  };

  const patchCellNavigationRef = (index, type, cellEditable = null) => {
    // type - row | column
    if (selectedCellRef.current.rowIndex !== null && selectedCellRef.current.columnIndex !== null) {
      // Making cell selection state to default on navigation, to make the state consistent
      if (cellClick.cellIndex !== null && cellClick.rowIndex !== null) {
        setCellClick({
          rowIndex: null,
          cellIndex: null,
          editable: false,
          errorState: false,
        });
      }

      const { rowIndex, columnIndex } = selectedCellRef.current;
      if (type === 'row') {
        toggleCellSelectionClassNames(rowIndex, columnIndex, index, columnIndex);
        selectedCellRef.current = {
          ...selectedCellRef.current,
          rowIndex: index,
          ...(cellEditable !== null ? { editable: cellEditable } : {}),
        };
        manageScrollWhileNavigation();
      }

      if (type === 'column') {
        toggleCellSelectionClassNames(rowIndex, columnIndex, rowIndex, index);
        selectedCellRef.current = {
          ...selectedCellRef.current,
          columnIndex: index,
          ...(cellEditable !== null ? { editable: cellEditable } : {}),
        };
        manageScrollWhileNavigation();
      }
    }
  };

  const fetchTableMetadata = () => {
    if (!isEmpty(selectedTable)) {
      tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
        if (error) {
          toast.error(error?.message ?? `Error fetching metadata for table "${selectedTable.table_name}"`);
          return;
        }

        const { foreign_keys = [], configurations = {} } = data?.result || {};
        setConfigurations(configurations);
        if (data?.result?.columns?.length > 0) {
          setColumns(
            data?.result?.columns.map(({ column_name, data_type, ...rest }) => ({
              Header: column_name,
              accessor: column_name,
              dataType: getColumnDataType({ column_default: rest.column_default, data_type }),
              ...rest,
            }))
          );
        }
        if (foreign_keys.length > 0) {
          setForeignKeys([...foreign_keys]);
        } else {
          setForeignKeys([]);
        }
      });
    } else {
      setColumns([]);
    }
  };

  const onSelectedTableChange = () => {
    resetAll();
    setSortFilters({});
    setQueryFilters({});
    fetchTableMetadata();
    setSelectedRowIds({});
  };

  useEffect(() => {
    if (prevSelectedTableRef.current.id !== selectedTable.id && !isEmpty(selectedTable)) {
      onSelectedTableChange();
    }
    prevSelectedTableRef.current = selectedTable;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  useEffect(() => {
    if (!isEditRowDrawerOpen && isDirectRowExpand) {
      setSelectedRowIds({});
      setIsDirectRowExpand(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditRowDrawerOpen]);

  const [tableColumnTypes, setTableColumnTypes] = React.useState({});

  const tableColumns = React.useMemo(() => {
    if (loading) {
      return columns.map((column) => ({
        ...column,
        Cell: <Skeleton />,
      }));
    } else {
      const primaryKeyArray = [];
      const nonPrimaryKeyArray = [];
      const updatedColumnTypes = {};

      columns.forEach((column) => {
        if (column.constraints_type.is_primary_key) {
          primaryKeyArray.push({ ...column });
        } else {
          nonPrimaryKeyArray.push({ ...column });
        }
        updatedColumnTypes[column.accessor] = column.dataType;
      });
      setTableColumnTypes(updatedColumnTypes);

      return [...primaryKeyArray, ...nonPrimaryKeyArray];
    }
  }, [loading, columns]);

  const tableData = React.useMemo(
    () =>
      loading
        ? Array(10).fill({})
        : selectedTableData.map((data) => {
            return Object.entries(data).reduce((accumulator, [key, value]) => {
              if (tableColumnTypes?.[key] === 'jsonb' && value !== null) {
                accumulator[key] = JSON.stringify(value);
              } else {
                accumulator[key] = value;
              }
              return accumulator;
            }, {});
          }),
    [loading, selectedTableData]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns: tableColumns,
      data: tableData,
      initialState: { selectedRowIds: {} },
    },
    useRowSelect
  );

  const columHeaderLength = useMemo(() => headerGroups[0]?.headers?.length || 0, [headerGroups]);

  const handleOnCloseEditMenu = () => {
    setNullValue(false);
    setDefaultValue(false);
  };

  const resetCellAndRowSelection = () => {
    setSelectedRowIds({});
    setCellClick({
      rowIndex: null,
      cellIndex: null,
      editable: false,
      errorState: false,
    });
    updateCellNavigationRefToDefault();
  };

  // Allowlist keys for entering on text field to enable edit mode
  const allowListForKeys = [
    ...Array(26)
      .fill()
      .map((_, i) => 65 + i),
    ...Array(26)
      .fill()
      .map((_, i) => 97 + i),
    ...Array(10)
      .fill()
      .map((_, i) => 48 + i),
    32,
    186,
    188,
    189,
    190,
    191,
    192,
    219,
    220,
    221,
    22,
  ];

  const handleKeyDown = (e) => {
    // Disables Cell navigation while error and update-inprogress
    if (cellClick.errorState || isCellUpdateInProgress) e.preventDefault();
    // Logic to edit value in a cell and simultaneously trigger edit menu
    if (
      selectedCellRef.current.rowIndex !== null &&
      !editPopover &&
      !cellClick.errorState &&
      !isCellUpdateInProgress &&
      allowListForKeys.includes(e.keyCode) &&
      shouldOpenCellEditMenu(selectedCellRef.current.columnIndex)
    ) {
      e.preventDefault();
      const cellValue = rows[selectedCellRef.current.rowIndex].cells[selectedCellRef.current.columnIndex].value;
      const cellDataType =
        rows[selectedCellRef.current.rowIndex].cells[selectedCellRef.current.columnIndex]?.column?.dataType;

      setReferencedColumnDetails([]);
      setCellClick((prevValue) => ({
        ...prevValue,
        rowIndex: selectedCellRef.current.rowIndex,
        cellIndex: selectedCellRef.current.columnIndex,
        editable: true,
      }));

      if (cellDataType !== 'boolean') {
        setSelectedRowIds({});
        if (cellValue === null) {
          setNullValue(false);
          setEditPopover(true);
          setCellVal(e.key);
          document.getElementById('edit-input-blur')?.focus();
        } else {
          cellValue === null ? setNullValue(true) : setNullValue(false);
          setCellVal(cellValue + e.key);
          setEditPopover(true);
          document.getElementById('edit-input-blur')?.focus();
        }
      }
    }

    // Logic for Cell Navigation - Enter ( Opens edit menu ), Backspace (removes Null value ) & ESC event ( close edit menu )
    if (selectedCellRef.current.rowIndex !== null && !cellClick.errorState && !isCellUpdateInProgress) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (Object.keys(selectedRowIds).length > 0) setSelectedRowIds({});
        if (editPopover) setEditPopover(false);

        const newIndex =
          selectedCellRef.current.columnIndex === columHeaderLength - 1
            ? columHeaderLength - 1
            : selectedCellRef.current.columnIndex + 1;
        patchCellNavigationRef(newIndex, 'column', true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (Object.keys(selectedRowIds).length > 0) setSelectedRowIds({});
        if (editPopover) setEditPopover(false);

        const newIndex = selectedCellRef.current.columnIndex === 0 ? 0 : selectedCellRef.current.columnIndex - 1;
        patchCellNavigationRef(newIndex, 'column', true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (Object.keys(selectedRowIds).length > 0) setSelectedRowIds({});
        if (editPopover) setEditPopover(false);

        const newRowIndex = selectedCellRef.current.rowIndex === 0 ? 0 : selectedCellRef.current.rowIndex - 1;
        patchCellNavigationRef(newRowIndex, 'row', true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (Object.keys(selectedRowIds).length > 0) setSelectedRowIds({});
        if (editPopover) setEditPopover(false);

        const newRowIndex =
          selectedCellRef.current.rowIndex === rows.length - 1 ? rows.length - 1 : selectedCellRef.current.rowIndex + 1;
        patchCellNavigationRef(newRowIndex, 'row', true);
      } else if (e.key === 'Enter' && shouldOpenCellEditMenu(selectedCellRef.current.columnIndex)) {
        setSelectedRowIds({});
        const cellValue = rows[selectedCellRef.current.rowIndex].cells[selectedCellRef.current.columnIndex]?.value;
        const isCellValueDefault =
          headerGroups[0].headers[selectedCellRef.current.columnIndex]?.column_default === cellValue?.toString()
            ? true
            : false;
        setCellVal(cellValue);
        setCellClick((prevValue) => ({
          ...prevValue,
          rowIndex: selectedCellRef.current.rowIndex,
          cellIndex: selectedCellRef.current.columnIndex,
          editable: true,
        }));
        cellValue === null ? setNullValue(true) : setNullValue(false);
        setDefaultValue(isCellValueDefault);
        setEditPopover(true);
        document?.getElementById('edit-input-blur').focus();
      } else if (e.key === 'Backspace' && !editPopover && shouldOpenCellEditMenu(selectedCellRef.current.columnIndex)) {
        const cellValue = rows[selectedCellRef.current.rowIndex].cells[selectedCellRef.current.columnIndex]?.value;
        const cellDataType =
          rows[selectedCellRef.current.rowIndex].cells[selectedCellRef.current.columnIndex]?.column?.dataType;
        if (cellValue === null) {
          const isCellValueDefault =
            headerGroups[0].headers[selectedCellRef.current.columnIndex]?.column_default === cellValue?.toString()
              ? true
              : false;
          setSelectedRowIds({});
          setCellClick((prevValue) => ({
            ...prevValue,
            rowIndex: selectedCellRef.current.rowIndex,
            cellIndex: selectedCellRef.current.columnIndex,
            editable: true,
          }));
          cellDataType === 'boolean' ? setCellVal(true) : setCellVal('');
          setNullValue(false);
          setDefaultValue(isCellValueDefault);
          setEditPopover(true);
          document.getElementById('edit-input-blur').focus();
        }
      }
    }
    e.stopPropagation();
  };

  useEffect(() => {
    const selectedDatatype = headerGroups[0]?.headers?.[selectedCellRef.current.columnIndex]?.dataType;
    if (!editPopover && selectedDatatype !== 'timestamp with time zone') {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cellClick,
    selectedCellRef.current.rowIndex,
    selectedCellRef.current.columnIndex,
    editPopover,
    isCellUpdateInProgress,
  ]);

  useEffect(() => {
    setSelectedRowIds({});
  }, []);

  const handleCellOutsideClick = (event) => {
    if (
      !event.target.closest('.table-cell-click') &&
      !event.target.closest('.table-editable-parent-cell') &&
      !event.target.closest('.popover-body') &&
      !event.target.closest('.cell-text') &&
      !event.target.closest('.tjdb-td-wrapper')
    ) {
      setCellClick((prevState) => ({
        ...prevState,
        rowIndex: null,
        cellIndex: null,
        editable: false,
        errorState: false,
      }));
      updateCellNavigationRefToDefault();
      handleOnCloseEditMenu();
      setReferencedColumnDetails([]);
    }
    event.stopPropagation();
  };

  useEffect(() => {
    document.addEventListener('click', handleCellOutsideClick);
    return () => {
      document.removeEventListener('click', handleCellOutsideClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteRow = async () => {
    const shouldDelete = confirm('Are you sure you want to delete the selected rows?');
    if (shouldDelete) {
      const selectedRows = Object.keys(selectedRowIds).map((key) => rows[key]);
      const primaryKey = columns.find((column) => column?.constraints_type?.is_primary_key);
      if (primaryKey) {
        const deletionKeys = selectedRows.map((row) => {
          return row.values[primaryKey?.accessor];
        });

        let query = `?${primaryKey?.accessor}=in.(${deletionKeys.toString()})`;

        const { error } = await tooljetDatabaseService.deleteRows(organizationId, selectedTable.id, query);

        if (error) {
          toast.error(error?.message ?? `Error deleting rows from table "${selectedTable.table_name}"`);
          return;
        }

        toast.success(`Deleted ${selectedRows.length} rows from table "${selectedTable.table_name}"`);
        handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
        setSelectedRowIds({});
      } else {
        toast.error('Something went wrong - Record Id is incorrect');
      }
    }
  };

  const handleDeleteColumn = async () => {
    const columnName = editColumnHeader?.columnHeaderValue;
    setEditColumnHeader((prevState) => ({
      ...prevState,
      deletePopupModal: false,
    }));
    const { error } = await tooljetDatabaseService.deleteColumn(organizationId, selectedTable.table_name, columnName);
    if (error) {
      toast.error(error?.message ?? `Error deleting column "${columnName}" from table "${selectedTable}"`);
      return;
    }
    await fetchTableMetadata();
    toast.success(`Deleted ${columnName} from table "${selectedTable.table_name}"`);
  };

  const handleProgressAnimation = (message, status) => {
    setIsCellUpdateInProgress(true);
    const startTime = Date.now();
    const updateProgress = () => {
      const runningTime = Date.now() - startTime;
      const progressPercentage = Math.min(1, runningTime / duration);
      setProgress(progressPercentage * 100);

      if (progressPercentage < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setProgress(0);
          if (status === true) {
            toast.success(message);
          } else {
            toast.error(message, { duration: 3000 });
          }
          setIsCellUpdateInProgress(false);
        }, 100);
      }
    };
    requestAnimationFrame(updateProgress);
  };

  // Invoked when the boolean toggle is clicked and the save button in the Cell edit menu is clicked.
  const handleToggleCellEdit = async (cellValue, rowId, index, rIndex, directToggle, oldValue) => {
    const primaryKeyColumns = listAllPrimaryKeyColumns(columns);
    const filterQuery = new PostgrestQueryBuilder();
    const sortQuery = new PostgrestQueryBuilder();
    console.log(cellValue, 'cellValue Before');

    primaryKeyColumns.forEach((primaryKeyColumnName) => {
      if (rows[rIndex]?.values[primaryKeyColumnName]) {
        filterQuery.filter(primaryKeyColumnName, 'eq', rows[rIndex]?.values[primaryKeyColumnName]);
        sortQuery.order(primaryKeyColumnName, 'desc');
      }
    });

    setIsCellUpdateInProgress(true);
    const cellKey = headerGroups[0].headers[index].id;
    const dataType = headerGroups[0].headers[index].dataType;
    const query = `${filterQuery.url.toString()}&${sortQuery.url.toString()}`;
    const cellData = directToggle === true ? { [cellKey]: !cellValue } : { [cellKey]: cellValue };
    const { error } = await tooljetDatabaseService.updateRows(organizationId, selectedTable.id, cellData, query);

    if (error) {
      handleProgressAnimation(
        error?.message ?? `Failed to create a new column table "${selectedTable.table_name}"`,
        false
      );
      setEditPopover(false);
      handleOnCloseEditMenu();
      setTimeout(() => {
        setCellClick((prev) => ({
          ...prev,
          editable: true,
          errorState: true,
        }));
        setCellVal(cellValue);
      }, 400);

      setTimeout(() => {
        setCellClick((prev) => ({
          ...prev,
          editable: true,
          errorState: false,
        }));
        setCellVal(oldValue);
        oldValue === null ? setNullValue(true) : setNullValue(false);
        document.getElementById('edit-input-blur').blur();
      }, 3000);
      return;
    }

    // Optimised by avoiding Refetch API call on Cell-Edit Save and state is updated
    const selectedTableDataCopy = [...selectedTableData];
    if (selectedTableDataCopy[rIndex][cellKey] !== undefined) {
      selectedTableDataCopy[rIndex][cellKey] = directToggle === true ? !cellValue : cellValue;
      setSelectedTableData([...selectedTableDataCopy]);
    }

    // handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
    setEditPopover(false);
    handleOnCloseEditMenu();
    setCellClick((prev) => ({
      ...prev,
      rowIndex: rIndex,
      cellIndex: index,
      errorState: false,
    }));
    cellValue === null ? setNullValue(true) : setNullValue(false);
    handleProgressAnimation('Column edited successfully', true);
    if (dataType === 'timestamp with time zone') return;
    document.getElementById('edit-input-blur').blur();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editColumnHeader.columnEditPopover && event.target.closest('.popover') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editColumnHeader.columnEditPopover]);

  const handleDelete = (column) => {
    setEditColumnHeader((prevState) => ({
      ...prevState,
      deletePopupModal: true,
      columnHeaderValue: column,
    }));
    closeMenu();
  };

  if (!selectedTable) return null;

  const handleMouseOver = (index) => {
    if (selectedCellRef.current.rowIndex !== null && selectedCellRef.current.columnIndex !== null) {
      const cellValue = rows[selectedCellRef.current.rowIndex].cells[selectedCellRef.current.columnIndex]?.value;
      setCellVal(cellValue);
      setCellClick((prevState) => ({
        ...prevState,
        rowIndex: selectedCellRef.current.rowIndex,
        cellIndex: selectedCellRef.current.columnIndex,
      }));
      cellValue === null ? setNullValue(true) : setNullValue(false);
    }

    setEditColumnHeader((prevState) => ({
      ...prevState,
      hoveredColumn: index,
    }));
  };

  const onMenuClick = (index, _e) => {
    setEditColumnHeader((prevState) => ({
      ...prevState,
      clickedColumn: index,
      columnEditPopover: !editColumnHeader.columnEditPopover,
    }));
  };

  const handleMouseOut = () => {
    setEditColumnHeader((prevState) => ({
      ...prevState,
      hoveredColumn: null,
    }));
  };

  const closeMenu = () => {
    setEditColumnHeader((prevState) => ({
      ...prevState,
      columnEditPopover: false,
      hoveredColumn: null,
    }));
  };

  const handleCellClick = (e, cellIndex, rowIndex, cellVal) => {
    if (
      [
        'table-editable-parent-cell',
        'tjdb-td-wrapper',
        'table-cell',
        'cell-text',
        'css-18kmycr-Input',
        ' css-18kmycr-Input',
        'foreignkey-cell',
      ].includes(e.target.classList.value)
    ) {
      const isCellValueDefault =
        headerGroups[0].headers[cellIndex]?.column_default === cellVal?.toString() ? true : false;
      updateCellNavigationRef(rowIndex, cellIndex, true);
      setSelectedRowIds({});
      setCellVal(cellVal);
      setCellClick((prevState) => ({
        ...prevState,
        rowIndex: rowIndex,
        cellIndex: cellIndex,
        editable: true,
        errorState: false,
      }));
      cellVal === null ? setNullValue(true) : setNullValue(false);
      setDefaultValue(isCellValueDefault);
      setEditPopover(false);
      setReferencedColumnDetails([]);
    }
  };

  const closeEditPopover = (previousValue, _cellIndex) => {
    setEditPopover(false);
    previousValue === null ? setNullValue(true) : setNullValue(false);
    setCellVal(previousValue);
    document.getElementById('edit-input-blur')?.blur();
  };

  function shouldOpenCellEditMenu(cellColumnIndex) {
    // Should not be Primary Key & Serial Data-type
    if (headerGroups.length && headerGroups[0].headers.length) {
      const tableHeaderList = headerGroups[0].headers;
      const { constraints_type = {}, dataType = '' } = tableHeaderList[cellColumnIndex];
      if (constraints_type.is_primary_key) return false;
      if (dataType === 'serial') return false;
      return true;
    } else {
      return false;
    }
  }

  const getTooltipTextForCell = (cellValue, cellColumnIndex) => {
    if (headerGroups.length && headerGroups[0].headers.length) {
      const tableHeaderList = headerGroups[0].headers;
      const { constraints_type = {}, dataType = '' } = tableHeaderList[cellColumnIndex];
      if (constraints_type.is_primary_key) return 'Cannot edit primary key values';
      if (dataType === 'serial') return 'Serial type values cannot be modified';
      return cellValue || '';
    } else {
      return cellValue || '';
    }
  };

  function isMatchingForeignKeyColumn(columnName) {
    return foreignKeys.some((foreignKey) => foreignKey.column_names[0] === columnName);
  }

  function isMatchingForeignKeyColumnDetails(columnHeader) {
    const matchingColumn = foreignKeys.find((foreignKey) => foreignKey.column_names[0] === columnHeader);
    return matchingColumn;
  }

  function tableHeaderContent(column, index) {
    const { constraints_type = {}, dataType = '' } = column;
    const { is_primary_key } = constraints_type;
    const primaryKeyCount = headerGroups[0]?.headers.filter(
      (obj) => obj.constraints_type.is_primary_key === true
    ).length;

    return is_primary_key ? (
      <ToolTip show message="Column cannot be edited or deleted" placement="bottom" delay={{ show: 0, hide: 100 }}>
        <div
          className={cx({
            'header-primaryKey-container':
              editColumnHeader?.hoveredColumn === index ||
              (editColumnHeader.columnEditPopover && editColumnHeader.clickedColumn === index),
            primaryKeyTooltip: true,
          })}
        >
          <div className="table-header-container">
            <span className="tj-text-xsm tj-db-dataype text-lowercase">
              {renderDatatypeIcon(dataType === 'serial' ? 'serial' : column?.dataType)}
            </span>
            <span>{column.render('Header')}</span>
          </div>
          <div className="d-flex align-items-center">
            <ToolTip
              message={primaryKeyCount === 1 ? 'Primary key' : 'Composite primary key'}
              placement="top"
              tooltipClassName="tjdb-table-tooltip"
              show={true}
            >
              <div>
                <span
                  style={{
                    marginRight: isMatchingForeignKeyColumn(column.Header) ? '3px' : '',
                  }}
                >
                  <SolidIcon name="primarykey" />
                </span>
              </div>
            </ToolTip>

            <ToolTip
              message={
                isMatchingForeignKeyColumn(column.Header) ? (
                  <div className="foreignKey-relation-tooltip">
                    <span>Foreign key relation</span>
                    <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                      <span>{isMatchingForeignKeyColumnDetails(column.Header)?.column_names[0]}</span>
                      <ArrowRight />
                      <span>{`${isMatchingForeignKeyColumnDetails(column.Header)?.referenced_table_name}.${
                        isMatchingForeignKeyColumnDetails(column.Header)?.referenced_column_names[0]
                      }`}</span>
                    </div>
                  </div>
                ) : null
              }
              placement="top"
              tooltipClassName="tjdb-table-tooltip"
              show={true}
            >
              <div>
                {isMatchingForeignKeyColumn(column.Header) && (
                  <span
                    style={{
                      marginRight: isMatchingForeignKeyColumn(column.Header) ? '3px' : '',
                    }}
                  >
                    <ForeignKeyIndicator />
                  </span>
                )}
              </div>
            </ToolTip>
          </div>
        </div>
      </ToolTip>
    ) : (
      <div className="primaryKeyTooltip">
        <div className="table-header-container">
          <span className="tj-text-xsm tj-db-dataype text-lowercase">
            {renderDatatypeIcon(dataType === 'serial' ? 'serial' : column?.dataType)}
          </span>
          <span style={{ width: '100px' }}>{column.render('Header')} </span>
        </div>

        <ToolTip
          message={
            isMatchingForeignKeyColumn(column.Header) ? (
              <div className="foreignKey-relation-tooltip">
                <span>Foreign key relation</span>
                <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                  <span>{isMatchingForeignKeyColumnDetails(column.Header)?.column_names[0]}</span>
                  <ArrowRight />
                  <span>{`${isMatchingForeignKeyColumnDetails(column.Header)?.referenced_table_name}.${
                    isMatchingForeignKeyColumnDetails(column.Header)?.referenced_column_names[0]
                  }`}</span>
                </div>
              </div>
            ) : dataType === 'timestamp with time zone' ? (
              <span>Display time</span>
            ) : null
          }
          placement="top"
          tooltipClassName="tjdb-table-tooltip"
          show={true}
        >
          <div>
            {isMatchingForeignKeyColumn(column.Header) ? (
              <span
                style={{
                  marginRight: isMatchingForeignKeyColumn(column.Header) ? '3px' : '',
                }}
              >
                <ForeignKeyIndicator />
              </span>
            ) : dataType === 'timestamp with time zone' ? (
              <span className="tjdb-display-time-pill">{`UTC ${getUTCOffset(
                getConfigurationProperty(column.Header, 'timezone', getLocalTimeZone())
              )}`}</span>
            ) : null}
          </div>
        </ToolTip>
      </div>
    );
  }

  const toggleAddNewDataMenu = (isShow) => {
    setIsAddNewDataMenuOpen(isShow);
  };

  const handleOnClickCreateNewRow = () => {
    resetCellAndRowSelection();
    setIsCreateRowDrawerOpen(true);
  };

  const handleOnClickBulkUpdateData = (isOpenBulkUploadDrawer) => {
    setIsBulkUploadDrawerOpen(isOpenBulkUploadDrawer);
  };

  const emptyHeader = Array.from({ length: 5 }, (_, index) => index + 1);
  const emptyTableData = Array.from({ length: 10 }, (_, index) => index + 1);
  const emptyData = filterEnable
    ? 'No data found matching the criteria specified in current filters.'
    : 'Use Add Row from the menu or directly click on + icon to add a row. You may use the bulk upload option to add multiple rows of data using a csv file.';
  const emptyMainData = filterEnable ? 'No results found' : 'No data added yet';

  const footerStyle = {
    borderTop: '1px solid var(--slate5)',
    paddingTop: '12px',
    marginTop: '0px',
  };

  return (
    <div>
      <TjdbTableHeader
        isCreateColumnDrawerOpen={isCreateColumnDrawerOpen}
        setIsCreateColumnDrawerOpen={setIsCreateColumnDrawerOpen}
        isCreateRowDrawerOpen={isCreateRowDrawerOpen}
        setIsCreateRowDrawerOpen={setIsCreateRowDrawerOpen}
        setIsBulkUploadDrawerOpen={setIsBulkUploadDrawerOpen}
        isBulkUploadDrawerOpen={isBulkUploadDrawerOpen}
        selectedRowIds={selectedRowIds}
        handleDeleteRow={handleDeleteRow}
        rows={rows}
        isEditRowDrawerOpen={isEditRowDrawerOpen}
        setIsEditRowDrawerOpen={setIsEditRowDrawerOpen}
        setFilterEnable={setFilterEnable}
        filterEnable={filterEnable}
        isDirectRowExpand={isDirectRowExpand}
        setIsDirectRowExpand={setIsDirectRowExpand}
        referencedColumnDetails={referencedColumnDetails}
        setReferencedColumnDetails={setReferencedColumnDetails}
        // getForeignKeyDetails={getForeignKeyDetails}
      />
      <div
        style={{
          height: 'calc(100vh - 164px)', // 48px navbar + 96 for table bar +  52 px in footer
        }}
        className={cx(
          `table-responsive border-0 tj-db-table animation-fade ${rows.length === 0 ? 'tj-table-empty' : 'tj-table'}`
        )}
        ref={tooljetDbTableRef}
      >
        <div
          className={cx(`tjdb-th-bg`, {
            'tjdb-th-bg-dark': darkMode,
          })}
        />
        {loadingState ? (
          <table
            className={`table card-table loading-table table-vcenter text-nowrap datatable ${
              darkMode && 'dark-background'
            }`}
            style={{ position: 'relative', top: '-32px' }}
          >
            <thead>
              <tr>
                {emptyHeader.map((element, index) => (
                  <th key={index} width={index === 0 ? 66 : 230}>
                    <div className="d-flex align-items-center justify-content-between tjdb-loader-parent">
                      {index > 0 && <Skeleton count={1} height={20} className="tjdb-loader" />}

                      <div className="tjdb-loader-icon-parent">
                        <Skeleton count={1} height={20} className="tjdb-icon-loader" />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emptyTableData.map((element, rowIdex) => (
                <tr
                  className={cx(`tjdb-table-row row-tj tjdb-empty-row`, {
                    'dark-bg': darkMode,
                  })}
                  key={rowIdex} // row Index
                >
                  {emptyHeader.map((elem, i) => (
                    <td key={i} className={cx('table-cell')}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table
            {...getTableProps()}
            className={`table card-table table-vcenter text-nowrap datatable ${darkMode && 'dark-background'}`}
            style={{ position: 'relative', top: '-32px' }}
          >
            <thead>
              {headerGroups.map((headerGroup, index) => (
                <tr className="tj-database-column-row" {...headerGroup.getHeaderGroupProps()} key={index}>
                  <th
                    className={`${
                      darkMode ? 'table-header-dark' : 'table-header'
                    } tj-database-column-header tj-text-xsm`}
                    style={{ width: '66px', height: index === 0 ? '32px' : '' }}
                  >
                    <div>
                      <IndeterminateCheckbox
                        indeterminate={
                          isDirectRowExpand
                            ? false
                            : Object.keys(selectedRowIds).length > 0 && Object.keys(selectedRowIds).length < rows.length
                        }
                        checked={
                          isDirectRowExpand ? false : Object.keys(selectedRowIds).length === rows.length && rows.length
                        }
                        onChange={() => toggleSelectOrDeSelectAllRows(rows.length)}
                        style={{
                          backgroundColor: `${
                            (!isDirectRowExpand &&
                              Object.keys(selectedRowIds).length > 0 &&
                              Object.keys(selectedRowIds).length < rows.length) ||
                            (!isDirectRowExpand && Object.keys(selectedRowIds).length === rows.length && rows.length)
                              ? '#3E63DD'
                              : 'var(--base)'
                          }`,
                        }}
                      />
                    </div>
                  </th>
                  {headerGroup.headers.map((column, index) => (
                    <th
                      key={column.Header}
                      width={230}
                      style={{ height: index === 0 ? '32px' : '' }}
                      title={column?.constraints_type?.is_primary_key ?? false ? '' : column?.Header}
                      className={
                        darkMode
                          ? 'table-header-dark tj-database-column-header tj-text-xsm'
                          : !darkMode
                          ? 'table-header tj-database-column-header tj-text-xsm'
                          : editColumnHeader?.clickedColumn === index && editColumnHeader?.columnEditPopover === true
                          ? 'table-header-click tj-database-column-header tj-text-xsm'
                          : 'table-header tj-database-column-header tj-text-xsm'
                      }
                      data-cy={`${String(column.Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-header`}
                      {...column.getHeaderProps()}
                      onMouseOver={() => handleMouseOver(index)}
                      onMouseOut={() => handleMouseOut()}
                    >
                      <div className="d-flex align-items-center justify-content-between" style={{ gap: '4px' }}>
                        {tableHeaderContent(column, index)}

                        <TablePopover
                          onEdit={() => {
                            setSelectedColumn(column);
                            setIsEditColumnDrawerOpen(true);
                            closeMenu();
                          }}
                          onDelete={() => handleDelete(column.Header)}
                          // disabled={column.isPrimaryKey}
                          show={editColumnHeader.columnEditPopover && editColumnHeader.clickedColumn === index}
                          className="column-popover-parent"
                          darkMode={darkMode}
                          showDeleteColumnOption={!column?.constraints_type?.is_primary_key}
                        >
                          <div className="tjdb-menu-icon-parent" data-cy="column-menu-icon">
                            <Menu
                              width="20"
                              height="20"
                              className="tjdb-menu-icon"
                              onClick={(e) => onMenuClick(index, e)}
                            />
                          </div>
                        </TablePopover>
                      </div>
                    </th>
                  ))}
                  <th
                    onClick={() => {
                      resetCellAndRowSelection();
                      setIsCreateColumnDrawerOpen(true);
                    }}
                    className={darkMode ? 'add-icon-column-dark' : 'add-icon-column'}
                  >
                    <div className="icon-styles d-flex align-items-center justify-content-center">+</div>
                  </th>
                </tr>
              ))}
            </thead>
            <tbody
              className={cx({
                'bg-white': rows.length > 0 && !darkMode,
                'fs-12': true,
              })}
              {...getTableBodyProps()}
            >
              {rows.map((row, rIndex) => {
                prepareRow(row);
                return (
                  <>
                    <tr
                      className={cx(`tjdb-table-row row-tj`, {
                        'dark-bg': darkMode,
                        'table-row-selected': selectedRowIds[row.id] ?? false,
                      })}
                      {...row.getRowProps()}
                      key={rIndex} // row Index
                    >
                      <td
                        className={cx('table-cell', {
                          'table-cell-selected': selectedRowIds[row.id] ?? false,
                        })}
                      >
                        <div
                          className="d-flex align-items-center"
                          style={{
                            cursor: 'pointer',
                          }}
                        >
                          <IndeterminateCheckbox
                            checked={!isDirectRowExpand ? selectedRowIds[row.id] ?? false : false}
                            onChange={() => toggleRowSelection(row.id)}
                          />

                          <div
                            onClick={() => {
                              replaceToggleSelectedRow(row.id);
                              setTimeout(() => setIsEditRowDrawerOpen(true), 100);
                              // getForeignKeyDetails(0);
                            }}
                            className="tjdb-checkbox-cell"
                            data-cy="edit-cell-expand"
                            style={{
                              display: 'none',
                            }}
                          >
                            <SolidIcon name="expand" width={16} viewBox="0 0 16 16" />
                          </div>
                        </div>
                      </td>
                      {row.cells.map((cell, index) => {
                        const dataCy =
                          cell.column.id === 'selection'
                            ? `${cell.row.values?.id}-checkbox`
                            : `id-${cell.row.values?.id}-column-${cell.column.id}`;

                        return (
                          <td
                            {...cell.getCellProps()}
                            key={`cell.value-${index}`}
                            className={cx(
                              `${
                                editColumnHeader?.clickedColumn === index &&
                                editColumnHeader?.columnEditPopover === true &&
                                !darkMode
                                  ? `table-columnHeader-click`
                                  : editColumnHeader?.clickedColumn === index &&
                                    editColumnHeader?.columnEditPopover === true &&
                                    darkMode
                                  ? `table-columnHeader-click-dark`
                                  : editColumnHeader?.hoveredColumn === index && !darkMode
                                  ? 'table-cell-hover-background'
                                  : editColumnHeader?.hoveredColumn === index && darkMode
                                  ? 'table-cell-hover-background-dark'
                                  : cellClick.rowIndex === rIndex &&
                                    cellClick.cellIndex === index &&
                                    cellClick.editable === true
                                  ? 'table-editable-parent-cell'
                                  : darkMode
                                  ? `table-cell table-cell-dark`
                                  : `table-cell`
                              }`,
                              {
                                'table-cell-selected': selectedRowIds[row.id] ?? false,
                              }
                            )}
                            data-cy={`${dataCy.toLocaleLowerCase().replace(/\s+/g, '-')}-table-cell`}
                            id={`tjdb-td-row${rIndex}-column${index}`}
                            {...cell.getCellProps()}
                            onClick={(e) => handleCellClick(e, index, rIndex, cell.value)}
                          >
                            <ToolTip
                              message={getTooltipTextForCell(
                                cell.column.dataType == 'timestamp with time zone'
                                  ? convertDateToTimeZoneFormatted(
                                      cell.value,
                                      getConfigurationProperty(cell.column.Header, 'timezone', getLocalTimeZone())
                                    )
                                  : cell.column.dataType === 'jsonb' &&
                                    typeof cell?.value !== 'string' &&
                                    cell?.value !== null
                                  ? JSON.stringify(cell?.value)
                                  : cell?.value,
                                index
                              )}
                              placement="bottom"
                              delay={{ show: 200, hide: 0 }}
                              show={
                                !(
                                  selectedCellRef.current.rowIndex === rIndex &&
                                  selectedCellRef.current.columnIndex === index &&
                                  cellClick.editable
                                ) &&
                                cell.value !== null &&
                                cell.column.dataType !== 'boolean' &&
                                cell.value !== ''
                              }
                              tooltipClassName="tooltip-table-dashboard"
                            >
                              <div
                                className={`${
                                  cellClick.rowIndex === rIndex &&
                                  cellClick.cellIndex === index &&
                                  cellClick.errorState === true
                                    ? 'tjdb-cell-error'
                                    : cellClick.rowIndex === rIndex &&
                                      cellClick.cellIndex === index &&
                                      cellClick.editable === true &&
                                      !isCellUpdateInProgress
                                    ? 'tjdb-selected-cell'
                                    : 'tjdb-column-select-border'
                                }`}
                                id={`tjdb-cell-row${rIndex}-column${index}`}
                              >
                                <div className={cx('tjdb-td-wrapper')}>
                                  {cellClick.editable &&
                                  cellClick.rowIndex === rIndex &&
                                  cellClick.cellIndex === index ? (
                                    <CellEditMenu
                                      show={shouldOpenCellEditMenu(index) ? editPopover : false}
                                      close={() => {
                                        closeEditPopover(cell.value, index);
                                      }}
                                      columnDetails={headerGroups[0].headers[index]}
                                      saveFunction={(newValue) => {
                                        handleToggleCellEdit(newValue, row.values.id, index, rIndex, false, cell.value);
                                        // if (cell.column?.dataType === 'jsonb') {
                                        //   const event = new Event('click', { bubbles: true, cancelable: true });
                                        //   document.body.dispatchEvent(event);
                                        // }
                                      }}
                                      setCellValue={setCellVal}
                                      cellValue={cellVal}
                                      previousCellValue={cell.value}
                                      setDefaultValue={setDefaultValue}
                                      defaultValue={defaultValue}
                                      setNullValue={setNullValue}
                                      nullValue={nullValue}
                                      isBoolean={cell.column?.dataType === 'boolean' ? true : false}
                                      isTimestamp={cell.column?.dataType === 'timestamp with time zone' ? true : false}
                                      referencedColumnDetails={referencedColumnDetails}
                                      referenceColumnName={
                                        foreignKeys.length > 0 &&
                                        isMatchingForeignKeyColumnDetails(cell.column.Header)
                                          ?.referenced_column_names[0]
                                      }
                                      isForeignKey={isMatchingForeignKeyColumn(cell.column.Header)}
                                      darkMode={darkMode}
                                      scrollEventForColumnValues={true}
                                      organizationId={organizationId}
                                      foreignKeys={foreignKeys}
                                      setReferencedColumnDetails={setReferencedColumnDetails}
                                      cellHeader={cell.column.Header}
                                      cachedOptions={cachedOptions?.[cell.column.Header]}
                                      dataType={cell.column.dataType}
                                    >
                                      <div
                                        className="input-cell-parent"
                                        onClick={() => {
                                          if (shouldOpenCellEditMenu(index)) setEditPopover(true);
                                          if (cellVal === null) {
                                            setCellVal('');
                                            setNullValue(false);
                                            setTimeout(() => {
                                              document.getElementById('edit-input-blur').focus();
                                            }, 0);
                                          }
                                        }}
                                      >
                                        {cellVal === null ? (
                                          <span className="cell-text-null-input">Null</span>
                                        ) : cell.column?.dataType === 'boolean' ? (
                                          <div className="d-flex align-items-center justify-content-between">
                                            <div
                                              className="row"
                                              style={{ marginLeft: '0px' }}
                                              onClick={() => {
                                                if (shouldOpenCellEditMenu(index)) setEditPopover(true);
                                              }}
                                            >
                                              <div className="col-1 p-0">
                                                <label className={`form-switch`}>
                                                  <input
                                                    autoComplete="off"
                                                    id="edit-input-blur"
                                                    className="form-check-input fs-12"
                                                    type="checkbox"
                                                    checked={editPopover ? cellVal : cell.value}
                                                    onChange={() => {
                                                      if (!editPopover && shouldOpenCellEditMenu(index))
                                                        handleToggleCellEdit(
                                                          cell.value,
                                                          row.values.id,
                                                          index,
                                                          rIndex,
                                                          true,
                                                          cell.value
                                                        );
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setCellClick((prev) => ({
                                                        ...prev,
                                                        editable: false,
                                                      }));
                                                    }}
                                                  />
                                                </label>
                                              </div>
                                            </div>
                                            {/* <ToolTip
                                              message={'Open referenced table'}
                                              placement="top"
                                              tooltipClassName="tjdb-table-tooltip"
                                            >
                                              <div className="cursor-pointer">
                                                {isMatchingForeignKeyColumn(cell.column.Header) && <Maximize />}
                                              </div>
                                            </ToolTip> */}
                                          </div>
                                        ) : (
                                          //  : cell.column?.dataType === 'jsonb' ? (
                                          //   <CodehinterWrapper
                                          //     cellVal={cellVal}
                                          //     shouldOpenCellEditMenu={shouldOpenCellEditMenu}
                                          //     setCellVal={setCellVal}
                                          //     headerGroups={headerGroups}
                                          //     index={index}
                                          //     setDefaultValue={setDefaultValue}
                                          //   />
                                          // )
                                          <div className="d-flex align-items-center justify-content-between">
                                            <input
                                              autoComplete="off"
                                              className="form-control fs-12 text-truncate"
                                              id="edit-input-blur"
                                              value={cellVal === null ? '' : cellVal}
                                              onChange={(e) => {
                                                if (shouldOpenCellEditMenu(index)) setCellVal(e.target.value);
                                                if (e.target.value !== headerGroups[0].headers[index].column_default) {
                                                  setDefaultValue(false);
                                                } else {
                                                  setDefaultValue(true);
                                                }
                                              }}
                                              onFocus={() => {
                                                if (shouldOpenCellEditMenu(index)) setEditPopover(true);
                                              }}
                                              disabled={
                                                nullValue === true || !shouldOpenCellEditMenu(index) ? true : false
                                              }
                                            />
                                            {/* <ToolTip
                                              message={'Open referenced table'}
                                              placement="top"
                                              tooltipClassName="tjdb-table-tooltip"
                                            >
                                              <div className="cursor-pointer">
                                                {foreignKeys[0]?.column_names?.length > 0 &&
                                                  foreignKeys[0]?.column_names[0] === cell?.column?.Header && (
                                                    <Maximize />
                                                  )}
                                              </div>
                                            </ToolTip> */}
                                          </div>
                                        )}
                                      </div>
                                    </CellEditMenu>
                                  ) : (
                                    <>
                                      {cell.value === null ? (
                                        <span className="cell-text-null">Null</span>
                                      ) : cell.column.dataType === 'jsonb' ? (
                                        `{...}`
                                      ) : cell.column.dataType === 'boolean' ? (
                                        // <div className="d-flex align-items-center justify-content-between">
                                        <div className="row" style={{ width: '33px' }}>
                                          <div className="col-1">
                                            <label className={`form-switch`}>
                                              <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={cell.value}
                                                onChange={() => {
                                                  if (shouldOpenCellEditMenu(index)) {
                                                    handleToggleCellEdit(
                                                      cell.value,
                                                      row.values.id,
                                                      index,
                                                      rIndex,
                                                      true,
                                                      cell.value
                                                    );
                                                  }
                                                }}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                      ) : (
                                        //   <ToolTip
                                        //     message={'Open referenced table'}
                                        //     placement="top"
                                        //     tooltipClassName="tjdb-table-tooltip"
                                        //   >
                                        //     <div className="cursor-pointer">{isForeignKey && <Maximize />}</div>
                                        //   </ToolTip>
                                        // </div>
                                        <div
                                          className={cx({
                                            'foreignkey-cell': isMatchingForeignKeyColumn(cell.column.Header),
                                          })}
                                        >
                                          <div className="cell-text">
                                            {isBoolean(cell?.value)
                                              ? cell?.value?.toString()
                                              : cell.column?.dataType === 'timestamp with time zone'
                                              ? convertDateToTimeZoneFormatted(
                                                  cell?.value,
                                                  getConfigurationProperty(
                                                    cell.column.Header,
                                                    'timezone',
                                                    getLocalTimeZone()
                                                  )
                                                )
                                              : cell.render('Cell')}
                                          </div>
                                          {/* <ToolTip
                                            message={'Open referenced table'}
                                            placement="top"
                                            tooltipClassName="tjdb-table-tooltip"
                                          >
                                            <div className="cursor-pointer">
                                              {foreignKeys[0]?.column_names?.length > 0 &&
                                                foreignKeys[0]?.column_names[0] === cell?.column?.Header && (
                                                  <Maximize />
                                                )}
                                            </div>
                                          </ToolTip> */}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {shouldOpenCellEditMenu(index) &&
                                  cellClick.rowIndex === rIndex &&
                                  cellClick.cellIndex === index &&
                                  isCellUpdateInProgress ? (
                                    <div>
                                      <progress
                                        className="progress progress-sm tjdb-cell-save-progress"
                                        value={progress}
                                        max="100"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </ToolTip>
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })}
              <div />
            </tbody>
            {rows.length > 0 && (
              <div
                onClick={() => {
                  resetCellAndRowSelection();
                  setIsCreateRowDrawerOpen(true);
                }}
                className={darkMode ? 'add-icon-row-dark' : 'add-icon-row'}
                style={{
                  zIndex: 3,
                }}
              >
                +
              </div>
            )}
          </table>
        )}
        {rows.length === 0 && !loadingState && (
          <div className="empty-table-container">
            <div>
              <div className={darkMode ? 'warning-icon-container-dark' : 'warning-icon-container'}>
                {darkMode ? <WarningDark /> : <Warning />}
              </div>
              <div
                className="text-h3"
                style={{ width: '400px', textAlign: 'center' }}
                data-cy="do-not-have-records-text"
              >
                {emptyMainData}
                <p className="empty-table-description mb-2">{emptyData}</p>
              </div>
              <div style={{ width: '130px', margin: '0px auto' }}>
                <AddNewDataPopOver
                  disabled={false}
                  show={isAddNewDataMenuOpen}
                  darkMode={darkMode}
                  toggleAddNewDataMenu={toggleAddNewDataMenu}
                  handleOnClickCreateNewRow={handleOnClickCreateNewRow}
                  handleOnClickBulkUpdateData={handleOnClickBulkUpdateData}
                >
                  <span className="col-auto">
                    <ButtonSolid
                      variant={`${darkMode ? 'zBlack' : 'tertiary'}`}
                      disabled={false}
                      onClick={() => toggleAddNewDataMenu(true)}
                      size="sm"
                      className="px-1 pe-3 ps-2 gap-0"
                    >
                      <Plus fill="#697177" style={{ height: '16px' }} />
                      Add new data
                    </ButtonSolid>
                  </span>
                </AddNewDataPopOver>
              </div>
            </div>
          </div>
        )}

        <TableFooter
          darkMode={darkMode}
          dataLoading={loading}
          tableDataLength={tableData.length}
          collapseSidebar={collapseSidebar}
        />
        {rows.length === 0 && !loadingState && (
          <div
            onClick={() => {
              resetCellAndRowSelection();
              setIsCreateRowDrawerOpen(true);
            }}
            className={darkMode ? 'add-icon-row-dark' : 'add-icon-row'}
            style={{
              zIndex: 3,
            }}
          >
            +
          </div>
        )}
      </div>
      <Drawer
        isOpen={isEditColumnDrawerOpen}
        onClose={() => setIsEditColumnDrawerOpen(false)}
        position="right"
        className="tj-db-drawer"
      >
        <EditColumnForm
          selectedColumn={selectedColumn}
          setColumns={setColumns}
          onClose={() => setIsEditColumnDrawerOpen(false)}
          rows={rows}
          isEditColumn={true}
          referencedColumnDetails={referencedColumnDetails}
          setReferencedColumnDetails={setReferencedColumnDetails}
          initiator="EditColumnForm"
        />
      </Drawer>
      <ConfirmDialog
        title={'Delete Column'}
        show={editColumnHeader?.deletePopupModal}
        message={
          'Deleting the column could affect it’s associated queries/components. Are you sure you want to continue?'
        }
        onConfirm={handleDeleteColumn}
        onCancel={() => {
          setEditColumnHeader((prevState) => ({
            ...prevState,
            deletePopupModal: false,
          }));
        }}
        darkMode={darkMode}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => {
          setEditColumnHeader((prevState) => ({
            ...prevState,
            deletePopupModal: false,
          }));
        }}
        confirmButtonText={'Delete Column'}
        cancelButtonText={'Cancel'}
        confirmIcon={<DeleteIcon />}
        footerStyle={footerStyle}
      />
    </div>
  );
};

export default Table;
