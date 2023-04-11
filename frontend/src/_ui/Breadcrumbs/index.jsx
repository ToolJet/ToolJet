import React from 'react';
import { Link } from 'react-router-dom';
import useBreadcrumbs from 'use-react-router-breadcrumbs';

export const Breadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs(routes, { excludePaths: ['/'] });
  return (
    <ol className="breadcrumb breadcrumb-arrows">
      {breadcrumbs.length === 0 && (
        <li className="breadcrumb-item font-weight-500">
          <Link to={'/'}>Apps</Link>
        </li>
      )}
      {breadcrumbs.map(({ breadcrumb, dataCy, beta }) => {
        return (
          <li key={breadcrumb.key} className="breadcrumb-item font-weight-500" data-cy={dataCy ?? ''}>
            <span to={breadcrumb.key}>{breadcrumb}</span>
            {beta && <span class="badge bg-color-primary mx-3">beta</span>}
          </li>
        );
      })}
    </ol>
  );
};

// define some custom breadcrumbs for certain routes (optional)
const routes = [
  { path: '/:worspace_id', breadcrumb: 'Apps' },
  { path: '/database', breadcrumb: 'Tables', props: { dataCy: 'tables-page-header' } },
  { path: '/workspace-settings', breadcrumb: 'Workspace settings' },
  { path: '/global-datasources', breadcrumb: 'Global Datasources' },
  { path: '/integrations', breadcrumb: 'Integrations / plugins', props: { beta: true } },
];
