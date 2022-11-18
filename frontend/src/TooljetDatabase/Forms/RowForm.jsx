import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';

const RowForm = ({ onCreate, onClose }) => {
  const { organizationId, selectedTable, columns } = useContext(TooljetDatabaseContext);
  const [data, setData] = useState({});

  const handleChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.value });
  };

  const handleSubmit = async () => {
    const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable, data);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable}"`);
      return;
    }
    toast.success(`Row created successfully`);
    onCreate && onCreate();
  };

  console.log(data);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new row</h3>
      </div>
      <div className="card-body">
        {Array.isArray(columns) &&
          columns?.map(({ Header, accessor }, index) => {
            return (
              <div className="mb-3" key={index}>
                <div className="form-label">{Header}</div>
                <input
                  type="text"
                  onChange={handleChange(accessor)}
                  placeholder="Enter a column name"
                  className="form-control"
                  autoComplete="off"
                />
              </div>
            );
          })}
      </div>
      <div className="position-fixed bottom-0 right-0 w-100 card-footer bg-transparent mt-auto">
        <div className="btn-list justify-content-end">
          <a className="btn" onClick={onClose}>
            Cancel
          </a>
          <a className="btn btn-primary" onClick={handleSubmit}>
            Create
          </a>
        </div>
      </div>
    </div>
  );
};

export default RowForm;
