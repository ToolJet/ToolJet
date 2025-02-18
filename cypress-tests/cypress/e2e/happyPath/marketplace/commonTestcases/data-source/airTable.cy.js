import { fake } from "Fixtures/fake";
import { postgreSqlSelector, airTableSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { airtableText } from "Texts/airTable";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import { redisText } from "Texts/redis";

import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
  addQuery,
  addDsAndAddQuery,
  selectDatasource,
} from "Support/utils/dataSource";

import { openQueryEditor } from "Support/utils/dataSource";
import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.dsName1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source Redis", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connection AirTable form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase()
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    selectAndAddDataSource("databases", airtableText.airtable, data.dsName);

    cy.get(postgreSqlSelector.linkReadDocumentation).verifyVisibleElement(
      "have.text",
      postgreSqlText.readDocumentation
    );

    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );
    deleteDatasource(`cypress-${data.dsName}-airtable`);
  });

  it("Should verify the functionality of AirTable connection form.", () => {
    selectAndAddDataSource("databases", airtableText.airtable, data.dsName);

    fillDataSourceTextField(
      airtableText.apiKey,
      airtableText.apikeyPlaceholder,
      Cypress.env("airTable_apikey")
    );
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dsName}-airtable-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName}-airtable`);
    deleteDatasource(`cypress-${data.dsName}-airtable`);
  });

  it("Should able to run the query with valid conection", () => {
    const airTable_apiKey = Cypress.env("airTable_apikey");
    const airTable_baseId = Cypress.env("baseId");
    const airTable_tableName = Cypress.env("tableName");
    const airTable_recordID = Cypress.env("recordId");

    selectAndAddDataSource("databases", airtableText.airtable, data.dsName);

    fillDataSourceTextField(
      airtableText.apiKey,
      airtableText.apikeyPlaceholder,
      airTable_apiKey
    );

    cy.wait(1000);
    cy.get(postgreSqlSelector.buttonSave).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dsName}-airtable-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.dsName}-airtable`);
    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    // Verfiy List Recored operation
    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("List records{enter}");

    cy.wait(500);

    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.baseIdInputField,
      airTable_baseId
    );
    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.tableNameInputField,
      airTable_tableName
    );
    cy.wait(1000);

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );

    // Verfiy Retrieve record operation
    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Retrieve record{enter}");
    cy.wait(500);

    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.baseIdInputField,
      airTable_baseId
    );
    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.tableNameInputField,
      airTable_tableName
    );
    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.recordIdInputField,
      airTable_recordID
    );
    cy.wait(1000);
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );

    // Verfiy Create record operation

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Create record{enter}");
    cy.wait(500);

    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.baseIdInputField,
      airTable_baseId
    );
    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.tableNameInputField,
      airTable_tableName
    );

    cy.get(airTableSelector.bodyInputField)
      .realClick()
      .realType('[{"', { force: true, delay: 0 })
      .realType("fields", { force: true, delay: 0 })
      .realType('": {}', { force: true, delay: 0 });

    cy.wait(1000);
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );

    // Verfiy Update record operation

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName1);

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Update record{enter}");
    cy.wait(500);

    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.baseIdInputField,
      airTable_baseId
    );
    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.tableNameInputField,
      airTable_tableName
    );
    cy.clearAndTypeOnCodeMirrorForEachField(
      airTableSelector.recordIdInputField,
      airTable_recordID
    );

    cy.get(airTableSelector.bodyInputField)
      .realClick()
      .realType("{", { force: true, delay: 0 })
      .realType("{enter}", { force: true, delay: 0 })
      .realType('"Phone Number": "555_98"', { force: true, delay: 0 });

    cy.wait(1000);
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName1}) completed.`
    );

    // Verify Delete record operation

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Delete record{enter}");
    cy.wait(500);

    // Generate a unique dummy ID for the record
    const recordId = Cypress._.uniqueId("recDummy_");

    // Create a new record in Airtable
    cy.request({
      method: "POST",
      url: `https://api.airtable.com/v0/${airTable_baseId}/${airTable_tableName}`, // Your Airtable Base ID and Table Name
      headers: {
        Authorization: `Bearer ${Cypress.env("airTable_apikey")}`, // Your Airtable API Key
        "Content-Type": "application/json",
      },
      body: {
        records: [
          {
            fields: {
              "Employee ID": "E005",
              "First Name": "test",
              "Last Name": "abc",
              Email: "doe@example.com",
              "Phone Number": "555-12",
            },
          },
        ],
      },
    }).then((createResponse) => {
      const newRecordId = createResponse.body.records[0].id; // Get the ID of the newly created record

      // Use the newly created record ID in your test case to delete the record
      cy.get(airTableSelector.operationSelectDropdown)
        .click()
        .type("Delete record{enter}");
      cy.wait(500);

      cy.clearAndTypeOnCodeMirrorForEachField(
        airTableSelector.baseIdInputField,
        airTable_baseId
      );

      cy.clearAndTypeOnCodeMirrorForEachField(
        airTableSelector.tableNameInputField,
        airTable_tableName
      );

      cy.clearAndTypeOnCodeMirrorForEachField(
        airTableSelector.recordIdInputField,
        newRecordId // Using the newly created record ID
      );
      cy.wait(1000);

      cy.get(dataSourceSelector.queryPreviewButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        `Query (${data.dsName1}) completed.`
      );
    });
  });
});
