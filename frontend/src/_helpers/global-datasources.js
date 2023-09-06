import { authenticationService } from '@/_services';

export const canAnyGroupPerformAction = (action, permissions, id) => {
  if (!permissions) {
    return false;
  }

  if (id) {
    return permissions.filter((p) => p.data_source_id === id && p[action]).length;
  }

  return permissions.some((p) => p[action]);
};

export const canUseDataSourceForQuery = (dataSourceId) => {
  let { data_source_group_permissions, group_permissions, super_admin, admin } =
    authenticationService.currentSessionValue;

  if (admin || super_admin) return true;

  if (canCreateDataSource() || canDeleteDataSource(group_permissions)) return true;

  if (!data_source_group_permissions) {
    return false;
  }

  const dataSource = data_source_group_permissions.filter((p) => p.data_source_id === dataSourceId)[0];
  return dataSource ? true : false;
};

export const canCreateDataSource = () => {
  let { group_permissions, super_admin, admin } = authenticationService.currentSessionValue;

  return canAnyGroupPerformAction('data_source_create', group_permissions) || super_admin || admin;
};

export const canDeleteDataSource = () => {
  let { group_permissions } = authenticationService.currentSessionValue;
  return canAnyGroupPerformAction('data_source_delete', group_permissions);
};

export const canReadDataSource = (id) => {
  let { data_source_group_permissions, super_admin, admin } = authenticationService.currentSessionValue;

  return canAnyGroupPerformAction('read', data_source_group_permissions, id) || super_admin || admin;
};

export const canUpdateDataSource = (id) => {
  let { data_source_group_permissions, group_permissions, super_admin, admin } =
    authenticationService.currentSessionValue;

  return (
    canAnyGroupPerformAction('update', data_source_group_permissions, id) ||
    canCreateDataSource() ||
    super_admin ||
    admin
  );
};
