import React, { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import CreateColumnsForm from './ColumnsForm';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { isEmpty } from 'lodash';

const TableForm = ({
  selectedTable = '',
  selectedColumns = { 0: { column_name: 'id', data_type: 'serial', constraint: 'PRIMARY KEY' } },
  onCreate,
  onEdit,
  onClose,
}) => {
  const [fetching, setFetching] = useState(false);
  const [tableName, setTableName] = useState(selectedTable);
  const [columns, setColumns] = useState(selectedColumns);
  const { organizationId } = useContext(TooljetDatabaseContext);
  const isEditMode = !isEmpty(selectedTable);

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

    setFetching(true);
    const { error } = await tooljetDatabaseService.createTable(organizationId, tableName, Object.values(columns));
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} created successfully`);
    onCreate && onCreate(tableName);
  };

  const handleEdit = async () => {
    if (!validateTableName()) return;

    setFetching(true);
    const { error } = await tooljetDatabaseService.renameTable(organizationId, selectedTable, tableName);
    setFetching(false);

    if (error) {
      toast.error(error?.message ?? `Failed to edit table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} edited successfully`);
    onEdit && onEdit();
  };

  return (
    <div className="card">
      <div className="card-header">
        {!isEditMode && <h3 className="card-title">Create a new table</h3>}
        {isEditMode && <h3 className="card-title">Edit table</h3>}
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="form-label">Table name</div>
          <input
            type="text"
            placeholder="Enter table name"
            name="table-name"
            className="form-control"
            autoComplete="off"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />
        </div>
        {/* <div className="mb-3">
          <div className="form-label">Table description</div>
          <input type="text" className="form-control" placeholder="optional" />
        </div> */}
      </div>
      {!isEditMode && <CreateColumnsForm columns={columns} setColumns={setColumns} />}
      <DrawerFooter
        fetching={fetching}
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={handleEdit}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default TableForm;
