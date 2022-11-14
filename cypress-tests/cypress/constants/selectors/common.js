export const cyParamName = (paramName= "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const commonSelectors = {
  toastMessage: ".go318386747",
  toastCloseButton: '[data-cy="toast-close-button"]',
  editButton: "[data-cy=edit-button]",
  searchField: "[data-cy=widget-search-box]",
  firstWidget: "[data-cy=widget-list]:eq(0)",
  canvas: "[data-cy=real-canvas]",
  appCardOptionsButton: "[data-cy=app-card-menu-icon]",
  folderCardOptions: "[data-cy=folder-card-menu-icon]",
  autoSave: "[data-cy=autosave-indicator]",
  skipButton: ".driver-close-btn",
  skipInstallationModal: "[data-cy=skip-button]",
  homePageLogo: "[data-cy=home-page-logo]",
  emailField: "[data-cy=email-text-field]",
  passwordField: "[data-cy=password-text-field]",
  signInButton: "[data-cy=login-button]",
  dropdown: "[data-cy=workspace-dropdown]",
  backButton: "[data-cy=left-sidebar-back-button]",
  emptyAppCreateButton: "[data-cy=create-new-application]",
  appCreateButton: "[data-cy=create-new-app-button]",
  createButton: "[data-cy=create-button]",
  appNameInput: "[data-cy=app-name-input]",
  launchButton: "[data-cy=launch-button]",
  folderNameInput: "[data-cy=folder-name-input]",
  deleteFolderOption: "[data-cy=delete-folder-card-option]",
  editFolderOption: "[data-cy=edit-folder-card-option]",
  deleteAppOption: "[data-cy=delete-app-card-option]",
  cancelButton: "[data-cy=cancel-button]",
  modalComponent: "[data-cy=modal-component]",
  modalMessage: "[data-cy=modal-message]",
  createNewFolderButton: "[data-cy=create-new-folder-button]",
  folderNameInput: "[data-cy=folder-name-input]",
  createFolderButton: "[data-cy=create-folder-button]",
  folderList: "[data-index]",
  empytyFolderImage: "[data-cy=empty-folder-image]",
  emptyFolderText: "[data-cy=empty-folder-text]",
  allApplicationsLink: "[data-cy=all-applications-link]",
  folderInfo: "[data-cy=folder-info]",
  folderInfoText: "[data-cy=folder-info-text]",
  folderCard: "[data-cy=folder-card]",
  folderPageTitle: "[data-cy=folder-page-title]",
  appCreatorName: "[data-cy=app-creator]",
  appCreatedTime: "[data-cy=app-creation-time]",
  homePageSearchBar: "[data-cy=home-page-search-bar]",
  editorPageLogo: '[data-cy="editor-page-logo"]',
  viewerPageLogo: '[data-cy="viewer-page-logo"]',
  lastPageArrow: '[data-cy="last-page-link"]',
  nextPageArrow: '[data-cy="next-page-link"]',
  emailFilterInput: '[data-cy="email-filter-input-field"]',
  firstNameFilterInput: '[data-cy="first-name-filter-input-field"]',
  lastNameFilterInput: '[data-cy="last-name-filter-input-field"]',
  filterButton: '[data-cy="filter-button"]',

  folderListcard: (folderName) => {
    return `[data-cy="${cyParamName(folderName)}-list-card"]`;
  },

  appCard: (appName) => {
    return `[data-cy="${cyParamName(appName)}-card"]`;
  },

  appTitle: (appName) => {
    return `[data-cy="${cyParamName(appName)}-title"]`;
  },

  appCardOptions: (options) => {
    return `[data-cy="${cyParamName(options)}-card-option"]`;
  },

  modalTitle: (title) => {
    return `[data-cy="${cyParamName(title)}-title"]`;
  },
  buttonSelector: (buttonText) => {
    return `[data-cy="${cyParamName(buttonText)}-button"]`;
  },
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
  stylePicker: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-picker"]`;
  },
  stylePickerValueIcon: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-picker-icon"]`;
  },
  stylePickerValue: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-value"]`;
  },
  stylePickerFxInput: (paramName) => {
    return `[data-cy="${cyParamName(paramName)}-input-field"]`;
  },
  validationFeedbackMessage: (widgetName) => {
    return `[data-cy="${widgetName.toLowerCase()}-invalid-feedback"]`;
  },

  buttonCloseEditorSideBar: "[data-rb-event-key='close-inpector-light']",
  buttonStylesEditorSideBar: "[data-rb-event-key='styles']",
  WidgetNameInputField: "[data-cy=edit-widget-name]",

  tooltipInputField: "[data-cy='tooltip-input-field']",
  tooltipLabel: "[id=button-tooltip]",

  noEventHandlerMessage: "[data-cy='no-event-handler-message']",
  addEventHandlerLink: "[data-cy='add-event-handler']",
  addMoreEventHandlerLink: '[data-cy="add-more-event-handler"]',
  eventHandlerCard: "[data-cy='event-handler-card']",
  alertMessageInputField: "[data-cy='alert-message-input-field']",
  eventSelection: '[data-cy="event-selection"]',
  actionSelection: '[data-cy="action-selection"]',
  eventComponentSelection:
    '[data-cy="action-options-component-selection-field"]',
  eventComponentActionSelection:
    '[data-cy="action-options-action-selection-field"]',
  componentTextInput: '[data-cy="action-options-text-input-field"]',
  changeLayoutButton: "[data-cy= 'change-layout-button']",

  sidebarinspector: "[data-cy='left-sidebar-inspector-button']",
  inspectorNodeComponents: "[data-cy='inspector-node-components']> .node-key",
  nodeComponentValue: "[data-cy='inspector-node-value']> .mx-2",
  nodeComponentValues: "[data-cy='inspector-node-values']> .node-key",

  widgetDocumentationLink: "[data-cy='widget-documentation-link']",

  boxShadowDefaultParam: ["x", "y", "blur", "spread"],
  colourPickerParent: "[data-cy='color-picker-parent']",
  inputBoxShadow: "[data-cy= 'input-box-shadow']",
  boxShadowColorPicker: "[data-cy='box-shadow-picker']",
  textInputWidget: '[data-cy="draggable-widget-textinput1"]',
  previewButton: `[data-cy="preview-link-button"]`,
};
