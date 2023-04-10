import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';
import useBreadcrumbs from 'use-react-router-breadcrumbs';

export const Breadcrumbs = ({ darkMode }) => {
  const { sidebarNav } = useContext(BreadCrumbContext);
  const breadcrumbs = useBreadcrumbs(routes, { excludePaths: ['/'] });
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
      {breadcrumbs.map(({ breadcrumb, dataCy, beta }) => {
        return (
          <div key={breadcrumb.key} className="tj-dashboard-header-title-wrap" data-cy={dataCy ?? ''}>
            <p className=" tj-text-xsm ">{breadcrumb}</p>
            {sidebarNav?.length > 0 && <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />}
            <li className="breadcrumb-item font-weight-500">
              <Link to={breadcrumb.key}> {sidebarNav}</Link>
            </li>
            {beta && <span class="badge bg-color-primary mx-3">beta</span>}
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
  { path: '/global-datasources', breadcrumb: 'Global Datasources' },
  { path: '/integrations', breadcrumb: 'Integrations / plugins', props: { beta: true } },
];
