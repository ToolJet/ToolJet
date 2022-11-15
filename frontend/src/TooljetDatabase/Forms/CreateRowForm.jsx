import React from 'react';

const CreateRowForm = ({ onClose }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new row</h3>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="form-label">Row name</div>
          <input type="text" placeholder="Enter row name" className="form-control" autoComplete="off" />
        </div>
        <div className="mb-3">
          <div className="form-label">Default value</div>
          <input type="text" placeholder="Enter default value" className="form-control" autoComplete="off" />
        </div>
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
