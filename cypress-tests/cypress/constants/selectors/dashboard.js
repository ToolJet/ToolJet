import { cyParamName } from "./common";

export const dashboardSelector = {
  emptyPageImage: '[data-cy="front-end-empty-state-image"]',
  emptyPageHeader: '[data-cy="front-end-empty-state-header"]',
  emptyPageDescription: '[data-cy="front-end-empty-state-description"]',
  emptyPageContainer: '[data-cy="front-end-empty-state"]',
  createAppButton: "[data-cy=create-new-application]",
  importAppButton: '[data-cy="button-import-an-app"]',
  chooseFromTemplate: "[data-cy='choose-from-template-button']",
  modeToggle: '[data-cy="mode-switch-button"]',
  dropdownText: "[data-cy=dropdown-organization-list]>>:eq(0)",
  dropdown: "[data-cy=dropdown-organization-list]",
  editButton: "[data-cy=edit-workspace-name]",
  manageUsers: "[data-cy=manage-users]",
  manageGroups: "[data-cy=manage-groups]",
  ManageSSO: "[data-cy=manage-sso]",
  userMenu: "[data-cy=user-menu]",
  profileLink: "[data-cy=profile-link]",
  logoutLink: '[data-cy="logout-link"]',
  changeIconTitle: "[data-cy=change-icon-title]",
  appCardDefaultIcon: "[data-cy=app-card-apps-icon]",
  changeButton: "[data-cy=change-button]",
  updateFolderTitle: "[data-cy=update-folder-title]",
  selectFolder: '[data-cy="select-folder"]',
  addToFolderButton: "[data-cy=add-to-folder-button]",
  appTemplateRow: '[data-cy="app-template-row"]',
  importDropdownMenu: '[data-cy="import-dropdown-menu"]',
  buildWithAiButton: '[data-cy="build-with-ai-button"]',
  contentToolbar: '[data-cy="content-toolbar"]',
  appsTab: '[data-cy="apps-tab"]',
  modulesTab: '[data-cy="modules-tab"]',
  folderDropdownList: '[data-cy="folder-dropdown-list"]',
  createAppTitle: '[data-cy="create-app-title"]',
  createFolderTitle: '[data-cy="create-folder-title"]',
  headerSearchBar: '[data-cy="header-search-bar"]',
  workspaceSelectorTrigger: '[data-cy="workspace-selector-trigger"]',
  paginationShowingLabel: '[data-cy="pagination-showing-label"]',
  paginationPageSizeSelector: '[data-cy="pagination-page-size-selector"]',
  paginationAppsCount: '[data-cy="pagination-apps-count"]',
  paginationPreviousButton: '[data-cy="pagination-previous-button"]',
  paginationNextButton: '[data-cy="pagination-next-button"]',
  homePageContent: '[data-cy="home-page-content"]',
  seeAllAppsTemplateButton: '[data-cy="see-all-app-template-buton"]',
  folderLabel: '[data-cy="folder-info"]',
  dashboardAppsHeaderLabel: '[data-cy="app-header-label"]',
  versionLabel: '[data-cy="version-label"]',

  changeIconSearch: '[data-cy="change-icon-search"]',
  noMatchingIconsText: '[data-cy="no-matching-results-found-text"]',

  appCardIcon: (iconName) => {
    return `[data-cy="app-card-${cyParamName(iconName)}-icon"]`;
  },
  appIcon: (iconName) => {
    return `[data-cy="icon-${cyParamName(iconName)}"]`;
  },
  folderName: (folderName) => {
    return `[data-cy="${cyParamName(folderName)}-folder-name"]`;
  },

  createWorkspaceTitle: '[data-cy="create-workspace-title"]',
  workspaceNameLabel: '[data-cy="workspace-name-label"]',
  workspaceNameInfoLabel: '[data-cy="workspace-name-info-label"]',
  slugNameInputLabel: '[data-cy="slug-input-label"]',
  workspaceSlugInputField: '[data-cy="workspace-slug-input-field"]',
  slugInfoLabel: '[data-cy="slug-info-label"]',
  workspaceLinkLabel: '[data-cy="workspace-link-label"]',
  slugField: '[data-cy="slug-field"]',
  createWorkspaceButton: '[data-cy="create-workspace-button"]',
  workspaceErrorLabel: '[data-cy="workspace-error-label"]',
  inputLabelError: '[data-cy="input-label-error"]',
  slugSuccessLabel: '[data-cy="slug-sucess-label"]',
  slugErrorLabel: '[data-cy="slug-error-label"]',
  editWorkspaceTitle: '[data-cy="edit-workspace-title"]',

  homePagePromptHeader: '[data-cy="home-page-prompt-header"]',
  promptInput: '[data-cy="prompt-input"]',
  homePageDividerText: '[data-cy="divider-text"]',
  appCardWidget: '[data-cy="getstarted-app-widget"]',
  templateCardWidget: '[data-cy="getstarted-templates-widget"]',
  databaseCardWidget: '[data-cy="getstarted-datasource-widget"]',
  workflowCardWidget: '[data-cy="getstarted-workflow-widget"]',

  widgetCardName: (cardType) => {
    return `[data-cy="getstarted-${cardType}-widget"]`;
  },
  widgetCardTitle: '[data-cy="widget-card-title"]',
  widgetCardDescription: '[data-cy="widget-card-description"]',
  homePagePromptTextArea: '[data-cy="prompt-textarea"]',
  promptEnterButton: '[data-cy="prompt-enter-button"]',
  aiIcon: '[data-cy="ai-icon"]',
  homePageIcon: (iconName) => {
    return `[data-cy="${iconName}s-icon"]`;
  }
};
