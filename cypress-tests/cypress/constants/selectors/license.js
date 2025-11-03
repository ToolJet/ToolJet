export const cyParamName = (paramName = "") => {
  return String(paramName).toLowerCase().replace(/\s+/g, "-");
};

export const cyParamNameCamelCase = (paramName = "") => {
  return paramName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase()
    .replace(/\s+(\w)/g, (_, c) => c.toUpperCase());
};

export const licenseSelectors = {
  comparePlansText: '[data-cy="compare-plans-button"]',
  listOfItems: (itemName) => {
    return `[data-cy="${cyParamName(itemName)}-list-item"]`;
  },
  tabTitle: (tabName) => {
    return `[data-cy="${cyParamNameCamelCase(tabName)}-tab-title"]`;
  },
  subTab: (subTabName) => {
    return `[data-cy="${cyParamName(subTabName)}-sub-tab"]`;
  },
  numberOfTextLabel: (label) => {
    return `[data-cy="number-of-${cyParamName(label)}-label"]`;
  },
  inputField: (fieldName) => {
    return `[data-cy="${cyParamName(fieldName)}-field"]`;
  },
  label: (labelName) => {
    return `[data-cy="${cyParamName(labelName)}-label"]`;
  },

  limitInfo: (type) => {
    return `[data-cy="${cyParamName(type)}-limit-info"]`;
  },
  limitHeading: (type) => {
    return `[data-cy="${cyParamName(type)}-limit-heading"]`;
  },
  totalLimitLabel: (type) => {
    return `[data-cy="total-${cyParamName(type)}-limit-label"]`;
  },
  totalLimitCount: (type) => {
    return `[data-cy="total-${cyParamName(type)}-limit-count"]`;
  },

  workspaceCount: '[data-cy="workspace-count"]',
  circularToggleDisabledIcon: '[data-cy="circular-toggle-disabled-icon"]',
  circularToggleEnabledIcon: '[data-cy="circular-toggle-enabled-icon"]',
  licenseBannerHeading: '[data-cy="license-banner-heading"]',
  licenseBannerInfo: '[data-cy="license-banner-info"]',
  paidFeatureButton: '[data-cy="paid-feature-button"]',
  warningIcon: '[data-cy="warning-icon"]',
  noDomainLinkedLabel: '[data-cy="no-domain-header"]',
  noDomainInfoText: '[data-cy="no-domain-info-text"]',
  licenseOption: '[data-cy="license-list-item"]',
  licenseKeyOption: '[data-cy="license-key-list-item"]',
  limitOption: '[data-cy="limits-list-item"]',
  accessOption: '[data-cy="access-list-item"]',
  domainOption: '[data-cy="domain-list-item"]',
  licenseKeyTitle: '[data-cy="licenseKey-tab-title"]',
  licenseLabel: '[data-cy="license-label"]',
  updateButton: '[data-cy="update-button"]',
  limitsTabTitle: '[data-cy="limits-tab-title"]',
  appsTab: '[data-cy="apps-sub-tab"]',
  noOfAppsLabel: '[data-cy="number-of-apps-label"]',
  noOfAppsfield: '[data-cy="apps-field"]',
  workspaceTab: '[data-cy="workspaces-sub-tab"]',
  noOfworkspaceLabel: '[data-cy="number-of-workspaces-label"]',
  noOfWorkspacefield: '[data-cy="workspaces-field"]',
  usersTab: '[data-cy="users-sub-tab"]',
  noOfTotalUsersLabel: '[data-cy="number-of-total-users-label"]',
  noOfTotalUsersfield: '[data-cy="total-users-field"]',
  noOfBuildersLabel: '[data-cy="number-of-builders-label"]',
  noOfBuildersfield: '[data-cy="builders-field"]',
  noOfEndUsersLabel: '[data-cy="number-of-end-users-label"]',
  noOfEndUsersfield: '[data-cy="end-users-field"]',
  noOfSuperAdminLabel: '[data-cy="number-of-super-admins-label"]',
  noOfSuperAdminfield: '[data-cy="super-admins-field"]',
  tablesTab: '[data-cy="tables-sub-tab"]',
  noOfTablesLabel: '[data-cy="number-of-tables-label"]',
  noOfTablesfield: '[data-cy="tables-field"]',
  expiryStatus: '[data-cy="license-expiry-status"]',
  licenseTextArea: '[data-cy="license-text-area"]',
  paidFeatureButton: '[data-cy="paid-feature-button"]',
  accessTabTitle: '[data-cy="access-tab-title"]',
  enterpriseGradientIcon: '[data-cy="enterprise-gradient-icon"]',
  warningInfoText: '[data-cy="warning-info-text"]',
  lockGradientIcon: '[data-cy="lock-gradient"]',
  dsGradientIcon: '[data-cy="datasource-gradient"]',
};
