import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { bigqueryText } from "Texts/bigquery";
import { firestoreText } from "Texts/firestore";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";

const data = {};

describe("Data source BigQuery", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Should verify elements on BigQuery connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    // cy.get(commonSelectors.addNewDataSourceButton)
    //   .verifyVisibleElement("have.text", commonText.addNewDataSourceButton)
    //   .click();

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
      `cypress-${data.dataSourceName}-bigquery`,
      "bigquery",
      [{ key: "private_key", value: "", encrypted: true }]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-bigquery-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-bigquery`
    );

    cy.get('[data-cy="label-private-key"]').verifyVisibleElement(
      "have.text",
      firestoreText.labelPrivateKey
    );
    cy.get(".datasource-edit-btn").should("be.visible");
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
      bigqueryText.errorInvalidEmailId
    );
    deleteDatasource(
      `cypress-${String(data.dataSourceName).toLowerCase()}-${String(
        bigqueryText.bigQuery
      ).toLowerCase()}`
    );
  });

  it("Should verify the functionality of BigQuery connection form.", () => {
    selectAndAddDataSource(
      "databases",
      bigqueryText.bigQuery,
      data.dataSourceName
    );

    fillDataSourceTextField(
      firestoreText.privateKey,
      bigqueryText.placehlderPrivateKey,
      `${JSON.stringify(Cypress.env("bigquery_pvt_key"))}`,
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
      `[data-cy="cypress-${data.dataSourceName}-bigquery-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-bigquery`
    );

    deleteDatasource(`cypress-${data.dataSourceName}-bigquery`);
  });
});
