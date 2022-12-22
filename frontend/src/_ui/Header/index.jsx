import React from 'react';
import Breadcrumbs from '../Breadcrumbs';
import { OrganizationList } from '@/_components/OrganizationManager/List';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <header>
      <div className="row w-100 gx-0">
        <div className="organization-selector col p-2 border-end border-bottom">
          <OrganizationList />
        </div>
        <div className="col p-3 border-bottom m-auto">
          <div className="d-flex justify-content-sm-between">
            <div className="mr-3">
              <Breadcrumbs />
            </div>
            <div style={{ marginLeft: 'auto' }} className={`${darkMode ? 'color-muted-darkmode' : 'color-disabled'}`}>
              v{currentVersion}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
