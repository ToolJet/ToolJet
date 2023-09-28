import React, { useEffect, useState, useContext, useRef } from 'react';
import cx from 'classnames';
import { useTable, useRowSelect } from 'react-table';
import { isBoolean, isEmpty } from 'lodash';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { toast } from 'react-hot-toast';
import { TablePopover } from './ActionsPopover';
import Skeleton from 'react-loading-skeleton';
import IndeterminateCheckbox from '@/_ui/IndeterminateCheckbox';
import Drawer from '@/_ui/Drawer';
import EditColumnForm from '../Forms/ColumnForm';
import TableFooter from './Footer';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';

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
  } = useContext(TooljetDatabaseContext);
  const [isEditColumnDrawerOpen, setIsEditColumnDrawerOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState();
  const [loading, setLoading] = useState(false);
  const prevSelectedTableRef = useRef({});

  const fetchTableMetadata = () => {
    if (!isEmpty(selectedTable)) {
      tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
        if (error) {
          toast.error(error?.message ?? `Error fetching metadata for table "${selectedTable.table_name}"`);
          return;
        }

        if (data?.result?.length > 0) {
          setColumns(
            data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
              Header: column_name,
              accessor: column_name,
              dataType: data_type,
              isPrimaryKey: keytype?.toLowerCase() === 'primary key',
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
        return 'int';
      case 'bigint':
        return 'bigint';
      case 'character varying':
        return 'varchar';
      case 'boolean':
        return 'bool';
      case 'double precision':
        return 'float';
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

  const handleDeleteColumn = async (columnName) => {
    const shouldDelete = confirm(`Are you sure you want to delete the column "${columnName}"?`);
    if (shouldDelete) {
      const { error } = await tooljetDatabaseService.deleteColumn(organizationId, selectedTable.table_name, columnName);
      if (error) {
        toast.error(error?.message ?? `Error deleting column "${columnName}" from table "${selectedTable}"`);
        return;
      }
      await fetchTableMetadata();
      toast.success(`Deleted ${columnName} from table "${selectedTable.table_name}"`);
    }
  };

  if (!selectedTable) return null;

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div>
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
          className="table w-auto card-table table-bordered table-vcenter text-nowrap datatable"
        >
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <tr className="tj-database-column-row" {...headerGroup.getHeaderGroupProps()} key={index}>
                {headerGroup.headers.map((column, index) => (
                  <TablePopover
                    key={column.Header}
                    onEdit={() => {
                      setSelectedColumn(column);
                      setIsEditColumnDrawerOpen(true);
                    }}
                    onDelete={() => handleDeleteColumn(column.Header)}
                    disabled={index === 0 || column.isPrimaryKey}
                  >
                    <th
                      width={index === 0 ? 66 : 230}
                      title={column?.Header || ''}
                      className="table-header tj-database-column-header tj-text-xsm"
                      data-cy={`${String(column.Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-header`}
                      {...column.getHeaderProps()}
                    >
                      {column.render('Header')}
                      <span className="tj-text-xsm tj-db-dataype text-lowercase">
                        {column.Header == 'id' ? 'serial' : checkDataType(column?.dataType)}
                      </span>
                    </th>
                  </TablePopover>
                ))}
              </tr>
            ))}
          </thead>
          <button onClick={() => openCreateColumnDrawer()} className="add-row-btn-database">
            +
          </button>
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
              rows.map((row, index) => {
                prepareRow(row);
                return (
                  <>
                    <tr {...row.getRowProps()} key={index}>
                      {row.cells.map((cell, index) => {
                        const dataCy =
                          cell.column.id === 'selection'
                            ? `${cell.row.values?.id}-checkbox`
                            : `id-${cell.row.values?.id}-column-${cell.column.id}`;
                        return (
                          <td
                            key={`cell.value-${index}`}
                            title={cell.value || ''}
                            className="table-cell"
                            data-cy={`${dataCy.toLocaleLowerCase().replace(/\s+/g, '-')}-table-cell`}
                            {...cell.getCellProps()}
                          >
                            {isBoolean(cell?.value) ? cell?.value?.toString() : cell.render('Cell')}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })
            )}
            <button onClick={() => openCreateRowDrawer()} className="add-col-btn-database">
              +
            </button>
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
          onEdit={() => {
            fetchTableMetadata();
            setSelectedColumn();
            setIsEditColumnDrawerOpen(false);
          }}
          onClose={() => setIsEditColumnDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};

export default Table;
