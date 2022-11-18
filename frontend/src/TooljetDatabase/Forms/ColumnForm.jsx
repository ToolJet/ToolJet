import React, { useState, useContext } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';

const ColumnForm = ({ onCreate, onEdit, onClose }) => {
  const [columnName, setColumnName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [dataType, setDataType] = useState();
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);

  const types = [
    { value: 'character varying', label: 'varchar' },
    { value: 'integer', label: 'int' },
    { value: 'double precision', label: 'float' },
    { value: 'boolean', label: 'boolean' },
  ];

  const handleTypeChange = ({ value }) => {
    setDataType(value);
  };

  const handleCreate = async () => {
    const { error } = await tooljetDatabaseService.createColumn(
      organizationId,
      selectedTable,
      columnName,
      dataType,
      defaultValue
    );
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column in "${selectedTable}" table`);
      return;
    }

    toast.success(`Column created successfully`);
    onCreate && onCreate();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new column</h3>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="form-label">Column name</div>
          <input
            value={columnName}
            type="text"
            placeholder="Enter column name"
            className="form-control"
            autoComplete="off"
            onChange={(e) => setColumnName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <div className="form-label">Column type</div>
          <Select value={types.find(({ value }) => dataType === value)} options={types} onChange={handleTypeChange} />
        </div>
        <div className="mb-3">
          <div className="form-label">Default value</div>
          <input
            value={defaultValue}
            type="text"
            placeholder="Enter default value"
            className="form-control"
            autoComplete="off"
            onChange={(e) => setDefaultValue(e.target.value)}
          />
        </div>
      </div>
      <div className="position-fixed bottom-0 right-0 w-100 card-footer bg-transparent mt-auto">
        <div className="btn-list justify-content-end">
          <a className="btn" onClick={onClose}>
            Cancel
          </a>
          <a className="btn btn-primary" onClick={handleCreate}>
            Create
          </a>
        </div>
      </div>
    </div>
  );
};

export default ColumnForm;
