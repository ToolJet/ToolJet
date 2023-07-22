import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText, commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { deleteDatasource, closeDSModal } from "Support/utils/dataSource";

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

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("SQL Server");
    cy.get("[data-cy*='data-source-']").eq(1).should("contain", "SQL Server");
    cy.get('[data-cy="data-source-sql server"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      "SQL Server"
    );
    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get('[data-cy="label-instance"]').verifyVisibleElement(
      "have.text",
      "Instance"
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );
    cy.get(postgreSqlSelector.labelDbName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelDbName
    );
    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelUserName
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      "Password"
    );

    cy.get('[data-cy="label-azure"]').verifyVisibleElement(
      "have.text",
      "Azure"
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
      "Failed to connect to localhost:1433 - Could not connect (sequence)"
    );
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
    selectDataSource("SQL Server");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-sqlserver`
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("sqlserver_host")
    );
    fillDataSourceTextField(
      "Instance",
      "Enter the name of the database instance",
      Cypress.env("sqlserver_instance")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "1433"
    );
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      postgreSqlText.placeholderNameOfDB,
      Cypress.env("sqlserver_db")
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("sqlserver_user")
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("sqlserver_password")
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

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.lastName}-sqlserver-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-sqlserver`);
    deleteDatasource(`cypress-${data.lastName}-sqlserver`);
  });
});
