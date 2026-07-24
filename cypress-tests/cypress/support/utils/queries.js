import { postgreSqlSelector } from "Selectors/postgreSql";
import { selectEvent } from "Support/utils/events";
import { commonQuerySelectors } from "Selectors/common";
import { postgreSqlText } from "Texts/postgreSql";

export const selectQueryFromLandingPage = (dbName, label) => {
  cy.get(
    `[data-cy="${dbName.toLowerCase().replace(/\s+/g, "-")}-add-query-card"]`
  )
    .should("contain", label)
    .click();
  cy.waitForAutoSave();
};

export const deleteQuery = (queryName) => {
  cy.get(`[data-cy="list-query-${queryName}"]`).click();
  cy.get(`[data-cy="delete-query-${queryName}"]`).click();
  cy.get('[data-cy="component-inspector-delete-button"]').click();
};

export const query = (action) => {
  cy.get(`[data-cy="query-${action}-button"]`).click();
};

export const changeQueryToggles = (option) => {
  cy.get(`[data-cy="${option}-toggle-switch"]`).parent().click();
};

export const renameQueryFromEditor = (name) => {
  cy.get('[data-cy="query-name-label"]').realHover();
  cy.get('[class="breadcrum-rename-query-icon"]').click();
  cy.get('[data-cy="query-rename-input"]').clear().type(`${name}{enter}`);
  // cy.realType(`{selectAll}{backspace}${name}{enter}`);
};

export const addInputOnQueryField = (field, data) => {
  cy.get(`[data-cy="${field}-input-field"]`)
    .click()
    .clearAndTypeOnCodeMirror(`{backSpace}`);
  cy.get(`[data-cy="${field}-input-field"]`).clearAndTypeOnCodeMirror(data);
  // cy.forceClickOnCanvas();
};

export const waitForQueryAction = (action) => {
  cy.get(`[data-cy="query-${action}-button"]`, { timeout: 20000 }).should(
    "not.have.class",
    "button-loading"
  );
};

// Create an event handler (popover EventManager flow) and set its action to
// "Run Query", picking the action from the `action-selection` RocketSelect.
//
// WHY THIS LIVES HERE (not via events.js `selectEvent`/`chooseRocketOption`):
// `action-selection` is a Radix UI Select (frontend/.../shadcn/select.jsx:13
// → @radix-ui/react-select Trigger). Its Trigger opens the portalled
// `SelectContent` on a *pointer* gesture, not on a synthetic DOM click.
// events.js `chooseRocketOption` opens it with `.click({ force:true })`, which
// — when the EventManager auto-open (`open={true}` via autoOpenActionSelect,
// EventManager.jsx:579) has NOT kicked in for this render — does not reliably
// trigger Radix's pointerdown open handler. The portal never mounts, so
// `[role="option"]` is never found and the step times out (30s). This was
// intermittent: it passed whenever the auto-open had the listbox already
// showing (guard short-circuits the trigger click), and failed when it didn't.
//
// Fix: drive the Radix Select deterministically with cypress-real-events
// `.realClick()` (a native pointer event Radix responds to), and only when the
// listbox isn't already open from auto-open. Then pick the role=option.
export const selectRunQueryEvent = (
  event,
  addEventhandlerSelector = '[data-cy="add-event-handler"]',
  index = 0,
  eventIndex = 0
) => {
  // Event handlers save via POST `/events` (create) / PATCH `/events/:id`.
  cy.intercept(/\/events(\/|\?|$)/).as("chainEvents");

  // Add-new-handler popover (EventManager.jsx:1278/1290/1306). One click on the
  // trigger option both chooses the trigger and creates the handler.
  cy.get(addEventhandlerSelector).eq(index).click();
  cy.get('[data-cy="add-event-menu"]').should("be.visible");
  cy.contains(
    '[data-cy^="event-trigger-option-"]',
    new RegExp(`^${event}$`, "i")
  ).click();
  cy.wait("@chainEvents");

  // Creating a handler auto-opens its config popover-card (data-state="open").
  // Reopen it (force — open Radix popover sets body{pointer-events:none}) only
  // if it didn't auto-open.
  cy.get('[data-cy="event-handler-card"]')
    .eq(eventIndex)
    .then(($card) => {
      if ($card.attr("data-state") !== "open") {
        cy.wrap($card).click({ force: true });
      }
    });
  cy.get('[data-cy="popover-card"]').should("be.visible");

  // Open the action-selection Radix Select reliably.
  //
  // The previous flaky paths (events.js force-click; realClick) both failed
  // because (1) the action select is rendered inside the `popover-card` (a
  // Radix Popover) which scroll-locks `body { pointer-events:none }`, so a
  // pointer click — synthetic OR real — is swallowed; and (2) EventManager
  // controls the select's `open` prop via `autoOpenActionSelect`
  // (EventManager.jsx:579) — when that auto-open is active, clicking the
  // trigger calls onOpenChange(false) and *closes* an already-open listbox.
  //
  // Robust approach: focus the trigger and open via KEYBOARD (Radix Select
  // opens on Enter/Space/ArrowDown when focused — unaffected by the
  // body pointer-events lock), but ONLY if the listbox isn't already open
  // from the auto-open. Gate the keyboard open on the trigger's own
  // data-state so we never toggle a controlled-open select shut. Then assert
  // an option is present before picking.
  cy.get('[data-cy="action-selection"]')
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
    .contains(new RegExp(`^\\s*Run Query\\s*$`, "i"))
    .click({ force: true });
  // Changing actionId to run-query fires a PATCH /events; wait for it so the
  // query-selection-field has rendered before we type into it.
  cy.wait("@chainEvents");
};

export const chainQuery = (currentQuery, trigger) => {
  cy.get(`[data-cy="list-query-${currentQuery}"]`).click();
  cy.wait(1000);
  cy.get('[data-cy="query-tab-settings"]').click();
  selectRunQueryEvent("Query Success");
  // query-selection-field is now a Rocket OptionCombobox whose InputGroup nests
  // more than one <input>, so the old `.find("input").type()` threw
  // "cy.type() can only be called on a single element" (2 elements). Type into
  // the first visible input, then pick the matching role=option.
  cy.get('[data-cy="query-selection-field"]').scrollIntoView().click();
  cy.get('[data-cy="query-selection-field"] input')
    .filter(":visible")
    .first()
    .clear({ force: true })
    .type(trigger, { force: true });
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${trigger}\\s*$`, "i"))
    .click({ force: true });
};

export const addSuccessNotification = (notification) => {
  cy.get('[data-cy="query-tab-settings"]').click();
  cy.get("body").then(($body) => {
    if (!$body.find('[data-cy="success-message-input-field"]').is(":visible")) {
      changeQueryToggles("notification-on-success");
      // cy.get('[data-cy="success-message-input-field"]').then(($input) => {
      //   cy.wrap($input).clearAndTypeOnCodeMirror(notification);
      // });
    }
  });
  cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(
    notification
  );
  cy.get('[data-cy="query-tab-setup"]').click();
  cy.wait(300);
};

export const performQueryAction = (queryName, action, newName) => {
  cy.get(commonQuerySelectors.queryNameList(queryName))
    .should("be.visible")
    .trigger("mouseover");
  cy.get(`[data-cy="query-handler-menu-${queryName}"]`)
    .should("be.visible")
    .click();
  if (action === "rename") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
    cy.get(commonQuerySelectors.queryEditInputField)
      .clear()
      .type(`${newName}{enter}`);
  } else if (action === "duplicate") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
  } else if (action === "delete") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
    cy.get(postgreSqlSelector.deleteModalMessage).verifyVisibleElement(
      "have.text",
      postgreSqlText.dialogueTextDelete
    );
    cy.get(postgreSqlSelector.deleteModalCancelButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.cancel
    );
    cy.get(postgreSqlSelector.deleteModalConfirmButton)
      .verifyVisibleElement("have.text", postgreSqlText.yes)
      .click();
  }
};
