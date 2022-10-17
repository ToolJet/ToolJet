import { multiselectSelector } from "Selectors/multiselect";
import { multiselectText } from "Texts/multiselect";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

import { addQuery } from "Support/utils/postgreSql";
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

export const cyParamName = (paramName) => {
  return paramName.toLowerCase().replace(/\s+/g, "-");
};
export const fillDataSourceTextField = (fieldName, placeholder, input) => {
  cy.get(`[data-cy="label-${cyParamName(fieldName)}"]`).should(
    "have.text",
    fieldName
  );
  cy.get(`[data-cy="${cyParamName(fieldName)}-text-field"]`)
    .invoke("attr", "placeholder")
    .should("eq", placeholder.replace(/\u00a0/g, " "));
  cy.clearAndType(`[data-cy="${cyParamName(fieldName)}-text-field"]`, input);
};

// export const addQuery = (queryName, query) => {
//   cy.get('[data-cy="button-add-new-queries"]').click();
//   cy.get('[data-cy="cypress-postgresql"]')
//     .should("contain", "cypress-postgresql")
//     .click();

//   cy.get('[data-cy="query-label-input-field"]').clear().type(queryName);
//   cy.get('[data-cy="query-input-field"]').clearOnCodeMirror(query);
//   cy.get('[data-cy="query-create-and-run-button"]').click();
//   cy.verifyToastMessage(
//     commonSelectors.toastMessage,
//     `Query (${queryName}) completed.`
//   );
// };

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("Should verify elements on connection form", () => {});

  it("Should verify the functionality of PostgreSQL connection form.", () => {});

  it("Should verify elements of the Query section.", () => {});
  it("Should verify CRUD operations on SQL Query.", () => {
    cy.get("[data-cy='left-sidebar-sources-button']").click();
    cy.get("[data-cy='label-datasources']").should("have.text", "Data sources");
    //plus button
    cy.get("[data-cy='add-datasource-link']")
      .should("have.text", "+ add data source")
      .click();

    cy.get("[data-cy='title-add-new-datasource']").should(
      "have.text",
      "Add new datasource"
    );

    cy.get('[data-rb-event-key="#alldatasources"]').should(
      "have.text",
      "All Datasources (36)"
    );
    cy.get('[data-rb-event-key="#databases"]').should(
      "have.text",
      "Databases (16)"
    );
    cy.get('[data-rb-event-key="#apis"]').should("have.text", "APIs (17)");
    cy.get('[data-rb-event-key="#cloudstorage"]').should(
      "have.text",
      "Cloud Storage (3)"
    );

    cy.get('[data-cy="datasource-search-input"]').type("PostgreSQL");
    cy.get("[data-cy*='data-source-']").eq(0).should("contain", "PostgreSQL");
    cy.get("[data-cy='data-source-postgresql']").click();

    cy.clearAndType(
      '[data-cy="data-source-name-input-filed"]',
      "cypress-postgresql"
    );

    // cy.get('[data-cy="label-host"]').should('have.text', 'Host');
    // cy.get('[data-cy="host-text-field"]').should('have.placeholder','Enter host').clear().type("hostname");

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
    //SSL certificate

    cy.get('[data-cy="button-copy-ip"]').click();
    cy.get('[data-cy="label-ip-copied"]').should("have.text", "Copied");
    cy.get('[data-cy="white-list-ip-text"]').should(
      "have.text",
      "Please white-list our IP address if the data source is not publicly accessible"
    );
    cy.get('[data-cy="link-read-documentation"]').should(
      "have.text",
      "Read documentation"
    );
    // cy.get('[data-cy="button-test-connection"]').should('Test Connnection').click();
    cy.get('[data-cy="test-connection-button"]')
      .should("have.text", "Test Connection")
      .click();
    cy.get('[data-cy="test-connection-verified-text"]', {
      timeout: 7000,
    }).should("have.have.text", "connection verified");
    cy.get('[data-cy="db-connection-save-button"]')
      .should("have.text", "Save")
      .click();

    cy.verifyToastMessage(commonSelectors.toastMessage, "Datasource Added");

    cy.get("[data-cy='left-sidebar-sources-button']").click();
    cy.get('[data-cy="datasource-Label"]')
      .should("have.text", "cypress-postgresql")
      .find("button")
      .should("be.visible");

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

  it("Should verify bulk update", () => {});
});
