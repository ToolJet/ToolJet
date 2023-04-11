import { authenticationService } from '@/_services';

export const canAnyGroupPerformAction = (action, permissions) => {
  if (!permissions) {
    return false;
  }

  return permissions.some((p) => p[action]);
};

export const canUseDataSourceForQuery = (dataSourceId) => {
  let { data_source_group_permissions, group_permissions, super_admin, admin } =
    authenticationService.currentSessionValue;

  if (admin || super_admin) return true;

  if (canCreateDataSource(group_permissions) || canDeleteDataSource(group_permissions)) return true;

  if (!data_source_group_permissions) {
    return false;
  }

  const dataSource = data_source_group_permissions.filter((p) => p.data_source_id === dataSourceId)[0];
  return dataSource ? true : false;
};

export const canCreateDataSource = (group_permissions, super_admin, admin) => {
  return canAnyGroupPerformAction('data_source_create', group_permissions);
};

export const canDeleteDataSource = (group_permissions) => {
  return canAnyGroupPerformAction('data_source_delete', group_permissions);
};
