import React from 'react';
import List from './List';
import Table from './Table';

const PageBody = () => {
  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="row g-4">
          <div className="col-3">
            <List />
          </div>
          <div className="col-9">
            <Table />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageBody;
