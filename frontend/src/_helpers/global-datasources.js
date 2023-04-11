const { admin, data_source_group_permissions, group_permissions, super_admin, id } =
  JSON.parse(localStorage.getItem('currentUser')) || {};

export const canAnyGroupPerformAction = (action, permissions) => {
  if (!permissions) {
    return false;
  }

  return permissions.some((p) => p[action]);
};

export const canUseDataSourceForQuery = (dataSourceId) => {
  if (admin || super_admin) return true;

  if (canCreateDataSource() || canDeleteDataSource()) return true;

  if (!data_source_group_permissions) {
    return false;
  }

  const dataSource = data_source_group_permissions.filter((p) => p.data_source_id === dataSourceId)[0];
  return dataSource ? true : false;
};

export const canReadDataSource = () => {
  return canAnyGroupPerformAction('read', data_source_group_permissions) || super_admin || admin;
};

export const canCreateDataSource = () => {
  return canAnyGroupPerformAction('data_source_create', group_permissions) || super_admin || admin;
};

export const canUpdateDataSource = () => {
  return canAnyGroupPerformAction('update', data_source_group_permissions) || super_admin || admin;
};

export const canDeleteDataSource = () => {
  return canAnyGroupPerformAction('data_source_delete', group_permissions) || super_admin || admin;
};
