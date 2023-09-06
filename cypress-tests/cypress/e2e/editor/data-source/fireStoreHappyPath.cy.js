import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { firestoreText } from "Texts/firestore";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  verifyCouldnotConnectWithAlert,
  deleteDatasource,
  closeDSModal,
} from "Support/utils/dataSource";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";
const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source Firestore", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on Firestore connection form", () => {
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

    selectAndAddDataSource("databases", firestoreText.firestore, data.lastName);

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
    cy.get('[data-cy="connection-alert-text"]').verifyVisibleElement(
      "have.text",
      firestoreText.errorGcpKeyCouldNotBeParsed
    );
  });

  it("Should verify the functionality of Firestore connection form.", () => {
    data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    selectAndAddDataSource("databases", firestoreText.firestore, data.lastName);

    fillDataSourceTextField(
      firestoreText.privateKey,
      firestoreText.placeholderPrivateKey,
      `${JSON.stringify(Cypress.env("firestore_pvt_key"))}`,
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

    cy.get(
      `[data-cy="cypress-${data.lastName}-firestore-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-firestore`);

    deleteDatasource(`cypress-${data.lastName}-firestore`);
  });
});
