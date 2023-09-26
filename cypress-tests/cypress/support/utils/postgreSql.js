import {
  commonSelectors,
  cyParamName,
  commonWidgetSelector,
} from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { closeDSModal } from "Support/utils/dataSource";

export const addQuery = (queryName, query, dbName) => {
  cy.get(postgreSqlSelector.buttonAddNewQueries).click();
  cy.get(`[data-cy="${dbName}-add-query-card"]`)
    .should("contain", dbName)
    .click();
  // selectQueryMode(postgreSqlText.queryModeSql, "3");
  cy.get('[data-cy="query-name-label"]')
    .realHover()
    .then(() => {
      cy.get('[class*="breadcrum-rename-query-icon"]').click();
    });
  cy.get(postgreSqlSelector.queryLabelInputField).clear().type(queryName);
  cy.get(postgreSqlSelector.queryInputField)
    .realMouseDown({ position: "center" })
    .realType(" ");
  cy.get(postgreSqlSelector.queryInputField).clearAndTypeOnCodeMirror(query);
  cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
};

export const addQueryOnGui = (queryName, query) => {
  cy.get(postgreSqlSelector.buttonAddNewQueries).click();
  cy.get('[data-cy="cypress-postgresql"]').should("contain", dbName).click();

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
export const selectAndAddDataSource = (
  dscategory,
  dataSource,
  dataSourceName
) => {
  cy.get(commonSelectors.globalDataSourceIcon).click();
  cy.wait(1000)
  cy.get(`[data-cy="${cyParamName(dscategory)}-datasource-button"]`).click();
  cy.wait(500)
  cy.get(postgreSqlSelector.dataSourceSearchInputField).type(dataSource);
  cy.get(`[data-cy="data-source-${(dataSource).toLowerCase()}"]`)
    .parent()
    .within(() => {
      cy.get(
        `[data-cy="data-source-${(
          dataSource
        ).toLowerCase()}"]>>>.datasource-card-title`
      ).realHover("mouse");
      cy.get(
        `[data-cy="${cyParamName(dataSource).toLowerCase()}-add-button"]`
      ).click();
    });

  cy.wait(1000)
  cy.get(postgreSqlSelector.buttonSave).should("be.disabled")
  cy.clearAndType(
    '[data-cy="data-source-name-input-filed"]',
    cyParamName(`cypress-${dataSourceName}-${dataSource}`)
  );
  cy.get(postgreSqlSelector.buttonSave).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    postgreSqlText.toastDSAdded
  );
  cy.get(
    `[data-cy="cypress-${cyParamName(dataSourceName)}-${cyParamName(
      dataSource
    )}-button"]`
  ).verifyVisibleElement(
    "have.text",
    `cypress-${cyParamName(dataSourceName)}-${cyParamName(dataSource)}`
  );
};

export const fillConnectionForm = (data, toggle = "") => {
  cy.get("body").then(($body) => {
    const editButton = $body.find(".tj-btn");
    if (editButton.length > 0) {
      editButton.click();
    }
  });
  for (const property in data) {
    cy.clearAndType(
      `[data-cy="${cyParamName(property)}-text-field"]`,
      `${data[property]}`
    );
  }
  if (toggle != "") {
    cy.get(toggle).click();
  }

  cy.get(postgreSqlSelector.buttonSave).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    postgreSqlText.toastDSSaved
  );
  cy.get(postgreSqlSelector.buttonTestConnection).click();
  cy.get(postgreSqlSelector.textConnectionVerified, {
    timeout: 7000,
  }).should("have.text", postgreSqlText.labelConnectionVerified);
};

export const fillDataSourceTextField = (
  fieldName,
  placeholder,
  input,
  assertionType = "have",
  args
) => {
  cy.get(`[data-cy="label-${cyParamName(fieldName)}"]`).should(
    `${assertionType}.text`,
    fieldName
  );
  cy.get(`[data-cy="${cyParamName(fieldName)}-text-field"]`).then(($field) => {
    if ($field.is(":disabled")) {
      cy.get(".datasource-edit-btn").click();
    }
  });
  cy.get(`[data-cy="${cyParamName(fieldName)}-text-field"]`)
    .invoke("attr", "placeholder")
    .should("eq", placeholder.replace(/\u00a0/g, " "));

  cy.get(`[data-cy="${cyParamName(fieldName)}-text-field"]`)
    .clear()
    .type(input, args);
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
  cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(0)`)
    .scrollIntoView()
    .should("be.visible")
    .click();
  cy.contains("[id*=react-select-]", mode).click();
};

export const addGuiQuery = (tableName, primaryKey) => {
  cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(1)`).click();
  cy.get("#react-select-5-option-0").click();

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

export const addListviewToVerifyData = () => { };