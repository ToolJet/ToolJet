import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';
import useBreadcrumbs from 'use-react-router-breadcrumbs';

// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';

export const Breadcrumbs = ({ darkMode, dataCy }) => {
  const { sidebarNav } = useContext(BreadCrumbContext);
  const breadcrumbs = useBreadcrumbs(routes, { excludePaths: ['/'] });
  const location = useLocation();
  const search = location.search || '';

  return (
    <ol className="breadcrumb breadcrumb-arrows">
      {breadcrumbs.map(({ breadcrumb, beta }, i) => {
        console.log(breadcrumb);
        if (i == 1 || breadcrumbs?.length == 1) {
          return (
            <div key={breadcrumb.key} className="tj-dashboard-header-title-wrap" data-cy={dataCy ?? ''}>
              <p className=" tj-text-xsm ">{i18next.t(breadcrumb.props.children)}</p>
              {sidebarNav?.length > 0 && <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />}
              <li className="breadcrumb-item font-weight-500">
                <Link to={`${breadcrumb.key}${search}`} data-cy="breadcrumb-page-title">
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
  { path: '/:worspace_id', breadcrumb: '_ui.breadcrumbs.apps' },
  { path: '/:worspace_id/database', breadcrumb: '_ui.breadcrumbs.tables', props: { dataCy: 'tables-page-header' } },
  { path: '/workspace-settings', breadcrumb: '_ui.breadcrumbs.workspaceSettings' },
  { path: '/data-sources', breadcrumb: '_ui.breadcrumbs.ds' },
  { path: '/:worspace_id/workspace-constants', breadcrumb: ' ' },
  { path: '/:worspace_id/settings', breadcrumb: ' ' },
  { path: '/integrations', breadcrumb: '_ui.breadcrumbs.plugins', props: { beta: true } },
];
