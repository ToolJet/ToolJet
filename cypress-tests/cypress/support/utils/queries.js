import { postgreSqlSelector } from "Selectors/postgreSql";
import { selectEvent } from "Support/utils/events";

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
  cy.get('[data-cy="component-inspector-delete-button"]').click()
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

export const chainQuery = (currentQuery, trigger) => {
  cy.get(`[data-cy="list-query-${currentQuery}"]`).click();
  cy.wait(1000);
  cy.get('[data-cy="query-tab-settings"]').click();
  selectEvent("Query Success", "Run Query");
  cy.get('[data-cy="query-selection-field"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${trigger}{enter}`);
};

export const addSuccessNotification = (notification) => {
  cy.get('[data-cy="query-tab-settings"]').click();
  cy.get('body').then(($body) => {
    if (!$body.find('[data-cy="success-message-input-field"]').is(':visible')) {
      changeQueryToggles("notification-on-success");
      // cy.get('[data-cy="success-message-input-field"]').then(($input) => {
      //   cy.wrap($input).clearAndTypeOnCodeMirror(notification);
      // });
    }
  });
  cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(notification);
  cy.get('[data-cy="query-tab-setup"]').click();
  cy.wait(300);
};
