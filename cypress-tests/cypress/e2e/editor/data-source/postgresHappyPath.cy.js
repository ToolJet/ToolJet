import { fake } from "Fixtures/fake";
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
import { deleteDatasource } from "Support/utils/dataSource";

const data = {};
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Should verify elements on connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.wait(1000);
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

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type(
      postgreSqlText.postgreSQL
    );
    cy.get("[data-cy*='data-source-']")
      .eq(1)
      .should("contain", postgreSqlText.postgreSQL);
    cy.get(postgreSqlSelector.postgresDataSource).click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      postgreSqlText.postgreSQL
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
    cy.get(postgreSqlSelector.connectionFailedText).verifyVisibleElement(
      "have.text",
      postgreSqlText.couldNotConnect
    );
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonTextSave
    );
    cy.get('[data-cy="connection-alert-text"]').should("be.visible");
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
    selectDataSource(postgreSqlText.postgreSQL);

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      `cypress-${data.lastName}-postgresql`
    );

    fillDataSourceTextField(
      postgreSqlText.labelHost,
      postgreSqlText.placeholderEnterHost,
      Cypress.env("pg_host")
    );
    fillDataSourceTextField(
      postgreSqlText.labelPort,
      postgreSqlText.placeholderEnterPort,
      "5432"
    );
    cy.get('[data-cy="-toggle-input"]').uncheck();
    fillDataSourceTextField(
      postgreSqlText.labelDbName,
      postgreSqlText.placeholderNameOfDB,
      "postgres"
    );
    fillDataSourceTextField(
      postgreSqlText.labelUserName,
      postgreSqlText.placeholderEnterUserName,
      "postgres"
    );

    cy.get(postgreSqlSelector.passwordTextField).type(
      Cypress.env("pg_password")
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
      `[data-cy="cypress-${data.lastName}-postgresql-button"]`
    ).verifyVisibleElement("have.text", `cypress-${data.lastName}-postgresql`);

    deleteDatasource(`cypress-${data.lastName}-postgresql`);
  });

  it.skip("Should verify elements of the Query section.", () => {
    selectDataSource(postgreSqlText.postgreSQL);
    fillConnectionForm(
      {
        Host: Cypress.env("pg_host"),
        Port: "5432",
        "Database Name": "postgres",
        Username: Cypress.env("pg_user"),
        Password: Cypress.env("pg_password"),
      },
      ".form-switch"
    );

    openQueryEditor(postgreSqlText.postgreSQL);

    // cy.get(postgreSqlSelector.headerQueryManager).verifyVisibleElement(
    //   "have.text",
    //   postgreSqlText.headerQueries
    // ); removed
    // cy.get(postgreSqlSelector.labelNoQuery).verifyVisibleElement(
    //   "have.text",
    //   postgreSqlText.noQueryText
    // );
    cy.get(postgreSqlSelector.createQueryButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelCreateQuery
    );

    cy.get(postgreSqlSelector.querySearchBar).should("be.visible");
    cy.get('[data-cy="button-add-new-queries"]').click();
    cy.get(postgreSqlSelector.labelSelectDataSource).verifyVisibleElement(
      "have.text",
      postgreSqlText.headerSelectDatasource
    );

    cy.get(postgreSqlSelector.addQueriesCard)
      .verifyVisibleElement("contain", postgreSqlText.postgreSQL)
      .click();

    cy.get(postgreSqlSelector.queryTabGeneral).verifyVisibleElement(
      "contain",
      postgreSqlText.tabGeneral
    );
    cy.get(postgreSqlSelector.queryLabelInputField).verifyVisibleElement(
      "have.value",
      postgreSqlText.firstQueryName
    );
    cy.get(postgreSqlSelector.queryPreviewButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelPreview
    );
    cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelCreateAndRun
    );

    cy.get(postgreSqlSelector.queryCreateDropdown).should("be.visible").click();
    cy.get(postgreSqlSelector.queryCreateAndRunOption).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelCreateAndRun
    );
    cy.get(postgreSqlSelector.queryCreateOption)
      .verifyVisibleElement("have.text", postgreSqlText.buttonLabelCreate)
      .click();

    cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.buttonLabelCreate
    );

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
    cy.get(postgreSqlSelector.psqlQueryLabel).should("be.visible").click();

    cy.get(postgreSqlSelector.labelTransformation)
      .scrollIntoView()
      .verifyVisibleElement("have.text", postgreSqlText.headerTransformations);
    cy.get(postgreSqlSelector.toggleTransformation).click();
    cy.get(postgreSqlSelector.inputFieldTransformation).should("be.visible");

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
    cy.contains('[id*="react-select"]', postgreSqlText.guiOptionBulkUpdate)
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
    cy.get(postgreSqlSelector.labelRecordsToUpdate).verifyVisibleElement(
      "have.text",
      postgreSqlText.labelRecordsToUpdate
    );

    cy.get(postgreSqlSelector.queryTabAdvanced)
      .verifyVisibleElement("contain", postgreSqlText.tabAdvanced)
      .click();

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

    cy.get(postgreSqlSelector.toggleNotification).click();
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

    cy.get(postgreSqlSelector.queryCreateDropdown).click();
    cy.get(postgreSqlSelector.opetionQuerySave).click();
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
    cy.get(postgreSqlSelector.psqlQueryLabel).verifyVisibleElement(
      "have.text",
      postgreSqlText.firstQueryName
    );
    cy.get(postgreSqlSelector.postgresqlQueryRunButton).should("be.visible");
    cy.intercept("GET", "api/data_queries?**").as("addQuery");
    cy.wait("@addQuery");
    cy.get(postgreSqlSelector.psqlQueryLabel).click();
    cy.get(postgreSqlSelector.psqlQueryDeleteButton).click();
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
    selectDataSource(postgreSqlText.postgreSQL);

    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      postgreSqlText.psqlName
    );
    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");

    cy.intercept("GET", "api/data_sources?**").as("datasource");
    fillConnectionForm({
      Host: Cypress.env("pg_host"),
      Port: "5432",
      "Database Name": "postgres",
      Username: Cypress.env("pg_user"),
      Password: Cypress.env("pg_password"),
    });
    cy.wait("@datasource");

    addQuery(
      "table_creation",
      `CREATE TABLE "public"."cypress_test_users" ("id" integer GENERATED ALWAYS AS IDENTITY,
        "name" text, "email" text, PRIMARY KEY ("id"), UNIQUE ("email") );`,
      postgreSqlText.psqlName
    );

    addQuery(
      "table_preview",
      `SELECT * FROM cypress_test_users`,
      postgreSqlText.psqlName
    );

    addQuery(
      "existance_of_table",
      `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name   = 'cypress_test_users'
      );`,
      postgreSqlText.psqlName
    );

    cy.get(postgreSqlSelector.queryPreviewButton, { timeout: 3000 }).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw, { timeout: 3000 })
      .scrollIntoView()
      .should("be.visible", { timeout: 3000 })
      .click();

    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"exists":true}]'
    );

    addQuery(
      "add_data_using_widgets",
      `INSERT INTO "public"."cypress_test_users"("name", "email") VALUES('{{}{{}components.textinput1.value{rightArrow}{rightArrow}', '{{}{{}components.textinput2.value{rightArrow}{rightArrow}') RETURNING "id", "name", "email";`,
      postgreSqlText.psqlName
    );

    addQuery(
      "truncate_table",
      `TRUNCATE TABLE "public"."cypress_test_users"`,
      postgreSqlText.psqlName
    );

    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should("have.text", "[]");

    addQuery(
      "drop_table",
      `DROP TABLE "public"."cypress_test_users"`,
      postgreSqlText.psqlName
    );
    cy.get(postgreSqlSelector.dataExistanceQuery).click();
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"exists":false}]'
    );

    addWidgetsToAddUser();
  });

  it.skip("Should verify bulk update", () => {
    selectDataSource(postgreSqlText.postgreSQL);
    fillConnectionForm({
      Host: Cypress.env("pg_host"),
      Port: "5432",
      "Database Name": "postgres",
      Username: Cypress.env("pg_user"),
      Password: Cypress.env("pg_password"),
    });

    openQueryEditor(postgreSqlText.postgreSQL);
    selectQueryMode(postgreSqlText.queryModeGui);
    addGuiQuery("name", "email");
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  });
});
