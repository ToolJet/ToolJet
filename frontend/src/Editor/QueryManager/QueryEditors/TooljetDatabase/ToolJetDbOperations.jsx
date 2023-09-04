import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import clone from 'lodash/clone';
import isEmpty from 'lodash/isEmpty';
import { cloneDeep } from 'lodash';

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
  const [tableInfo, setTableInfo] = useState({});
  const [deleteRowsOptions, setDeleteRowsOptions] = useState(
    options['delete_rows'] || {
      limit: 1,
    }
  );
  const [joinTableOptions, setJoinTableOptions] = useState(options['join_table'] || {});
  const joinOptions = options['join_table']?.['joins'] || [
    { conditions: { conditionsList: [{ leftField: { table: selectedTable } }] } },
  ];

  const setJoinOptions = (values) => {
    const tableSet = new Set();
    (values || []).forEach((join) => {
      const { table, conditions } = join;
      tableSet.add(table);
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField, rightField } = condition;
        if (leftField?.table) {
          tableSet.add(leftField?.table);
        }
        if (rightField?.table) {
          tableSet.add(rightField?.table);
        }
      });
    });
    tableSet.add(selectedTable);

    setJoinTableOptions((joinOptions) => {
      const { conditions, order_by = [] } = joinOptions;
      const conditionsList = cloneDeep(conditions?.conditionsList || []);
      const newConditionsList = conditionsList.filter((condition) => {
        const { leftField } = condition || {};
        if (tableSet.has(leftField?.table)) {
          return true;
        }
        return false;
      });
      const newOrderBy = order_by.filter((order) => tableSet.has(order.table));
      return {
        ...joinOptions,
        joins: values,
        conditions: { conditionsList: newConditionsList },
        order_by: newOrderBy,
      };
    });
  };
  // const [joinOptions, setJoinOptions] = useState(

  // );
  const [joinSelectOptions, setJoinSelectOptions] = useState(options['join_table']?.['fields'] || []);
  const joinOrderByOptions = options?.['join_table']?.['order_by'] || [];

  const setJoinOrderByOptions = (values) => {
    if (values.length) {
      setJoinTableOptions((joinOptions) => {
        return {
          ...joinOptions,
          order_by: values,
        };
      });
    } else {
      deleteJoinTableOptions('order_by');
    }
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // const newJoinOptions = clone(joinOptions);
    // if (newJoinOptions?.[0]?.conditions?.conditionsList) {
    //   const newConditionsList = [...newJoinOptions?.[0]?.conditions?.conditionsList].map(condition => {
    //     if(condition?.leftField?.table)
    //   })
    // } else {
    //   newJoinOptions[0] = { table: selectedTable };
    // }
    // setJoinOptions(newJoinOptions);
    selectedTable &&
      setJoinTableOptions((joinOptions) => {
        return {
          ...joinOptions,
          from: {
            name: selectedTable,
            type: 'Table',
          },
        };
      });
  }, [selectedTable]);

  useEffect(() => {
    const tableSet = new Set();
    const joinOptions = options['join_table']?.['joins'];
    (joinOptions || []).forEach((join) => {
      const { table, conditions } = join;
      tableSet.add(table);
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField, rightField } = condition;
        if (leftField?.table) {
          tableSet.add(leftField?.table);
        }
        if (rightField?.table) {
          tableSet.add(rightField?.table);
        }
      });
    });

    const tables = [...tableSet];
    tables.forEach((table) => table && loadTableInformation(table));
  }, [options['join_table']?.['joins']]);

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
    if (mounted) {
      setJoinTableOptions((opts) => ({ ...opts, joins: joinOptions, fields: joinSelectOptions }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinSelectOptions]);

  useEffect(() => {
    mounted && optionchanged('delete_rows', deleteRowsOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteRowsOptions]);

  useEffect(() => {
    mounted && optionchanged('update_rows', updateRowsOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRowsOptions]);

  useEffect(() => {
    mounted && optionchanged('join_table', joinTableOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinTableOptions]);

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

  const loadTableInformation = useCallback(
    async (tableName) => {
      if (!tableInfo[tableName]) {
        const { data } = await tooljetDatabaseService.viewTable(organizationId, tableName);
        setTableInfo((info) => ({
          ...info,
          [tableName]: data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
            Header: column_name,
            accessor: column_name,
            dataType: data_type,
            isPrimaryKey: keytype?.toLowerCase() === 'primary key',
            ...rest,
          })),
        }));
      }
    },
    [tableInfo]
  );

  const joinTableOptionsChange = (optionsChanged, value) => {
    setJoinTableOptions((prev) => ({ ...prev, [optionsChanged]: value }));
  };

  const deleteJoinTableOptions = (optionToDelete) => {
    setJoinTableOptions((prev) => {
      const prevOptions = { ...prev };
      if (prevOptions[optionToDelete]) delete prevOptions[optionToDelete];
      return prevOptions;
    });
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
      joinTableOptions,
      joinTableOptionsChange,
      tableInfo,
      loadTableInformation,
      joinOptions,
      setJoinOptions,
      joinSelectOptions,
      setJoinSelectOptions,
      joinOrderByOptions,
      setJoinOrderByOptions,
      deleteJoinTableOptions,
    }),
    [
      organizationId,
      tables,
      columns,
      selectedTable,
      listRowsOptions,
      deleteRowsOptions,
      updateRowsOptions,
      joinTableOptions,
      tableInfo,
      loadTableInformation,
      joinOptions,
      joinSelectOptions,
      joinOrderByOptions,
    ]
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
      const columnList = data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
        Header: column_name,
        accessor: column_name,
        dataType: data_type,
        isPrimaryKey: keytype?.toLowerCase() === 'primary key',
        ...rest,
      }));
      setColumns(columnList);
      setTableInfo((tableInfo) => ({ ...tableInfo, [table]: columnList }));
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
    setJoinTableOptions({ joins: [{ conditions: { conditionsList: [{ leftField: { table: tableName } }] } }] });
    setJoinOptions([{ conditions: { conditionsList: [{ leftField: { table: tableName } }] } }]);
    setJoinSelectOptions([]);
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
