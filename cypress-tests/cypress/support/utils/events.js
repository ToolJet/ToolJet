export const selectEvent = (
  event,
  action,
  index = 0,
  addEventhandlerSelector = '[data-cy="add-event-handler"]',
  eventIndex = 0
) => {
  cy.intercept("PUT", "events").as("events");
  cy.get(addEventhandlerSelector).eq(index).click();
  cy.get('[data-cy="event-handler"]').eq(eventIndex).click();
  cy.get('[data-cy="event-selection"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${event}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})

  cy.get('[data-cy="action-selection"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${action}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})
  cy.wait("@events");
};

export const selectCSA = (
  component,
  componentAction,
  debounce = `{selectAll}{backspace}`
) => {
  cy.intercept("PUT", "events").as("events");
  cy.get('[data-cy="action-options-component-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${component}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})

  cy.get('[data-cy="action-options-action-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${componentAction}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})

  cy.wait("@events");
  cy.get('[data-cy="debounce-input-field"]')
    .click()
    .type(`{selectAll}{backspace}${debounce}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})
  cy.wait("@events");
};

export const addSupportCSAData = (field, data) => {
  cy.intercept("PUT", "events").as("events");
  cy.get(`[data-cy="event-${field}-input-field"]`)
    .click({ force: true })
    .clearAndTypeOnCodeMirror(data);
    cy.get('[data-cy="event-label"]').click({force:true})
};

export const selectSupportCSAData = (option) => {
  cy.intercept("PUT", "events").as("events");
  cy.get('[data-cy="action-options-action-selection-field"]')
    .eq(1)
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${option}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})
  cy.wait("@events");
};

export const changeEventType = (event, eventIndex = 0) => {
  cy.intercept("PUT", "events").as("events");
  cy.get('[data-cy="event-handler"]').eq(eventIndex).click();
  cy.get('[data-cy="event-selection"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${event}{enter}`);
    cy.get('[data-cy="event-label"]').click({force:true})
  cy.wait("@events");
};
