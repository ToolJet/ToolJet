import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SolidIcon from '../Icon/SolidIcons';
import { BreadCrumbContext } from '../../App/App';
import cx from 'classnames';

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

export const Breadcrumbs = ({ breadcrumbs, darkMode }) => {
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const location = useLocation();
  const search = location.search || '';

  // Generate breadcrumbs from current location if not provided
  const generatedBreadcrumbs =
    breadcrumbs ||
    (() => {
      const pathname = location.pathname;
      const pathParts = pathname.split('/').filter(Boolean);

      // Special handling for apps and modules pages
      if (pathParts.length >= 1) {
        const workspaceId = pathParts[0];

        // Apps page is at root workspace path (/:workspaceId)
        if (pathParts.length === 1) {
          return [
            {
              breadcrumb: 'Applications',
              key: `/${workspaceId}`,
              props: {},
            },
            {
              breadcrumb: 'All apps',
              key: `/${workspaceId}`,
              props: {},
            },
          ];
        }

        // Modules page is at /:workspaceId/modules
        if (pathParts.length === 2 && pathParts[1] === 'modules') {
          return [
            {
              breadcrumb: 'Applications',
              key: `/${workspaceId}`,
              props: {},
            },
            {
              breadcrumb: 'All modules',
              key: `/${workspaceId}/modules`,
              props: {},
            },
          ];
        }
      }

      // Find matching route from the routes array
      const matchingRoute = routes.find((route) => {
        const routePathParts = route.path.split('/').filter(Boolean);
        if (routePathParts.length !== pathParts.length) return false;

        return routePathParts.every((part, index) => {
          return part.startsWith(':') || part === pathParts[index];
        });
      });

      if (matchingRoute) {
        return [
          {
            breadcrumb: matchingRoute.breadcrumb,
            key: matchingRoute.path,
            props: matchingRoute.props || {},
          },
        ];
      }

      // Fallback: use the last path part as breadcrumb
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart) {
        return [
          {
            breadcrumb: lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' '),
            key: pathname,
            props: {},
          },
        ];
      }

      return [];
    })();

  const breadcrumbsLength = generatedBreadcrumbs?.length || 0;
  let parent = null;
  let current = null;

  if (breadcrumbsLength >= 2) {
    parent = generatedBreadcrumbs[breadcrumbsLength - 2]; // Applications
    current = generatedBreadcrumbs[breadcrumbsLength - 1]; // All modules (or whatever)
  } else if (breadcrumbsLength === 1) {
    parent = generatedBreadcrumbs[0]; // Applications
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

        {(current || updateSidebarNAV) && (
          <li className="breadcrumb-item font-weight-500" data-cy="breadcrumb-page-title">
            {current?.breadcrumb || updateSidebarNAV}
          </li>
        )}
      </div>
    </ol>
  );
};
