import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { mySqlText } from "Texts/mysql";
import { commonSelectors } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectDataSource,
} from "Support/utils/postgreSql";
import { verifyCouldnotConnectWithAlert } from "Support/utils/dataSource";
describe("Data sources MySql", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on MySQL connection form", () => {
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("MySQL");
    cy.get("[data-cy*='data-source-']").eq(0).should("contain", "MySQL");
    cy.get('[data-cy="data-source-mysql"]').click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      "MySQL"
    );
    cy.get(postgreSqlSelector.labelHost).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelHost
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPort
    );
    cy.get(postgreSqlSelector.labelSsl).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSSL
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
      postgreSqlText.labelPassword
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
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    verifyCouldnotConnectWithAlert(mySqlText.errorConnectionRefused);
  });

  it("Should verify the functionality of MySQL connection form.", () => {
    selectDataSource("MySQL");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      mySqlText.cypressMySql
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("mysql_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "3306"
    );
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      postgreSqlText.placeholderNameOfDB,
      "test_db1"
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "admin"
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("mysql_password")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(mySqlText.errorUnknownDb);
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      postgreSqlText.placeholderNameOfDB,
      "test_db"
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "admin1"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(mySqlText.errorAccessDeniedAdmin1);

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "admin"
    );
    cy.get(postgreSqlSelector.passwordTextField).type("testpassword");

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(mySqlText.errorAccessDeniedAdmin);
    cy.get(postgreSqlSelector.passwordTextField).type(
      `{selectAll}{backspace}${Cypress.env("mysql_password")}`
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
      .should("have.text", mySqlText.cypressMySql)
      .find("button")
      .should("be.visible");
  });
});
