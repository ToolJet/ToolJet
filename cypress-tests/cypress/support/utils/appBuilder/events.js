// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// events.js
//   selectEvent                      events               → events
//   selectSearchableOption           -                    → events
//   selectCSA                        csa                  → csa
//   addSupportCSAData                -                    → csa
//   selectSupportCSAData             -                    → csa
//   changeEventType                  -                    → events
//   addMultiEventsWithAlert          events               → events
//   setCSAParam                      -                    → csa
//   configureCSA                     csa                  → csa
//   selectQueryForEvent              -                    → events
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/events: right-Inspector **Events tab** + Component-Specific
 * Action (CSA) helpers.
 * FOR AI: wire a component's event handlers and their actions. Route by need:
 *   add a trigger + action        → selectEvent (e.g. 'On click' → 'Show Alert')
 *   Show-Alert message / code arg → addSupportCSAData
 *   Control-Component action      → selectCSA + setCSAParam, or configureCSA (one call)
 *   change an existing trigger    → changeEventType
 *   many alert handlers at once   → addMultiEventsWithAlert
 * PRECONDITION: open the Events tab / handler popover; most CSA helpers assume
 *   selectEvent already left the handler card open. Triggers/labels match
 *   case-insensitively. CSA code params are evaluated as JS — see setCSAParam.
 * NOT here: properties → properties.js · styles → styles.js · Run-Query event &
 *   query chaining → querymanager/queries.js (selectRunQueryEvent) · state tree → inspectorTree.js.
 */
// ---------------------------------------------------------------------------
// Shared primitives for the event-handler popover.
// ---------------------------------------------------------------------------

// Alias /events requests. Handlers save via POST (create) and PATCH (update), so the
// pattern is method-agnostic; call before any `cy.wait("@events")`.
const interceptEvents = () => cy.intercept(/\/events(\/|\?|$)/).as("events");

// Blur the popover's active field so its value commits.
const commitEventConfig = () =>
  cy.get('[data-cy="event-label"]').click({ force: true });

// Open a handler's config popover if it is closed. `index` is the card index, or
// "last" for the most recently created handler. Force-click is required: an open Radix
// popover sets `body { pointer-events: none }`.
const ensureHandlerCardOpen = (index = 0) => {
  const card = cy.get('[data-cy="event-handler-card"]');
  return (index === "last" ? card.last() : card.eq(index)).then(($card) => {
    if ($card.attr("data-state") !== "open") {
      cy.wrap($card).click({ force: true });
    }
  });
};

// Add an event handler and set its action.
//   event    — trigger label as shown in the UI, matched case-insensitively
//              (callers may pass "On Click" while the UI shows "On click").
//   needWait — pass TRUE whenever config is written straight after (an alert message,
//              CSA params). With false that write races the handler's POST and is
//              silently dropped, leaving the handler on its defaults.
/**
 * @tjType   events
 * @tjBlock  events
 * @tjUsage  selectEvent('On click', 'Show Alert')
 * @tjDom    add-event-handler click → add-event-menu → event-trigger-option-<value> → action-selection listbox
 */
export const selectEvent = (
  event,
  action = "Show Alert",
  index = 0,
  addEventhandlerSelector = '[data-cy="add-event-handler"]',
  eventIndex = 0,
  needWait = true
) => {
  interceptEvents();
  // Popover add-flow: this single click on `event-trigger-option-<value>` both picks
  // the trigger AND creates the handler (no separate `event-selection` step).
  cy.get(addEventhandlerSelector).eq(index).click();
  cy.get('[data-cy="add-event-menu"]').should("be.visible");
  cy.contains(
    '[data-cy^="event-trigger-option-"]',
    new RegExp(`^${event}$`, "i")
  ).click();
  if (needWait) {
    cy.wait("@events");
  }

  ensureHandlerCardOpen(eventIndex);
  cy.get('[data-cy="popover-card"]').should("be.visible");

  selectListboxOption('[data-cy="action-selection"]', action);
  
  // A new handler already has actionId 'show-alert' (EventManager.jsx:441), so
  // re-picking "Show Alert" fires no PATCH — waiting for one would hang.
  if (needWait && !/^\s*show alert\s*$/i.test(action)) {
    cy.wait("@events");
  }
};

// Pick an option from a Radix Select (RocketSelect) by visible label.
// Opens via KEYBOARD {downarrow}: the trigger sits inside a scroll-locked popover
// (`body { pointer-events: none }`) where pointer clicks are swallowed, and the select
// may be controlled-open, so a click can toggle it shut. Gated on `data-state`.
const selectListboxOption = (triggerSelector, label) => {
  cy.get(triggerSelector)
    .find('button[role="combobox"]')
    .should("be.visible")
    .then(($trigger) => {
      if ($trigger.attr("data-state") !== "open") {
        cy.wrap($trigger).focus().type("{downarrow}", { force: true });
      }
    });
  cy.get('[role="option"]', { timeout: 15000 }).should("exist");
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${label}\\s*$`, "i"))
    .click({ force: true });
};

// Pick a value from a searchable OptionCombobox by typing to filter, then clicking the
// EXACT match (an inexact click can select a longer superset option).
// The ComboboxInput nests more than one <input>, so typing is scoped to the first
// visible one — `.find("input").type()` would throw "single element" here.
/**
 * @tjBlock  events
 * @tjUsage  selectSearchableOption('[data-cy="query-selection-field"]', 'myquery')
 * @tjDom    a searchable OptionCombobox: type to filter, click the exact match
 */
export const selectSearchableOption = (fieldSelector, label) => {
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

// Set a "Control Component" action's target and action name, plus its debounce.
// Requires the handler popover to be open (selectEvent leaves it open).
/**
 * @tjType   csa
 * @tjBlock  csa
 * @tjUsage  selectCSA('textinput1', 'Set text')
 * @tjDom    action-options-component-selection-field + action-options-action-selection-field combobox → debounce-input-field
 */
export const selectCSA = (
  component,
  componentAction,
  debounce = `{selectAll}{backspace}`
) => {
  interceptEvents();

  selectSearchableOption(
    '[data-cy="action-options-component-selection-field"]',
    component
  );
  selectSearchableOption(
    '[data-cy="action-options-action-selection-field"]',
    componentAction
  );
  cy.wait("@events");

  cy.get('[data-cy="debounce-input-field"]')
    .click()
    .type(`{selectAll}{backspace}${debounce}{enter}`);
  commitEventConfig();
  cy.wait("@events");
};

// Type into a config field of the open handler, e.g. addSupportCSAData("alert-message", msg)
// or a CSA param via `event-<label>`. Reopens the handler card if a re-render closed it.
// NOTE: the value is typed through clearAndTypeOnCodeMirror, which SILENTLY DROPS any
// character outside [a-zA-Z0-9._-] — keep literals free of punctuation such as `!`.
/**
 * @tjBlock  csa
 * @tjUsage  addSupportCSAData('alert-message', 'Hello world')
 * @tjDom    <field>-input-field inside popover-card → clearAndTypeOnCodeMirror
 */
export const addSupportCSAData = (field, data) => {
  interceptEvents();
  // The config field (e.g. alert-message) lives inside the event's `popover-card`.
  // Selecting the action via the RocketSelect can momentarily re-render the
  // popover; if it ended up closed, the field won't exist. Ensure the popover is
  // open (reopening the handler card when needed) before typing.
  cy.get("body").then(($body) => {
    if ($body.find(`[data-cy="${field}-input-field"]`).length === 0) {
      // Runs right after selectEvent created/edited the most recent handler, so
      // the relevant card is the last one.
      ensureHandlerCardOpen("last");
    }
  });
  cy.get(`[data-cy="${field}-input-field"]`)
    .should("be.visible")
    .click({ force: true })
    .clearAndTypeOnCodeMirror(data);
  commitEventConfig();
};

// Set a CSA `select`-type parameter. Its combobox shares
// `action-options-action-selection-field` with the action picker
// (EventManager.jsx:1044), so the parameter's own control is `.eq(1)`.
/**
 * @tjBlock  csa
 * @tjUsage  selectSupportCSAData('First option')
 * @tjDom    action-options-action-selection-field:eq(1) searchable combobox option
 */
export const selectSupportCSAData = (option) => {
  interceptEvents();
  selectSearchableOption(
    '[data-cy="action-options-action-selection-field"]:eq(1)',
    option
  );
  commitEventConfig();
  cy.wait("@events");
};

// Change the trigger of an EXISTING handler at `eventIndex`.
/**
 * @tjBlock  events
 * @tjUsage  changeEventType('On blur', 0)
 * @tjDom    event-handler card click → event-selection searchable combobox
 */
export const changeEventType = (event, eventIndex = 0) => {
  interceptEvents();
  cy.get('[data-cy="event-handler"]').eq(eventIndex).click();
  // Same nested-<input> hazard as above — go through selectSearchableOption.
  selectSearchableOption('[data-cy="event-selection"]', event);
  commitEventConfig();
  cy.wait("@events");
};


// Wire ONE trigger to Show Alert. Same isWait caveat as below.
export const addEventWithAlert = (event, message, isWait = true) => {
  addMultiEventsWithAlert([{ event, message }], isWait);
};

// Wire several triggers to Show Alert in one call: [{ event, message }, ...].
// Leave isWait TRUE — see selectEvent; false drops the alert message and the handler
// falls back to its default "Hello world!".
/**
 * @tjType   events
 * @tjBlock  events
 * @tjUsage  addMultiEventsWithAlert([{ event: 'On click', message: 'clicked' }])
 * @tjDom    per entry selectEvent Show Alert → alert-message-input-field
 */
export const addMultiEventsWithAlert = (events, isWait = true) => {
  events.forEach((eventObj, index) => {
    selectEvent(eventObj.event, 'Show Alert', 0, '[data-cy="add-event-handler"]', index, isWait);
    addSupportCSAData("alert-message", eventObj.message);
    cy.wait("@events");
  });
};
// ---------------------------------------------------------------------------
// Component-specific action (CSA) configuration — widget agnostic.
// ---------------------------------------------------------------------------

// Set ONE parameter on the CSA of the currently-open event-handler popover.
//
// param = { label, type?, value }
//   label — the param's displayName from the widget's WidgetManager config, verbatim
//           (original casing and spaces, e.g. "Column key").
//   type  — "toggle" | "select" | omitted (code field).
//
// Per type:
//   toggle  — renders a checkbox `event-<label>-toggle-button`, NOT a code field.
//             Toggle.jsx:23 sends `{{!value}}`, i.e. a click FLIPS. Pass an explicit
//             `value: true|false`; the state is asserted after, so a missed click
//             fails loudly instead of silently keeping the declared default.
//   select  — see selectSupportCSAData.
//   code    — field is `event-<label>-input-field` (SingleLineCodeEditor.jsx:559,685
//             falls back to the raw cyLabel, hence the unslugified label).
//
//             *** CODE FIELDS ARE EVALUATED AS JAVASCRIPT. ***
//             strings : {{"id"}}      — a bare `id` is an identifier -> undefined
//             numbers : {{3}}
//             arrays  : {{[1,2]}}
//             Getting this wrong fails SILENTLY: the action runs, the param resolves
//             to undefined, and nothing changes.
/**
 * @tjBlock  csa
 * @tjUsage  setCSAParam({ label: 'Column key', type: 'toggle', value: true })
 * @tjDom    per type — event-<label>-toggle-button checkbox, select combobox, or event-<label>-input-field code editor
 */
export const setCSAParam = (param) => {
  const { label, type, value } = param;

  if (type === "toggle") {
    const desired = value !== false;
    const sel = `[data-cy="event-${label}-toggle-button"]`;
    cy.get(sel)
      .scrollIntoView()
      .then(($el) => {
        if ($el.prop("checked") !== desired) {
          cy.wrap($el).click({ force: true });
        }
      });
    cy.get(sel).should(desired ? "be.checked" : "not.be.checked");
    return;
  }

  if (type === "select") {
    selectSupportCSAData(value);
    return;
  }

  addSupportCSAData(`event-${label}`, value);
  // Defensive sync: addSupportCSAData never waits on its own intercept.
  cy.wait("@events");
};

// Configure a "Control Component" action on the ALREADY-OPEN event handler: pick the
// target component + action, set every param, then blur and wait for the app to save.
// Call after selectEvent(<trigger>, "Control Component").
/**
 * @tjType   csa
 * @tjBlock  csa
 * @tjUsage  configureCSA('textinput1', 'Set text', [{ label: 'text', value: '{{"hi"}}' }])
 * @tjDom    selectCSA target+action → setCSAParam per param → forceClickOnCanvas + waitForAutoSave
 */
export const configureCSA = (component, action, params = []) => {
  selectCSA(component, action);
  params.forEach(setCSAParam);
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

// Picks the query for a "Run query" event action ("Run query" is the exact label,
// ActionTypes.js — lowercase q; a different list, useCallbackActions.js, spells it
// "Run Query").
//
// Delegates to selectSearchableOption rather than hand-rolling: this control is an
// @base-ui/react Combobox with a real text input, NOT the Radix Select that
// `action-selection` uses, and its ComboboxInput nests more than one <input>, so a plain
// .find("input").click() throws "can only be called on a single element".
//
// The trailing assertion is the control: selectSearchableOption clicks an option but
// asserts nothing, so without it a mis-click leaves the event pointing at no query and
// the test fails later, somewhere less obvious.
/**
 * @tjBlock  events
 * @tjUsage  selectEvent('On click', 'Run query'); selectQueryForEvent('mysquery')
 * @tjDom    query-selection-field input → portalled [data-slot="combobox-item"]
 */
export const selectQueryForEvent = (queryName) => {
  selectSearchableOption('[data-cy="query-selection-field"]', queryName);
  cy.get('[data-cy="query-selection-field"] input')
    .filter(":visible")
    .first()
    .should("have.value", queryName);
  cy.waitForAutoSave();
};
