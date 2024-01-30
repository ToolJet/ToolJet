import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import cx from 'classnames';
import { useTable, useRowSelect } from 'react-table';
import { isBoolean, isEmpty } from 'lodash';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { toast } from 'react-hot-toast';
import { TablePopover } from './ActionsPopover';
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
  });
  const [cellVal, setCellVal] = useState('');

  const prevSelectedTableRef = useRef({});
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const toggleSelectOrDeSelectAllRows = (totalRowsCount) => {
    if (!totalRowsCount) return;
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

  useEffect(() => {
    setSelectedRowIds({});
  }, []);

  const columHeaderLength = useMemo(() => headerGroups[0]?.headers?.length || 0, [headerGroups]);

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
        fetchTableData();
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

  const handleToggleCellEdit = async (cellVal, rowId, index) => {
    const cellKey = headerGroups[0].headers[index].id;
    const query = `id=eq.${rowId}&order=id`;
    const cellData = { [cellKey]: !cellVal };
    const { error } = await tooljetDatabaseService.updateRows(organizationId, selectedTable.id, cellData, query);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable.table_name}"`);
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
    toast.success(`cell edited successfully`);
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
        }));
      }
    }
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
                    />
                  </div>
                </th>
                {headerGroup.headers.map((column, index) => (
                  <th
                    key={column.Header}
                    width={230}
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
                          darkMode={darkMode}
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
                        {/* {column.render('Header')} */}
                      </>
                    )}
                  </th>
                ))}
                <th
                  onClick={() => setIsCreateColumnDrawerOpen(true)}
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
                    <tr
                      className={`tjdb-table-row ${`row-tj`} ${darkMode && 'dark-bg'}`}
                      {...row.getRowProps()}
                      key={rIndex}
                    >
                      <td className="table-cell">
                        <div
                          className="d-flex align-items-center gap-2"
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
                            style={{
                              display: 'none',
                            }}
                          >
                            <SolidIcon name="expand" width={14} viewBox="0 0 14 14" />
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
                            title={cell.value || ''}
                            //tabIndex="0"
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
                                : `table-cell`
                            }`}
                            data-cy={`${dataCy.toLocaleLowerCase().replace(/\s+/g, '-')}-table-cell`}
                            {...cell.getCellProps()}
                            //onKeyDown={(e) => handleKeyDown(e, cell.value)}
                            onClick={(e) => handleCellClick(e, index, rIndex, cell.value)}
                          >
                            {/* {isBoolean(cell?.value) ? cell?.value?.toString() : cell.render('Cell')} */}
                            {cellClick.editable &&
                            index !== 0 &&
                            index !== 1 &&
                            cellClick.cellIndex !== 0 &&
                            cellClick.cellIndex !== 1 &&
                            cellClick.rowIndex === rIndex &&
                            cellClick.cellIndex === index ? (
                              <input
                                className="form-control"
                                value={cellVal}
                                onChange={(e) => setCellVal(e.target.value)}
                              />
                            ) : (
                              <>
                                {cell.value === null ? (
                                  <span className="cell-text-null">Null</span>
                                ) : cell.column.dataType === 'boolean' ? (
                                  <div className="row">
                                    <div className="col-1">
                                      <label className={`form-switch`}>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={cell.value}
                                          onChange={() => handleToggleCellEdit(cell.value, row.values.id, index)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="cell-text">
                                    {isBoolean(cell?.value) ? cell?.value?.toString() : cell.render('Cell')}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })
            )}
            <div
              onClick={() => setIsCreateRowDrawerOpen(true)}
              className={darkMode ? 'add-icon-row-dark' : 'add-icon-row'}
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
