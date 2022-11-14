import React, { useState } from 'react';
import List from './List';
import Table from './Table';

const PageBody = () => {
  const [selectedTable, setSelectedTable] = useState('');

  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="row g-4">
          <div className="col-3">
            <List setSelectedTable={setSelectedTable} />
          </div>
          <div className="col-9">
            <Table selectedTable={selectedTable} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageBody;
