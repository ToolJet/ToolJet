import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { mySqlText } from "Texts/mysql";
import { commonSelectors } from "Selectors/common";
import { commonWidgetText, commonText } from "Texts/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
  addQuery,
  fillConnectionForm,
  openQueryEditor,
  selectQueryMode,
  addGuiQuery,
  addWidgetsToAddUser,
} from "Support/utils/postgreSql";
import {
  closeDSModal,
  deleteDatasource,
  verifyCouldnotConnectWithAlert,
} from "Support/utils/dataSource";
import { realHover } from "cypress-real-events/commands/realHover";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data sources MySql", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on MySQL connection form", () => {
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

    selectAndAddDataSource("databases", "MySQL", data.lastName);

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
    deleteDatasource(`cypress-${data.lastName}-mysql`);
  });

  it("Should verify the functionality of MySQL connection form.", () => {
    selectAndAddDataSource("databases", "MySQL", data.lastName);

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("mysql_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "3318"
    );
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      postgreSqlText.placeholderNameOfDB,
      "unknowndb"
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("mysql_user")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "Enter password",
      Cypress.env("mysql_password")
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert("");
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      postgreSqlText.placeholderNameOfDB,
      "testdb"
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "admin1"
    );
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(
      "ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol requested by server; consider upgrading MySQL client"
    );

    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      Cypress.env("mysql_user")
    );
    cy.get(postgreSqlSelector.passwordTextField).type("testpassword");

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    verifyCouldnotConnectWithAlert(
      "ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'103.171.99.42' (using password: YES)"
    );
    cy.get('[data-cy="-toggle-input"]').then(($el) => {
      if ($el.is(":checked")) {
        cy.get('[data-cy="-toggle-input"]').uncheck();
      }
    });

    fillDataSourceTextField(
      postgreSqlText.labelPassword,
      "Enter password",
      Cypress.env("mysql_password")
    );

    // cy.get(postgreSqlSelector.passwordTextField).should("be.visible");
    // cy.get(".datasource-edit-btn").should("be.visible").click();
    // cy.get(postgreSqlSelector.passwordTextField).type(
    //   `{selectAll}{backspace}${Cypress.env("mysql_password")}`,
    //   { log: false }
    // );
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
      `[data-cy="cypress-${data.lastName}-mysql-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-mysql`);

    deleteDatasource(`cypress-${data.lastName}-mysql`);
  });

  it.skip("Should verify elements of the Query section.", () => {
    cy.viewport(1200, 1300);
    selectAndAddDataSource("databases", "MySQL", data.lastName);
    fillConnectionForm({
      Host: Cypress.env("mysql_host"),
      Port: Cypress.env("mysql_port"),
      "Database Name": "testdb",
      Username: Cypress.env("mysql_user"),
      Password: Cypress.env("mysql_password"),
    });

    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");
    openQueryEditor("MySQL");
    // cy.get('[class="query-pane"]').invoke("css", "height", "calc(95%)");

    // cy.get(postgreSqlSelector.addQueriesCard)
    //   .verifyVisibleElement("contain", mySqlText.cypressMySql)
    //   .click();

    // cy.get(postgreSqlSelector.queryTabGeneral).verifyVisibleElement(
    //   "contain",
    //   postgreSqlText.tabGeneral
    // );
    // cy.get(postgreSqlSelector.queryLabelInputField).verifyVisibleElement(
    //   "have.value",
    //   postgreSqlText.firstQueryName
    // );
    // cy.get(postgreSqlSelector.queryPreviewButton).verifyVisibleElement(
    //   "have.text",
    //   postgreSqlText.buttonLabelPreview
    // );
    // cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
    //   "have.text",
    //   postgreSqlText.buttonLabelCreateAndRun
    // );

    // cy.get(postgreSqlSelector.queryCreateDropdown).should("be.visible").click();
    // cy.get(postgreSqlSelector.queryCreateAndRunOption).verifyVisibleElement(
    //   "have.text",
    //   postgreSqlText.buttonLabelCreateAndRun
    // );
    // cy.get(postgreSqlSelector.queryCreateOption)
    //   .verifyVisibleElement("have.text", postgreSqlText.buttonLabelCreate)
    //   .click();

    // cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
    //   "have.text",
    //   postgreSqlText.buttonLabelCreate
    // );

    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");

    cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(0)`)
      .scrollIntoView()
      .should("be.visible")
      .click();
    cy.contains("[id*=react-select-]", postgreSqlText.queryModeSql).should(
      "have.text",
      postgreSqlText.queryModeSql
    );
    cy.contains("[id*=react-select-]", postgreSqlText.queryModeGui).should(
      "have.text",
      postgreSqlText.queryModeGui
    );

    cy.get(postgreSqlSelector.queryCreateAndRunButton)
      .should("be.visible")
      .click();
    // cy.get('[data-cy="list-query-mysql1"]').should("be.visible").click();

    cy.get(postgreSqlSelector.labelTransformation)
      .scrollIntoView()
      .verifyVisibleElement("have.text", postgreSqlText.headerTransformations);
    cy.wait(200);
    cy.get(postgreSqlSelector.toggleTransformation).parent().click();
    cy.get(postgreSqlSelector.inputFieldTransformation).should("be.visible");
    cy.get(postgreSqlSelector.toggleTransformation).parent().click();

    cy.get(postgreSqlSelector.headerQueryPreview).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelPreview
    );
    cy.get(postgreSqlSelector.previewTabJson).verifyVisibleElement(
      "have.text",
      postgreSqlText.json
    );
    cy.get(postgreSqlSelector.previewTabRaw).verifyVisibleElement(
      "have.text",
      postgreSqlText.raw
    );

    selectQueryMode(postgreSqlText.queryModeGui, "4");
    cy.get(postgreSqlSelector.operationsDropDownLabel).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelOperation
    );
    cy.get(`${postgreSqlSelector.querySelectDropdown}:eq(1)`).click();
    cy.contains('[id*="react-select-10"]', postgreSqlText.guiOptionBulkUpdate)
      .should("have.text", postgreSqlText.guiOptionBulkUpdate)
      .click();

    cy.get(postgreSqlSelector.labelTableNameInputField).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelTable
    );
    cy.get(postgreSqlSelector.labelPrimaryKeyColoumn).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelPrimaryKeyColumn
    );
    cy.get('[data-cy="label-records"]').verifyVisibleElement(
      "have.text",
      "Records"
    );

    // cy.get(postgreSqlSelector.queryTabAdvanced)
    //   .verifyVisibleElement("contain", postgreSqlText.tabAdvanced)
    //   .click();

    cy.get(postgreSqlSelector.labelRunQueryOnPageLoad).verifyVisibleElement(
      "have.text",
      postgreSqlText.toggleLabelRunOnPageLoad
    );
    cy.get(
      postgreSqlSelector.labelRequestConfirmationOnRun
    ).verifyVisibleElement("have.text", postgreSqlText.toggleLabelconfirmation);
    cy.get(postgreSqlSelector.labelShowNotification).verifyVisibleElement(
      "have.text",
      postgreSqlText.toggleLabelShowNotification
    );

    cy.get(postgreSqlSelector.toggleNotification).parent().click();
    cy.get(postgreSqlSelector.labelSuccessMessageInput).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelSuccessMessage
    );
    cy.get(postgreSqlSelector.notificationDurationInput).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelNotificatioDuration
    );
    cy.get(postgreSqlSelector.addEventHandler).verifyVisibleElement(
      "have.text",
      commonWidgetText.addEventHandlerLink
    );
    cy.get(postgreSqlSelector.noEventHandlerMessage).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelNoEventhandler
    );

    cy.get('[data-cy="list-query-mysql1"]').verifyVisibleElement(
      "have.text",
      "mysql1"
    );
    cy.get('[class="row query-row query-row-selected"]')
      .realHover()
      .then(() => {
        cy.get('[data-cy="delete-query-mysql1"]').click();
      });
    cy.get(postgreSqlSelector.deleteModalMessage).verifyVisibleElement(
      "have.text",
      postgreSqlText.dialogueTextDelete
    );
    cy.get(postgreSqlSelector.deleteModalCancelButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.cancel
    );
    cy.get(postgreSqlSelector.deleteModalConfirmButton)
      .verifyVisibleElement("have.text", postgreSqlText.yes)
      .click();
  });

  it.skip("Should verify CRUD operations on SQL Query.", () => {
    let dbName = "7mmplik";
    selectAndAddDataSource("databases", "MySQL", data.lastName);

    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      mySqlText.cypressMySql
    );
    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");

    cy.intercept("GET", "api/data_sources?**").as("datasource");
    fillConnectionForm({
      Host: Cypress.env("mysql_host"),
      Port: Cypress.env("mysql_port"),
      "Database Name": "testdb",
      Username: Cypress.env("mysql_user"),
      Password: Cypress.env("mysql_password"),
    });
    cy.wait("@datasource");

    addQuery(
      "table_creation",
      `CREATE TABLE ${dbName} (id MEDIUMINT NOT NULL AUTO_INCREMENT, name CHAR(30) NOT NULL,email VARCHAR(255),PRIMARY KEY (id));`,
      mySqlText.cypressMySql
    );

    addQuery(
      "table_preview",
      `SELECT * FROM ${dbName}`,
      mySqlText.cypressMySql
    );

    addQuery(
      "existance_of_table",
      `SHOW TABLES LIKE '${dbName}';`,
      mySqlText.cypressMySql
    );

    cy.get(postgreSqlSelector.queryPreviewButton, { timeout: 3000 }).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw, { timeout: 3000 })
      .scrollIntoView()
      .should("be.visible", { timeout: 3000 })
      .click();

    cy.get(".p-3").should(
      "have.text",
      `[{"Tables_in_testdb (${dbName})":"${dbName}"}]`
    );

    // addQuery(
    //   "add_data_using_widgets",
    //   `INSERT INTO "public"."cypress_test_users"("name", "email") VALUES('{{components.textinput1.value{rightArrow}{rightArrow}', '{{}{{}components.textinput2.value{rightArrow}{rightArrow}') RETURNING "id", "name", "email";`,
    //   mySqlText.cypressMySql
    // );

    addQuery(
      "truncate_table",
      `TRUNCATE TABLE ${dbName}`,
      mySqlText.cypressMySql
    );

    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should(
      "have.text",
      `{"fieldCount":0,"affectedRows":0,"insertId":0,"serverStatus":2,"warningCount":0,"message":"","protocol41":true,"changedRows":0}`
    );

    addQuery("drop_table", `DROP TABLE ${dbName}`, mySqlText.cypressMySql);
    cy.get('[data-cy="list-query-existance_of_table"]').click();
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should("have.text", "[]");

    // addWidgetsToAddUser();
  });

  it.skip("Should verify bulk update", () => {
    selectAndAddDataSource("databases", "MySQL", data.lastName);
    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      mySqlText.cypressMySql
    );
    fillConnectionForm({
      Host: Cypress.env("mysql_host"),
      Port: "3318",
      "Database Name": "testdb",
      Username: Cypress.env("mysql_user"),
      Password: Cypress.env("mysql_password"),
    });

    openQueryEditor(mySqlText.cypressMySql);
    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");
    selectQueryMode(postgreSqlText.queryModeGui);
    addGuiQuery("name", "email");
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  });
});
