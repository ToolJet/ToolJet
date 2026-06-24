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
  // didn't, click the card to open it. The card IS the Radix popover trigger,
  // so when it's already open it carries `data-state="open"` — gate on that
  // rather than the popover's `:visible` (which flickers mid-animation and can
  // wrongly trigger a re-click). When a re-click is needed, force it: an open
  // Radix popover sets `body { pointer-events: none }` (scroll-lock), which
  // would otherwise block the click even though the card is interactive.
  cy.get('[data-cy="event-handler-card"]')
    .eq(eventIndex)
    .then(($card) => {
      if ($card.attr("data-state") !== "open") {
        cy.wrap($card).click({ force: true });
      }
    });
  cy.get('[data-cy="popover-card"]').should("be.visible");

  // `action-selection` is now a RocketSelect (trigger + role=option items in a
  // portal), not a searchable input. Open it (unless it auto-opened) and pick
  // the action by its visible label.
  chooseRocketOption('[data-cy="action-selection"]', action);
  // A handler is created with `actionId: 'show-alert'` already set
  // (EventManager.jsx:441), so re-picking "Show Alert" is a no-op that fires no
  // PATCH /events — waiting for one would hang. Only wait when the action
  // actually changes the saved handler.
  if (needWait && !/^\s*show alert\s*$/i.test(action)) {
    cy.wait("@events");
  }
};

// Pick an option (by visible label, case-insensitive) from a RocketSelect
// identified by `triggerSelector`. Only clicks the trigger when the listbox
// isn't already showing, since some EventManager selects auto-open.
const chooseRocketOption = (triggerSelector, label) => {
  cy.get("body").then(($body) => {
    if ($body.find('[role="option"]:visible').length === 0) {
      // force: an open popover-card sets body{pointer-events:none} (Radix
      // scroll-lock) which blocks a normal click on the RocketSelect trigger.
      // Matches the rest of this file's force-click convention.
      cy.get(triggerSelector).should("be.visible").click({ force: true });
    }
  });
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${label}\\s*$`, "i"))
    .click();
};

// Pick a value from an OptionCombobox (shared.jsx OptionCombobox → Rocket
// Combobox). The field renders a searchable `ComboboxInput` (an InputGroup that
// nests >1 <input>, so scope typing to the first/visible one) and a portalled
// listbox of `role="option"` items. Type to filter, then click the exact match.
const pickComboboxOption = (fieldSelector, label) => {
  cy.get(fieldSelector).scrollIntoView().click();
  cy.get(`${fieldSelector} input`)
    .filter(":visible")
    .first()
    .clear({ force: true })
    .type(label, { force: true });
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${label}\\s*$`, "i"))
    .click({ force: true });
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

  pickComboboxOption(
    '[data-cy="action-options-component-selection-field"]',
    component
  );
  pickComboboxOption(
    '[data-cy="action-options-action-selection-field"]',
    componentAction
  );
  cy.wait("@events");

  cy.get('[data-cy="debounce-input-field"]')
    .click()
    .type(`{selectAll}{backspace}${debounce}{enter}`);
  cy.get('[data-cy="event-label"]').click({ force: true });
  cy.wait("@events");
};

export const addSupportCSAData = (field, data) => {
  // Event handlers save via POST `/events` (create) and PATCH `/events/:id`
  // (update) — not PUT. Match the URL regardless of method so the waits below
  // resolve on the real requests.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  // The config field (e.g. alert-message) lives inside the event's `popover-card`.
  // Selecting the action via the RocketSelect can momentarily re-render the
  // popover; if it ended up closed, the field won't exist. Ensure the popover is
  // open (reopening the handler card when needed) before typing.
  cy.get("body").then(($body) => {
    if ($body.find(`[data-cy="${field}-input-field"]`).length === 0) {
      // addSupportCSAData always runs right after selectEvent created/edited the
      // most recent handler, so the relevant card is the last one.
      cy.get('[data-cy="event-handler-card"]')
        .last()
        .then(($card) => {
          if ($card.attr("data-state") !== "open") {
            cy.wrap($card).click({ force: true });
          }
        });
    }
  });
  cy.get(`[data-cy="${field}-input-field"]`)
    .should("be.visible")
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