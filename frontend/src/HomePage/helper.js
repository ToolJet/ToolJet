export const appTypeToDisplayNameMapping = {
  'front-end': 'App',
  module: 'Module',
  workflow: 'Workflow',
};

// appType → the snake_case prefix its folder-permission session fields use
// (folder_create, workflow_folder_create, module_folder_create, ...).
// Add an entry here (not another ternary) when a new folder-owning app type is introduced.
const FOLDER_TYPE_PREFIX_BY_APP_TYPE = {
  workflow: 'workflow_',
  module: 'module_',
};

export const getFolderGroupPermissions = (currentSession, appType) => {
  const prefix = FOLDER_TYPE_PREFIX_BY_APP_TYPE[appType] ?? '';
  return currentSession?.[`${prefix}folder_group_permissions`];
};

export const getFolderPermissionField = (userPermissions, appType, action) => {
  const prefix = FOLDER_TYPE_PREFIX_BY_APP_TYPE[appType] ?? '';
  return userPermissions?.[`${prefix}folder_${action}`];
};
