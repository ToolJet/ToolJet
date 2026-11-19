export const cloudSubscriptionSelectors = {
  subscriptionOverview: '[data-cy="subscription-overview"]',
  planTag: '[data-cy="license-type-label"]',
  subscriptionLimitsLabel: '[data-cy="subscription-limits-label"]',
  featureAccessLabel: '[data-cy="feature-access-label"]',
  accessContent: '[data-cy="access-content"]',
  exceedingLimitError: '[data-cy="error-label"]',
  limitErrorBorderClass: "error-border",

  comparePlansButton: '[data-cy="compare-plans-button"]',
  upgradeButton: '[data-cy="upgrade-button"]',
  footerTotalAmount: '.subscription-footer [data-cy="total-amount"]',
  footerDueDate: ".subscription-footer .due-container .text-muted",
  viewInvoicesButton: '[data-cy="view-invoice-button"]',
  manageSubscriptionButton: '[data-cy="manage-subscription-button"]',

  pricingModal: '[data-cy="upgrade-plan-modal"]',
  pricingPlanColumn: (planKey) => `[data-cy="${planKey}-plan-column"]`,

  checkoutModalTitle: '.upgrade-plan-modal [data-cy="modal-title"]',
  checkoutModalBody: '.upgrade-plan-modal [data-cy="modal-body"]',
  checkoutPlanTypeValue: '.upgrade-plan-modal [data-cy="business-plan-label"]',
  checkoutBillingToggle: '.upgrade-plan-modal [data-cy="offer-toggle"]',
  checkoutBillingToggleLabel: '.upgrade-plan-modal [data-cy="offer-toggle-label"]',
  checkoutUpgradeButton: '.upgrade-plan-modal [data-cy="modal-upgrade-button"]',
};
