import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { azureBlobStorageText } from "Texts/azureBlobStorage";
import { mongoDbText } from "Texts/mongoDb";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.customText = fake.randomSentence;

describe("Data source Azure Blob Storage", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.intercept("GET", "/api/v2/data_sources");
  });

  it("Should verify elements on Azure Blob Storage connection form", () => {
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
    selectAndAddDataSource(
      "cloudstorage",
      azureBlobStorageText.azureBlobStorage,
      data.lastName
    );

    cy.get('[data-cy="label-connection-string"]').verifyVisibleElement(
      "have.text",
      mongoDbText.labelConnectionString
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
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      "Cannot read properties of undefined (reading 'startsWith')"
    );
  });

  it("Should verify the functionality of Azure Blob Storage connection form.", () => {
    data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources
    );
    selectAndAddDataSource(
      "cloudstorage",
      azureBlobStorageText.azureBlobStorage,
      data.lastName
    );

    fillDataSourceTextField(
      mongoDbText.labelConnectionString,
      azureBlobStorageText.connectionStringPlaceholder,
      data.customText,
      "contain",
      { parseSpecialCharSequences: false, delay: 0 }
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
    cy.get(dataSourceSelector.connectionAlertText).verifyVisibleElement(
      "have.text",
      azureBlobStorageText.unableExtractAccountNameText
    );

    fillDataSourceTextField(
      mongoDbText.labelConnectionString,
      azureBlobStorageText.connectionStringPlaceholder,
      Cypress.env("azure_blob_storage_connection_string"),
      "contain",
      { parseSpecialCharSequences: false, delay: 0 }
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

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-azure-blob-storage-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.lastName}-azure-blob-storage`
    );

    deleteDatasource(`cypress-${data.lastName}-azure-blob-storage`);
  });
});
