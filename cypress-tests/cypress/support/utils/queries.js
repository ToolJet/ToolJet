import { postgreSqlSelector } from "Selectors/postgreSql";

export const selectQueryFromLandingPage = (dbName, label) => {
  cy.get(
    `[data-cy="${dbName.toLowerCase().replace(/\s+/g, "-")}-add-query-card"]`
  )
    .should("contain", label)
    .click();
  cy.waitForAutoSave();
};

export const deleteQuery = (queryName) => {
  cy.get(`[data-cy="list-query-${queryName}"]`).realHover();
  cy.get(`[data-cy="elete-query-${queryName}"]`).click();
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
  cy.forceClickOnCanvas();
};

export const waitForQueryAction = (action) => {
  cy.get(`[data-cy="query-${action}-button"]`, { timeout: 20000 }).should(
    "not.have.class",
    "button-loading"
  );
};
