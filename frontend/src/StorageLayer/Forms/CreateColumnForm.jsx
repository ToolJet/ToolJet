import React from 'react';
import Select from 'react-select';

const CreateColumnForm = () => {
  const types = [
    { value: 'varchar', label: 'varchar' },
    { value: 'int', label: 'int' },
    { value: 'float', label: 'float' },
    { value: 'boolean', label: 'boolean' },
  ];

  const handleTypeChange = () => { };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new column</h3>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="form-label">Column name</div>
          <input type="text" placeholder="Enter column name" className="form-control" autoComplete="off" />
        </div>
        <div className="mb-3">
          <div className="form-label">Column type</div>
          <Select options={types} onChange={handleTypeChange} />
        </div>
        <div className="mb-3">
          <div className="form-label">Default value</div>
          <input type="text" placeholder="Enter default value" className="form-control" autoComplete="off" />
        </div>
      </div>
      <div className="position-fixed bottom-0 right-0 w-100 card-footer bg-transparent mt-auto">
        <div className="btn-list justify-content-end">
          <a className="btn">Cancel</a>
          <a className="btn btn-primary">Create</a>
        </div>
      </div>
    </div>
  );
};

export default CreateColumnForm;
