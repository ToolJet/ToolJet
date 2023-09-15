import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';
import useBreadcrumbs from 'use-react-router-breadcrumbs';

export const Breadcrumbs = ({ darkMode, dataCy }) => {
  const { sidebarNav } = useContext(BreadCrumbContext);
  const breadcrumbs = useBreadcrumbs(routes, { excludePaths: ['/'] });

  return (
    <ol className="breadcrumb breadcrumb-arrows">
      {breadcrumbs.map(({ breadcrumb, beta }, i) => {
        if (i == 1 || breadcrumbs?.length == 1) {
          return (
            <div key={breadcrumb.key} className="tj-dashboard-header-title-wrap" data-cy={dataCy ?? ''}>
              <p className=" tj-text-xsm ">{breadcrumb}</p>
              {sidebarNav?.length > 0 && <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />}
              <li className="breadcrumb-item font-weight-500">
                <Link to={breadcrumb.key} data-cy="breadcrumb-page-title">
                  {' '}
                  {sidebarNav}
                </Link>
              </li>
              {beta && <span className="badge bg-color-primary mx-3">beta</span>}
            </div>
          );
        }
      })}
    </ol>
  );
};
// define some custom breadcrumbs for certain routes (optional)
const routes = [
  { path: '/:worspace_id', breadcrumb: 'Applications' },
  { path: '/:worspace_id/database', breadcrumb: 'Tables', props: { dataCy: 'tables-page-header' } },
  { path: '/workspace-settings', breadcrumb: 'Workspace settings' },
  { path: '/data-sources', breadcrumb: 'Data Sources' },
  { path: '/integrations', breadcrumb: 'Integrations / plugins', props: { beta: true } },
];
