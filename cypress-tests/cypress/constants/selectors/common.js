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
  folderItemOptions: "[data-cy=folder-item-menu-icon]",
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
  backButton: "[data-cy=back-button]",
  emptyAppCreateButton: "[data-cy=create-new-application]",
  appCreateButton: "[data-cy=create-new-app-button]",
  createButton: "[data-cy=create-button]",
  appNameInput: "[data-cy=app-name-input]",
  dropdown: "[data-cy=workspace-dropdown]",
  launchButton: "[data-cy=launch-button]",
  createFolderButton: "[data-cy=create-new-folder-button]",
  folderNameInput: "[data-cy=folder-name-input]",
  folderCreateButton: "[data-cy=create-folder-button]",
  deleteFolder: "[data-cy=card-options]> :eq(1)",
};

export const commonWidgetSelector = {
  widgetBox: (widgetName) => {
    return `[data-cy=widget-list-box-${cyParamName(widgetName)}]`;
  },

  draggableWidget: (widgetName) => {
    return `[data-cy=draggable-widget-${cyParamName(widgetName)}]`;
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

  accordion: (accordionName, index = 0) => {
    return `[data-cy="widget-accordion-${accordionName.toLowerCase()}"]:eq(${index})`;
  },

  nodeComponent: (componentName) => {
    return `[data-cy="inspector-node-${componentName.toLowerCase()}"]> .node-key`;
  },
  boxShadowParamInput: (label) => {
    return `[data-cy="box-shadow-${label}-input-field"]`;
  },
  colourPickerInput: (index) => {
    return `[id*="rc-editable-input-"]:eq(${index})`;
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
  nodeComponentValues: "[data-cy='inspector-node-values']> .node-key",

  widgetDocumentationLink: "[data-cy='widget-documentation-link']",

  boxShadowDefaultParam: ["x", "y", "blur", "spread"],
};
