export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};
export const groupsSelector = {
  pageTitle: "[data-cy=user-groups-title]",
  createNewGroupButton: "[data-cy=create-new-group-button]",
  tableHeader: "[data-cy=table-header]",
  groupName: "[data-cy=group-name]",
  cardTitle: "[data-cy=card-title]",
  groupNameInput: "[data-cy=group-name-input]",
  cancelButton: "[data-cy=cancel-button]",
  createGroupButton: "[data-cy=create-group-button]",
  userGroup: "[data-cy=user-groups]",
  appsLink: "[data-cy=apps-link]",
  usersLink: "[data-cy=users-link]",
  permissionsLink: "[data-cy=permissions-link]",
  searchBox: '[data-cy="select-search"]',
  appSearchBox:
    "[data-cy=select-search]>>>>>.dropdown-heading-value > .gray",
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
  groupLink: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-group-link"]`;
  },
  updateGroupNameLink: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-group-update-link"]`;
  },
  deleteGroupLink: (groupname) => {
    return `[data-cy="${cyParamName(groupname)}-group-delete-link"]`;
  },
  mutiSelectAddButton: (groupname) => {
    return `[data-cy="${cyParamName(
      groupname
    )}-group-multi-select-search-add-button"]`;
  },
  selectAddButton: '[data-cy="add-button"]'
};
