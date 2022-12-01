import React from 'react';
import Breadcrumbs from '../Breadcrumbs';
import { OrganizationList } from '@/_components/OrganizationManager/List';

function Header() {
  return (
    <header>
      <div className="row w-100 gx-0">
        <div className="col-3 p-3 border-end border-bottom">
          <OrganizationList />
        </div>
        <div className="col-9 p-3 border-bottom">
          <div className="d-flex justify-content-sm-between">
            <div className="mr-3">
              <Breadcrumbs />
            </div>
            <div>version</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
