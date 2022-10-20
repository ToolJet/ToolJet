import {
  commonSelectors,
  cyParamName,
  commonWidgetSelector,
} from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { textInputText } from "Texts/textInput";

export const addQuery = (queryName, query, dbName) => {
  cy.get('[data-cy="button-add-new-queries"]').click();
  cy.get(`[data-cy="${dbName}-add-query-card"]`)
    .should("contain", "cypress-postgresql")
    .click();

  cy.get('[data-cy="query-label-input-field"]').clear().type(queryName);
  cy.get('[data-cy="query-input-field"]').should("be.visible").type(query);
  cy.get('[data-cy="query-create-and-run-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};

export const addQueryOnGui = (queryName, query) => {
  cy.get('[data-cy="button-add-new-queries"]').click();
  cy.get('[data-cy="cypress-postgresql"]')
    .should("contain", "cypress-postgresql")
    .click();

  cy.get('[data-cy="query-label-input-field"]').clear().type(queryName);
  cy.get('[data-cy="query-input-field"]')
    .should("be.visible")
    .clearAndTypeOnCodeMirror(query);
  cy.get('[data-cy="query-create-and-run-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};
export const selectDataSource = (dataSource) => {
  cy.get("[data-cy='left-sidebar-sources-button']").click();
  cy.get("[data-cy='add-datasource-link']").click();
  cy.get('[data-cy="datasource-search-input"]').type(dataSource);
  cy.get(`[data-cy='data-source-${dataSource.toLowerCase()}']`).click();
};

export const fillConnectionForm = (data) => {
  // cy.clearAndType('[data-cy="host-text-field"]', host);
  // cy.clearAndType('[data-cy="port-text-field"]', port);
  // cy.clearAndType('[data-cy="database-name-text-field"]', dbName);
  // cy.clearAndType('[data-cy="username-text-field"]', userName);
  // cy.clearAndType('[data-cy="password-text-field"]', password);

  for (const property in data) {
    cy.clearAndType(
      `[data-cy="${cyParamName(property)}-text-field"]`,
      `${data[property]}`
    );
  }
  cy.get('[data-cy="test-connection-button"]').click();
  cy.get('[data-cy="test-connection-verified-text"]', {
    timeout: 7000,
  }).should("have.text", "connection verified");
  cy.get('[data-cy="db-connection-save-button"]').click();
};

export const fillDataSourceTextField = (fieldName, placeholder, input) => {
  cy.get(`[data-cy="label-${cyParamName(fieldName)}"]`).should(
    "have.text",
    fieldName
  );
  cy.get(`[data-cy="${cyParamName(fieldName)}-text-field"]`)
    .invoke("attr", "placeholder")
    .should("eq", placeholder.replace(/\u00a0/g, " "));
  cy.clearAndType(`[data-cy="${cyParamName(fieldName)}-text-field"]`, input);
};

export const openQueryEditor = (dataSourceName) => {
  cy.reload(); // remove later
  cy.wait(5000);
  cy.get('[data-cy="button-add-new-queries"]').click();
  // cy.get(".spinner-border", { timeout: 10000 }).should("not.be.visible");
  cy.get(`[data-cy="${cyParamName(dataSourceName)}-add-query-card"]`).click();
};

export const selectQueryMode = (mode, index = 2) => {
  cy.get("[data-cy='query-select-dropdown']:eq(0)").click();

  mode == "SQL mode"
    ? cy.get(`#react-select-${index}-option-0`).click()
    : cy.get(`#react-select-${index}-option-1`).click();
};

export const addGuiQuery = (tableName, primaryKey, Data) => {
  cy.get("[data-cy='query-select-dropdown']:eq(1)").click();
  cy.get("#react-select-3-option-0").click();

  cy.get('[data-cy="table-input-field"]').type(tableName);
  cy.get('[data-cy="primary_key_column-input-field"]').type(primaryKey);
  cy.get('[data-cy="records-input-field"]')
    .type(`[{{}name:'midhun',email:'mid@example.com'}]}}`)
    .type("{home}{{");
};

export const addEventHandlerToRunQuery = (query) => {
  cy.get(commonWidgetSelector.addEventHandlerLink).click();
  cy.get(commonWidgetSelector.eventHandlerCard).click();
  cy.get(commonWidgetSelector.actionSelection).type("Run Query{enter}");
  cy.get('[data-cy="query-selection-field"]').type(`${query}{enter}`);
  cy.forceClickOnCanvas();
};

export const addWidgetsToAddUser = () => {
  cy.dragAndDropWidget("Text Input", 200, 160);
  cy.dragAndDropWidget("Text Input", 400, 160);
  cy.dragAndDropWidget("Button", 600, 160);
  openEditorSidebar("button1");
  openAccordion(commonWidgetText.accordionEvents);
  addEventHandlerToRunQuery("add_data_using_widgets");
};

export const addListviewToVerifyData = () => {};
