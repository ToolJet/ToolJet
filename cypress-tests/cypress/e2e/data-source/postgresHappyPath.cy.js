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
  verifyMultiselectHeader,
  selectFromMultiSelect,
  verifyMultiselectStatus,
  verifyMultiselectOptions,
} from "Support/utils/multiselectWidget";
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

export const addQuery = (queryName, query) => {
  cy.get('[data-cy="button-add-new-queries"]').click();
  cy.get('[data-cy="cypress-postgresql"]')
    .should("contain", "cypress-postgresql")
    .click();

  cy.get('[data-cy="query-label-input-field"]').clear().type(queryName);
  cy.get('[data-cy="query-input-field"]').clearOnCodeMirror(query);
  cy.get('[data-cy="query-create-and-run-button"]').click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};

describe("Data sources", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });
  it("should connect with PostgreSQL and verify queries", () => {
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

    cy.get('[data-cy="button-add-new-queries"]').click();
    cy.get('[data-cy="cypress-postgresql"]')
      .should("contain", "cypress-postgresql")
      .click();

    cy.get('[data-cy="query-label-input-field"]')
      .clear()
      .type("table_creation");
    cy.get('[data-cy="query-input-field"]')
      .clearAndTypeOnCodeMirror(`CREATE TABLE "public"."cypress_test_users" (
        "id" integer GENERATED ALWAYS AS IDENTITY,
        "name" text,
        "email" text,
        PRIMARY KEY ("id"),
        UNIQUE ("email")
    );`);
    cy.get('[data-cy="query-create-and-run-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (table_creation) completed."
    );
  });
});
