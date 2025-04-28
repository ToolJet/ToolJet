import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText, commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";

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
    cy.appUILogin();
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
      `cypress-${data.dataSourceName}-snowflake`,
      "snowflake",
      [
        { key: "username", value: "" },
        { key: "account", value: "" },
        { key: "password", value: "", encrypted: true },
        { key: "database", value: "" },
        { key: "schema", value: "" },
        { key: "warehouse", value: "" },
        { key: "role", value: "" },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-snowflake-button"]`)
      .should("be.visible")
      .click();
    cy.get(dataSourceSelector.dsNameInputField).should(
      "have.value",
      `cypress-${data.dataSourceName}-snowflake`
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
      "Invalid account. The specified value must be a valid subdomain string."
    );
    deleteDatasource(`cypress-${data.dataSourceName}-snowflake`);
  });

  it.skip("Should verify the functionality of snowflake connection form.", () => {
    selectAndAddDataSource("databases", "Snowflake", data.dataSourceName);

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
      "**************",
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
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get(
      `[data-cy="cypress-${data.dataSourceName}-snowflake-button"]`
    ).verifyVisibleElement(
      "have.text",
      `cypress-${data.dataSourceName}-snowflake`
    );

    deleteDatasource(`cypress-${data.dataSourceName}-snowflake`);
  });
});
