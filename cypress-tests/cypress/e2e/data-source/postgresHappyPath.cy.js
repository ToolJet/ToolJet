import { multiselectSelector } from "Selectors/multiselect";
import { multiselectText } from "Texts/multiselect";
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
    cy.get("[data-cy='left-sidebar-sources-button']").click();
    cy.get("[data-cy='label-datasources']").should("have.text", "Data sources");

    cy.get("[data-cy='add-datasource-link']")
      .should("have.text", "+ add data source")
      .click();

    cy.get('[data-rb-event-key="#alldatasources"]').should(
      "have.text",
      "All Datasources (38)"
    );
    cy.get('[data-rb-event-key="#databases"]').should(
      "have.text",
      "Databases (17)"
    );
    cy.get('[data-rb-event-key="#apis"]').should("have.text", "APIs (18)");
    cy.get('[data-rb-event-key="#cloudstorage"]').should(
      "have.text",
      "Cloud Storage (3)"
    );

    cy.get('[data-cy="datasource-search-input"]').type("PostgreSQL");
    cy.get("[data-cy*='data-source-']").eq(0).should("contain", "PostgreSQL");
    cy.get("[data-cy='data-source-postgresql']").click();

    cy.get('[data-cy="data-source-name-input-filed"]').should(
      "have.value",
      "PostgreSQL"
    );
    cy.get('[data-cy="label-host"]').verifyVisibleElement("have.text", "Host");
    cy.get('[data-cy="label-port"]').verifyVisibleElement("have.text", "Port");
    cy.get('[data-cy="label-ssl"]').verifyVisibleElement("have.text", "SSL");
    cy.get('[data-cy="label-database-name"]').verifyVisibleElement(
      "have.text",
      "Database Name"
    );
    cy.get('[data-cy="label-username"]').verifyVisibleElement(
      "have.text",
      "Username"
    );
    cy.get('[data-cy="label-password"]').verifyVisibleElement(
      "have.text",
      "PasswordEncrypted"
    );
    cy.get('[data-cy="ssl-certificate-dropdown-label"]').verifyVisibleElement(
      "have.text",
      "SSL Certificate"
    );
    cy.get('[data-cy="white-list-ip-text"]').verifyVisibleElement(
      "have.text",
      "Please white-list our IP address if the data source is not publicly accessible"
    );
    cy.get('[data-cy="button-copy-ip"]').verifyVisibleElement(
      "have.text",
      "Copy"
    );
    //   .click()

    // cy.get('[data-cy="label-ip-copied"]').verifyVisibleElement(
    //   "have.text",
    //   "Copied"
    // );
    cy.get('[data-cy="link-read-documentation"]').verifyVisibleElement(
      "have.text",
      "Read documentation"
    );
    cy.get('[data-cy="test-connection-button"]')
      .verifyVisibleElement("have.text", "Test Connection")
      .click();
    cy.get('[data-cy="test-connection-failed-text"]').verifyVisibleElement(
      "have.text",
      "could not connect"
    );
    cy.get('[data-cy="db-connection-save-button"]').verifyVisibleElement(
      "have.text",
      "Save"
    );
    cy.get('[class="alert alert-danger"]').verifyVisibleElement(
      "have.text",
      "The server does not support SSL connections"
    );
  });

  it("Should verify the functionality of PostgreSQL connection form.", () => {
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

    cy.get('[data-cy="password-password-field"]').type("postgres123");

    cy.get('[data-cy="test-connection-button"]').click();
    cy.get('[data-cy="test-connection-verified-text"]', {
      timeout: 7000,
    }).should("have.text", "connection verified");
    cy.get('[data-cy="db-connection-save-button"]').click();

    cy.verifyToastMessage(commonSelectors.toastMessage, "Datasource Added");

    cy.get("[data-cy='left-sidebar-sources-button']").click();
    cy.get('[data-cy="datasource-Label"]')
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

    cy.get('[data-cy="button-add-new-queries"]').click();
    cy.get('[data-cy="postgresql-add-query-card"]')
      .should("contain", "PostgreSQL")
      .click();

    cy.get('[data-cy="header-queries-on-query-manager"]').verifyVisibleElement(
      "have.text",
      "Queries"
    );
    cy.get('[data-cy="no-query-text"]').verifyVisibleElement(
      "have.text",
      "You haven't created queries yet."
    );
    cy.get('[data-cy="create-query-button"]').verifyVisibleElement(
      "have.text",
      "Create query"
    );
    cy.get('[data-cy="header-queries-on-query-manager"]').verifyVisibleElement(
      "have.text",
      "Queries"
    );
    cy.get('[data-cy="query-search-icon"]').should("be.visible");
    cy.get('[data-cy="button-add-new-queries"]').should("be.visible").click();

    cy.get('[data-cy="label-select-datasource"]').verifyVisibleElement(
      "have.text",
      "Select Datasource"
    );
    cy.get('[data-cy="postgresql-add-query-card"]')
      .verifyVisibleElement("contain", "PostgreSQL")
      .click();

    cy.get('[data-cy="query-tab-general"]').verifyVisibleElement(
      "contain",
      "General"
    );
    cy.get('[data-cy="query-label-input-field"]').verifyVisibleElement(
      "have.value",
      "postgresql1"
    );
    cy.get('[data-cy="query-preview-button"]').verifyVisibleElement(
      "have.text",
      "Preview"
    );
    cy.get('[data-cy="query-create-and-run-button"]').verifyVisibleElement(
      "have.text",
      "Create & Run"
    );

    cy.get('[data-cy="query-create-dropdown"]').should("be.visible").click();
    cy.get('[data-cy="query-create-and-run-option"]').verifyVisibleElement(
      "have.text",
      "Create & Run"
    );
    cy.get('[data-cy="query-create-option"]')
      .verifyVisibleElement("have.text", "Create")
      .click();

    cy.get('[data-cy="query-create-and-run-button"]').verifyVisibleElement(
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

    cy.get('[data-cy="query-input-field"]').should("be.visible");

    cy.get('[data-cy="label-query-transformation"]')
      .scrollIntoView()
      .verifyVisibleElement("have.text", "Transformations");
    cy.get('[data-cy="toggle-query-transformation"]').click();
    cy.get('[data-cy="transformation-input-input-field"]').should("be.visible");

    cy.get('[data-cy="header-query-preview"]').verifyVisibleElement(
      "have.text",
      "Preview"
    );
    cy.get('[data-cy="preview-tab-json"]').verifyVisibleElement(
      "have.text",
      "Json"
    );
    cy.get('[data-cy="preview-tab-raw"]').verifyVisibleElement(
      "have.text",
      "Raw"
    );

    selectQueryMode("GUI mode", "4");
    cy.get('[data-cy="operation-dropdown-label"]').verifyVisibleElement(
      "have.text",
      "Operation"
    );
    cy.get("[data-cy='query-select-dropdown']:eq(1)").click();
    cy.get("#react-select-5-option-0")
      .should("have.text", "Bulk update using primary key")
      .click();

    cy.get('[data-cy="label-table"]').verifyVisibleElement(
      "have.text",
      "Table"
    );
    cy.get('[data-cy="label-primary-key-column"]').verifyVisibleElement(
      "have.text",
      "Primary key column"
    );
    cy.get('[data-cy="label-records-to-update"]').verifyVisibleElement(
      "have.text",
      "Records to update"
    );

    cy.get('[data-cy="query-tab-advanced"]')
      .verifyVisibleElement("contain", "Advanced")
      .click();

    cy.get('[data-cy="label-run-query-on-page-load"]').verifyVisibleElement(
      "have.text",
      "Run this query on page load?"
    );
    cy.get(
      '[data-cy="label-request-confirmation-on-run"]'
    ).verifyVisibleElement(
      "have.text",
      "Request confirmation before running query?"
    );
    cy.get('[data-cy="label-show-notification"]').verifyVisibleElement(
      "have.text",
      "Show notification on success?"
    );

    cy.get('[data-cy="toggle-show-notification"]').click();
    cy.get('[data-cy="label-success-message-input"]').verifyVisibleElement(
      "have.text",
      "Success Message"
    );
    cy.get(
      '[data-cy="label-notification-duration-input"]'
    ).verifyVisibleElement("have.text", "Notification duration (s)");
    cy.get('[data-cy="add-event-handler"]').verifyVisibleElement(
      "have.text",
      "+ Add event handler"
    );
    cy.get('[data-cy="no-event-handler-message"]').verifyVisibleElement(
      "have.text",
      "This query doesn't have any event handlers"
    );

    cy.get('[data-cy="query-create-dropdown"]').click();
    cy.get('[data-cy="query-create-option"]').click();
    cy.get('[data-cy="query-create-and-run-button"]').click();
    cy.get('[data-cy="postgresql1-query-label"]').verifyVisibleElement(
      "have.text",
      "postgresql1"
    );
    cy.get('[data-cy="postgresql1-query-run-button"]').should("be.visible");

    cy.get('[data-cy="postgresql1-query-label"]').click();
    cy.get('[data-cy="postgresql1-query-delete-button"]').click();
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
      "have.text",
      "Do you really want to delete this query?"
    );
    cy.get('[data-cy="modal-cancel-button"]').verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get('[data-cy="modal-confirm-button"]')
      .verifyVisibleElement("have.text", "Yes")
      .click();
  });

  it("Should verify CRUD operations on SQL Query.", () => {
    selectDataSource("PostgreSQL");

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      "cypress-postgresql"
    );

    fillConnectionForm({
      Host: "test-data-source-postgres.cid8c0avwtmj.us-west-1.rds.amazonaws.com",
      Port: "5432",
      "Database Name": "postgres",
      Username: "postgres",
      Password: "postgres123",
    });

    addQuery(
      "table_creation",
      `CREATE TABLE "public"."cypress_test_users" (
        "id" integer GENERATED ALWAYS AS IDENTITY,
        "name" text,
        "email" text,
        PRIMARY KEY ("id"),
        UNIQUE ("email")
    );`
    );

    addQuery(
      "existance_of_table",
      `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name   = 'cypress_test_users'
      );`
    );

    cy.get(`[data-cy="query-preview-button"]`, { timeout: 3000 }).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get('[data-cy="preview-tab-raw"]', { timeout: 3000 })
      .scrollIntoView()
      .should("be.visible", { timeout: 3000 })
      .click();

    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"exists":true}]'
    );

    addQuery(
      "add_data_using-Widgets",
      `INSERT INTO "public"."cypress_test_users"("name", "email") VALUES('{{components.textinput1.value}}', '{{components.textinput2.value}}') RETURNING "id", "name", "email";`
    );

    addQuery("truncate_table", `TRUNCATE TABLE "public"."cypress_test_users"`);
    addQuery("drop_table", `DROP TABLE "public"."cypress_test_users"`);
    cy.get(`[data-cy="query-preview-button"]`).click();
    cy.get('[class="tab-pane active"]', { timeout: 3000 }).should("be.visible");
    cy.get('[data-cy="preview-tab-raw"]').click();
    cy.get('[class="tab-pane active"]').should(
      "have.text",
      '[{"exists":false}]'
    );
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
    cy.get('[data-cy="query-create-and-run-button"]').click();
  });
});
