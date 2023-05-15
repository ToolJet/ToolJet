import React, { useState, useContext, useEffect } from 'react';
import Select from '@/_ui/Select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { dataTypes } from '../constants';

const ColumnForm = ({ onCreate, onClose }) => {
  const [columnName, setColumnName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [dataType, setDataType] = useState();
  const [fetching, setFetching] = useState(false);
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);

  useEffect(() => {
    toast.dismiss();
  }, []);

  const handleTypeChange = (value) => {
    setDataType(value);
  };

  const handleCreate = async () => {
    if (isEmpty(columnName)) {
      toast.error('Column name cannot be empty');
      return;
    }
    if (isEmpty(dataType)) {
      toast.error('Data type cannot be empty');
      return;
    }

    setFetching(true);

    const { error } = await tooljetDatabaseService.createColumn(
      organizationId,
      selectedTable.table_name,
      columnName,
      dataType,
      defaultValue
    );

    setFetching(false);

    if (error) {
      toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
      return;
    }

    toast.success(`Column created successfully`);
    onCreate && onCreate();
  };

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title ">
        <h3 className="" data-cy="create-new-column-header">
          Create a new column
        </h3>
      </div>
      <div className="card-body">
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="column-name-input-field-label">
            Column name
          </div>
          <input
            value={columnName}
            type="text"
            placeholder="Enter column name"
            className="form-control"
            data-cy="column-name-input-field"
            autoComplete="off"
            onChange={(e) => setColumnName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-3 data-type-dropdown-section" data-cy="data-type-dropdown-section">
          <div className="form-label" data-cy="data-type-input-field-label">
            Data type
          </div>
          <Select
            useMenuPortal={false}
            placeholder="Select data type"
            value={dataType}
            options={dataTypes}
            onChange={handleTypeChange}
            customWrap={true}
          />
        </div>
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="default-value-input-field-label">
            Default value
          </div>
          <input
            value={defaultValue}
            type="text"
            placeholder="Enter default value"
            className="form-control"
            data-cy="default-value-input-field"
            autoComplete="off"
            onChange={(e) => setDefaultValue(e.target.value)}
            disabled={dataType === 'serial'}
          />
        </div>
      </div>
      <DrawerFooter fetching={fetching} onClose={onClose} onCreate={handleCreate} />
    </div>
  );
};

export default ColumnForm;
