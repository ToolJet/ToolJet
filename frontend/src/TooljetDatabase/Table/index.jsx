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

import './styles.scss';

const Table = ({ openCreateRowDrawer, openCreateColumnDrawer }) => {
  const {
    organizationId,
    columns,
    selectedTable,
    selectedTableData,
    setSelectedTableData,
    setColumns,
    setTotalRecords,
    setQueryFilters,
    setSortFilters,
    resetAll,
    pageSize,
    pageCount,
  } = useContext(TooljetDatabaseContext);
  const [isEditColumnDrawerOpen, setIsEditColumnDrawerOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState();
  const [loading, setLoading] = useState(false);
  const [editColumnHeader, setEditColumnHeader] = useState({
    hoveredColumn: null,
    clickedColumn: null,
    columnHeaderValue: null,
    deletePopupModal: false,
    columnEditPopover: false,
  });
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
  const [showUpdateProgressBar, setShowUpdateProgressBar] = useState(false);

  const prevSelectedTableRef = useRef({});
  const duration = 300;
  const darkMode = localStorage.getItem('darkMode') === 'true';

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

  const fetchTableData = (queryParams = '', pagesize = 50, pagecount = 1) => {
    const defaultQueryParams = `limit=${pagesize}&offset=${(pagecount - 1) * pagesize}&order=id.desc`;
    let params = queryParams ? queryParams : defaultQueryParams;
    setLoading(true);

    tooljetDatabaseService.findOne(organizationId, selectedTable.id, params).then(({ headers, data = [], error }) => {
      setLoading(false);
      if (error) {
        toast.error(error?.message ?? `Error fetching table "${selectedTable.table_name}" data`);
        return;
      }
      const totalContentRangeRecords = headers['content-range'].split('/')[1] || 0;
      setTotalRecords(totalContentRangeRecords);
      setSelectedTableData(data);
    });
  };

  const onSelectedTableChange = () => {
    resetAll();
    setSortFilters({});
    setQueryFilters({});
    fetchTableMetadata();
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { selectedRowIds },
  } = useTable(
    {
      columns: tableColumns,
      data: tableData,
    },
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        // Let's make a column for selection
        {
          id: 'selection',
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div>
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }) => (
            <div>
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ]);
    }
  );

  const columHeaderLength = useMemo(() => headerGroups[0]?.headers?.length || 0, [headerGroups]);

  const handleKeyDown = (e) => {
    if (cellClick.rowIndex !== null) {
      if (e.key === 'ArrowRight') {
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
      } else if (e.key === 'ArrowLeft') {
        const cellIndexValue = cellClick.cellIndex === 2 ? 2 : cellClick.cellIndex - 1;
        const cellValue = rows[cellClick.rowIndex].cells[cellIndexValue].value; // cell Index's value
        const newIndex = cellClick.cellIndex === 2 ? 2 : cellClick.cellIndex - 1;
        setCellClick((prevState) => ({
          ...prevState,
          cellIndex: newIndex,
        }));
        setCellVal(cellValue);
      } else if (e.key === 'ArrowUp') {
        const cellValue = rows[cellClick.rowIndex - 1].cells[cellClick.cellIndex].value; // row Index's value
        const newRowIndex = cellClick.rowIndex === 0 ? 0 : cellClick.rowIndex - 1;
        setCellClick((prevState) => ({
          ...prevState,
          rowIndex: newRowIndex,
        }));
        setCellVal(cellValue);
      } else if (e.key === 'ArrowDown') {
        const cellValue = rows[cellClick.rowIndex + 1].cells[cellClick.cellIndex].value; // row Index's value
        const newRowIndex = cellClick.rowIndex === rows.length - 1 ? rows.length - 1 : cellClick.rowIndex + 1;
        setCellClick((prevState) => ({
          ...prevState,
          rowIndex: newRowIndex,
        }));
        setCellVal(cellValue);
      } else if (e.key === 'Enter') {
        document.getElementById('edit-input-blur').focus();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cellClick]);

  const handleCellOutsideClick = (event) => {
    if (
      !event.target.closest('.table-cell-click') &&
      !event.target.closest('.table-editable-parent-cell') &&
      !event.target.closest('.popover-body')
    ) {
      setCellClick((prevState) => ({
        ...prevState,
        rowIndex: null,
        cellIndex: null,
        editable: false,
        errorState: false,
      }));
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleCellOutsideClick);
    return () => {
      document.removeEventListener('click', handleCellOutsideClick);
    };
  }, []);

  const handleDeleteRow = async () => {
    const shouldDelete = confirm('Are you sure you want to delete the selected rows?');
    if (shouldDelete) {
      const selectedRows = Object.keys(selectedRowIds).map((key) => rows[key]);
      const primaryKey = columns.find((column) => column.isPrimaryKey);
      const deletionKeys = selectedRows.map((row) => {
        return row.values[primaryKey.accessor];
      });

      let query = `?${primaryKey.accessor}=in.(${deletionKeys.toString()})`;

      const { error } = await tooljetDatabaseService.deleteRows(organizationId, selectedTable.id, query);

      if (error) {
        toast.error(error?.message ?? `Error deleting rows from table "${selectedTable.table_name}"`);
        return;
      }

      toast.success(`Deleted ${selectedRows.length} rows from table "${selectedTable.table_name}"`);
      fetchTableData();
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
    setShowUpdateProgressBar(true);
    const startTime = Date.now();
    const updateProgress = () => {
      const runningTime = Date.now() - startTime;
      const progressPercentage = Math.min(1, runningTime / duration);
      setProgress(progressPercentage * 100);

      if (progressPercentage < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setShowUpdateProgressBar(false);
          setProgress(0);
          if (status === true) {
            toast.success(message);
          } else {
            toast.error(message);
          }
        }, 100);
      }
    };
    requestAnimationFrame(updateProgress);
  };

  const handleToggleCellEdit = async (cellValue, rowId, index, rIndex, directToggle) => {
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
      setNullValue(false);
      setDefaultValue(false);
      setTimeout(() => {
        setCellClick((prev) => ({
          ...prev,
          editable: false,
          errorState: true,
        }));
        setCellVal(cellValue);
      }, 400);
      return;
    }

    const limit = pageSize;
    const pageRange = `${(pageCount - 1) * pageSize + 1}`;
    tooljetDatabaseService
      .findOne(organizationId, selectedTable.id, `order=id.desc&limit=${limit}&offset=${pageRange - 1}`)
      .then(({ headers, data = [], error }) => {
        if (error) {
          toast.error(error?.message ?? `Failed to fetch table "${selectedTable.table_name}"`);
          return;
        }
        if (Array.isArray(data) && data?.length > 0) {
          const totalContentRangeRecords = headers['content-range'].split('/')[1] || 0;
          setTotalRecords(totalContentRangeRecords);
          setSelectedTableData(data);
        }
      });
    setEditPopover(false);
    setDefaultValue(false);
    setNullValue(false);
    setCellClick((prev) => ({
      ...prev,
      rowIndex: rIndex,
      cellIndex: index,
      errorState: false,
    }));
    handleProgressAnimation('column edited successfully', true);
  };

  const handleInputKeyDown = (event, cellValue, rowId, index, rIndex, directToggle) => {
    if (event.key === 'Enter') {
      if (cellValue != cellVal) {
        handleToggleCellEdit(cellValue, rowId, index, rIndex, directToggle);
        document.getElementById('edit-input-blur').blur();
      } else {
        setEditPopover(false);
        document.getElementById('edit-input-blur').blur();
      }
    } else if (event.key === 'Escape') {
      setEditPopover(false);
      setCellVal(cellValue);
      document.getElementById('edit-input-blur').blur();
    }
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

  const onMenuClick = (index, e) => {
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
    }));
  };

  const handleCellClick = (e, cellIndex, rowIndex, cellVal) => {
    if (e.target.classList.value === 'table-cell') {
      if (cellIndex !== 0 && cellIndex !== 1) {
        setCellVal(cellVal);
        setCellClick((prevState) => ({
          ...prevState,
          rowIndex: rowIndex,
          cellIndex: cellIndex,
          editable: true,
          errorState: false,
        }));
        setEditPopover(false);
      }
    }
  };

  const closeEditPopover = (previousValue) => {
    setEditPopover(false);
    setCellVal(previousValue);
  };

  function showTooltipForId(column) {
    return (
      <ToolTip message="Column cannot be edited or deleted" placement="bottom">
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
          <div className="tjdb-primary-key-parent">
            <span className="primary-key-text">Primary key</span>
          </div>
        </div>
      </ToolTip>
    );
  }

  return (
    <div>
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
      {Object.keys(selectedRowIds).length > 0 && (
        <div className="w-100 bg-white">
          <button
            onClick={handleDeleteRow}
            type="button"
            className="btn border-0 d-flex align-items-center delete-row-btn"
            data-cy="delete-row-records-button"
          >
            <svg
              width="13"
              height="14"
              viewBox="0 0 13 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              data-cy="delete-row-records-icon"
            >
              <path
                d="M2.97721 13.4306C2.62166 13.4306 2.31332 13.3 2.05221 13.0389C1.7911 12.7778 1.66055 12.4695 1.66055 12.1139V2.78059H1.47721C1.28832 2.78059 1.12999 2.71671 1.00221 2.58893C0.874436 2.46115 0.810547 2.30282 0.810547 2.11393C0.810547 1.92504 0.874436 1.7667 1.00221 1.63893C1.12999 1.51115 1.28832 1.44726 1.47721 1.44726H4.36055C4.36055 1.25837 4.42444 1.10004 4.55221 0.97226C4.67999 0.844483 4.83832 0.780594 5.02721 0.780594H8.39388C8.58277 0.780594 8.74388 0.847261 8.87721 0.980594C9.01055 1.11393 9.07721 1.26948 9.07721 1.44726H11.9439C12.1328 1.44726 12.2911 1.51115 12.4189 1.63893C12.5467 1.7667 12.6105 1.92504 12.6105 2.11393C12.6105 2.30282 12.5467 2.46115 12.4189 2.58893C12.2911 2.71671 12.1328 2.78059 11.9439 2.78059H11.7605V12.1139C11.7605 12.4695 11.63 12.7778 11.3689 13.0389C11.1078 13.3 10.7994 13.4306 10.4439 13.4306H2.97721ZM2.97721 2.78059V12.1139H10.4439V2.78059H2.97721ZM4.71055 10.1806C4.71055 10.3362 4.7661 10.4695 4.87721 10.5806C4.98832 10.6917 5.12166 10.7473 5.27721 10.7473C5.44388 10.7473 5.58277 10.6917 5.69388 10.5806C5.80499 10.4695 5.86055 10.3362 5.86055 10.1806V4.69726C5.86055 4.53059 5.80221 4.38893 5.68555 4.27226C5.56888 4.15559 5.43277 4.09726 5.27721 4.09726C5.11055 4.09726 4.97444 4.15559 4.86888 4.27226C4.76332 4.38893 4.71055 4.53059 4.71055 4.69726V10.1806ZM7.56055 10.1806C7.56055 10.3362 7.61888 10.4695 7.73555 10.5806C7.85221 10.6917 7.98832 10.7473 8.14388 10.7473C8.31055 10.7473 8.44944 10.6917 8.56055 10.5806C8.67166 10.4695 8.72721 10.3362 8.72721 10.1806V4.69726C8.72721 4.53059 8.66888 4.38893 8.55221 4.27226C8.43555 4.15559 8.29944 4.09726 8.14388 4.09726C7.97721 4.09726 7.83832 4.15559 7.72721 4.27226C7.6161 4.38893 7.56055 4.53059 7.56055 4.69726V10.1806ZM2.97721 2.78059V12.1139V2.78059Z"
                fill="#FF6972"
              />
            </svg>
            &nbsp; Delete records
          </button>
        </div>
      )}
      <div
        style={{
          height: 'calc(100vh - 164px)', // 48px navbar + 96 for table bar +  52 px in footer
        }}
        className={cx('table-responsive border-0 tj-db-table animation-fade')}
      >
        <table
          {...getTableProps()}
          className="table card-table table-bordered table-vcenter text-nowrap datatable"
          style={{ position: 'relative' }}
        >
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <tr className="tj-database-column-row" {...headerGroup.getHeaderGroupProps()} key={index}>
                {headerGroup.headers.map((column, index) => (
                  <th
                    key={column.Header}
                    width={index === 0 ? 66 : 230}
                    style={{ height: index === 0 ? '32px' : '' }}
                    title={index === 1 ? '' : column?.Header}
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
                        >
                          <div className="tjdb-menu-icon-parent">
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
                        {column.render('Header')}
                      </>
                    )}
                  </th>
                ))}
                <th
                  onClick={() => openCreateColumnDrawer()}
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
                    <tr className={`${`row-tj`}`} {...row.getRowProps()} key={rIndex}>
                      {row.cells.map((cell, index) => {
                        const dataCy =
                          cell.column.id === 'selection'
                            ? `${cell.row.values?.id}-checkbox`
                            : `id-${cell.row.values?.id}-column-${cell.column.id}`;
                        const cellValue = cell.value === null ? '' : cell.value;
                        return (
                          <td
                            key={`cell.value-${index}`}
                            title={cell.value || ''}
                            //tabIndex="0"
                            style={{
                              position: 'relative',
                            }}
                            className={`${
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
                                  cellClick.editable === true &&
                                  cellClick.cellIndex !== 0 &&
                                  cellClick.cellIndex !== 1
                                ? 'table-editable-parent-cell'
                                : cellClick.rowIndex === rIndex &&
                                  cellClick.cellIndex === index &&
                                  cellClick.errorState === true
                                ? 'tjdb-cell-error'
                                : `table-cell`
                            }`}
                            data-cy={`${dataCy.toLocaleLowerCase().replace(/\s+/g, '-')}-table-cell`}
                            {...cell.getCellProps()}
                            onKeyDown={(e) => handleInputKeyDown(e, cell.value, row.values.id, index, rIndex, false)}
                            onClick={(e) => handleCellClick(e, index, rIndex, cell.value)}
                          >
                            {cellClick.editable &&
                            index !== 0 &&
                            index !== 1 &&
                            cellClick.cellIndex !== 0 &&
                            cellClick.cellIndex !== 1 &&
                            cellClick.rowIndex === rIndex &&
                            cellClick.cellIndex === index ? (
                              <CellEditMenu
                                show={editPopover}
                                close={() => closeEditPopover(cell.value)}
                                columnDetails={headerGroups[0].headers[index]}
                                saveFunction={() =>
                                  handleToggleCellEdit(cell.value, row.values.id, index, rIndex, false)
                                }
                                setCellValue={setCellVal}
                                cellValue={cellVal}
                                previousCellValue={cell.value}
                                setDefaultValue={setDefaultValue}
                                defaultValue={defaultValue}
                                setNullValue={setNullValue}
                                nullValue={nullValue}
                                isBoolean={cell.column?.dataType === 'boolean' ? true : false}
                              >
                                <div className="input-cell-parent" onClick={() => setEditPopover(true)}>
                                  {cellVal === null ? (
                                    <span className="cell-text-null-input">Null</span>
                                  ) : cell.column?.dataType === 'boolean' ? (
                                    <div
                                      className="row"
                                      style={{ marginLeft: '0px' }}
                                      onClick={() => setEditPopover(true)}
                                    >
                                      <div className="col-1 p-0">
                                        <label className={`form-switch`}>
                                          <input
                                            autoComplete="off"
                                            id="edit-input-blur"
                                            className="form-check-input"
                                            //disabled={editPopover ? true : false}
                                            type="checkbox"
                                            checked={editPopover ? cellVal : cell.value}
                                            onChange={() => {
                                              if (!editPopover)
                                                handleToggleCellEdit(cell.value, row.values.id, index, rIndex, true);
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
                                      className="form-control"
                                      id="edit-input-blur"
                                      value={cellVal === null ? '' : cellVal}
                                      onChange={(e) => setCellVal(e.target.value)}
                                      onFocus={() => {
                                        setEditPopover(true);
                                      }}
                                      disabled={defaultValue === true || nullValue === true ? true : false}
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
                                          onChange={() =>
                                            handleToggleCellEdit(cell.value, row.values.id, index, rIndex, true)
                                          }
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <>{isBoolean(cell?.value) ? cell?.value?.toString() : cell.render('Cell')}</>
                                )}
                              </>
                            )}
                            {cellClick.cellIndex !== 0 &&
                            cellClick.cellIndex !== 1 &&
                            cellClick.rowIndex === rIndex &&
                            cellClick.cellIndex === index &&
                            showUpdateProgressBar ? (
                              <progress
                                className="progress progress-sm tjdb-cell-save-progress"
                                value={progress}
                                max="100"
                              />
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })
            )}
            <div onClick={() => openCreateRowDrawer()} className={darkMode ? 'add-icon-row-dark' : 'add-icon-row'}>
              +
            </div>
          </tbody>
        </table>

        <TableFooter
          darkMode={darkMode}
          openCreateRowDrawer={openCreateRowDrawer}
          dataLoading={loading}
          tableDataLength={tableData.length}
        />
      </div>
      <Drawer isOpen={isEditColumnDrawerOpen} onClose={() => setIsEditColumnDrawerOpen(false)} position="right">
        <EditColumnForm
          selectedColumn={selectedColumn}
          setColumns={setColumns}
          onClose={() => setIsEditColumnDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};

export default Table;
