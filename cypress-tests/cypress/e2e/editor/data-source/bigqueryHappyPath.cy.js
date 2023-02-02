import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { bigqueryText } from "Texts/bigquery";
import { firestoreText } from "Texts/firestore";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";

describe("Data source BigQuery", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on BigQuery connection form", () => {
    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.labelDataSources).should(
      "have.text",
      postgreSqlText.labelDataSources
    );

    cy.get(postgreSqlSelector.addDatasourceLink)
      .should("have.text", postgreSqlText.labelAddDataSource)
      .click();

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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type(
      bigqueryText.bigQuery
    );
    cy.get("[data-cy*='data-source-']")
      .eq(0)
      .should("contain", bigqueryText.bigQuery);
    cy.get('[data-cy="data-source-bigquery"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      bigqueryText.bigQuery
    );

    cy.get('[data-cy="label-private-key"]').verifyVisibleElement(
      "have.text",
      firestoreText.labelPrivateKey
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
    cy.get(postgreSqlSelector.dangerAlertNotSupportSSL).verifyVisibleElement(
      "have.text",
      bigqueryText.errorInvalidEmailId
    );
  });

  it("Should verify the functionality of BigQuery connection form.", () => {
    selectDataSource(bigqueryText.bigQuery);

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      bigqueryText.cypressBigQuery
    );

    fillDataSourceTextField(
      firestoreText.privateKey,
      bigqueryText.placehlderPrivateKey,
      JSON.stringify(Cypress.env("bigquery_pvt_key")),
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
      postgreSqlText.toastDSAdded
    );

    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.datasourceLabelOnList)
      .should("have.text", bigqueryText.cypressBigQuery)
      .find("button")
      .should("be.visible");
  });
});
