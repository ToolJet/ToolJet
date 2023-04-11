export const selectEvent = (event, action) => {
  cy.get('[data-cy="add-event-handler"]').click()
  cy.get('[data-cy="event-handler"]').eq(0).click()
  cy.get('[data-cy="event-selection"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${event}{enter}`);
  cy.get('[data-cy="action-selection"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${action}{enter}`);
};

export const selectCSA = (
  component,
  componentAction,
  dbounce = `{selectAll}{backspace}`
) => {
  cy.get('[data-cy="action-options-component-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${component}`);
  cy.get('[data-cy="action-options-action-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${componentAction}`);
  cy.get('[data-cy="-input-field"]').type(`{selectAll}{backspace}${debounce}`);
};
