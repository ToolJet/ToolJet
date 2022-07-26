export const cyParamName = (paramName) => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const commonSelectors = {
  toastMessage: ".go318386747",
  appCard: "[data-cy=app-card]",
  editButton: "[data-cy=edit-button]",
  searchField: "[data-cy=widget-search-box]",
  firstWidget: "[data-cy=widget-list]:eq(0)",
  canvas: "[data-cy=real-canvas]",
  appCardOptions: "[data-cy=app-card-menu-icon]",
  folderCardOptions: "[data-cy=folder-card-menu-icon]",
  deleteApp: "[data-cy=card-options] :nth-child(5)>span",
  confirmButton: "[data-cy=confirm-yes-button]",
  autoSave: "[data-cy=autosave-indicator]",
  skipButton: ".driver-close-btn",
  skipInstallationModal: "[data-cy=skip-button]",
  homePageLogo: "[data-cy=home-page-logo]:eq(1)",
  emailField: "[data-cy=email-text-field]",
  passwordField: "[data-cy=password-text-field]",
  signInButton: "[data-cy=login-button]",
  dropdown: "[data-cy=workspace-dropdown]",
  backButton: "[data-cy=left-sidebar-back-button]",
  emptyAppCreateButton: "[data-cy=create-new-application]",
  appCreateButton: "[data-cy=create-new-app-button]",
  createButton: "[data-cy=create-button]",
  appNameInput: "[data-cy=app-name-input]",
  dropdown: "[data-cy=workspace-dropdown]",
  launchButton: "[data-cy=launch-button]",
  folderNameInput: "[data-cy=folder-name-input]",
  deleteFolderOption: "[data-cy=delete-folder-card-option]",
  editFolderOption: "[data-cy=edit-folder-card-option]",
  changeIconOption: "[data-cy=change-icon-card-option]",
  addToFolderOption: "[data-cy=add-to-folder-card-option]",
  removeFromFolderOption: "[data-cy=remove-from-folder-card-option]",
  cloneAppOption: "[data-cy=clone-app-card-option]",
  exportAppOption: "[data-cy=export-app-card-option]",
  deleteAppOption: "[data-cy=delete-app-card-option]",
  modalCloseButton: "[data-cy=modal-close-button]",
  cancelButton: "[data-cy=cancel-button]",
  modalComponent: "[data-cy=modal-component]",
  modalMessage: "[data-cy=modal-message]",
  modalCancelButton: "[data-cy=confirm-cancel-button]",
  modalYesButton: "[data-cy=confirm-yes-button]",
  createNewFolderButton: "[data-cy=create-new-folder-button]",
  createFolderTitle: "[data-cy=create-folder-title]",
  folderNameInput: "[data-cy=folder-name-input]",
  createFolderButton: "[data-cy=create-folder-button]",
  folderList: "[data-index]",
  empytyFolderImage: "[data-cy=empty-folder-image]",
  emptyFolderText: "[data-cy=empty-folder-text]",
  allApplicationsLink: "[data-cy=all-applications-link]",
  folderInfo: "[data-cy=folder-info]",
  folderInfoText: "[data-cy=folder-info-text]",
  folderCard: "[data-cy=folder-card]",
  updateFolderTitle: "[data-cy=update-folder-title]",
  updateFolderButton: "[data-cy=update-folder-button]",
  folderPageTitle: "[data-cy=folder-page-title]",
  appTitle: "[data-cy=app-title]",
  appCreatorName: "[data-cy=app-creator]",
  appCreatedTime: "[data-cy=app-creation-time]",
};

export const commonWidgetSelector = {
  widgetBox: (widgetName) => {
    return `[data-cy=widget-list-box-${cyParamName(widgetName)}]`;
  },

  parameterLabel: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-widget-parameter-label"]`;
  },

  parameterInputField: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-input-field"]`;
  },

  parameterTogglebutton: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-toggle-button"]`;
  },

  parameterFxButton: (paramName, childIndex = "") => {
    return `[data-cy="${cyParamName(paramName)}-fx-button"]${childIndex}`;
  },

  widgetConfigHandle: (widgetName) => {
    return `[data-cy="${cyParamName(widgetName)}-config-handle"]`;
  },

  accordion: (accordionName) => {
    return `[data-cy="widget-accordion-${accordionName.toLowerCase()}"]:eq(0)`;
  },

  nodeComponent: (componentName) => {
    return `[data-cy="inspector-node-${componentName.toLowerCase()}"]> .node-key`;
  },

  buttonCloseEditorSideBar: "[data-rb-event-key='close-inpector-light']",
  buttonStylesEditorSideBar: "[data-rb-event-key='styles']",
  WidgetNameInputField: "[data-cy=edit-widget-name]",

  tooltipInputField: "[data-cy='tooltip-input-field']",
  tooltipLabel: "[id=button-tooltip]",

  noEventHandlerMessage: "[data-cy='no-event-handler-message']",
  addEventHandlerLink: "[data-cy='add-event-handler']",
  eventHandlerCard: "[data-cy='event-handler-card']",
  alertMessageInputField: "[data-cy='alert-message-input-field']",
  changeLayoutButton: "[data-cy= 'change-layout-button']",

  sidebarinspector: "[data-cy='left-sidebar-inspector-button']",
  inspectorNodeComponents: "[data-cy='inspector-node-components']> .node-key",
  nodeComponentValue: "[data-cy='inspector-node-value']> .mx-2",

  widgetDocumentationLink: "[data-cy='widget-documentation-link']",
};
