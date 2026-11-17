// Cloud Subscription page AI credits block and Add AI credits modal: most elements have no data-cy.
export const cloudAiSelectors = {
  creditsBlock: ".ai-top-up-container",
  creditsRow: ".ai-top-up-container .inner-container",
  creditsRowValue: "input.form-control",
  topUpButton: '[data-cy="top-up-button"]',
  tooltip: ".tooltip",

  addCreditsModal: ".modal-content:has(.ai-top-up-modal)",
  addCreditsModalTitle: '[data-cy="modal-title"]',
  addCreditsModalRow: ".ai-top-up-modal .input-container",
  addCreditsModalInput: "input.form-control",
  addCreditsAmountDue: '[data-cy="due-today-label"]',
  addCreditsCheckoutButton: '[data-cy="modal-upgrade-button"]',

  upgradePlanModal: '[data-cy="upgrade-plan-modal"]',
};
