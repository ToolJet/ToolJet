import { authenticationService } from '@/_services';

export const canAnyGroupPerformAction = (action, id) => {
  let { user_permissions, data_source_group_permissions, super_admin, admin } =
    authenticationService.currentSessionValue;
  const canCreateDataSource = super_admin || admin || user_permissions?.data_source_create;
  const canDeleteDataSource = super_admin || admin || user_permissions?.data_source_delete;
  const canConfigureDataSource =
    canCreateDataSource ||
    data_source_group_permissions?.is_all_configurable ||
    data_source_group_permissions?.configurable_data_source_id?.includes(id);
  const canUseDataSource =
    canConfigureDataSource ||
    data_source_group_permissions?.is_all_usable ||
    data_source_group_permissions?.usable_data_sources_id?.includes(id);

  switch (action) {
    case 'data_source_create':
      return canCreateDataSource;
    case 'data_source_delete':
      return canDeleteDataSource;
    case 'read':
      return canUseDataSource;
    case 'update':
      return canConfigureDataSource;
    default:
      return false;
  }
};

export const canUseDataSourceForQuery = (dataSourceId) => {
  return canAnyGroupPerformAction('read', dataSourceId);
};

export const canCreateDataSource = () => {
  return canAnyGroupPerformAction('data_source_create');
};

export const canDeleteDataSource = () => {
  return canAnyGroupPerformAction('data_source_delete');
};

export const canReadDataSource = (id) => {
  return canAnyGroupPerformAction('read', id);
};

export const canUpdateDataSource = (id) => {
  return canAnyGroupPerformAction('update', id);
};
