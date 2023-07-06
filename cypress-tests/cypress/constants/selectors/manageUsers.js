import { cyParamName } from "./common";

export const usersSelector = {
  dropdown: "[data-cy=workspace-dropdown]",
  buttonAddUsers: "[data-cy=button-invite-new-user]",
  usersElements: {
    usersTableNameColumnHeader: '[data-cy="users-table-name-column-header"]',
    usersTableEmailColumnHeader: '[data-cy="users-table-email-column-header"]',
    usersTableStatusColumnHeader:
      '[data-cy="users-table-status-column-header"]',
    usersFilterLabel: '[data-cy="users-filter-label"]',
  },
  usersPageTitle: '[data-cy="title-users-page"]',
  userFilterInput: '[data-cy="users-filter-input"]',
  adminUserName: "[data-cy=user-name]",
  adminUserEmail: "[data-cy=user-email]",
  userState: "[data-cy=user-state]:eq(0)",
  addUsersCardTitle: '[data-cy="add-users-card-title"]',

  inputFieldName: "[data-cy=first-name-input]",
  lastNameInput: "[data-cy=last-name-input]",
  emailLabel: "[data-cy=email-label]",
  emailInput: "[data-cy=email-input]",
  cancelButton: "[data-cy=cancel-button]",
  buttonInviteUsers: '[data-cy="button-invite-users"]',
  buttonInviteWithEmail: '[data-cy="button-invite-with-email"]',
  buttonUploadCsvFile: '[data-cy="button-upload-csv-file"]',
  fullNameError: '[data-cy="error-message-fullname"]',
  emailError: '[data-cy="error-message-email"]',
  pageLogo: "[data-cy=page-logo]",
  invitePageHeader: '[data-cy="invite-page-header"]',
  invitePgaeSubHeader: '[data-cy="invite-page-sub-header"]',
  acceptInvite: "[data-cy=accept-invite-button]",
  firstNameField: "[data-cy=first-name-input]",
  lastNameField: "[data-cy=last-name-input]",
  workspaceField: "[data-cy=workspace-input]",
  roleOptions: "[data-cy=role-options]",
  passwordInput: "[data-cy=password-input]",
  confirmPasswordInput: "[data-cy=confirm-password-input]",
  finishSetup: "[data-cy=finish-setup-button]",
  emptyImage: "[data-cy=empty-img]",
  manageUsers: "[data-cy=manage-users]",
  createNewApp: "[data-cy=create-new-application]",
  dropdownText: "[data-cy=dropdown-organization-list]>>:eq(0)",
  arrowIcon: "[data-cy=workspace-arrow-icon]",
  singleWorkspaceElements: {
    cardTitle: "[data-cy=card-title]",
    passwordLabel: "[data-cy=password-label]",
    confirmpasswordLabel: "[data-cy=confirm-password-label]",
    termsInfo: "[data-cy=terms-and-condition-info]",
  },
  inviteBulkUserButton: '[data-cy="invite-bulk-user-button"]',
  bulkUserUploadPageTitle: '[data-cy="bulk-user-upload-page-title"]',
  bulkUSerUploadInput: '[data-cy="bulk-user-upload-input"]',
  buttonDownloadTemplate: '[data-cy="button-download-template"]',
  buttonUploadUsers: '[data-cy="button-upload-users"]',
  helperTextBulkUpload: '[data-cy="helper-text-bulk-upload"]',
  iconBulkUpload: '[data-cy="icon-bulk-upload"]',
  helperTextSelectFile: '[data-cy="helper-text-select-file"]',
  helperTextDropFile: '[data-cy="helper-text-drop-file"]',
  inputFieldBulkUpload: '[data-cy="input-field-bulk-upload"]',
  copyInvitationLink: '[data-cy="copy-invitation-link"]',
  uploadedFileData: '[data-cy="uploaded-file-data"]',
  toastCloseButton:
    '.drawer-container > [style="position: fixed; z-index: 9999; inset: 16px; pointer-events: none;"] > .go4109123758 > .go2072408551 > [data-cy="toast-close-button"]',


  userName: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-name"]`;
  },
  userEmail: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-email"]`;
  },
  userStatus: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-status"]`;
  },

};
