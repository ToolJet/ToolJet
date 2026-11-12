export const routes = (pathEnd: string, path: string) => {
  const pathParts = path.split('/');
  if (pathParts.length > 1) {
    const parentPath = pathParts[pathParts.length - 2];
    if (['workspace-settings', 'settings'].includes(parentPath)) {
      return parentPath === 'workspace-settings' ? 'Workspace settings' : 'Settings';
    }
    // A selected data source's page ends in its id (/:workspaceId/data-sources/:selectedId).
    if (parentPath === 'data-sources') return 'Data sources';
  }

  switch (pathEnd) {
    case 'workspaceId':
      return 'Applications';
    case 'database':
      return 'Database';
    case 'workspace-settings':
    case 'users':
    case 'workspace-variables':
    case 'groups':
    case 'workspace-login':
      return 'Workspace settings';
    case 'data-sources':
      return 'Data sources';
    case 'profile-settings':
      return 'Profile settings';
    case 'installed':
    case 'marketplace':
      return 'Integrations';
    case 'settings':
      return 'Settings';
    case 'audit-logs':
      return 'Audit logs';
    case 'workflows':
      return 'Workflows';
    case 'workspace-constants':
      return 'Workspace constants';
    case 'modules':
      return 'Modules';
    default:
      return 'Applications';
  }
};

export const routesWithTags = (pathEnd: string) => {
  switch (pathEnd) {
    case 'Audit logs':
      return 'auditLogs';
    default:
      return null;
  }
};

export const isWorkspaceGitPage = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 1 || (parts.length >= 2 && ['data-sources', 'modules', 'workflows'].includes(parts[1]));
};
