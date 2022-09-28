import React, { useState } from 'react';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../Forms/CreateTableForm';
import CreateColumnsForm from '../Forms/CreateColumnsForm';
import Search from './Search';

const PageHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <div className="row g-2 align-items-center">
          <div className="col-3">
            <button className="btn btn-outline-secondary active w-100" type="button" onClick={() => setIsOpen(!isOpen)}>
              Create new table +
            </button>
            <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} position="right">
              <CreateTableForm />
              <CreateColumnsForm />
            </Drawer>
            <Search />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
