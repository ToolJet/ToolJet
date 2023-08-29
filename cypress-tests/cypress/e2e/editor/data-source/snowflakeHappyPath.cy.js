import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText, commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
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

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  const data = {};
  data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("Snowflake");
    cy.get("[data-cy*='data-source-']").eq(1).should("contain", "Snowflake");
    cy.get("[data-cy='data-source-snowflake']").click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      "Snowflake"
    );

    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelUserName
    );

    cy.get('[data-cy="label-account"]').verifyVisibleElement(
      "have.text",
      "Account"
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      `Password`
    );

    cy.get('[data-cy="label-database"]').verifyVisibleElement(
      "have.text",
      "Database"
    );
    cy.get('[data-cy="label-schema"]').verifyVisibleElement(
      "have.text",
      "Schema"
    );

    cy.get('[data-cy="label-warehouse"]').verifyVisibleElement(
      "have.text",
      "Warehouse"
    );
    cy.get('[data-cy="label-role"]').verifyVisibleElement("have.text", "Role");
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
    cy.get('[data-cy="connection-alert-text"]').should(
      "have.text",
      "A user name must be specified."
    );
  });

  it.skip("Should verify the functionality of PostgreSQL connection form.", () => {
    selectAndAddDataSource("Snowflake");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-snowflake`
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("snowflake_user")
    );

    fillDataSourceTextField(
      "Account",
      "Enter account",
      Cypress.env("snowflake_account")
    );
    fillDataSourceTextField(
      "Password",
      "Enter password",
      Cypress.env("snowflake_password")
    );
    fillDataSourceTextField(
      "Database",
      "Enter database",
      Cypress.env("snowflake_database")
    );
    fillDataSourceTextField("Schema", "Enter schema", "{del}");

    fillDataSourceTextField("Warehouse", "Enter warehouse", "{del}");

    fillDataSourceTextField("Role", "Enter role", "{del}");

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
      `[data-cy="cypress-${data.lastName}-snowflake-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-snowflake`);

    deleteDatasource(`cypress-${data.lastName}-snowflake`);
  });
});
