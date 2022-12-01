import React from 'react';
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
              <ol className="breadcrumb breadcrumb-arrows">
                <li className="breadcrumb-item">
                  <a href="#">Home</a>
                </li>
                <li className="breadcrumb-item active">
                  <a href="#">All apps</a>
                </li>
              </ol>
            </div>
            <div>version</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
