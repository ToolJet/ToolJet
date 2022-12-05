import React from 'react';
import List from './TableList';
import Table from './Table';

const PageBody = () => {
  return (
    <div className="page-body">
      <div>
        <div className="row gx-0 p-3">
          <div className="col-3">
            <List />
          </div>
          <div className="col-9" style={{ marginTop: '-3rem' }}>
            <Table />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageBody;
