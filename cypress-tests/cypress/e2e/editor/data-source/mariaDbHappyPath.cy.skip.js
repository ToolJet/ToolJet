import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText, commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  addQuery,
  fillDataSourceTextField,
  fillConnectionForm,
  selectDataSource,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";


describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    cy.get(commonSelectors.addNewDataSourceButton)
      .verifyVisibleElement("have.text", commonText.addNewDataSourceButton)
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("MariaDB");
    cy.get("[data-cy*='data-source-']").eq(1).should("contain", "MariaDB");
    cy.get('[data-cy="data-source-mariadb"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      "MariaDB"
    );

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
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
    selectDataSource("MariaDB");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      "cypress-mariadb"
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("mariadb_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "5432"
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("mariadb_user")
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("mariadb_password")
    );

    cy.get('[data-cy="label-database"]').verifyVisibleElement("have.text", "Database")
    cy.get('[data-cy="database-text-field"]').should("be.visible").invoke('attr', 'placeholder').should('contain', 'Enter name of the database')

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSAdded
    );

      cy.get('[data-cy="cypress-mariadb-button"]').verifyVisibleElement(
        "have.text",
        "cypress-mariadb"
      );
  
      deleteDatasource("cypress-mariadb");
  });
});
