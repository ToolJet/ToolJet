import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';
import cx from 'classnames';

export const Breadcrumbs = ({ breadcrumbs, darkMode }) => {
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const location = useLocation();
  const search = location.search || '';
  const breadcrumbsLength = breadcrumbs.length;
  let parent = null;
  let current = null;

  if (breadcrumbsLength >= 2) {
    parent = breadcrumbs[breadcrumbsLength - 2]; // Applications
    current = breadcrumbs[breadcrumbsLength - 1]; // All modules (or whatever)
  } else if (breadcrumbsLength === 1) {
    parent = breadcrumbs[0]; // Applications
    current = null; // fallback to sidebarNav
  }

  return (
    <ol className="breadcrumb breadcrumb-arrows">
      <div
        key={parent?.key || 'breadcrumb'}
        className="tj-dashboard-header-title-wrap"
        data-cy={parent?.props?.dataCy ?? ''}
      >
        {parent && <p className="tj-text-xsm">{parent.breadcrumb}</p>}

        {(current || updateSidebarNAV) && <SolidIcon name="cheveronright" fill={darkMode ? '#FDFDFE' : '#131620'} />}

        {(updateSidebarNAV || current) && (
          <li className="breadcrumb-item font-weight-500" data-cy="breadcrumb-page-title">
            {updateSidebarNAV ? updateSidebarNAV : current?.breadcrumb}
          </li>
        )}
      </div>
    </ol>
  );
};

// define some custom breadcrumbs for certain routes (optional)
const routes = [
  { path: '/:worspace_id', breadcrumb: 'Applications' },
  { path: '/:workspace_id/modules', breadcrumb: 'All modules' },
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
