import React, { useState, useEffect, useMemo } from 'react';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { ListRows } from './ListRows';
import { CreateRow } from './CreateRow';
import { UpdateRows } from './UpdateRows';
import { DeleteRows } from './DeleteRows';
import { toast } from 'react-hot-toast';
import Select from '@/_ui/Select';

const ToolJetDbOperations = ({ currentState, optionchanged, options, darkMode }) => {
  const { organization_id: organizationId } = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [operation, setOperation] = useState(options['operation'] || '');
  const [columns, setColumns] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(options['table_name']);
  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    optionchanged('operation', operation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);

  const value = useMemo(
    () => ({
      organizationId,
      tables,
      setTables,
      columns,
      setColumns,
      selectedTable,
      setSelectedTable,
    }),
    [organizationId, tables, columns, selectedTable]
  );

  const fetchTables = async () => {
    const { error, data } = await tooljetDatabaseService.findAll(organizationId);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch tables');
      return;
    }

    if (Array.isArray(data?.result)) {
      setTables(data.result.map((table) => table.table_name) || []);
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
    }
  };

  const ComponentToRender = getComponent(operation);

  return (
    <TooljetDatabaseContext.Provider value={value}>
      {/* table name dropdown */}
      <div className="row">
        <div className="col-4">
          <label className="form-label">Table name</label>

          <Select
            options={generateListForDropdown(tables)}
            value={selectedTable}
            onChange={(value) => handleTableNameSelect(value)}
            width="100%"
            useMenuPortal={false}
          />
        </div>
      </div>

      {/* operation selection dropdown */}
      <div className="row">
        <div className="my-2 col-4">
          <label className="form-label">Operations</label>
          <Select
            options={[
              { name: 'List rows', value: 'list_rows' },
              { name: 'Create row', value: 'create_row' },
              { name: 'Update rows', value: 'update_rows' },
              { name: 'Delete rows', value: 'delete_rows' },
            ]}
            value={operation}
            onChange={(value) => setOperation(value)}
            width="100%"
            useMenuPortal={false}
          />
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
