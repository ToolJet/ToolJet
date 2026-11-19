import { cyParamName } from "Selectors/common";

export const cloudSettingsSelectors = {
  settingsNavList: ".workspace-nav-list-wrap",
  settingsNavItems: '.workspace-nav-list-wrap [data-cy$="-list-item"]',
  settingsNavItem: (name) => `[data-cy="${cyParamName(name)}-list-item"]`,
  cardTitle: '[data-cy="card-title"]',
  paidFeatureButton: '[data-cy="paid-feature-button"]',
  loginBannerImage: "img.general-feature-image",
};

export const customDomainSelectors = {
  domainLabel: '[data-cy="domain-label"]',
  domainInput: '[data-cy="domain-input"]',
  domainHelper: '[data-cy="domain-helper"]',
  workspaceUrlLabel: '[data-cy="workspace-url-label"]',
  workspaceUrl: '[data-cy="workspace-url"]',
  workspaceUrlHelper: '[data-cy="workspace-url-helper"]',
  workspaceUrlCopyButton: '[data-cy="workspace-url-label"] + .d-flex button',
  readDocumentationLink: '[data-cy="read-documentation-link"]',
  testConnectionButton: '[data-cy="test-connection-button"]',
  cancelButton: '[data-cy="cancel-button"]',
  saveButton: '[data-cy="save-button"]',
};
