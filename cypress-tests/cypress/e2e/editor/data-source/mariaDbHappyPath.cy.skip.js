import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText, commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
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
import { fake } from "Fixtures/fake";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

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

    selectAndAddDataSource("databases", "MariaDB", data.lastName);

    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelUserName
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      "Password"
    );
    cy.get('[data-cy="label-connection-limit"]').verifyVisibleElement(
      "have.text",
      "Connection Limit"
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );
    cy.get(postgreSqlSelector.labelSsl).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSSL
    );
    cy.get('[data-cy="label-database"]').verifyVisibleElement(
      "have.text",
      "Database"
    );

    cy.get(postgreSqlSelector.labelSSLCertificate).verifyVisibleElement(
      "have.text",
      postgreSqlText.sslCertificate
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
    cy.get(postgreSqlSelector.connectionFailedText)
      .scrollIntoView()
      .verifyVisibleElement("have.text", postgreSqlText.couldNotConnect);
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    // cy.get('[data-cy="connection-alert-text"]').should("be.visible")
    deleteDatasource(`cypress-${data.lastName}-mariadb`);
  });

  it("Should verify the functionality of MariaDB connection form.", () => {
    selectAndAddDataSource("databases", "MariaDB", data.lastName);

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("mariadb_host")
    );
    // fillDataSourceTextField(
    //   postgreSqlText.labelPort,
    //   postgreSqlText.placeholderEnterPort,
    //   "5432"
    // );

    cy.get('[data-cy="label-port"]').verifyVisibleElement("have.text", "Port");
    cy.get('[data-cy="port-text-field"]')
      .should("be.visible")
      .invoke("attr", "placeholder")
      .should("contain", "Enter port");

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("mariadb_user")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "Enter password",
      Cypress.env("mariadb_password")
    );

    cy.get('[data-cy="label-database"]').verifyVisibleElement(
      "have.text",
      "Database"
    );
    cy.get('[data-cy="database-text-field"]')
      .should("be.visible")
      .invoke("attr", "placeholder")
      .should("contain", "Enter name of the database");

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
      `[data-cy="cypress-${data.lastName}-mariadb-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-mariadb`);

    deleteDatasource(`cypress-${data.lastName}-mariadb`);
  });
});
