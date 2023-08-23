import React, { useState, useEffect, useMemo } from 'react';
import cx from 'classnames';
import { tooljetDatabaseService, authenticationService } from '@/_services';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { ListRows } from './ListRows';
import { CreateRow } from './CreateRow';
import { UpdateRows } from './UpdateRows';
import { DeleteRows } from './DeleteRows';
import { toast } from 'react-hot-toast';
import Select from '@/_ui/Select';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import { useMounted } from '@/_hooks/use-mount';
import { useCurrentState } from '@/_stores/currentStateStore';
import { JoinTable } from './JoinTable';

const ToolJetDbOperations = ({ optionchanged, options, darkMode, isHorizontalLayout }) => {
  const computeSelectStyles = (darkMode, width) => {
    return queryManagerSelectComponentStyle(darkMode, width);
  };
  const currentState = useCurrentState();
  const { current_organization_id: organizationId } = authenticationService.currentSessionValue;
  const mounted = useMounted();
  const [operation, setOperation] = useState(options['operation'] || '');
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(options['table_name']);
  const [listRowsOptions, setListRowsOptions] = useState(() => options['list_rows'] || {});
  const [updateRowsOptions, setUpdateRowsOptions] = useState(
    options['update_rows'] || { columns: {}, where_filters: {} }
  );
  const [deleteRowsOptions, setDeleteRowsOptions] = useState(
    options['delete_rows'] || {
      limit: 1,
    }
  );

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mounted) {
      optionchanged('operation', operation);
      setListRowsOptions({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);

  useEffect(() => {
    if (mounted) {
      optionchanged('list_rows', listRowsOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRowsOptions]);

  useEffect(() => {
    mounted && optionchanged('delete_rows', deleteRowsOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteRowsOptions]);

  useEffect(() => {
    mounted && optionchanged('update_rows', updateRowsOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRowsOptions]);

  const handleOptionsChange = (optionsChanged, value) => {
    setListRowsOptions((prev) => ({ ...prev, [optionsChanged]: value }));
  };

  const handleDeleteRowsOptionsChange = (optionsChanged, value) => {
    setDeleteRowsOptions((prev) => ({ ...prev, [optionsChanged]: value }));
  };

  const handleUpdateRowsOptionsChange = (optionsChanged, value) => {
    setUpdateRowsOptions((prev) => ({ ...prev, [optionsChanged]: value }));
  };

  const limitOptionChanged = (value) => {
    setListRowsOptions((prev) => ({ ...prev, limit: value }));
  };

  const deleteOperationLimitOptionChanged = (limit) => {
    setDeleteRowsOptions((prev) => ({ ...prev, limit: limit }));
  };

  const value = useMemo(
    () => ({
      organizationId,
      tables,
      setTables,
      columns,
      setColumns,
      selectedTable,
      setSelectedTable,
      listRowsOptions,
      setListRowsOptions,
      limitOptionChanged,
      handleOptionsChange,
      deleteRowsOptions,
      handleDeleteRowsOptionsChange,
      deleteOperationLimitOptionChanged,
      updateRowsOptions,
      handleUpdateRowsOptionsChange,
    }),
    [organizationId, tables, columns, selectedTable, listRowsOptions, deleteRowsOptions, updateRowsOptions]
  );

  const fetchTables = async () => {
    const { error, data } = await tooljetDatabaseService.findAll(organizationId);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch tables');
      return;
    }

    if (Array.isArray(data?.result)) {
      setTables(data.result.map((table) => table.table_name) || []);

      if (selectedTable) {
        console.log('fetchTableInformation');
        fetchTableInformation(selectedTable);
      }
    }
  };

  const fetchTableInformation = async (table) => {
    const { error, data } = await tooljetDatabaseService.viewTable(organizationId, table);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch table information');
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
  };

  const generateListForDropdown = (list) => {
    return list.map((value) =>
      Object.fromEntries([
        ['name', value],
        ['value', value],
      ])
    );
  };

  const handleTableNameSelect = (tableName) => {
    setSelectedTable(tableName);
    fetchTableInformation(tableName);

    optionchanged('organization_id', organizationId);
    optionchanged('table_name', tableName);
  };

  const getComponent = () => {
    switch (operation) {
      case 'list_rows':
        return ListRows;
      case 'create_row':
        return CreateRow;
      case 'update_rows':
        return UpdateRows;
      case 'delete_rows':
        return DeleteRows;
      case 'join_tables':
        return JoinTable;
    }
  };

  const ComponentToRender = getComponent(operation);

  return (
    <TooljetDatabaseContext.Provider value={value}>
      {/* table name dropdown */}
      <div className={cx({ row: !isHorizontalLayout })}>
        <div className={cx({ 'col-4': !isHorizontalLayout, 'd-flex': isHorizontalLayout })}>
          <label className={cx('form-label')}>Table name</label>
          <div className={cx({ 'flex-grow-1': isHorizontalLayout })}>
            <Select
              options={generateListForDropdown(tables)}
              value={selectedTable}
              onChange={(value) => handleTableNameSelect(value)}
              width="100%"
              // useMenuPortal={false}
              useCustomStyles={true}
              styles={computeSelectStyles(darkMode, '100%')}
            />
          </div>
        </div>
      </div>

      {/* operation selection dropdown */}
      <div className={cx('my-3 py-1', { row: !isHorizontalLayout })}>
        <div
          /* className="my-2 col-4"  */
          className={cx({ 'col-4': !isHorizontalLayout, 'd-flex': isHorizontalLayout })}
        >
          <label className={cx('form-label')}>Operations</label>
          <div className={cx({ 'flex-grow-1': isHorizontalLayout })}>
            <Select
              options={[
                { name: 'List rows', value: 'list_rows' },
                { name: 'Create row', value: 'create_row' },
                { name: 'Update rows', value: 'update_rows' },
                { name: 'Delete rows', value: 'delete_rows' },
                { name: 'Join tables', value: 'join_tables' },
              ]}
              value={operation}
              onChange={(value) => setOperation(value)}
              width="100%"
              // useMenuPortal={false}
              useCustomStyles={true}
              styles={computeSelectStyles(darkMode, '100%')}
            />
          </div>
        </div>
      </div>

      {/* component to render based on the operation */}
      {ComponentToRender && (
        <ComponentToRender
          currentState={currentState}
          options={options}
          optionchanged={optionchanged}
          darkMode={darkMode}
        />
      )}
    </TooljetDatabaseContext.Provider>
  );
};

export default ToolJetDbOperations;
