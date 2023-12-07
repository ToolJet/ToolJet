import React, { useState, useContext, useEffect } from 'react';
import Select from '@/_ui/Select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { dataTypes } from '../constants';

const ColumnForm = ({ onDelete, onClose, selectedColumn }) => {
  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [fetching, setFetching] = useState(false);
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);

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

    // setFetching(true);

    // const { error } = await tooljetDatabaseService.createColumn(
    //     organizationId,
    //     selectedTable.table_name,
    //     columnName,
    //     dataType,
    //     defaultValue
    // );

    // setFetching(false);

    // if (error) {
    //     toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
    //     return;
    // }

    // toast.success(`Column created successfully`);
    // onCreate && onCreate();
  };

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title ">
        <h3 className="" data-cy="create-new-column-header">
          Edit column
        </h3>
      </div>
      <div className="card-body mt-4">
        <div className="mb-4 d-flex justify-content-between align-items-center tj-app-name-input">
          <div className="form-label-name mb-0" data-cy="column-name-input-field-label">
            Column name
          </div>
          <input
            value={columnName}
            type="text"
            placeholder="Enter column name"
            className="form-control w-75"
            data-cy="column-name-input-field"
            autoComplete="off"
            onChange={(e) => setColumnName(e.target.value)}
            autoFocus
          />
        </div>
        <div
          className="mb-4 d-flex justify-content-between align-items-center data-type-dropdown-section-type"
          data-cy="data-type-dropdown-section"
        >
          <div className="form-label data-type mb-0" data-cy="data-type-input-field-label">
            Data type
          </div>
          <Select
            useMenuPortal={false}
            placeholder="Select data type"
            value={dataType}
            options={dataTypes}
            onChange={handleTypeChange}
            className="w-75"
          />
        </div>
        <div className="mb-4 d-flex justify-content-between align-items-center tj-app-default-type-input">
          <div className="form-label default-type mb-0" data-cy="default-value-input-field-label">
            Default value
          </div>
          <input
            value={defaultValue}
            type="text"
            placeholder="Enter default value"
            className="form-control w-75"
            data-cy="default-value-input-field"
            autoComplete="off"
            onChange={(e) => setDefaultValue(e.target.value)}
            disabled={dataType === 'serial'}
          />
        </div>
      </div>
      <DrawerFooter
        fetching={fetching}
        onClose={onClose}
        onDelete={onDelete}
        onCreate={handleCreate}
        isDeleteMode={true}
      />
    </div>
  );
};

export default ColumnForm;
