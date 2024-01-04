import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectEvent } from "Support/utils/events";
import { randomString } from "Support/utils/textInput";
import { buttonText } from "Texts/button";

import { addSuccessNotification, chainQuery } from "Support/utils/queries";

import { resizeQueryPanel } from "Support/utils/dataSource";

describe("Chaining of queries", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-App`);
    cy.openApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
  });

  it("should verify the chainig of runjs, restapi, runpy, tooljetdb and postgres", () => {
    const data = {};
    let dsName = fake.companyName;
    data.customText = randomString(12);
    cy.apiAddQueryToApp(
      "runjs",
      { code: "return true", hasParamSupport: true, parameters: [] },
      null,
      "runjs"
    );
    cy.apiAddQueryToApp(
      "runpy",
      { code: "True", hasParamSupport: true, parameters: [] },
      null,
      "runpy"
    );
    cy.apiAddQueryToApp(
      "restapi",
      {
        method: "get",
        url: "https://gorest.co.in/public/v2/users",
        url_params: [["", ""]],
      },
      null,
      "restapi"
    );
    cy.apiAddQueryToApp(
      "tjdb",
      {
        operation: "",
        transformationLanguage: "javascript",
        enableTransformation: false,
      },
      null,
      "tooljetdb"
    );

    cy.apiCreateGDS(
      "http://localhost:3000/api/v2/data_sources",
      `cypress-${dsName}-postgresql`,
      "postgresql",
      [
        { key: "host", value: Cypress.env("pg_host") },
        { key: "port", value: 5432 },
        { key: "database", value: Cypress.env("pg_user") },
        { key: "username", value: Cypress.env("pg_user") },
        { key: "password", value: Cypress.env("pg_password"), encrypted: true },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );
    cy.apiAddQueryToApp(
      "psql",
      {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM server_side_pagination`,
      },
      `cypress-${dsName}-postgresql`,
      "postgresql"
    );
    cy.reload();
    resizeQueryPanel("80");
    chainQuery("psql", "runjs");
    addSuccessNotification("psql");
    chainQuery("runjs", "runpy");
    addSuccessNotification("runjs");
    chainQuery("runpy", "restapi");
    addSuccessNotification("runpy");
    chainQuery("restapi", "tjdb");
    addSuccessNotification("restapi");

    openEditorSidebar(buttonText.defaultWidgetName);
    selectEvent("On Click", "Run Query", 1, `[data-cy="add-event-handler"]`, 1);
    cy.wait(500);
    cy.get('[data-cy="query-selection-field"]')
      .click()
      .find("input")
      .type(`{selectAll}{backspace}psql{enter}`);
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "psql");
    cy.verifyToastMessage(commonSelectors.toastMessage, "runjs");
    cy.verifyToastMessage(commonSelectors.toastMessage, "runpy");
    cy.verifyToastMessage(commonSelectors.toastMessage, "restapi");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid operation");
  });
});
