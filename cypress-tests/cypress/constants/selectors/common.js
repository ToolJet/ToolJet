export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const commonSelectors = {
  toastMessage: ".go3958317564",
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
  pageLogo: "[data-cy=page-logo]",
  workEmailLabel: '[data-cy="work-email-label"]',
  workEmailInputField: "[data-cy=work-email-input]",
  emailInputError: '[data-cy="email-error-message"]',
  passwordLabel: '[data-cy="password-label"]',
  forgotPasswordLink: '[data-cy="forgot-password-link"]',
  passwordInputField: '[data-cy="password-input-field"]',
  signInButton: "[data-cy=login-button]",
  loginButton: '[data-cy="login-button"]',
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
  folderList: ".css-2kg7t4-MenuList",
  empytyFolderImage: "[data-cy=empty-folder-image]",
  emptyFolderText: "[data-cy=empty-folder-text]",
  allApplicationsLink: "[data-cy=all-applications-link]",
  folderInfo: "[data-cy=folder-info]",
  folderInfoText: "[data-cy=folder-info-text]",
  folderCard: "[data-cy=folder-card]",
  folderPageTitle: "[data-cy=folder-page-title]",
  appCreationDetails: "[data-cy=app-creation-details]",
  homePageSearchBar: "[data-cy=home-page-search-bar]",
  editorPageLogo: '[data-cy="editor-page-logo"]',
  viewerPageLogo: '[data-cy="viewer-page-logo"]',
  lastPageArrow: '[data-cy="last-page-link"]',
  nextPageArrow: '[data-cy="next-page-link"]',
  emailFilterInput: '[data-cy="email-filter-input-field"]',
  firstNameFilterInput: '[data-cy="first-name-filter-input-field"]',
  lastNameFilterInput: '[data-cy="last-name-filter-input-field"]',
  filterButton: '[data-cy="filter-button"]',
  copyIcon: '[data-cy="copy-icon"]',
  addWorkspaceButton: '[data-cy="add-new-workspace-link"]',
  workspaceNameInput: '[data-cy="workspace-name-input-field"]',
  createWorkspaceButton: '[data-cy="create-workspace-button"]',
  workspaceLoginUrl: "[data-cy=workspace-login-url]",
  workspaceName: '[data-cy="workspace-name"]',
  signInHeader: '[data-cy="sign-in-header"]',
  signInSubHeader: '[data-cy="sign-in-sub-header"]',
  createAnAccountLink: '[data-cy="create-an-account-link"]',
  SignUpSectionHeader: '[data-cy="signup-section-header"]',
  signInRedirectText: '[data-cy="signin-redirect-text"]',
  signInRedirectLink: '[data-cy="signin-redirect-link"]',
  signUpTermsHelperText: '[data-cy="signup-terms-helper"]',
  termsOfServiceLink: '[data-cy="terms-of-service-link"]',
  privacyPolicyLink: '[data-cy="privacy-policy-link"]',
  redirectURL: '[data-cy="redirect-url"]',
  invitePageHeader: '[data-cy="invite-page-header"]',
  invitePageSubHeader: '[data-cy="invite-page-sub-header"]',
  userNameInputLabel: '[data-cy="name-input-label"]',
  invitedUserName: '[data-cy="invited-user-name"]',
  invitedUserEmail: '[data-cy="invited-user-email"]',
  acceptInviteButton: '[data-cy="accept-invite-button"]',
  profileSettings: '[data-cy="profile-settings"]',
  workspaceSettingsIcon: '[data-cy="workspace-settings-icon"]',
  manageUsersOption: '[data-cy="manage-users-option"]',
  manageGroupsOption: '[data-cy="manage-groups-option"]',
  manageSSOOption: '[data-cy="manage-sso-option"]',
  workspaceVariableOption: '[data-cy="workspace-variable-option"]',
  clearFilterButton: '[data-cy="clear-filter-button"]',
  userStatusSelect: '[data-cy="user-status-select-continer"]',
  emailInputLabel: '[data-cy="email-input-label"]',
  onboardingSeperator: '[data-cy="onboarding-separator"]',
  onboardingSeperatorText: '[data-cy="onboarding-separator-text"]',
  pageTitle: '[data-cy="page-title"]',
  enableToggleLabel: '[data-cy="enable-toggle-label"]',
  enableToggle: '[data-cy="enable-toggle"]',
  mainWrapper: '[data-cy="main-wrapper"]',
  workspaceEditButton: '[data-cy="edit-workspace-button"]',
  dashboardIcon: '[data-cy="dashboard-icon"]',
  notificationsIcon: '[data-cy="notifications-icon"]',
  notificationsCard: '[data-cy="notifications-card"]',
  notificationsCardTitle: '[data-cy="notifications-card-title"]',
  emptyNotificationIcon: '[data-cy="empty-notification-icon"]',
  emptyNotificationTitle: '[data-cy="empty-notification-title"]',
  emptyNotificationSubtitle: '[data-cy="empty-notification-subtitle"]',
  notificationsCardFooter: '[data-cy="notifications-card-footer"]',
  allApplicationLink: '[data-cy="all-applications-link"]',
  logoutLink: "[data-cy=logout-link]",
  exportAllButton: '[data-cy="export-all-button"]',
  avatarImage: '[data-cy="avatar-image"]',
  selfHostSetUpBanner: '[data-cy="setup-banner-inner"]',
  selfHostSetUpSubBanner: '[data-cy="setup-sub-banner"]',
  selfHostSetUpCard: '[data-cy="setup-card"]',
  selfHostSetUpCardImage: '[data-cy="setup-card-image"]',
  selfHostSetUpCardHeader: '[data-cy="setup-card-header"]',
  selfHostSetUpCardSubHeader: '[data-cy="setup-card-sub-header"]',
  setUpToolJetButton: '[data-cy="setup-tooljet-button"]',
  setUpadminCheckPoint: '[data-cy="set-up-admin-check-point"]',
  setUpworkspaceCheckPoint: '[data-cy="set-up-workspace-check-point"]',
  companyProfileCheckPoint: '[data-cy="company-profile-check-point"]',
  onboardingPageHeader: '[data-cy="onboarding-page-header"]',
  onboardingPageSubHeader: '[data-cy="onboarding-page-sub-header"]',
  onboardingPageDescription: '[data-cy="onboarding-page-description"]',
  passwordHelperText: '[data-cy="password-helper-text"]',
  continueButton: '[data-cy="continue-button"]',
  userAccountNameAvatar: '[data-cy="user-account-name-avatar"]',
  workspaceNameInputLabel: '[data-cy="workspace-name-input-label"]',
  workspaceNameInputField: '[data-cy="workspace-name-input-field"]',
  backArrow: '[data-cy="back-arrow"]',
  backArrowText: '[data-cy="back-arrow-text"]',
  onboardingPorgressBubble: '[data-cy="onboarding-progress-bubbles"]',
  skipArrow: '[data-cy="skip-button"]',
  skipArrowText: '[data-cy="skip-arrow-text"]',
  companyNameInputField: '[data-cy="company-name-input-field"]',
  nameInputField: '[data-cy="name-input-field"]',
  emailInputField: '[data-cy="email-input-field"]',
  signUpButton: '[data-cy="sign-up-button"]',
  emailImage: '[data-cy="email-image"]',
  spamMessage: '[data-cy="signup-email-page-spam-msg"]',
  resendEmailButton: '[data-cy="resend-email-button"]',
  editEmailButton: '[data-cy="edit-email-button"]',
  createAccountCheckMark: '[data-cy="create-account-check-mark"]',
  createAccountCheckPoint: '[data-cy="create-account-check-point"]',
  verifyEmailCheckMark: '[data-cy="verify-email-check-mark"]',
  verifyEmailCheckPoint: '[data-cy="verify-email-check-point"]',
  backtoSignUpButton: '[data-cy="back-to-signup-button"]',

  onboardingRadioButton: (radioButtonText) => {
    return `[data-cy="${cyParamName(radioButtonText)}-radio-button"]`;
  },
  onboardingRole: (roleText) => {
    return `[data-cy="${cyParamName(roleText)}-role"]`;
  },

  currentWorkspaceName: (workspaceName) => {
    return `[data-cy="${cyParamName(workspaceName)}-current-workspace-name"]`;
  },

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

  buttonCloseEditorSideBar: "[data-cy='inspector-close-icon']",
  buttonStylesEditorSideBar: "[data-cy='sidebar-option-styles']",
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
  changeLayoutToMobileButton:  '[data-cy="button-change-layout-to-mobile"]',
  changeLayoutToDesktopButton: '[data-cy="button-change-layout-to-desktop"]',

  sidebarinspector: "[data-cy='left-sidebar-inspect-button']",
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
