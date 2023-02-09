import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonWidgetText } from "Texts/common";
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

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on connection form", () => {
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
      "Snowflake"
    );
    cy.get("[data-cy*='data-source-']")
      .eq(0)
      .should("contain", "Snowflake");
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
    cy.get('[data-cy="label-role"]').verifyVisibleElement(
      "have.text",
      "Role"
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
      'A user name must be specified.'
    );
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
    selectDataSource("Snowflake");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      "cypress-snowflake"
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "snowflake"
    );

    fillDataSourceTextField(
      "Account",
      "Enter account",
      Cypress.env("pg_host")
    );
    fillDataSourceTextField(
      "Password",
      "Enter password",
      "password"
    );
    fillDataSourceTextField(
      "Database",
      "Enter database",
      "snowflake"
    );
    fillDataSourceTextField(
      "Schema",
      "Enter schema",
      "schema"
    );

    fillDataSourceTextField(
      "Warehouse",
      "Enter warehouse",
      "warehouse"
    );

    fillDataSourceTextField(
      "Role",
      "Enter role",
      "role"
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
      .should("have.text", "cypress-snowflake")
      .find("button")
      .should("be.visible");
  });
});
