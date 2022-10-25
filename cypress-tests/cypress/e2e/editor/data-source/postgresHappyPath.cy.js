import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

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
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  editAndVerifyWidgetName,
  verifyMultipleComponentValuesFromInspector,
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyAndModifyStylePickerFx,
  addTextWidgetToVerifyValue,
  verifyTooltip,
  verifyWidgetText,
} from "Support/utils/commonWidget";

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on connection form", () => {
    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.labelDataSources).should(
      "have.text",
      "Data sources"
    );

    cy.get(postgreSqlSelector.addDatasourceLink)
      .should("have.text", "+ add data source")
      .click();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      "All Datasources (38)"
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      "Databases (17)"
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      "APIs (18)"
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      "Cloud Storage (3)"
    );

    cy.get(postgreSqlSelector.dataSourceSearchInputField).type("PostgreSQL");
    cy.get("[data-cy*='data-source-']").eq(0).should("contain", "PostgreSQL");
    cy.get(postgreSqlSelector.postgresDataSource).click();

    cy.get(postgreSqlSelector.dataSourceNameInputField).should(
      "have.value",
      "PostgreSQL"
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      "Host"
    );
    cy.get(postgreSqlSelector.labelPort).verifyVisibleElement(
      "have.text",
      "Port"
    );
    cy.get(postgreSqlSelector.labelSsl).verifyVisibleElement(
      "have.text",
      "SSL"
    );
    cy.get(postgreSqlSelector.labelDbName).verifyVisibleElement(
      "have.text",
      "Database Name"
    );
    cy.get(postgreSqlSelector.labelUserName).verifyVisibleElement(
      "have.text",
      "Username"
    );
    cy.get(postgreSqlSelector.labelPassword).verifyVisibleElement(
      "have.text",
      "PasswordEncrypted"
    );
    cy.get(postgreSqlSelector.labelSSLCertificate).verifyVisibleElement(
      "have.text",
      "SSL Certificate"
    );
    cy.get(postgreSqlSelector.labelIpWhitelist).verifyVisibleElement(
      "have.text",
      "Please white-list our IP address if the data source is not publicly accessible"
    );
    cy.get(postgreSqlSelector.buttonCopyIp).verifyVisibleElement(
      "have.text",
      "Copy"
    );

    //   .click() TODO: withTable
    // cy.get('[data-cy="label-ip-copied"]').verifyVisibleElement(
    //   "have.text",
    //   "Copied"
    // );

    cy.get(postgreSqlSelector.linkReadDocumentation).verifyVisibleElement(
      "have.text",
      "Read documentation"
    );
    cy.get(postgreSqlSelector.buttonTestConnection)
      .verifyVisibleElement("have.text", "Test Connection")
      .click();
    cy.get(postgreSqlSelector.connectionFailedText).verifyVisibleElement(
      "have.text",
      "could not connect"
    );
    cy.get(postgreSqlSelector.buttonSave).verifyVisibleElement(
      "have.text",
      "Save"
    );
    cy.get(postgreSqlSelector.dangerAlertNotSupportSSL).verifyVisibleElement(
      "have.text",
      "The server does not support SSL connections"
    );
  });

  it.only("Should verify the functionality of PostgreSQL connection form.", () => {
    selectDataSource("PostgreSQL");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      "cypress-postgresql"
    );

    fillDataSourceTextField(
      "Host",
      "Enter host",
      "test-data-source-postgres.cid8c0avwtmj.us-west-1.rds.amazonaws.com"
    );
    fillDataSourceTextField("Port", "Enter port", "5432");
    fillDataSourceTextField(
      "Database Name",
      "Name of the database",
      "postgres"
    );
    fillDataSourceTextField("Username", "Enter username", "postgres");
    // fillDataSourceTextField("Password", "Enter password", "postgres");

    cy.get(postgreSqlSelector.passwordTextField).type("postgres123");

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 7000,
    }).should("have.text", "connection verified");
    cy.get(postgreSqlSelector.buttonSave).click();

    cy.verifyToastMessage(commonSelectors.toastMessage, "Datasource Added");

    cy.get(postgreSqlSelector.leftSidebarDatasourceButton).click();
    cy.get(postgreSqlSelector.datasourceLabelOnList)
      .should("have.text", "cypress-postgresql")
      .find("button")
      .should("be.visible");
  });

  it("Should verify elements of the Query section.", () => {
    selectDataSource("PostgreSQL");
    fillConnectionForm({
      Host: "test-data-source-postgres.cid8c0avwtmj.us-west-1.rds.amazonaws.com",
      Port: "5432",
      "Database Name": "postgres",
      Username: "postgres",
      Password: "postgres123",
    });
    openQueryEditor("PostgreSQL");

    cy.get(postgreSqlSelector.psqlQueryLabel).click();
    cy.get(postgreSqlSelector.addQueriesCard)
      .should("contain", "PostgreSQL")
      .click();

    cy.get(postgreSqlSelector.headerQueryManager).verifyVisibleElement(
      "have.text",
      "Queries"
    );
    cy.get(postgreSqlSelector.labelNoQuery).verifyVisibleElement(
      "have.text",
      "You haven't created queries yet."
    );
    cy.get(postgreSqlSelector.createQueryButton).verifyVisibleElement(
      "have.text",
      "Create query"
    );

    cy.get(postgreSqlSelector.querySearchIcon).should("be.visible");
    cy.get(postgreSqlSelector.psqlQueryLabel).should("be.visible").click();

    cy.get(postgreSqlSelector.labelSelectDataSource).verifyVisibleElement(
      "have.text",
      "Select Datasource"
    );
    cy.get(postgreSqlSelector.addQueriesCard)
      .verifyVisibleElement("contain", "PostgreSQL")
      .click();

    cy.get(postgreSqlSelector.queryTabGeneral).verifyVisibleElement(
      "contain",
      "General"
    );
    cy.get(postgreSqlSelector.queryLabelInputField).verifyVisibleElement(
      "have.value",
      "postgresql1"
    );
    cy.get(postgreSqlSelector.queryPreviewButton).verifyVisibleElement(
      "have.text",
      "Preview"
    );
    cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
      "have.text",
      "Create & Run"
    );

    cy.get(postgreSqlSelector.queryCreateDropdown).should("be.visible").click();
    cy.get(postgreSqlSelector.queryCreateAndRunOption).verifyVisibleElement(
      "have.text",
      "Create & Run"
    );
    cy.get(postgreSqlSelector.queryCreateOption)
      .verifyVisibleElement("have.text", "Create")
      .click();

    cy.get(postgreSqlSelector.queryCreateAndRunButton).verifyVisibleElement(
      "have.text",
      "Create"
    );

    cy.get('[class="query-pane"]').invoke("css", "height", "calc(85%)");

    cy.get("[data-cy='query-select-dropdown']:eq(0)")
      .scrollIntoView()
      .should("be.visible")
      .click();
    cy.get("#react-select-4-option-0").should("have.text", "SQL mode");
    cy.get("#react-select-4-option-1").should("have.text", "GUI mode");

    cy.get(postgreSqlSelector.queryCreateOption).should("be.visible");

    cy.get(postgreSqlSelector.labelTransformation)
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Transformations");
    cy.get(postgreSqlSelector.toggleTransformation).click();
    cy.get(postgreSqlSelector.inputFieldTransformation).should("be.visible");

    cy.get(postgreSqlSelector.headerQueryPreview).verifyVisibleElement(
      "have.text",
      "Preview"
    );
    cy.get(postgreSqlSelector.previewTabJson).verifyVisibleElement(
      "have.text",
      "Json"
    );
    cy.get(postgreSqlSelector.previewTabRaw).verifyVisibleElement(
      "have.text",
      "Raw"
    );

    selectQueryMode("GUI mode", "4");
    cy.get(postgreSqlSelector.operationsDropDownLabel).verifyVisibleElement(
      "have.text",
      "Operation"
    );
    cy.get("[data-cy='query-select-dropdown']:eq(1)").click();
    cy.get("#react-select-5-option-0")
      .should("have.text", "Bulk update using primary key")
      .click();

    cy.get(postgreSqlSelector.labelTableNameInputField).verifyVisibleElement(
      "have.text",
      "Table"
    );
    cy.get(postgreSqlSelector.labelPrimaryKeyColoumn).verifyVisibleElement(
      "have.text",
      "Primary key column"
    );
    cy.get(postgreSqlSelector.labelRecordsToUpdate).verifyVisibleElement(
      "have.text",
      "Records to update"
    );

    cy.get(postgreSqlSelector.queryTabAdvanced)
      .verifyVisibleElement("contain", "Advanced")
      .click();

    cy.get(postgreSqlSelector.labelRunQueryOnPageLoad).verifyVisibleElement(
      "have.text",
      "Run this query on page load?"
    );
    cy.get(
      postgreSqlSelector.labelRequestConfirmationOnRun
    ).verifyVisibleElement(
      "have.text",
      "Request confirmation before running query?"
    );
    cy.get(postgreSqlSelector.labelShowNotification).verifyVisibleElement(
      "have.text",
      "Show notification on success?"
    );

    cy.get(postgreSqlSelector.labelShowNotification).click();
    cy.get(postgreSqlSelector.labelSuccessMessageInput).verifyVisibleElement(
      "have.text",
      "Success Message"
    );
    cy.get(postgreSqlSelector.notificationDurationInput).verifyVisibleElement(
      "have.text",
      "Notification duration (s)"
    );
    cy.get(postgreSqlSelector.addEventHandler).verifyVisibleElement(
      "have.text",
      "+ Add event handler"
    );
    cy.get(postgreSqlSelector.noEventHandlerMessage).verifyVisibleElement(
      "have.text",
      "This query doesn't have any event handlers"
    );

    cy.get(postgreSqlSelector.queryCreateDropdown).click();
    cy.get(postgreSqlSelector.queryCreateOption).click();
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
    cy.get(postgreSqlSelector.psqlQueryLabel).verifyVisibleElement(
      "have.text",
      "postgresql1"
    );
    cy.get(postgreSqlSelector.postgresqlQueryRunButton).should("be.visible");

    cy.get(postgreSqlSelector.psqlQueryLabel).click();
    cy.get(postgreSqlSelector.psqlQueryDeleteButton).click();
    cy.get(postgreSqlSelector.deleteModalMessage).verifyVisibleElement(
      "have.text",
      "Do you really want to delete this query?"
    );
    cy.get(postgreSqlSelector.deleteModalCancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(postgreSqlSelector.deleteModalConfirmButton)
      .verifyVisibleElement("have.text", "Yes")
      .click();
  });

  it("Should verify CRUD operations on SQL Query.", () => {
    selectDataSource("PostgreSQL");

    cy.clearAndType(
      postgreSqlSelector.dataSourceNameInputField,
      "cypress-postgresql"
    );
    cy.intercept("GET", "api/data_sources?**").as("datasource");
    fillConnectionForm({
      Host: "test-data-source-postgres.cid8c0avwtmj.us-west-1.rds.amazonaws.com",
      Port: "5432",
      "Database Name": "postgres",
      Username: "postgres",
      Password: "postgres123",
    });
    cy.wait("@datasource");

    addQuery(
      "table_creation",
      `CREATE TABLE "public"."cypress_test_users" ("id" integer GENERATED ALWAYS AS IDENTITY,
        "name" text, "email" text, PRIMARY KEY ("id"), UNIQUE ("email") );`,
      "cypress-postgresql"
    );

    addQuery(
      "table_preview",
      `SELECT * FROM cypress_test_users`,
      "cypress-postgresql"
    );

    addQuery(
      "existance_of_table",
      `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name   = 'cypress_test_users'
      );`,
      "cypress-postgresql"
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
      `INSERT INTO "public"."cypress_test_users"("name", "email") VALUES('{{}{{}{backspace}{backspace}components.textinput1.value}}', '{{}{{}{backspace}{backspace}components.textinput2.value}}') RETURNING "id", "name", "email";`,
      "cypress-postgresql"
    );

    addQuery(
      "truncate_table",
      `TRUNCATE TABLE "public"."cypress_test_users"`,
      "cypress-postgresql"
    );

    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should("have.text", "[]");

    addQuery(
      "drop_table",
      `DROP TABLE "public"."cypress_test_users"`,
      "cypress-postgresql"
    );
    cy.get('[data-cy="existance_of_table-query-label"]').click();
    cy.get(postgreSqlSelector.queryPreviewButton).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get(postgreSqlSelector.previewTabRaw).click();
    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"exists":false}]'
    );

    addWidgetsToAddUser();

    // deleteQuery(queryName);
  });

  it("Should verify bulk update", () => {
    selectDataSource("PostgreSQL");
    fillConnectionForm({
      Host: "test-data-source-postgres.cid8c0avwtmj.us-west-1.rds.amazonaws.com",
      Port: "5432",
      "Database Name": "postgres",
      Username: "postgres",
      Password: "postgres123",
    });

    openQueryEditor("PostgreSQL");
    selectQueryMode("GUI mode");
    addGuiQuery("name", "email");
    cy.get(postgreSqlSelector.queryCreateAndRunButton).click();
  });
});
