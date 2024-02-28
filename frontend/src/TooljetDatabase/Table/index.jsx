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
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import BigInt from '../Icons/Biginteger.svg';
import Float from '../Icons/Float.svg';
import Integer from '../Icons/Integer.svg';
import CharacterVar from '../Icons/Text.svg';
import Boolean from '../Icons/Toggle.svg';
import Menu from '../Icons/Menu.svg';
import DeleteIcon from '../Table/ActionsPopover/Icons/DeleteColumn.svg';
import TjdbTableHeader from './Header';
import SolidIcon from '@/_ui/Icon/SolidIcons';

import './styles.scss';

const Table = ({ collapseSidebar }) => {
  const {
    organizationId,
    columns,
    selectedTable,
    selectedTableData,
    setColumns,
    queryFilters,
    setQueryFilters,
    sortFilters,
    setSortFilters,
    resetAll,
    pageSize,
    pageCount,
    handleRefetchQuery,
  } = useContext(TooljetDatabaseContext);
  const [isEditColumnDrawerOpen, setIsEditColumnDrawerOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState();
  const [loading, _setLoading] = useState(false);
  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [editColumnHeader, setEditColumnHeader] = useState({
    hoveredColumn: null,
    clickedColumn: null,
    columnHeaderValue: null,
    deletePopupModal: false,
    columnEditPopover: false,
  });

  // const [width, setWidth] = useState({ screenWidth: 0, xAxis: 0 });
  // const [wholeScreenWidth, setWholeScreenWidth] = useState(window.innerWidth);
  const [isEditRowDrawerOpen, setIsEditRowDrawerOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [cellClick, setCellClick] = useState({
    rowIndex: null,
    cellIndex: null,
    editable: false,
    errorState: false,
  });

  const [cellVal, setCellVal] = useState('');
  const [editPopover, setEditPopover] = useState(false);
  const [defaultValue, setDefaultValue] = useState(false);
  const [nullValue, setNullValue] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCellUpdateInProgress, setIsCellUpdateInProgress] = useState(false);

  const prevSelectedTableRef = useRef({});
  const duration = 300;
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const toggleSelectOrDeSelectAllRows = (totalRowsCount) => {
    if (!totalRowsCount) return;
    setCellClick({
      rowIndex: null,
      cellIndex: null,
      editable: false,
      errorState: false,
    });
    const isSelectAll =
      Object.keys(selectedRowIds).length !== totalRowsCount && Object.keys(selectedRowIds).length < totalRowsCount;
    if (!isSelectAll) {
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
    setSelectedRowIds(selectedRowIdsRef);
    return;
  };

  const replaceToggleSelectedRow = (rowIdSelected) => {
    const newSelectedIdRef = {};
    if (rowIdSelected) newSelectedIdRef[`${rowIdSelected}`] = true;
    setSelectedRowIds(newSelectedIdRef);
    return;
  };

  const fetchTableMetadata = () => {
    if (!isEmpty(selectedTable)) {
      tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
        if (error) {
          toast.error(error?.message ?? `Error fetching metadata for table "${selectedTable.table_name}"`);
          return;
        }

        if (data?.result?.length > 0) {
          setColumns(
            data?.result.map(({ column_name, data_type, ...rest }) => ({
              Header: column_name,
              accessor: column_name,
              dataType: data_type,
              ...rest,
            }))
          );
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

  const tableData = React.useMemo(
    () => (loading ? Array(10).fill({}) : selectedTableData),
    [loading, selectedTableData]
  );

  const tableColumns = React.useMemo(
    () =>
      loading
        ? columns.map((column) => ({
            ...column,
            Cell: <Skeleton />,
          }))
        : columns,
    [loading, columns]
  );

  const checkDataType = (type) => {
    switch (type) {
      case 'integer':
        return <Integer width="18" height="18" className="tjdb-column-header-name" />;
      case 'bigint':
        return <BigInt width="18" height="18" className="tjdb-column-header-name" />;
      case 'character varying':
        return <CharacterVar width="18" height="18" className="tjdb-column-header-name" />;
      case 'boolean':
        return <Boolean width="18" height="18" className="tjdb-column-header-name" />;
      case 'double precision':
        return <Float width="18" height="18" className="tjdb-column-header-name" />;
      default:
        return type;
    }
  };

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
      cellClick.rowIndex !== null &&
      !editPopover &&
      !cellClick.errorState &&
      !isCellUpdateInProgress &&
      allowListForKeys.includes(e.keyCode) &&
      cellClick.cellIndex !== 0
    ) {
      e.preventDefault();
      const cellValue = rows[cellClick.rowIndex].cells[cellClick.cellIndex].value;
      const cellDataType = rows[cellClick.rowIndex].cells[cellClick.cellIndex]?.column?.dataType;
      if (cellDataType !== 'boolean') {
        setSelectedRowIds({});
        if (cellValue === null) {
          setNullValue(false);
          setEditPopover(true);
          setCellVal(e.key);
          document.getElementById('edit-input-blur')?.focus();
        } else {
          setCellVal((prevValue) => prevValue + e.key);
          setEditPopover(true);
          document.getElementById('edit-input-blur')?.focus();
        }
      }
    }

    // Logic for Cell Navigation - Enter ( Opens edit menu ), Backspace (removes Null value ) & ESC event ( close edit menu )
    if (cellClick.rowIndex !== null && !cellClick.errorState && !isCellUpdateInProgress) {
      if (e.key === 'ArrowRight') {
        setSelectedRowIds({});
        setEditPopover(false);
        const cellIndexValue =
          cellClick.cellIndex === columHeaderLength - 1 ? columHeaderLength - 1 : cellClick.cellIndex + 1;
        const cellValue = rows[cellClick.rowIndex].cells[cellIndexValue].value; // cell Index's value
        const newIndex =
          cellClick.cellIndex === columHeaderLength - 1 ? columHeaderLength - 1 : cellClick.cellIndex + 1;
        setCellClick((prevState) => ({
          ...prevState,
          cellIndex: newIndex,
        }));
        setCellVal(cellValue);
        cellValue === null ? setNullValue(true) : setNullValue(false);
        setDefaultValue(false);
      } else if (e.key === 'ArrowLeft') {
        setSelectedRowIds({});
        setEditPopover(false);
        const cellIndexValue = cellClick.cellIndex === 0 ? 0 : cellClick.cellIndex - 1;
        const cellValue = rows[cellClick.rowIndex].cells[cellIndexValue].value; // cell Index's value
        const newIndex = cellClick.cellIndex === 0 ? 0 : cellClick.cellIndex - 1;
        setCellClick((prevState) => ({
          ...prevState,
          cellIndex: newIndex,
        }));
        setCellVal(cellValue);
        cellValue === null ? setNullValue(true) : setNullValue(false);
        setDefaultValue(false);
      } else if (e.key === 'ArrowUp') {
        setSelectedRowIds({});
        setEditPopover(false);
        const cellValue = rows[cellClick.rowIndex - 1].cells[cellClick.cellIndex].value; // row Index's value
        const newRowIndex = cellClick.rowIndex === 0 ? 0 : cellClick.rowIndex - 1;
        setCellClick((prevState) => ({
          ...prevState,
          rowIndex: newRowIndex,
        }));
        setCellVal(cellValue);
        cellValue === null ? setNullValue(true) : setNullValue(false);
        setDefaultValue(false);
      } else if (e.key === 'ArrowDown') {
        setSelectedRowIds({});
        setEditPopover(false);
        const cellValue = rows[cellClick.rowIndex + 1].cells[cellClick.cellIndex].value; // row Index's value
        const newRowIndex = cellClick.rowIndex === rows.length - 1 ? rows.length - 1 : cellClick.rowIndex + 1;
        setCellClick((prevState) => ({
          ...prevState,
          rowIndex: newRowIndex,
        }));
        setCellVal(cellValue);
        cellValue === null ? setNullValue(true) : setNullValue(false);
        setDefaultValue(false);
      } else if (e.key === 'Enter' && cellClick.cellIndex !== 0) {
        setEditPopover(true);
        document.getElementById('edit-input-blur').focus();
      } else if (e.key === 'Backspace' && !editPopover && cellClick.cellIndex !== 0) {
        const cellValue = rows[cellClick.rowIndex].cells[cellClick.cellIndex]?.value;
        const cellDataType = rows[cellClick.rowIndex].cells[cellClick.cellIndex]?.column?.dataType;
        if (cellValue === null) {
          setSelectedRowIds({});
          cellDataType === 'boolean' ? setCellVal(true) : setCellVal('');
          setNullValue(false);
          setDefaultValue(false);
          setEditPopover(true);
          document.getElementById('edit-input-blur').focus();
        }
      }
    }
    e.stopPropagation();
  };

  useEffect(() => {
    if (!editPopover) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellClick, editPopover, isCellUpdateInProgress]);

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
      handleOnCloseEditMenu();
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

  const handleToggleCellEdit = async (cellValue, rowId, index, rIndex, directToggle, oldValue) => {
    setIsCellUpdateInProgress(true);
    const cellKey = headerGroups[0].headers[index].id;
    const query = `id=eq.${rowId}&order=id`;
    const cellData = directToggle === true ? { [cellKey]: !cellValue } : { [cellKey]: cellVal };

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

    handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
    setEditPopover(false);
    handleOnCloseEditMenu();
    setCellClick((prev) => ({
      ...prev,
      rowIndex: rIndex,
      cellIndex: index,
      errorState: false,
    }));
    cellValue === null ? setNullValue(true) : setNullValue(false);
    handleProgressAnimation('column edited successfully', true);
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
      ['table-editable-parent-cell', 'tjdb-td-wrapper', 'table-cell', 'cell-text'].includes(e.target.classList.value)
    ) {
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
      setEditPopover(false);
    }
  };

  const closeEditPopover = (previousValue) => {
    setEditPopover(false);
    previousValue === null ? setNullValue(true) : setNullValue(false);
    setDefaultValue(false);
    setCellVal(previousValue);
    document.getElementById('edit-input-blur').blur();
  };

  function showTooltipForId(column) {
    return (
      <ToolTip message="Column cannot be edited or deleted" placement="bottom" delay={{ show: 0, hide: 100 }}>
        <div className="primaryKeyTooltip">
          <div>
            <span className="tj-text-xsm tj-db-dataype text-lowercase">
              {column.Header == 'id' ? (
                <Integer width="18" height="18" className="tjdb-column-header-name" />
              ) : (
                checkDataType(column?.dataType)
              )}
            </span>
            {column.render('Header')}
          </div>
          <div className="tjdb-primary-key-parent" data-cy="primary-key-label">
            <span className="primary-key-text">Primary key</span>
          </div>
        </div>
      </ToolTip>
    );
  }

  return (
    <div>
      <TjdbTableHeader
        isCreateColumnDrawerOpen={isCreateColumnDrawerOpen}
        setIsCreateColumnDrawerOpen={setIsCreateColumnDrawerOpen}
        isCreateRowDrawerOpen={isCreateRowDrawerOpen}
        setIsCreateRowDrawerOpen={setIsCreateRowDrawerOpen}
        selectedRowIds={selectedRowIds}
        handleDeleteRow={handleDeleteRow}
        rows={rows}
        isEditRowDrawerOpen={isEditRowDrawerOpen}
        setIsEditRowDrawerOpen={setIsEditRowDrawerOpen}
      />
      <div
        style={{
          height: 'calc(100vh - 164px)', // 48px navbar + 96 for table bar +  52 px in footer
        }}
        className={cx('table-responsive border-0 tj-db-table animation-fade tj-table')}
      >
        <table
          {...getTableProps()}
          className={`table card-table table-vcenter text-nowrap datatable ${darkMode && 'dark-background'}`}
          style={{ position: 'relative' }}
        >
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <tr className="tj-database-column-row" {...headerGroup.getHeaderGroupProps()} key={index}>
                <th
                  className={`${darkMode ? 'table-header-dark' : 'table-header'} tj-database-column-header tj-text-xsm`}
                  style={{ width: '66px', height: index === 0 ? '32px' : '' }}
                >
                  <div>
                    <IndeterminateCheckbox
                      indeterminate={
                        Object.keys(selectedRowIds).length > 0 && Object.keys(selectedRowIds).length < rows.length
                      }
                      checked={Object.keys(selectedRowIds).length === rows.length && rows.length}
                      onChange={() => toggleSelectOrDeSelectAllRows(rows.length)}
                      style={{
                        backgroundColor: `${
                          (Object.keys(selectedRowIds).length > 0 &&
                            Object.keys(selectedRowIds).length < rows.length) ||
                          (Object.keys(selectedRowIds).length === rows.length && rows.length)
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
                    title={index === 0 ? '' : column?.Header}
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
                    {column.Header !== 'id' && index > 0 ? (
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="tj-db-headerText">
                          <span className="tj-text-xsm tj-db-dataype text-lowercase">
                            {column.Header == 'id' ? (
                              <Integer width="18" height="18" className="tjdb-column-header-name" />
                            ) : (
                              checkDataType(column?.dataType)
                            )}
                          </span>
                          {column.render('Header')}
                        </div>
                        <TablePopover
                          onEdit={() => {
                            setSelectedColumn(column);
                            setIsEditColumnDrawerOpen(true);
                            closeMenu();
                          }}
                          onDelete={() => handleDelete(column.Header)}
                          disabled={index === 0 || column.isPrimaryKey}
                          show={editColumnHeader.columnEditPopover && editColumnHeader.clickedColumn === index}
                          className="column-popover-parent"
                          darkMode={darkMode}
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
                    ) : column.Header === 'id' ? (
                      showTooltipForId(column)
                    ) : (
                      <>
                        <span className="tj-text-xsm tj-db-dataype text-lowercase">
                          {column.Header == 'id' ? (
                            <Integer width="18" height="18" className="tjdb-column-header-name" />
                          ) : (
                            checkDataType(column?.dataType)
                          )}
                        </span>
                        {/* {column.render('Header')} */}
                      </>
                    )}
                  </th>
                ))}
                <th
                  onClick={() => {
                    resetCellAndRowSelection();
                    setIsCreateColumnDrawerOpen(true);
                  }}
                  className={darkMode ? 'add-icon-column-dark' : 'add-icon-column'}
                  data-cy="add-column-icon"
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="d-flex justify-content-center align-items-center flex-column">
                    <div className="mb-3">
                      <EmptyFoldersIllustration />
                    </div>
                    <div className="text-center">
                      <div className="text-h3" data-cy="do-not-have-records-text">
                        You don&apos;t have any records yet.
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rIndex) => {
                prepareRow(row);
                return (
                  <>
                    <tr
                      className={cx(`tjdb-table-row row-tj`, {
                        'dark-bg': darkMode,
                        'table-row-selected': selectedRowIds[row.id] ?? false,
                      })}
                      {...row.getRowProps()}
                      key={rIndex}
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
                            checked={selectedRowIds[row.id] ?? false}
                            onChange={() => toggleRowSelection(row.id)}
                          />

                          <div
                            onClick={() => {
                              replaceToggleSelectedRow(row.id);
                              setTimeout(() => setIsEditRowDrawerOpen(true), 100);
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
                                  : `table-cell`
                              }`,
                              {
                                'table-cell-selected': selectedRowIds[row.id] ?? false,
                              }
                            )}
                            data-cy={`${dataCy.toLocaleLowerCase().replace(/\s+/g, '-')}-table-cell`}
                            {...cell.getCellProps()}
                            onClick={(e) => handleCellClick(e, index, rIndex, cell.value)}
                          >
                            <ToolTip
                              message={index === 0 ? 'Cannot edit primary key values' : cell.value || ''}
                              placement="bottom"
                              delay={{ show: 200, hide: 0 }}
                              show={
                                !(
                                  cellClick.rowIndex === rIndex &&
                                  cellClick.cellIndex === index &&
                                  cellClick.editable
                                ) &&
                                cell.value !== null &&
                                cell.column.dataType !== 'boolean' &&
                                cell.value !== ''
                              }
                            >
                              <div className="tjdb-column-select-border">
                                <div
                                  className={cx('tjdb-td-wrapper', {
                                    'tjdb-selected-cell':
                                      cellClick.rowIndex === rIndex &&
                                      cellClick.cellIndex === index &&
                                      cellClick.editable === true &&
                                      !isCellUpdateInProgress,
                                    'tjdb-cell-error':
                                      cellClick.rowIndex === rIndex &&
                                      cellClick.cellIndex === index &&
                                      cellClick.errorState === true,
                                  })}
                                >
                                  {cellClick.editable &&
                                  cellClick.rowIndex === rIndex &&
                                  cellClick.cellIndex === index ? (
                                    <CellEditMenu
                                      show={index === 0 ? false : editPopover}
                                      close={() => closeEditPopover(cell.value)}
                                      columnDetails={headerGroups[0].headers[index]}
                                      saveFunction={(newValue) => {
                                        handleToggleCellEdit(newValue, row.values.id, index, rIndex, false, cell.value);
                                      }}
                                      setCellValue={setCellVal}
                                      cellValue={cellVal}
                                      previousCellValue={cell.value}
                                      setDefaultValue={setDefaultValue}
                                      defaultValue={defaultValue}
                                      setNullValue={setNullValue}
                                      nullValue={nullValue}
                                      isBoolean={cell.column?.dataType === 'boolean' ? true : false}
                                      darkMode={darkMode}
                                    >
                                      <div
                                        className="input-cell-parent"
                                        onClick={() => {
                                          if (index !== 0) setEditPopover(true);
                                        }}
                                      >
                                        {cellVal === null ? (
                                          <span className="cell-text-null-input">Null</span>
                                        ) : cell.column?.dataType === 'boolean' ? (
                                          <div
                                            className="row"
                                            style={{ marginLeft: '0px' }}
                                            onClick={() => {
                                              if (index !== 0) setEditPopover(true);
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
                                                    if (!editPopover && index !== 0)
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
                                        ) : (
                                          <input
                                            autoComplete="off"
                                            className="form-control fs-12 text-truncate"
                                            id="edit-input-blur"
                                            value={cellVal === null ? '' : cellVal}
                                            onChange={(e) => {
                                              if (index !== 0) setCellVal(e.target.value);
                                            }}
                                            onFocus={() => {
                                              if (index !== 0) setEditPopover(true);
                                            }}
                                            disabled={
                                              defaultValue === true || nullValue === true || index === 0 ? true : false
                                            }
                                          />
                                        )}
                                      </div>
                                    </CellEditMenu>
                                  ) : (
                                    <>
                                      {cell.value === null ? (
                                        <span className="cell-text-null">Null</span>
                                      ) : cell.column.dataType === 'boolean' ? (
                                        <div className="row" style={{ width: '33px' }}>
                                          <div className="col-1">
                                            <label className={`form-switch`}>
                                              <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={cell.value}
                                                onChange={() => {
                                                  if (index !== 0) {
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
                                        <div className="cell-text">
                                          {isBoolean(cell?.value) ? cell?.value?.toString() : cell.render('Cell')}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {cellClick.cellIndex !== 0 &&
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
              })
            )}
            <div
              onClick={() => {
                resetCellAndRowSelection();
                setIsCreateRowDrawerOpen(true);
              }}
              className={darkMode ? 'add-icon-row-dark' : 'add-icon-row'}
              data-cy="add-row-icon"
              style={{
                zIndex: 3,
              }}
            >
              +
            </div>
          </tbody>
        </table>

        <TableFooter
          darkMode={darkMode}
          dataLoading={loading}
          tableDataLength={tableData.length}
          collapseSidebar={collapseSidebar}
        />
      </div>
      <Drawer isOpen={isEditColumnDrawerOpen} onClose={() => setIsEditColumnDrawerOpen(false)} position="right">
        <EditColumnForm
          selectedColumn={selectedColumn}
          setColumns={setColumns}
          onClose={() => setIsEditColumnDrawerOpen(false)}
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
      />
    </div>
  );
};

export default Table;
