import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '../index';

const CreateRowForm = ({ onClose }) => {
  const { organizationId, columns } = useContext(TooljetDatabaseContext);

  console.log(columns);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new row</h3>
      </div>
      <div className="card-body">
        {columns.map(({ Header }, index) => {
          return (
            <div className="mb-3" key={index}>
              <div className="form-label">{Header}</div>
              <input type="text" placeholder="Enter row name" className="form-control" autoComplete="off" />
            </div>
          );
        })}
      </div>
      <div className="position-fixed bottom-0 right-0 w-100 card-footer bg-transparent mt-auto">
        <div className="btn-list justify-content-end">
          <a className="btn" onClick={onClose}>
            Cancel
          </a>
          <a className="btn btn-primary">Create</a>
        </div>
      </div>
    </div>
  );
};

export default CreateRowForm;
