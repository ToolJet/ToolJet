import React from 'react';

const CreateTableForm = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new table</h3>
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
          />
        </div>
        <div className="mb-3">
          <div className="form-label">Table description</div>
          <input type="text" className="form-control" placeholder="optional" />
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

export default CreateTableForm;
