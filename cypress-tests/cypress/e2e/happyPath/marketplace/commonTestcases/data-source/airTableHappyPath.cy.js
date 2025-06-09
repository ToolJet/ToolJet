import { fake } from "Fixtures/fake";
import { postgreSqlSelector, airTableSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { airtableText } from "Texts/airTable";
import { commonSelectors } from "Selectors/common";
import { closeDSModal } from "Support/utils/dataSource";
import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";

const data = {};
data.queryName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
const airTable_apiKey = Cypress.env("airTable_apikey");
const airTable_baseId = Cypress.env("airtabelbaseId");
const airTable_tableName = Cypress.env("airtable_tableName");
const airTable_recordID = Cypress.env("airtable_recordId");

describe("Data source Airtable", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
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

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dsName}-airtable`,
      "airtable",
      [
        {
          key: "personal_access_token",
          value: `${Cypress.env("airTable_apikey")}`,
          encrypted: true,
        },
      ]
    );
    cy.reload();
    cy.get(
      dataSourceSelector.dataSourceNameButton(`cypress-${data.dsName}-airtable`)
    )
      .should("be.visible")
      .click();
    cy.get(
      dataSourceSelector.labelFieldName(airtableText.ApiKey)
    ).verifyVisibleElement("have.text", `${airtableText.ApiKey}*`);
    cy.get(postgreSqlSelector.labelEncryptedText).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelEncrypted
    );
    cy.get(dataSourceSelector.button(postgreSqlText.editButtonText)).should(
      "be.visible"
    );
    cy.get(dataSourceSelector.button(postgreSqlText.editButtonText)).click();
    cy.verifyRequiredFieldValidation(airtableText.ApiKey, "rgb(226, 99, 103)");
    cy.get(dataSourceSelector.textField(airtableText.ApiKey)).should(
      "be.visible"
    );
    cy.get(postgreSqlSelector.labelIpWhitelist).verifyVisibleElement(
      "have.text",
      postgreSqlText.whiteListIpText
    );
    cy.get(postgreSqlSelector.buttonCopyIp).verifyVisibleElement(
      "have.text",
      postgreSqlText.textCopy
    );

    cy.get(postgreSqlSelector.linkReadDocumentation).verifyVisibleElement(
      "have.text",
      postgreSqlText.readDocumentation
    );
    cy.get(postgreSqlSelector.buttonTestConnection)
      .verifyVisibleElement(
        "have.text",
        postgreSqlText.buttonTextTestConnection
      )
      .click();
    cy.get(postgreSqlSelector.connectionFailedText).verifyVisibleElement(
      "have.text",
      postgreSqlText.couldNotConnect
    );
    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .and("be.disabled");
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      airtableText.invalidAccessToken
    );

    cy.apiDeleteGDS(`cypress-${data.dsName}-airtable`);
  });

  it("Should verify the functionality of AirTable connection form.", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dsName}-airtable`,
      "airtable",
      [
        {
          key: "personal_access_token",
          value: "Invalid access token",
          encrypted: true,
        },
      ]
    );
    cy.get(
      dataSourceSelector.dataSourceNameButton(`cypress-${data.dsName}-airtable`)
    )
      .should("be.visible")
      .click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(dataSourceSelector.connectionFailedText, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.couldNotConnect);

    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      airtableText.invalidAccessToken
    );
    cy.reload();
    cy.apiUpdateGDS({
      name: `cypress-${data.dsName}-airtable`,
      options: [
        {
          key: "personal_access_token",
          value: `${Cypress.env("airTable_apikey")}`,
          encrypted: true,
        },
      ],
    });
    cy.get(
      dataSourceSelector.dataSourceNameButton(`cypress-${data.dsName}-airtable`)
    )
      .should("be.visible")
      .click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.apiDeleteGDS(`cypress-${data.dsName}-airtable`);
  });

  it("Should able to run the query with valid conection", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dsName}-airtable`,
      "airtable",
      [
        {
          key: "personal_access_token",
          value: `${airTable_apiKey}`,
          encrypted: true,
        },
      ]
    );
    cy.apiCreateApp(`${data.dsName}-airtable-app`);
    cy.openApp();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    // Verfiy List Recored operation

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("List records{enter}");

    cy.get(airTableSelector.baseIdInputField).clearAndTypeOnCodeMirror(
      airTable_baseId
    );

    cy.get(airTableSelector.tableNameInputField).clearAndTypeOnCodeMirror(
      airTable_tableName
    );

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );

    // Verfiy Retrieve record operation

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Retrieve record{enter}");

    cy.get(airTableSelector.baseIdInputField).clearAndTypeOnCodeMirror(
      airTable_baseId
    );
    cy.get(airTableSelector.tableNameInputField).clearAndTypeOnCodeMirror(
      airTable_tableName
    );

    cy.get(airTableSelector.recordIdInputField).clearAndTypeOnCodeMirror(
      airTable_recordID
    );

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );

    // Verfiy Create record operation

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Create record{enter}");

    cy.get(airTableSelector.baseIdInputField).clearAndTypeOnCodeMirror(
      airTable_baseId
    );

    cy.get(airTableSelector.tableNameInputField).clearAndTypeOnCodeMirror(
      airTable_tableName
    );

    cy.get(airTableSelector.bodyInputField)
      .realClick()
      .realType('[{"', { force: true, delay: 0 })
      .realType("fields", { force: true, delay: 0 })
      .realType('": {}', { force: true, delay: 0 });

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );

    // Verfiy Update record operation

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.queryName);

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Update record{enter}");

    cy.get(airTableSelector.baseIdInputField).clearAndTypeOnCodeMirror(
      airTable_baseId
    );
    cy.get(airTableSelector.tableNameInputField).clearAndTypeOnCodeMirror(
      airTable_tableName
    );

    cy.get(airTableSelector.recordIdInputField).clearAndTypeOnCodeMirror(
      airTable_recordID
    );

    cy.get(airTableSelector.bodyInputField)
      .realClick()
      .realType("{", { force: true, delay: 0 })
      .realType("{enter}", { force: true, delay: 0 })
      .realType('"Phone Number": "555_98"', { force: true, delay: 0 });

    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.queryName}) completed.`
    );

    // Verify Delete record operation

    cy.get(airTableSelector.operationSelectDropdown)
      .click()
      .type("Delete record{enter}");

    const recordId = Cypress._.uniqueId("recDummy_");

    cy.request({
      method: "POST",
      url: `https://api.airtable.com/v0/${airTable_baseId}/${airTable_tableName}`,
      headers: {
        Authorization: `Bearer ${Cypress.env("airTable_apikey")}`,
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
      const newRecordId = createResponse.body.records[0].id;

      cy.get(airTableSelector.operationSelectDropdown)
        .click()
        .type("Delete record{enter}");

      cy.get(airTableSelector.baseIdInputField).clearAndTypeOnCodeMirror(
        airTable_baseId
      );
      cy.get(airTableSelector.tableNameInputField).clearAndTypeOnCodeMirror(
        airTable_tableName
      );

      cy.get(airTableSelector.recordIdInputField).clearAndTypeOnCodeMirror(
        newRecordId
      );

      cy.get(dataSourceSelector.queryPreviewButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        `Query (${data.queryName}) completed.`
      );

      cy.apiDeleteApp(`${data.dsName}-airtable-app`);
      cy.apiDeleteGDS(`cypress-${data.dsName}-airtable`);
    });
  });
});
