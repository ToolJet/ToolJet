import React from 'react';
import '../../resources/styles/group-permissions.styles.scss';

const ENVIRONMENT_CONFIG = [
  { key: 'canAccessDevelopment', label: 'Development', dataCy: 'env-tag-dev' },
  { key: 'canAccessStaging', label: 'Staging', dataCy: 'env-tag-staging' },
  { key: 'canAccessProduction', label: 'Production', dataCy: 'env-tag-prod' },
  { key: 'canAccessReleased', label: 'Released app', dataCy: 'env-tag-released' },
];

function EnvironmentTags({ permissions, isAll = false, resourceType = 'app' }) {
  const appsPermissions = permissions?.appsGroupPermissions;

  if (!appsPermissions) {
    return (
      <div className="environment-tags-container" data-cy="environment-tags-empty">
        <span className="environment-empty-text">-</span>
      </div>
    );
  }

  const activeEnvironments = ENVIRONMENT_CONFIG.filter((env) => appsPermissions[env.key] === true);

  if (activeEnvironments.length === 0) {
    return (
      <div className="environment-tags-container" data-cy="environment-tags-empty">
        <span className="environment-empty-text">-</span>
      </div>
    );
  }

  return (
    <div className="environment-tags-container" data-cy="environment-tags">
      {activeEnvironments.map((env) => (
        <div key={env.key} className="environment-tag" data-cy={env.dataCy}>
          <span className="environment-tag-label">{env.label}</span>
        </div>
      ))}
    </div>
  );
}

export default EnvironmentTags;
