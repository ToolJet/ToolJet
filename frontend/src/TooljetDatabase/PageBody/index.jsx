import React from 'react';
import List from './TableList';
import Table from './Table';

const PageBody = () => {
  return (
    <div className="row gx-0">
      <div className="col-3 table-left-sidebar border-end">
        <div className="p-3">
          <List />
        </div>
      </div>
      <div className="col-9 bg-gray">
        <Table />
      </div>
    </div>
  );
};

export default PageBody;
