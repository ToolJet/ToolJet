// Cloud-only licensing surfaces. Elements without data-cy are kept here as class/role selectors.
export const cloudLicenseSelectors = {
  // Dashboard header area that hosts the licence nav-bar buttons (LicenseNavBarActions, no data-cy).
  navBarActions: ".tj-dashboard-header-wrap",
  // Custom groups page banner (CustomGroupBanner) action button, no data-cy.
  customGroupBannerButton: ".custom-group-upgrade-button",
  // Loader shown by LicenseBanner while a cloud trial is generated, no data-cy.
  trialLoader: ".license-loader",
  // ResourcesLimitBanner breakdown rows (ToolJet database banner), no data-cy.
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
