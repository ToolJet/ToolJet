import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
// todo: legacy package, remove this and upgrade to react-router-dom v6 (https://reactrouter.com/en/main/upgrading/v5)
// v6 has an official way to support breadcrumbs https://reactrouter.com/en/main/hooks/use-matches#breadcrumbs
import withBreadcrumbs from 'react-router-breadcrumbs-hoc';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';

const Breadcrumbs = ({ breadcrumbs, darkMode }) => {
  console.log('check', darkMode);
  const { sidebarNav } = useContext(BreadCrumbContext);
  return (
    <ol className="breadcrumb breadcrumb-arrows">
      {breadcrumbs.length === 0 && (
        <li className="breadcrumb-item dashboard-breadcrumb-header">
          <div className="tj-dashboard-header-title-wrap">
            <p className=" tj-text-xsm ">Applications</p>
            <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />
            <Link to={'/'} className=" tj-para-xsm dashboard-breadcrumb-header-name">
              {sidebarNav}
            </Link>
          </div>
        </li>
      )}
      {breadcrumbs.map(({ breadcrumb, dataCy }) => {
        return (
          <div key={breadcrumb.key} className="tj-dashboard-header-title-wrap" data-cy={dataCy ?? ''}>
            <p className=" tj-text-xsm ">{breadcrumb}</p>
            <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />

            <li className="breadcrumb-item font-weight-500">
              <Link to={breadcrumb.key}> {sidebarNav}</Link>
            </li>
          </div>
        );
      })}
    </ol>
  );
};

// define some custom breadcrumbs for certain routes (optional)
const routes = [
  // { path: '/', breadcrumb: 'Apps' },
  { path: '/database', breadcrumb: 'Tables', dataCy: 'tables-page-header' },
  { path: '/workspace-settings', breadcrumb: 'Workspace settings' },
];

export default withBreadcrumbs(routes, { excludePaths: ['/'] })(Breadcrumbs);
