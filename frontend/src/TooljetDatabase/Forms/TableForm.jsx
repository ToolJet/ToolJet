import React, { useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import CreateColumnsForm from './ColumnsForm';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { isEmpty } from 'lodash';
import { BreadCrumbContext } from '@/App/App';

const TableForm = ({
  selectedTable = {},
  selectedColumns = { 0: { column_name: 'id', data_type: 'serial', constraint_type: 'PRIMARY KEY' } },
  onCreate,
  onEdit,
  onClose,
  updateSelectedTable,
}) => {
  const [fetching, setFetching] = useState(false);
  const [tableName, setTableName] = useState(selectedTable.table_name);
  const [columns, setColumns] = useState(selectedColumns);
  const { organizationId } = useContext(TooljetDatabaseContext);
  const isEditMode = !isEmpty(selectedTable);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  useEffect(() => {
    toast.dismiss();
  }, []);

  const validateTableName = () => {
    if (isEmpty(tableName)) {
      toast.error('Table name cannot be empty');
      return false;
    }

    if (tableName.length > 255) {
      toast.error('Table name cannot be more than 255 characters');
      return false;
    }

    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      toast.error('Table name can only contain alphabets, numbers and underscores');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateTableName()) return;

    const columnNames = Object.values(columns).map((column) => column.column_name);
    if (columnNames.some((columnName) => isEmpty(columnName))) {
      toast.error('Column names cannot be empty');
      return;
    }

    setFetching(true);
    const { error, data } = await tooljetDatabaseService.createTable(organizationId, tableName, Object.values(columns));
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} created successfully`);
    onCreate && onCreate({ id: data.result.id, table_name: tableName });
  };

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate(e);
    }
  }

  const handleEdit = async () => {
    if (!validateTableName()) return;

    setFetching(true);
    const { error } = await tooljetDatabaseService.renameTable(organizationId, selectedTable.table_name, tableName);
    setFetching(false);

    if (error) {
      toast.error(error?.message ?? `Failed to edit table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} edited successfully`);
    updateSidebarNAV(tableName);
    updateSelectedTable({ ...selectedTable, table_name: tableName });

    onEdit && onEdit();
  };

  return (
    <div className="drawer-card-wrapper">
      <div className="card-header">
        {!isEditMode && (
          <h3 className="card-title" data-cy="create-new-table-header">
            Create a new table
          </h3>
        )}
        {isEditMode && (
          <h3 className="card-title" data-cy="edit-table-header">
            Edit table
          </h3>
        )}
      </div>
      <div>
        <div className="card-body">
          <div className="mb-3">
            <div className="form-label" data-cy="table-name-label">
              Table name
            </div>
            <div className="tj-app-input">
              <input
                type="text"
                placeholder="Enter table name"
                name="table-name"
                className="form-control"
                data-cy="table-name-input-field"
                autoComplete="off"
                value={tableName}
                onChange={(e) => {
                  setTableName(e.target.value);
                }}
                autoFocus
              />
            </div>
          </div>
        </div>
        {!isEditMode && <CreateColumnsForm columns={columns} setColumns={setColumns} />}
      </div>
      <DrawerFooter
        fetching={fetching}
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={handleEdit}
        onCreate={handleCreate}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};

export default TableForm;
