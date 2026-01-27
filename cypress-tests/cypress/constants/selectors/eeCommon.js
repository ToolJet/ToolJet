import { cyParamName } from "./common";

export const commonEeSelectors = {
  instanceSettingIcon: '[data-cy="instance-settings-option"]',
  auditLogIcon: '[data-cy="audit-log-option"]',
  cancelButton: '[data-cy="cancel-button"]',
  saveButton: '[data-cy="save-button"]',
  pageTitle: '[data-cy="dashboard-section-header"]',
  modalTitle: '[data-cy="modal-title"]',
  modalCloseButton: '[data-cy="modal-close-button"]',
  saveButton: '[data-cy="save-button"]',
  cardTitle: '[data-cy="card-title"]',
  AddQueryButton: '[data-cy="show-ds-popover-button"]',
  promoteVersionButton: '[data-cy="promote-version-button"]',
  promoteButton: '[data-cy="promote-button"]',
  settingsIcon: '[data-cy="icon-settings"]',
  gitSyncIcon: '[data-cy="git-sync-icon"]',
  confirmButton: '[data-cy="confirm-button"]',
  importFromGit: '[data-cy="import-from-git-button"]',
  searchBar: '[data-cy="query-manager-search-bar"]',
  nameHeader: '[data-cy="name-header"]',
  modalMessage: '[data-cy="modal-message"]',
  paginationSection: '[data-cy="pagination-section"]',
  createNewThemeButton: '[data-cy="create-new-theme-button"]',
  upgradeButton: '[data-cy="upgrade-button"]',
};

export const ssoEeSelector = {
  oidc: '[data-cy="openid-connect-sso-card"]',
  statusLabel: '[data-cy="status-label"]',
  oidcToggle: '[data-cy="openid-toggle-input"] > .slider',
  oidcPageElements: {
    oidcToggleLabel: '[data-cy="openid-toggle-label"]',
    nameLabel: '[data-cy="name-label"]',
    clientIdLabel: '[data-cy="client-id-label"]',
    clientSecretLabel: '[data-cy="client-secret-label"]',
    encryptedLabel: '[data-cy="encripted-label"]',
    WellKnownUrlLabel: '[data-cy="well-known-url-label"]',
  },
  nameInput: '[data-cy="name-input"]',
  clientIdInput: '[data-cy="client-id-input"]',
  clientSecretInput: '[data-cy="client-secret-input"]',
  WellKnownUrlInput: '[data-cy="well-known-url-input"]',
  redirectUrl: '[data-cy="redirect-url"]',
  copyIcon: '[data-cy="copy-icon]',
  oidcSSOText: '[data-cy="oidc-sso-button-text"]',
  oidcSSOIcon: '[data-cy="oidc-so-icon"]',
  ldapPageElements: {
    ldapToggleLabel: '[data-cy="ldap-toggle-label"]',
    nameLabel: '[data-cy="name-label"]',
    hostLabel: '[data-cy="host-label"]',
    portLabel: '[data-cy="port-label"]',
    baseDnLabel: '[data-cy="base-dn-label"]',
    baseDnHelperText: '[data-cy="base-dn-helper-text"]',
    sslLabel: '[data-cy="ssl-label"]',
  },
  ldapToggle: '[data-cy="ldap-toggle-input"] > .slider',
  ldapLabel: '[data-cy="ldap-label"]',
  ldapCard: '[data-cy="ldap-sso-card"]',
  hostInput: '[data-cy="host-input"]',
  portInput: '[data-cy="port-input"]',
  baseDnInput: '[data-cy="base-dn-input"]',
  sslToggleInput: '[data-cy="ssl-toggle-input"]',
  ldapSSOText: '[data-cy="ldap-sso-button-text"]',
  userNameInputLabel: '[data-cy="user-name-input-label"]',
  passwordInputLabel: '[data-cy="password-label"]',
  passwordInputField: '[data-cy="password-input-field"]',

  samlModalElements: {
    toggleLabel: '[data-cy="saml-toggle-label"]',
    NameLabel: '[data-cy="name-label"]',
    metaDataLabel: '[data-cy="idp-metadata-label"]',
    baseDNHelperText: '[data-cy="base-dn-helper-text"]',
    groupAttributeLabel: '[data-cy="group-attribute-label"]',
    groupAttributeHelperText: '[data-cy="group-attribute-helper-text"]',
  },
  saml: {
    card: '[data-cy="saml-sso-card"]',
    label: '[data-cy="saml-label"]',
    toggleInput: '[data-cy="saml-toggle-input"]',
    nameInput: '[data-cy="name-input"]',
    metadataInput: '[data-cy="dp-metadata-input"]',
    groupAttributeInput: '[data-cy="group-attribute-input"]',
    copyIcon: '[data-cy="copy-icon"]',
    ssoText: '[data-cy="saml-sso-button-text"]',
  },
  redirectUrlLabel: '[data-cy="redirect-url-label"]',
};

export const eeGroupsSelector = {
  resourceDs: '[data-cy="resource-datasources"]',
  dsCreateCheck: '[data-cy="checkbox-create-ds"]',
  dsDeleteCheck: '[data-cy="checkbox-delete-ds"]',
  datasourceLink: '[data-cy="datasource-link"]',
  dsSearch: '[data-cy="datasource-select-search"]',
  AddDsButton: '[data-cy="datasource-add-button"]',
  dsNameHeader: '[data-cy="datasource-name-header"]',
};

export const instanceSettingsSelector = {
  allUsersTab: '[data-cy="all-users-list-item"]',
  manageInstanceSettings: '[data-cy="manage-instance-settings-list-item"]',
  typeColumnHeader: '[data-cy="users-table-type-column-header"]',
  workspaceColumnHeader: '[data-cy="users-table-workspaces-column-header"]',
  userName: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-name"]`;
  },
  userEmail: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-email"]`;
  },
  userType: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-type"]`;
  },
  userStatus: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-status"]`;
  },
  viewButton: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-view-button"]`;
  },
  editButton: (userName) => {
    return `[data-cy="${cyParamName(userName)}-user-edit-button"]`;
  },
  viewModalNoColumnHeader: '[data-cy="number-column-header"]',
  viewModalNameColumnHeader: '[data-cy="name-column-header"]',
  viewModalStatusColumnHeader: '[data-cy="status-column-header"]',
  archiveAllButton: '[data-cy="archive-all-button"]',
  viewModalRow: (workspaceName) => {
    return `[data-cy="${cyParamName(workspaceName)}-workspace-row"]>`;
  },

  workspaceName: (workspaceName) => {
    return `[data-cy="${cyParamName(workspaceName)}-workspace-name"]`;
  },
  userStatusChangeButton: '[data-cy="user-state-change-button"]',
  superAdminToggle: '[data-cy="super-admin-form-check-input"]',
  superAdminToggleLabel: '[data-cy="super-admin-form-check-label"]',
  allowWorkspaceToggle: '[data-cy="form-check-input"]',
  allowWorkspaceToggleLabel: '[data-cy="form-check-label"]',
  allowWorkspaceHelperText: '[data-cy="instance-settings-help-text"]',
  allWorkspaceTab: '[data-cy="all-workspaces-list-item"]',
};

export const multiEnvSelector = {
  envContainer: '[data-cy="env-container"]',
  envArrow: '[data-cy="env-arrow"]',
  selectedEnvName: '[data-cy="selected-current-env-name"]',
  envNameList: '[data-cy="env-name-list"]',
  appVersionLabel: '[data-cy="app-version-label"]',
  currentVersion: '[data-cy="current-version"]',
  createNewVersionButton: '[data-cy="create-new-version-button"]',
  fromLabel: '[data-cy="from-label"]',
  toLabel: '[data-cy="to-label"]',
  currEnvName: '[data-cy="current-env-name"]',
  targetEnvName: '[data-cy="target-env-name"]',
  stagingLabel: '[data-cy="staging-label"]',
  productionLabel: '[data-cy="production-label"]',
  previewSettings: '[data-cy="preview-settings"]',
  envContainer: '[data-cy="env-container"]',
  currentEnvName: '[data-cy="list-current-env-name"]',
  envArrow: '[data-cy="env-arrow"]',
  selectedEnvName: '[data-cy="selected-current-env-name"]',
  envNameList: '[data-cy="env-name-list"]',
  appVersionLabel: '[data-cy="app-version-label"]',
  currentVersion: '[data-cy="current-version"]',
  createNewVersionButton: '[data-cy="create-new-version-button"]',
  fromLabel: '[data-cy="from-label"]',
  toLabel: '[data-cy="to-label"]',
  currEnvName: '[data-cy="current-env-name"]',
  targetEnvName: '[data-cy="target-env-name"]',
  stagingLabel: '[data-cy="staging-label"]',
  productionLabel: '[data-cy="production-label"]',
  environmentsTag: (envName) => {
    return `[data-cy="${cyParamName(envName)}-environment-name"]`;
  },
};

export const whiteLabellingSelectors = {
  whiteLabelList: '[data-cy="white-labelling-list-item"]',
  appLogoLabel: '[data-cy="app-logo-label"]',
  appLogoInput: '[data-cy="input-field-app-logo"]',
  appLogoHelpText: '[data-cy="app-logo-help-text"]',
  pageTitleLabel: '[data-cy="page-title-label"]',
  pageTitleInput: '[data-cy="input-field-page-title"]',
  pageTitleHelpText: '[data-cy="page-title-help-text"]',
  favIconLabel: '[data-cy="fav-icon-label"]',
  favIconInput: '[data-cy="input-field-fav-icon"]',
  favIconHelpText: '[data-cy="fav-icon-help-text"]',
};

export const gitSyncSelector = {
  gitCommitInput: '[data-cy="git-commit-input"]',
  commitHelperText: '[data-cy="commit-helper-text"]',
  gitRepoInput: '[data-cy="git-repo-input"]',
  commitMessageInput: '[data-cy="commit-message-input"]',
  lastCommitInput: '[data-cy="las-commit-message"]',
  lastCommitVersion: '[data-cy="last-commit-version"]',
  autherInfo: '[data-cy="auther-info"]',
  commitButton: '[data-cy="commit-button"]',
  gitSyncToggleInput: '[data-cy="git-sync-toggle-input"]',
  gitSyncApphelperText: '[data-cy="sync-app-helper-text"]',
  connectRepoButton: '[data-cy="connect-repo-button"]',
  toggleMessage: '[data-cy="toggle-message"]',
  sshInput: '[data-cy="git-ssh-input"]',
  generateSshButton: '[data-cy="generate-ssh-key-button"',
  sshInputHelperText: '[data-cy="git-ssh-input-helper-text"]',
  configDeleteButton: '[data-cy="button-config-delete"]',
  testConnectionButton: '[data-cy="test-connection-button"]',
  sshKey: '[data-cy="ssh-key"]',
  deployKeyHelperText: '[data-cy="deploy-key-helper-text"]',
  gitRepoLink: '[data-cy="git-repo-link"]',
  appNameField: '[data-cy="app-name-field"]',
  gitRepoInfo: '[data-cy="git-repo-info"]',
  pullButton: '[data-cy="pull-button"]',
};

export const workspaceSelector = {
  activelink: '[data-cy="active-link"]',
  archivedLik: '[data-cy="archived-link"]',
  userStatusChange: '[data-cy="button-user-status-change"]',
  workspaceStatusChange: '[data-cy="button-ws-status-change"]',
  switchWsModalTitle: '[data-cy="switch-modal-title"]',
  switchWsModalMessage: '[data-cy="switch-modal-message"]',
  workspaceName: (workspaceName) => {
    return `[data-cy="${workspaceName}-workspace-name"]`;
  },
  workspaceInput: (workspaceName) => {
    return `[data-cy="${workspaceName}-workspace-input"]`;
  },
};

export const versionModalSelector = {
  versionNameLabel: '[data-cy="version-name-label"]',
  versionNameInput: '[data-cy="version-name-input-field"]',
  versionNameHelperText: '[data-cy="version-name-helper-text"]',
  versionDescriptionLabel: '[data-cy="version-description-label"]',
  versionDescriptionHelperText: '[data-cy="version-description-helper-text"]',
  commitChangesLabel: '[data-cy="commit-changes-label"]',
  commitHelperText: '[data-cy="commit-helper-text"]',
  versionLockInfoText: '[data-cy="version-lock-info-text"]',
  versionName: (versionName) => {
    return `[data-cy="${versionName}-version-name"]`;
  },
  draftTag: (versionName) => {
    return `[data-cy="${versionName}-draft-tag"]`;
  },
  saveVersionButton: (versionName) => {
    return `[data-cy="${versionName}-save-version-button"]`;
  },

  versionOptionsButton: (versionName) => {
    return `[data-cy="${versionName}-version-more-menu-button"]`;
  },

  editVersionButton: (versionName) => {
    return `[data-cy="${versionName}-edit-version-button"]`;
  },
  deleteVersionButton: (versionName) => {
    return `[data-cy="${versionName}-delete-version-button"]`;
  },

  createVersionModal: {
    versionDescriptionInput: '[data-cy="version-description-input-field"]',
    createVersionHelperText: '[data-cy="create-version-helper-text"]',
    cancelButton: '[data-cy="create-version-cancel-button"]',
    saveButton: '[data-cy="create-version-save-button"]',
  },

  createDraftVersionModal: {
    createDraftVersionFromLabel: '[data-cy="create-draft-version-from-label"]',
    createDraftVersionFromInput:
      '[data-cy="create-draft-version-from-input-field"]',
    createDraftVersionHelperText:
      '[data-cy="create-draft-version-helper-text"]',
    cancelButton: '[data-cy="create-draft-version-cancel-button"]',
    createButton: '[data-cy="create-draft-version-create-button"]',
  },

  editVersionModal: {
    versionNameInput: '[data-cy="edit-version-name-input-field"]',
    versionDescriptionInput: '[data-cy="edit-version-description-input-field"]',
    cancelButton: '[data-cy="cancel-button"]',
    saveButton: '[data-cy="save-button"]',
  },
};
