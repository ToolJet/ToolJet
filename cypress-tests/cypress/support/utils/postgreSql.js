import {
  commonSelectors,
  cyParamName,
  commonWidgetSelector,
} from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";

export const addQuery = (queryName, query, dbName) => {
  cy.get(postgreSqlSelector.buttonAddNewQueries).click();
  cy.get(`[data-cy="${dbName}-add-query-card"]`)
    .should("contain", postgreSqlText.psqlName)
    .click();
  selectQueryMode(postgreSqlText.queryModeSql, "3");
  cy.get(postgreSqlSelector.queryLabelInputField).clear().type(queryName);
  cy.get(postgreSqlSelector.queryInputField).should("be.visible").type(query);
  cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};

export const addQueryOnGui = (queryName, query) => {
  cy.get(postgreSqlSelector.buttonAddNewQueries).click();
  cy.get('[data-cy="cypress-postgresql"]')
    .should("contain", postgreSqlText.psqlName)
    .click();

  cy.get(postgreSqlSelector.queryLabelInputField).clear().type(queryName);
  cy.get(postgreSqlSelector.queryInputField)
    .should("be.visible")
    .clearAndTypeOnCodeMirror(query);
  cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};
export const selectDataSource = (dataSource) => {
  cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
  cy.get(postgreSqlSelector.addDatasourceLink).click();
  cy.get(postgreSqlSelector.dataSourceSearchInputField).type(dataSource);
  cy.get(`[data-cy='data-source-${dataSource.toLowerCase()}']`).click();
};

export const fillConnectionForm = (data) => {
  for (const property in data) {
    cy.clearAndType(
      `[data-cy="${cyParamName(property)}-text-field"]`,
      `${data[property]}`
    );
  }
  cy.get(postgreSqlSelector.buttonTestConnection).click();
  cy.get(postgreSqlSelector.textConnectionVerified, {
    timeout: 7000,
  }).should("have.text", "connection verified");
  cy.get(postgreSqlSelector.buttonSave).click();
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
  cy.reload();
  cy.wait(2000);
  cy.get(postgreSqlSelector.buttonAddNewQueries).click();
  cy.get(`[data-cy="${cyParamName(dataSourceName)}-add-query-card"]`)
    .should("contain", dataSourceName)
    .click();
};

export const selectQueryMode = (mode, index = 2) => {
  cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(0)`).click();
  cy.contains("[id*=react-select-]", mode).click();
};

export const addGuiQuery = (tableName, primaryKey) => {
  cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(1)`).click();
  cy.get("#react-select-3-option-0").click();

  cy.get(postgreSqlSelector.tableNameInputField).type(tableName);
  cy.get(postgreSqlSelector.primaryKeyColoumnInputField).type(primaryKey);
  cy.get(postgreSqlSelector.recordsInputField)
    .type(`[{{}name:'midhun',email:'mid@example.com'}]}}`)
    .type("{home}{{");
};

export const addEventHandlerToRunQuery = (query) => {
  cy.get(commonWidgetSelector.addEventHandlerLink).click();
  cy.get(commonWidgetSelector.eventHandlerCard).click();
  cy.get(commonWidgetSelector.actionSelection).type("Run Query{enter}");
  cy.get(postgreSqlSelector.eventQuerySelectionField).type(`${query}{enter}`);
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
