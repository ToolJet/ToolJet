import { cyParamName } from "./common";

export const dashboardSelector = {
  emptyPageImage: "[data-cy=empty-img]",
  emptyPageHeader: "[data-cy=empty-welcome-header]",
  emptyPageDescription: "[data-cy=empty-description]",
  createAppButton: "[data-cy=create-new-application]",
  importAppButton: "[data-cy=import-an-application]",
  chooseFromTemplate: "[data-cy=choose-from-template]",
  modeToggle: "[data-cy=mode-toggle]>svg",
  dropdownText: "[data-cy=dropdown-organization-list]>>:eq(0)",
  dropdown: "[data-cy=dropdown-organization-list]",
  editButton: "[data-cy=edit-workspace-name]",
  manageUsers: "[data-cy=manage-users]",
  manageGroups: "[data-cy=manage-groups]",
  ManageSSO: "[data-cy=manage-sso]",
  userMenu: "[data-cy=user-menu]",
  profileLink: "[data-cy=profile-link]",
  logoutLink: "[data-cy=logout-link]",
  changeIconTitle: "[data-cy=change-icon-title]",
  appCardDefaultIcon: "[data-cy=app-card-apps-icon]",
  changeButton: "[data-cy=change-button]",
  addToFolderTitle: "[data-cy=add-to-folder-title]",
  moveAppText: "[data-cy=move-selected-app-to-text]",
  selectFolder: ".select-search__input",
  addToFolderButton: "[data-cy=add-to-folder-button]",
  appCardIcon: (iconName) => {
    return `[data-cy="app-card-${cyParamName(iconName)}-icon"]`;
  },
  appIcon: (iconName) => {
    return `[data-cy="${cyParamName(iconName)}-icon"]`;
  },
  folderName: (folderName) => {
    return `[data-cy="${cyParamName(folderName)}-name"]`;
  },
};
