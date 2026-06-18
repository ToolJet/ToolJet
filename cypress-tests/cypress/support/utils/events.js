export const selectEvent = (
  event,
  action = "Show Alert",
  index = 0,
  addEventhandlerSelector = '[data-cy="add-event-handler"]',
  eventIndex = 0,
  needWait = true
) => {
  // Event handlers save via POST `/events` (create) and PATCH `/events/:id`
  // (update) — not PUT. Match the URL regardless of method so the waits below
  // resolve on the real requests.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  // New popover-based add flow (EventManager.jsx): the "Add new event handler"
  // button is a Popover trigger. Clicking it opens `add-event-menu`, whose
  // options are `event-trigger-option-<value>` buttons labelled by displayName.
  // Pick the trigger by its visible label (case-insensitive so callers can keep
  // passing "On Click" while the UI shows "On click"). This single click both
  // chooses the trigger AND creates the handler — the old `event-selection`
  // step is gone.
  cy.get(addEventhandlerSelector).eq(index).click();
  cy.get('[data-cy="add-event-menu"]').should("be.visible");
  cy.contains(
    '[data-cy^="event-trigger-option-"]',
    new RegExp(`^${event}$`, "i")
  ).click();
  if (needWait) {
    cy.wait("@events");
  }

  // Creating a handler auto-opens its config popover (`popover-card`); if it
  // didn't, click the card to open it.
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="popover-card"]:visible').length === 0) {
      cy.get('[data-cy="event-handler-card"]').eq(eventIndex).click();
    }
  });
  cy.get('[data-cy="popover-card"]').should("be.visible");

  // `action-selection` is now a RocketSelect (trigger + role=option items in a
  // portal), not a searchable input. Open it (unless it auto-opened) and pick
  // the action by its visible label.
  chooseRocketOption('[data-cy="action-selection"]', action);
  if (needWait) {
    cy.wait("@events");
  }
};

// Pick an option (by visible label, case-insensitive) from a RocketSelect
// identified by `triggerSelector`. Only clicks the trigger when the listbox
// isn't already showing, since some EventManager selects auto-open.
const chooseRocketOption = (triggerSelector, label) => {
  cy.get("body").then(($body) => {
    if ($body.find('[role="option"]:visible').length === 0) {
      cy.get(triggerSelector).should("be.visible").click();
    }
  });
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${label}\\s*$`, "i"))
    .click();
};

export const selectCSA = (
  component,
  componentAction,
  debounce = `{selectAll}{backspace}`
) => {
  // Event handlers save via POST `/events` (create) and PATCH `/events/:id`
  // (update) — not PUT. Match the URL regardless of method so the waits below
  // resolve on the real requests.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  cy.get('[data-cy="action-options-component-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${component}{enter}`);
  cy.get('[data-cy="event-label"]').click({ force: true })

  cy.get('[data-cy="action-options-action-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${componentAction}{enter}`);
  cy.get('[data-cy="event-label"]').click({ force: true })

  cy.wait("@events");
  cy.get('[data-cy="debounce-input-field"]')
    .click()
    .type(`{selectAll}{backspace}${debounce}{enter}`);
  cy.get('[data-cy="event-label"]').click({ force: true })
  cy.wait("@events");
};

export const addSupportCSAData = (field, data) => {
  // Event handlers save via POST `/events` (create) and PATCH `/events/:id`
  // (update) — not PUT. Match the URL regardless of method so the waits below
  // resolve on the real requests.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  cy.get(`[data-cy="${field}-input-field"]`)
    .click({ force: true })
    .clearAndTypeOnCodeMirror(data);
  cy.get('[data-cy="event-label"]').click({ force: true })
};

export const selectSupportCSAData = (option) => {
  // Event handlers save via POST `/events` (create) and PATCH `/events/:id`
  // (update) — not PUT. Match the URL regardless of method so the waits below
  // resolve on the real requests.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  cy.get('[data-cy="action-options-action-selection-field"]')
    .eq(1)
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${option}{enter}`);
  cy.get('[data-cy="event-label"]').click({ force: true })
  cy.wait("@events");
};

export const changeEventType = (event, eventIndex = 0) => {
  // Event handlers save via POST `/events` (create) and PATCH `/events/:id`
  // (update) — not PUT. Match the URL regardless of method so the waits below
  // resolve on the real requests.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  cy.get('[data-cy="event-handler"]').eq(eventIndex).click();
  cy.get('[data-cy="event-selection"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${event}{enter}`);
  cy.get('[data-cy="event-label"]').click({ force: true })
  cy.wait("@events");
};


export const addMultiEventsWithAlert = (events, isWait = true) => {
  events.forEach((eventObj, index) => {
    selectEvent(eventObj.event, 'Show Alert', 0, '[data-cy="add-event-handler"]', index, isWait);
    addSupportCSAData("alert-message", eventObj.message);
  });
};