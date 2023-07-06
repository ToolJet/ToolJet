export const codeMirrorInputLabel = (content) => {
  return ["{{", `${content}}}`];
};

export const path = {
  loginPath: "/login",
  profilePath: "/settings",
  confirmInvite: "/confirm",
  database: "/database",
};

export const commonText = {
  autoSave: "Saved changes",
  email: "dev@tooljet.io",
  password: "password",
  loginErrorToast: "Invalid email or password",
  welcomeTooljetWorkspace: "Welcome to your new ToolJet workspace",
  introductionMessage:
    "You can get started by creating a new application or by creating an application using a template in ToolJet Library.",
  changeIconOption: "Change Icon",
  addToFolderOption: "Add to folder",
  removeFromFolderOption: "Remove from folder",
  cloneAppOption: "Clone app",
  exportAppOption: "Export app",
  deleteAppOption: "Delete app",
  cancelButton: "Cancel",
  folderCreatedToast: "Folder created.",
  createFolder: "Create folder",
  AddedToFolderToast: "Added to folder.",
  appRemovedFromFolderMessage:
    "The app will be removed from this folder, do you want to continue?",
  appRemovedFromFolderTaost: "Removed from folder.",
  modalYesButton: "Yes",
  emptyFolderText: "This folder is empty",
  allApplicationsLink: "All applications",
  deleteAppModalMessage: (appName) => {
    return `The app ${appName} and the associated data will be permanently deleted, do you want to continue?`;
  },
  appDeletedToast: "App deleted successfully.",
  folderDeletedToast: "Folder has been deleted.",
  createNewFolderButton: "+ Create new folder",
  folderInfo: "Folders",
  folderInfoText:
    "You haven't created any folders. Use folders to organize your apps",
  createFolderButton: "Create folder",
  editFolderOption: "Edit folder",
  deleteFolderOption: "Delete folder",
  updateFolderTitle: "Update folder",
  updateFolderButton: "Update folder",
  folderDeleteModalMessage: (folderName) => {
    `Are you sure you want to delete the folder ${folderName}? Apps within the folder will not be deleted.`;
  },
  closeButton: "modal close",
  workEmailLabel: "Email",
  emailInputError: "Invalid Email",
  passwordLabel: "Password",
  forgotPasswordLink: "Forgot?",
  loginButton: " Login",
  signInHeader: "Sign in",
  signInSubHeader: "New to ToolJet?Create an account",
  SignUpSectionHeader: "Join ToolJet",
  signInRedirectText: "Already have an account?",
  signInRedirectLink: "Sign in",
  signUpTermsHelperText: "By signing up you are agreeing to the",
  termsOfServiceLink: "Terms of Service ",
  privacyPolicyLink: " Privacy Policy",
  invitePageHeader: "Join My workspace",
  invitePageSubHeader:
    "You are invited to a workspace My workspace. Accept the invite to join the workspace.",
  userNameInputLabel: "Name",
  acceptInviteButton: "Accept invite",
  createButton: "Create",
  saveChangesButton: "Save changes",
  emailInputLabel: "Email",
  allApplicationLink: "All apps",
  notificationsCardTitle: "Notifications",
  emptyNotificationTitle: "You're all caught up!",
  emptyNotificationSubtitle: "You don't have any unread notifications!",
  viewReadNotifications: "View read notifications",
  logoutLink: "Logout",

  backArrowText: "Back",
  skipArrowText: "Skip",
  selfHostSetUpCardHeader: "Hello, Welcome to ToolJet!",
  selfHostSetUpCardSubHeader:
    "Let’s set up your workspace to get started with ToolJet",
  setUpToolJetButton: "Set up ToolJet",
  setUpadminCheckPoint: "Set up admin",
  setUpworkspaceCheckPoint: "Set up workspace",
  companyProfileCheckPoint: "Company profile",
  setUpAdminHeader: "Set up your admin account",
  onboardingPageSubHeader: "This information will help us improve ToolJet.",
  passwordHelperText: "Password must be at least 5 characters",
  continueButton: "Continue",
  resetPasswordButton: "Reset password",
  setUpWorkspaceHeader: "Set up your workspace",
  userRolePageHeader: "What best describes your role?",
  sizeOftheCompanyHeader: "What is the size of your company?",
  workspaceNameInputLabel: "Workspace name",
  onboardingSeperatorText: "OR",
  getStartedButton: "Get started for free",
  emailPageHeader: "Check your mail",
  spamMessage: "Did not receive an email? Check your spam folder.",
  resendEmailButton: "Resend verification mail",
  editEmailButton: "Edit email address",
  emailVerifiedText: "Successfully verified email",
  continueToSetUp: "Continue to set up your workspace to start using ToolJet.",
  createAccountCheckPoint: "Create account",
  verifyEmailCheckPoint: "Verify email",
  inalidInvitationLinkHeader: "Invalid verification link",
  inalidInvitationLinkDescription: "This verification link is invalid.",
  backtoSignUpButton: "Back to signup",
  createAnAccountLink: "Create an account",
  forgotPasswordPageHeader: "Forgot Password",
  newToTooljetText: "New to",
  emailAddressLabel: "Email address",
  resetPasswordLinkButton: " Send a reset link",
  passwordResetEmailToast:
    "Please check your email/inbox for the password reset link",
  passwordResetPageHeader: "Reset Password",
  passwordResetSuccessPageHeader: "Password has been reset",
  newPasswordInputLabel: "New Password",
  confirmPasswordInputFieldLabel: "Re-enter the password",
  passwordResetSuccessToast: "Password reset successfully",
  backToLoginButton: "Back to log in",
  resetPasswordPageDescription:
    "Your password has been reset successfully, log into ToolJet to continue your session",
  labelFullNameInput: "Enter full name",
  labelEmailInput: "Email address",
  breadcrumbworkspaceSettingTitle: "Workspace settings",
  breadcrumbGlobalDatasourceTitle: "Global datasources",
  breadcrumbDatabaseTitle: "Databse",
  breadcrumbApplications: "Applications",
  breadcrumbSettings: "Settings",
  addNewDataSourceButton: "Add new datasource",

  emailPageDescription: (email) => {
    return `We’ve sent an email to ${email} with a verification link. Please use that to verify your email address.`;
  },
  companyPageHeader: (userName) => {
    return `Where do you work ${userName}?`;
  },
  resetPasswordEmailDescription: (email) => {
    return `We’ve sent an email to ${email} with a password reset link. Please click on that link to reset your password.`;
  },
  userJobRole: {
    HeadOfEngineering: "Head of engineering",
    headOfProduct: "Head of product",
    CioCto: "CIO/CTO",
    softwareEnginner: "Software engineer",
    dataScientist: "Data scientist",
    productManager: "Product manager",
    other: "Other",
  },
  companySize: {
    uptoTen: "1-10",
    uptoFifty: "11-50",
    uptoHundred: "51-100",
    uptoFiveHundred: "101-500",
    uptoThousand: "501-1000",
    ThousandPlus: "1000+",
  },
  selfHostSignUpTermsHelperText: "By continuing you are agreeing to the",

  shareModalElements: {
    modalHeader: "Share",
    makePublicAppToggleLabel: "Make application public?",
    shareableAppLink: "Get shareable link for this application",
    copyAppLinkButton: "copy",
    iframeLinkLabel: "Get embeddable link for this application",
    ifameLinkCopyButton: "copy",
  },
};

export const commonWidgetText = {
  accordionProperties: "Properties",
  accordionEvents: "Events",
  accordionGenaral: "General",
  accordionValidation: "Validation",
  accordionLayout: "Layout",

  parameterCustomValidation: "Custom validation",
  parameterShowOnDesktop: "Show on desktop",
  parameterShowOnMobile: "Show on mobile",
  parameterVisibility: "Visibility",
  parameterDisable: "Disable",
  parameterBorderRadius: "Border Radius",
  borderRadiusInput: ["{{", "20}}"],
  parameterOptionLabels: "Option labels",
  parameterBoxShadow: "Box Shadow",
  boxShadowDefaultValue: "0px 0px 0px 0px #00000040",
  parameterOptionvalues: "Option values",
  boxShadowColor: "Box Shadow Color",
  boxShadowFxValue: "-5px 6px 5px 8px #ee121240",

  codeMirrorLabelTrue: "{{true}}",
  codeMirrorLabelFalse: "{{false}}",
  codeMirrorInputTrue: codeMirrorInputLabel(true),
  codeMirrorInputFalse: codeMirrorInputLabel("false"),

  addEventHandlerLink: "+ Add event handler",
  inspectorComponentLabel: "components",
  componentValueLabel: "Value",
  labelDefaultValue: "Default Value",
  parameterLabel: "Label",
  labelMinimumValue: "Minimum value",
  labelMaximumValue: "Maximum value",
  labelPlaceHolder: "Placeholder",
  labelRegex: "Regex",
  labelMinLength: "Min length",
  labelMaxLength: "Max length",
  labelcustomValidadtion: "Custom validation",
  regularExpression: "^[A-Z]*$",

  regexValidationError: "The input should match pattern",
  minLengthValidationError: (value) => {
    return `Minimum ${value} characters is needed`;
  },
  maxLengthValidationError: (value) => {
    return `Maximum ${value} characters is allowed`;
  },

  datepickerDocumentationLink: "Datepicker documentation",
  text1: "text1",
  textinput1: "textinput1",
  toggleswitch1: "toggleswitch1",
  toggleSwitch: "Toggle Switch",
  button1: "button1",
  image1: "image1",
};

export const createBackspaceText = (text) => {
  let backspace = "{end}";
  [...text].forEach((c) => {
    backspace += "{backspace}{del}";
  });
  return backspace;
};

export const widgetValue = (widgetName) => {
  return ["{{", `components.${widgetName}.value}}`];
};

export const customValidation = (name, message) => {
  return ["{{", `components.${name}.value ? true : '${message}'}}`];
};
