export const cloudLicenseSelectors = {
  navBarActions: ".tj-dashboard-header-wrap",
  customGroupBannerButton: ".custom-group-upgrade-button",
  trialLoader: ".license-loader",
  limitBreakdownRow: ".resources-limit-banner-breakdown-row",
  limitBanner: (type) => `[data-cy="${type}-limit-banner"]`,
  upgradeButton: '[data-cy="upgrade-button"]',

  upgradePlanModal: '[data-cy="upgrade-plan-modal"]',
  upgradePlanTable: '[data-cy="upgrade-plan-table"]',
  upgradePlanModalClose: '[data-cy="upgrade-plan-modal-close"]',
  planColumns: '[data-cy$="-plan-column"]',
  planColumn: (plan) => `[data-cy="${plan}-plan-column"]`,
  planActionButton: (plan) => `[data-cy="${plan}-plan-action-button"]`,
  billingToggle: (period) => `[data-cy="billing-${period}-toggle"]`,
};
