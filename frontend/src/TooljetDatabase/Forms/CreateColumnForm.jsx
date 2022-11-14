import React, { useRef, useContext } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';

const CreateColumnForm = ({ tableName = 'test', onCreate }) => {
  const columnRef = useRef();
  const defaultRef = useRef();
  const [dataType, setDataType] = React.useState();
  const { organizationId } = useContext(TooljetDatabaseContext);

  const types = [
    { value: 'varchar(255)', label: 'varchar' },
    { value: 'int', label: 'int' },
    { value: 'float', label: 'float' },
    { value: 'boolean', label: 'boolean' },
  ];

  const handleTypeChange = ({ value }) => {
    setDataType(value);
  };

  const handleCreate = async () => {
    const columnName = columnRef.current.value;
    const { error } = await tooljetDatabaseService.addColumn(organizationId, tableName, columnName, dataType);
    if (error) {
      toast.error(`Failed to create a new column table "${tableName}"`);
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
            ref={columnRef}
            type="text"
            placeholder="Enter column name"
            className="form-control"
            autoComplete="off"
          />
        </div>
        <div className="mb-3">
          <div className="form-label">Column type</div>
          <Select options={types} onChange={handleTypeChange} />
        </div>
        <div className="mb-3">
          <div className="form-label">Default value</div>
          <input
            ref={defaultRef}
            type="text"
            placeholder="Enter default value"
            className="form-control"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="position-fixed bottom-0 right-0 w-100 card-footer bg-transparent mt-auto">
        <div className="btn-list justify-content-end">
          <a className="btn">Cancel</a>
          <a className="btn btn-primary" onClick={handleCreate}>
            Create
          </a>
        </div>
      </div>
    </div>
  );
};

export default CreateColumnForm;
