export const cyParamName = (paramName = "") => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};

export const commonSelectors = {
  toastMessage: ".go3958317564",
  oldToastMessage: ".go318386747",
  appSlugAccept: '[data-cy="app-slug-accepted-label"]',
  newToastMessage: '.drawer-container > [style="position: fixed; z-index: 9999; inset: 16px; pointer-events: none;"] > .go4109123758 > .go2072408551 > .go3958317564',
  toastCloseButton: '[data-cy="toast-close-button"]',
  editButton: "[data-cy=edit-button]",
  workspaceConstantNameInput: '[data-cy="name-input-field"]',
  workspaceConstantValueInput: '[data-cy="value-input-field"]',
  fileSelector: "[data-cy=uploaded-file-data]",
  searchField: "[data-cy='widget-search-box-search-bar']",
  firstWidget: "[data-cy=widget-list]:eq(0)",
  canvas: "[data-cy=real-canvas]",
  appCardOptionsButton: "[data-cy=app-card-menu-icon]",
  autoSave: "[data-cy=autosave-indicator]",
  nameInputFieldd: "[data-cy=name-input-field]",
  valueInputFieldd: '[data-cy=value-input-field]',
  skipButton: ".driver-close-btn",
  skipInstallationModal: "[data-cy=skip-button]",
  homePageLogo: "[data-cy=home-page-logo]",
  pageLogo: "[data-cy=page-logo]",
  workEmailLabel: '[data-cy="work-email-label"]',
  workEmailInputField: "[data-cy=work-email-input]",
  emailInputError: '[data-cy="email-error-message"]',
  passwordLabel: '[data-cy="password-input-label"]',
  forgotPasswordLink: '[data-cy="forgot-password-link"]',
  passwordInputField: '[data-cy="password-input-input"]',
  signInButton: "[data-cy=login-button]",
  loginButton: '[data-cy="login-button"]',
  dropdown: "[data-cy=workspace-dropdown]",
  backButton: "[data-cy=left-sidebar-back-button]",
  dashboardAppCreateButton: '[data-cy="button-new-app-from-scratch"]',
  appCreateButton: "[data-cy=create-new-app-button]",
  createButton: "[data-cy=create-button]",
  appNameInput: "[data-cy=app-name-input]",
  launchButton: "[data-cy=launch-button]",
  folderNameInput: "[data-cy=folder-name-input]",
  deleteAppOption: "[data-cy=delete-app-card-option]",
  cancelButton: "[data-cy=cancel-button]",
  modalComponent: "[data-cy=modal-component]",
  modalMessage: "[data-cy=modal-message]",
  createNewFolderButton: "[data-cy=create-new-folder-button]",
  folderNameInput: "[data-cy=folder-name-input]",
  createFolderButton: "[data-cy=create-folder-button]",
  folderList: ".react-select__menu-list",
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
  inputUserSearch: '[data-cy="input-field-user-filter-search"]',
  filterButton: '[data-cy="filter-button"]',
  copyIcon: '[data-cy="copy-icon"]',
  addWorkspaceButton: '[data-cy="add-new-workspace-link"]',
  createWorkspaceButton: '[data-cy="create-workspace-button"]',
  workspaceLoginUrl: "[data-cy=workspace-login-url]",
  workspaceName: '[data-cy="workspace-name"]:eq(0)',
  signInHeader: '[data-cy="sign-in-header"]',
  signInSubHeader: '[data-cy="signup-info"]',
  createAnAccountLink: '[data-cy="create-an-account-link"]',
  signUpSectionHeader: '[data-cy="sign-up-header"]',
  signInRedirectText: '[data-cy="signin-redirect-text"]',
  signInRedirectLink: '[data-cy="signin-link"]',
  signUpTermsHelperText: '[data-cy="signup-terms-helper"]',
  termsOfServiceLink: '[data-cy="terms-of-service-link"]',
  privacyPolicyLink: '[data-cy="privacy-policy-link"]',
  redirectURL: '[data-cy="redirect-url"]',
  invitePageHeader: '[data-cy="join-my-workspace-header"]',
  invitePageSubHeader: '[data-cy="onboarding-page-description"]',
  userNameInputLabel: '[data-cy="name-input-label"]',
  invitedUserName: '[data-cy="name-input-input-value"]',
  invitedUserEmail: '[data-cy="email-input-value"]',
  invitedUseremail: '[data-cy="email-input-input-value"]',
  acceptInviteButton: '[data-cy="accept-invite-button"]',
  databaseIcon: '[data-cy="icon-database"]',
  profileSettings: '[data-cy="profile-settings"]',
  workspaceSettings: '[data-cy="workspace-settings"]',
  manageUsersOption: '[data-cy="users-list-item"]',
  manageGroupsOption: '[data-cy="groups-list-item"]',
  manageSSOOption: '[data-cy="workspace-login-list-item"]',
  workspaceVariableOption: '[data-cy="workspace-variables-list-item"]',
  clearFilterButton: '[data-cy="clear-filter-button"]',
  userStatusSelect: '[data-cy="user-status-select-continer"]',
  emailInputLabel: '[data-cy="email-input-label"]',
  onboardingSeperator: '[data-cy="onboarding-separator"]',
  onboardingSeperatorText: '[data-cy="onboarding-separator-text"]',
  pageTitle: '[data-cy="page-title"]',
  enableToggleLabel: '[data-cy="enable-toggle-label"]',
  enableToggle: '[data-cy="enable-toggle"]',
  mainWrapper: '[data-cy="main-wrapper"]',
  editRectangleIcon: '[data-cy="edit-rectangle-icon"]',
  dashboardIcon: '[data-cy="icon-dashboard"]',
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
  HostBanner: '[data-cy="onboarding-image"]',
  adminSetup: '[data-cy="set-up-your-admin-account-header"]',
  signupTerms: '[data-cy="signup-terms-helper"]',
  selfHostSetUpSubBanner: '[data-cy="setup-sub-banner"]',
  selfHostSetUpCard: '[data-cy="setup-card"]',
  selfHostSetUpCardImage: '[data-cy="setup-card-image"]',
  selfHostSetUpCardHeader: '[data-cy="setup-card-header"]',
  selfHostSetUpCardSubHeader: '[data-cy="setup-card-sub-header"]',
  setUpToolJetButton: '[data-cy="setup-tooljet-button"]',
  setUpadminCheckPoint: '[data-cy="set-up-admin-check-point"]',
  setUpworkspaceCheckPoint: '[data-cy="set-up-your-workspace!-header"]',
  companyProfileCheckPoint: '[data-cy="company-profile-check-point"]',
  onboardingPageHeader: '[data-cy="onboarding-page-header"]',
  onboardingPageSubHeader: '[data-cy="onboarding-page-sub-header"]',
  onboardingPageDescription: '[data-cy="onboarding-page-description"]',
  passwordHelperText: '[data-cy="new-password-input-hint"]',
  continueButton: '[data-cy="continue-button"]',
  passwordHelperTextSignup: '[data-cy="password-input-hint"]',
  continueButton: '[data-cy="sign-up-button"]',
  OnbordingContinue: '[data-cy="onboarding-submit-button"]',
  userAccountNameAvatar: '[data-cy="user-account-name-avatar"]',
  workspaceNameInputLabel: '[data-cy="onboarding-workspace-name-label"]',
  workspaceNameInputField: '[data-cy="onboarding-workspace-name-input"]',
  workspaceNameinput: '[data-cy="workspace-name-input-field"]',
  backArrow: '[data-cy="back-arrow"]',
  backArrowText: '[data-cy="back-arrow-text"]',
  onboardingPorgressBubble: '[data-cy="onboarding-progress-bubbles"]',
  skipArrow: '[data-cy="skip-button"]',
  skipArrowText: '[data-cy="skip-arrow-text"]',
  companyNameInputField: '[data-cy="company-name-input-field"]',
  nameInputField: '[data-cy="name-input-input"]',
  emailInputField: '[data-cy="email-input-input"]',
  skipbutton: '[class="driver-close-btn"]',
  backLogo: '[data-cy="editor-page-logo"]',
  backtoapps: '[data-cy="back-to-app-option"]',
  signUpButton: '[data-cy="sign-up-button"]',
  emailImage: '[data-cy="email-image"]',
  spamMessage: '[data-cy="info-message"]',
  resendEmailButton: '[data-cy="resend-verification-email-button"]',
  editEmailButton: '[data-cy="edit-email-button"]',
  createAccountCheckMark: '[data-cy="create-account-check-mark"]',
  createAccountCheckPoint: '[data-cy="create-account-check-point"]',
  verifyEmailCheckMark: '[data-cy="verify-email-check-mark"]',
  verifyEmailCheckPoint: '[data-cy="verify-email-check-point"]',
  backtoSignUpButton: '[data-cy="back-to-signup-button"]',
  forgotPasswordPageHeader: '[data-cy="forgot-password-header"]',
  forgotPasswordPageSubHeader: '[data-cy="signup-redirect-text"]',
  resetPasswordLinkButton: '[data-cy="send-a-reset-link-button"]',
  enterIcon: '[data-cy="enter-icon"]',
  passwordResetPageHeader: '[data-cy="reset-password-header"]',
  newPasswordInputLabel: '[data-cy="new-password-input-label"]',
  newPasswordInputField: '[data-cy="new-password-input-input"]',
  confirmPasswordInputFieldLabel: '[data-cy="confirm-password-input-label"]',
  confirmPasswordInputField: '[data-cy="confirm-password-input-input"]',
  resetPasswordButton: '[data-cy="reset-password-button"]',
  resetPasswordPageDescription: '[data-cy="reset-password-page-description"]',
  backToLoginButton: '[data-cy="back-to-login"]',
  breadcrumbTitle: '[data-cy="app-header-label"]>>',
  // breadcrumbPageTitle: '[data-cy="app-header-label"]',
  breadcrumbPageTitle: '[data-cy="breadcrumb-page-title"]',
  labelFullNameInput: '[data-cy="name-label"]',
  duplicateOption: '[data-cy="duplicate-group-card-option"]',
  confirmDuplicateButton: '[data-cy="confim-button"]',
  inputFieldFullName: '[data-cy="name-input"]',
  labelEmailInput: '[data-cy="email-label"]',
  inputFieldEmailAddress: '[data-cy="email-input"]',
  closeButton: '[data-cy="close-button"]',
  emptyAppCreateButton: "[data-cy='button-new-app-from-scratch']",
  globalDataSourceIcon: '[data-cy="icon-global-datasources"]',
  addNewDataSourceButton: '[data-cy="add-new-data-source-button"]',
  saveButton: '[data-cy="save-button"]',
  appEditButton: '[data-cy="edit-button"]',
  onboardingRadioButton: (radioButtonText) => {
    return `[data-cy="${cyParamName(radioButtonText)}-radio-button"]`;
  },
  onboardingRole: (roleText) => {
    return `[data-cy="${cyParamName(roleText)}-role"]`;
  },

  currentWorkspaceName: (workspaceName) => {
    return `[data-cy="${cyParamName(workspaceName)}-current-workspace-name"]`;
  },
  appHeaderLable: '[data-cy="app-header-label"]',

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

  folderCardOptions: (folderName) => {
    return `[data-cy="${cyParamName(folderName)}-card-menu-icon"]`;
  },
  deleteFolderOption: (folderName) => {
    return `[data-cy="${cyParamName(folderName)}-delete-folder-option"]`;
  },
  editFolderOption: (folderName) => {
    return `[data-cy="${cyParamName(folderName)}-edit-folder-option"]`;
  },
  inspectorPinIcon: '.d-flex > [data-cy="left-sidebar-inspector"]',
  groupInputFieldLabel: '[data-cy="user-group-label"]',
  pageSectionHeader: '[data-cy="dashboard-section-header"]',
  yesButton: '[data-cy="yes-button"]',

  documentationLink: '[data-cy="read-documentation-option-button"]',
  nameLabel: '[data-cy="name-label"]',
  valueLabel: '[data-cy="value-label"]',
  valueInputField: '[data-cy="value-input-field"]',
  yesButton: '[data-cy="yes-button"]',
  pagination: '[data-cy="pagination-section"]',
  workspaceConstantsOption: '[data-cy="workspace-constants-list-item"]',
  nameErrorText: '[data-cy="name-error-text"]',
  valueErrorText: '[data-cy="value-error-text"]',
  releaseButton: '[data-cy="button-release"]',
  leftSideBarSettingsButton: '[data-cy="left-sidebar-settings-button"]',
  modalHeader: '[data-cy="modal-header"]',
  modalDescription: '[data-cy="modal-description"]',
  backToHomeButton: '[data-cy="back-to-home-button"]',
  createAppTitle: '[data-cy="create-app-title"]',
  appNameLabel: '[data-cy="app-name-label"]',
  appNameInput: '[data-cy="app-name-input"]',
  appNameInfoLabel: '[data-cy="app-name-info-label"]',
  createAppButton: '[data-cy="+-create-app"]',
  renameApptitle: '[data-cy="rename-app-title"]',
  renameAppButton: '[data-cy="rename-app"]',
  cloneAppTitle: '[data-cy="clone-app-title"]',
  cloneAppButton: '[data-cy="clone-app"]',
  appNameErrorLabel: '[data-cy="app-name-error-label"]',
  importAppTitle: '[data-cy="import-app-title"]',
  importAppButton: '[data-cy="import-app"]',
  chooseFromTemplateButton: '[data-cy="choose-from-template-button"]',
  CreateAppFromTemplateButton: '[data-cy="create-new-app-from-template-title"]',
  settingsIcon: '[data-cy="settings-icon"]',
  marketplaceOption: '[data-cy="marketplace-option"]',
  backToAppOption: '[data-cy="back-to-app-option"]',
  databaseOption: '[data-cy="database-option"]',
  datasourceOption: '[data-cy="data-source-option"]',
  workspaceConstantsOption: '[data-cy="workspace-constants-option"]',
  label: (labelName) => {
    return `[data-cy="${labelName
      .replace(/\s+|(?<=[\w-])\s+(?=\w)|[^\w\s]/g, "-")
      .toLowerCase()}-label"]`;
  },
  defaultModalTitle: '[data-cy="modal-title"]',
  workspaceConstantsIcon: '[data-cy="icon-workspace-constants"]',
  confirmationButton: '[data-cy="confirmation-button"]',
};

export const commonWidgetSelector = {
  widgetBox: (widgetName) => {
    return `[data-cy=widget-list-box-${cyParamName(widgetName)}]:eq(0)`;
  },

  draggableWidget: (widgetName) => {
    return `[data-cy=draggable-widget-${cyParamName(widgetName)}]`;
  },
  textInputInputField: (widgetName) => {
    return `[data-cy=input-${cyParamName(widgetName)}]`;
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
  buttonStylesEditorSideBar: "#inspector-tab-styles",
  WidgetNameInputField: "[data-cy=edit-widget-name]",
  constantInspectorIcon: '[data-cy="inspector-node-constants"]  > .node-key',
  inspectorIcon: '[data-cy="left-sidebar-inspect-button"]',
  tooltipInputField: "[data-cy='tooltip-input-field']",
  tooltipLabel: "[id=button-tooltip]",
  homePageLogo: '[data-cy="home-page-logo"]',

  noEventHandlerMessage: "[data-cy='no-items-banner']",
  addEventHandlerLink: "[data-cy='add-event-handler']",
  addMoreEventHandlerLink: '[data-cy="add-event-handler"]',
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
  changeLayoutToMobileButton: '[data-cy="button-change-layout-to-mobile"]',
  changeLayoutToDesktopButton: '[data-cy="button-change-layout-to-desktop"]',

  sidebarinspector: "[data-cy='left-sidebar-inspect-button']",
  inspectorNodeComponents: "[data-cy='inspector-node-components']> .node-key",
  nodeComponentValue: "[data-cy='inspector-node-value']> .mx-2",
  nodeComponentValues: "[data-cy='inspector-node-values']> .node-key",
  slugAccept: '[data-cy="app-slug-accepted-label"]',
  widgetDocumentationLink: "[data-cy='widget-documentation-link']",

  boxShadowDefaultParam: ["x", "y", "blur", "spread"],
  colourPickerParent: "[data-cy='color-picker-parent']",
  inputBoxShadow: "[data-cy= 'input-box-shadow']",
  boxShadowColorPicker: "[data-cy='box-shadow-picker']",
  textInputWidget: '[data-cy="draggable-widget-textinput1"]',
  previewButton: `[data-cy="preview-link-button"]`,
  defaultValueInputField: '[data-cy="default-value-input-field"]',
  alertInfoText: '[data-cy="alert-info-text"]',
  shareAppButton: '[data-cy="share-button-link"]',
  shareModalElements: {
    modalHeader: '[data-cy="modal-header"]',
    makePublicAppToggleLabel: '[data-cy="make-public-app-label"]',
    shareableAppLink: '[data-cy="shareable-app-link-label"]',
    // iframeLinkLabel: '[data-cy="iframe-link-label"]',
    // ifameLinkCopyButton: '[data-cy="iframe-link-copy-button"]',
  },
  copyAppLinkButton: '[data-cy="copy-app-link-button"]',
  makePublicAppToggle: '[data-cy="make-public-app-toggle"]',
  appLink: '[data-cy="app-link"]',
  appNameSlugInput: '[data-cy="app-name-slug-input"]',
  iframeLink: '[data-cy="iframe-link"]',
  modalCloseButton: '[data-cy="modal-close-button"]',
  iframeLinkLabel: '[data-cy="iframe-link-label"]',
  ifameLinkCopyButton: '[data-cy="iframe-link-copy-button"]',
  appSlugLabel: '[data-cy="input-field-label"]',
  appSlugInput: '[data-cy="app-slug-input-field"]',
  appSlugInfoLabel: '[data-cy="helper-text"]',
  appLinkLabel: '[data-cy="app-link-label"]',
  appLinkField: '[data-cy="app-link-field"]',
  appSlugErrorLabel: '[data-cy="app-slug-error-label"]',
  appLinkSucessLabel: '[data-cy="app-link-success-label"]',
};
