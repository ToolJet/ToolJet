import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";
import {
  addQuery,
  fillDataSourceTextField,
  fillConnectionForm,
  selectAndAddDataSource,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";

const data = {};

describe("Data sources", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on connection form", () => {
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
      `cypress-${data.dataSourceName}-cosmosdb`,
      "cosmosdb",
      [
        { key: "endpoint", value: "" },
        { key: "key", value: "", encrypted: true },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-cosmosdb-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-cosmosdb`
    );

    cy.get('[data-cy="label-end-point"]').verifyVisibleElement(
      "have.text",
      "End point"
    );
    cy.get('[data-cy="label-key"]').verifyVisibleElement("have.text", "Key");

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
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      "Invalid URL"
    );
    deleteDatasource(`cypress-${data.dataSourceName}-cosmosdb`);
  });

  it("Should verify the functionality of CosmosDB connection form.", () => {
    selectAndAddDataSource("databases", "CosmosDB", data.dataSourceName);

    fillDataSourceTextField(
      "End point",
      "https://your-account.documents.azure.com",
      Cypress.env("cosmosdb_end_point")
    );
    fillDataSourceTextField(
      "Key",
      "**************",
      Cypress.env("cosmosdb_key")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-cosmosdb-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-cosmosdb`
    );
    deleteDatasource(`cypress-${data.dataSourceName}-cosmosdb`);
  });
});
