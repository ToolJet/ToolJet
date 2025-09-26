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


export const performQueryAction = (queryName, action, newName) => {
  cy.get(commonQuerySelectors.queryNameList(queryName))
    .should("be.visible")
    .trigger("mouseover");
  cy.get(`[data-cy="delete-query-${queryName}"]`)
    .should("be.visible")
    .click();
  if (action === "rename") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
    cy.get(commonQuerySelectors.queryEditInputField).clear().type(`${newName}{enter}`);
  } 
  else if (action === "duplicate") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
  } 
  else if (action === "delete") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
    cy.get(postgreSqlSelector.deleteModalMessage)
      .verifyVisibleElement("have.text", postgreSqlText.dialogueTextDelete);
    cy.get(postgreSqlSelector.deleteModalCancelButton)
      .verifyVisibleElement("have.text", postgreSqlText.cancel);
    cy.get(postgreSqlSelector.deleteModalConfirmButton)
      .verifyVisibleElement("have.text", postgreSqlText.yes)
      .click();
  }
};