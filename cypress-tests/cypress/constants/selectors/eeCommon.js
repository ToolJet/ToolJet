import { cyParamName } from "./common";

export const commonEeSelectors = {
  instanceSettingIcon: '[data-cy="icon-instance-settings"]',
  auditLogIcon: '[data-cy="icon-audit-logs"]',
  cancelButton: '[data-cy="cancel-button"]',
  saveButton: '[data-cy="save-button"]',
  pageTitle: '[data-cy="dashboard-section-header"]',
  modalTitle: '[data-cy="modal-title"]',
  modalCloseButton: '[data-cy="modal-close-button"]',
  saveButton: '[data-cy="save-button"]',
  cardTitle: '[data-cy="card-title"]',
};

export const ssoEeSelector = {
  oidc: '[data-cy="openid-connect-list-item"]',
  statusLabel: '[data-cy="status-label"]',
  oidcToggle: '[data-cy="openid-toggle-input"]',
  oidcPageElements: {
    oidcToggleLabel: '[data-cy="openid-toggle-label"]',
    nameLabel: '[data-cy="name-label"]',
    clientIdLabel: '[data-cy="client-id-label"]',
    clientSecretLabel: '[data-cy="client-secret-label"]',
    encryptedLabel: '[data-cy="encripted-label"]',
    WellKnownUrlLabel: '[data-cy="well-known-url-label"]',
    redirectUrlLabel: '[data-cy="redirect-url-label"]',
  },
  nameInput: '[data-cy="name-input"]',
  clientIdInput: '[data-cy="client-id-input"]',
  clientSecretInput: '[data-cy="client-secret-input"]',
  WellKnownUrlInput: '[data-cy="well-known-url-input"]',
  redirectUrl: '[data-cy="redirect-url"]',
  copyIcon: '[data-cy="copy-icon]',
  oidcSSOText: '[data-cy="oidc-sso-text"]',
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
  ldapToggle: '[data-cy="ldap-toggle-input"]',
  hostInput: '[data-cy="host-input"]',
  portInput: '[data-cy="port-input"]',
  baseDnInput: '[data-cy="base-dn-input"]',
  sslToggleInput: '[data-cy="ssl-toggle-input"]',
  ldapSSOText: '[data-cy="ldap-sso-text"]',
  userNameInputLabel: '[data-cy="user-name-input-label"]'


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
};
