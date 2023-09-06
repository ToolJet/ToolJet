import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonText } from "Texts/common";
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
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );
    selectAndAddDataSource("databases", "CosmosDB", data.lastName);

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
    cy.get('[data-cy="connection-alert-text"]').verifyVisibleElement(
      "have.text",
      "Invalid URL"
    );
  });

  it.only("Should verify the functionality of CosmosDB connection form.", () => {
    data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    selectAndAddDataSource("databases", "CosmosDB", data.lastName);

    fillDataSourceTextField(
      "End point",
      "https://your-account.documents.azure.com",
      Cypress.env("cosmosdb_end_point")
    );
    fillDataSourceTextField(
      "Key",
      "Enter your key",
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
      `[data-cy="cypress-${data.lastName}-cosmosdb-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-cosmosdb`);
    deleteDatasource(`cypress-${data.lastName}-cosmosdb`);
  });
});
