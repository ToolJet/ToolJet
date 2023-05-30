import { cyParamName } from "./common";

export const dashboardSelector = {
  emptyPageImage: '[data-cy="empty-home-page-image"]',
  emptyPageHeader: "[data-cy=empty-homepage-welcome-header]",
  emptyPageDescription: "[data-cy=empty-homepage-description]",
  createAppButton: "[data-cy=create-new-application]",
  importAppButton: '[data-cy="button-import-an-app"]',
  chooseFromTemplate: "[data-cy=choose-from-template]",
  modeToggle: '[data-cy="mode-switch-button"]',
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
  selectFolder: '[data-cy="select-folder"]>.css-nwhe5y-container > .react-select__control > .react-select__value-container',
  addToFolderButton: "[data-cy=add-to-folder-button]",
  appTemplateRow: '[data-cy="app-template-row"]',
  homePageContent: '[data-cy="home-page-content"]',
  seeAllAppsTemplateButton: '[data-cy="see-all-app-template-buton"]',
  folderLabel: '[data-cy="folder-info"]',
  dashboardAppsHeaderLabel: '[data-cy="app-header-label"]',
  versionLabel: '[data-cy="version-label"]',
  dashboardAppCreateButton: '[data-cy="button-new-app-from-scratch"]',

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
