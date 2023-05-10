export const selectEvent = (event, action) => {
  cy.get('[data-cy="add-event-handler"]').click();
  cy.get('[data-cy="event-handler"]').eq(0).click();
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
  debounce = `{selectAll}{backspace}`
) => {
  cy.get('[data-cy="action-options-component-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${component}{enter}`);
  cy.get('[data-cy="action-options-action-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${componentAction}{enter}`);
  cy.get('[data-cy="-input-field"]').type(
    `{selectAll}{backspace}${debounce}{enter}`
  );
};

export const addSupportCSAData = (field, data) => {
  cy.get(`[data-cy="${field}-input-field"]`).clearAndTypeOnCodeMirror(data);
};
