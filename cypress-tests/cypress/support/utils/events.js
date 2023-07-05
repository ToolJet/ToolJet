export const selectEvent = (
  event,
  action,
  index = 0,
  addEventhandlerSelector = '[data-cy="add-event-handler"]',
  eventIndex = 0
) => {
  cy.get(addEventhandlerSelector).eq(index).click();
  cy.get('[data-cy="event-handler"]').eq(eventIndex).click();
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

export const selectSupportCSAData = (option) => {
  cy.get('[data-cy="action-options-action-selection-field"]')
    .eq(1)
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${option}{enter}`);
};
