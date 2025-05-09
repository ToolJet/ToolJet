import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';
import useBreadcrumbs from 'use-react-router-breadcrumbs';
import { decodeEntities } from '@/_helpers/utils';

export const Breadcrumbs = ({ darkMode, dataCy }) => {
  const { sidebarNav } = useContext(BreadCrumbContext);
  const breadcrumbs = useBreadcrumbs(routes, { excludePaths: ['/'] });
  const location = useLocation();
  const search = location.search || '';

  return (
    <ol className="breadcrumb breadcrumb-arrows">
      {breadcrumbs.map(({ breadcrumb, beta }, i) => {
        if (i == 1 || breadcrumbs?.length == 1) {
          return (
            <div key={breadcrumb.key} className="tj-dashboard-header-title-wrap" data-cy={dataCy ?? ''}>
              <p className=" tj-text-xsm ">{breadcrumb}</p>
              {sidebarNav?.length > 0 && <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />}
              <li className="breadcrumb-item font-weight-500" data-cy="breadcrumb-page-title">
                {' '}
                {sidebarNav && decodeEntities(sidebarNav)}
              </li>
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
  { path: '/:worpsace_id/audit-logs', breadcrumb: ' ' },
  { path: '/data-sources', breadcrumb: 'Data sources' },
  { path: '/:worspace_id/workspace-constants', breadcrumb: 'Workspace constants' },
  { path: '/integrations', breadcrumb: 'Integrations / plugins', props: { beta: true } },
  { path: '/license', breadcrumb: 'Enterprise Edition' },
  { path: '/settings/all-users', breadcrumb: 'Settings' },
  { path: '/settings/manage-instance-settings', breadcrumb: 'Settings' },
  { path: '/settings/all-workspaces', breadcrumb: 'Settings' },
  { path: '/settings/white-labelling', breadcrumb: 'Settings' },
  { path: '/settings/license', breadcrumb: 'Settings' },
  { path: '/settings/smtp', breadcrumb: 'Settings' },
  { path: '/settings/instance-login', breadcrumb: 'Settings' },
  { path: '/:worspace_id/workflows', breadcrumb: 'Workflows', props: { beta: true } },
  { path: '/integrations/installed', breadcrumb: 'Integrations' },
  { path: '/integrations/marketplace', breadcrumb: 'Integrations' },
];
