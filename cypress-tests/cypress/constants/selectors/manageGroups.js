export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};
export const groupsSelector = {
  pageTitle: "[data-cy=user-groups-title]",
  createNewGroupButton: "[data-cy=create-new-group-button]",
  tableHeader: "[data-cy=table-header]",
  groupName: "[data-cy=group-name]",
  addNewGroupModalTitle: '[data-cy="add-new-group-title"]',
  groupNameInput: "[data-cy=group-name-input]",
  cancelButton: "[data-cy=cancel-button]",
  createGroupButton: "[data-cy=create-group-button]",
  userGroup: "[data-cy=user-groups]",
  appsLink: "[data-cy=apps-link]",
  usersLink: "[data-cy=users-link]",
  permissionsLink: "[data-cy=permissions-link]",
  searchBox: '[data-cy="select-search"]',
  appSearchBox: "[data-cy=select-search]>>>>>.dropdown-heading-value > .gray",
  searchBoxOptions: ".panel-content",
  appAddButton: "[data-cy=add-button]",
  addButton: '[data-cy="add-button"]',
  nameTableHeader: ".active [data-cy=name-header]",
  permissionstableHedaer: ".active [data-cy=permissions-header]",
  emailTableHeader: "[data-cy=email-header]",
  resourcesTableHeader: "[data-cy=resource-header]",
  resourcesApps: "[data-cy=resource-apps]",
  resourcesFolders: "[data-cy=resource-folders]",
  resourcesWorkspaceVar: '[data-cy="resource-workspace-variable"]',
  appsCreateCheck: "[data-cy=app-create-checkbox]",
  appsCreateLabel: "[data-cy=app-create-label]",
  appsDeleteCheck: "[data-cy=app-delete-checkbox]",
  appsDeleteLabel: "[data-cy=app-delete-label]",
  foldersCreateCheck: "[data-cy=folder-create-checkbox]",
  foldersCreateLabel: "[data-cy=folder-create-label]",
  workspaceVarCheckbox: '[data-cy="env-variable-checkbox"]',
  confirmText: "[data-cy=modal-message]",
  confirmCancelButton: "[data-cy=confirm-cancel-button]",
  confirmYesButton: "[data-cy=confirm-yes-button]",
  multiSelectSearch: '[data-cy="multi-select-search"]',
  multiSelectSearchInput:
    '[data-cy="multi-select-search"]>>>>.select-search__input',
  workspaceVarCreateLabel: '[data-cy="workspace-variable-create-label"]',
  selectAddButton: '[data-cy="add-button"]',
  textDefaultGroup: '[data-cy="text-default-group"]',
  helperTextNoAppsAdded: '[data-cy="helper-text-no-apps-added"]',
  helperTextPermissions: '[data-cy="helper-text-user-groups-permissions"]',
  helperTextAllUsersIncluded: '[data-cy="helper-text-all-user-included"]',
  helperTextAdminAppAccess: '[data-cy="helper-text-admin-app-access"]',
  helperTextAdminPermissions: '[data-cy="helper-text-admin-permissions"]',
  updateGroupNameModalTitle: '[data-cy="update-group-title"]',
  groupLink: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-list-item"]`;
  },
  updateGroupNameLink: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-group-name-update-link"]`;
  },
  deleteGroupLink: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-group-delete-link"]`;
  },
  mutiSelectAddButton: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-group-add-button"]`;
  },

  groupPageTitle: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-title"]`;
  },
  userRow: (email) => {
    return `[data-cy="${cyParamName(email)}-user-row"]`
  }
};
