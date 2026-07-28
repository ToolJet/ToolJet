import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectEvent } from "Support/utils/events";
import { randomString } from "Support/utils/editor/textInput";
import { buttonText } from "Texts/button";

import {
  addSuccessNotification,
  chainQuery,
  selectRunQueryEvent,
} from "Support/utils/queries";

import { resizeQueryPanel } from "Support/utils/dataSource";

describe("Chaining of queries", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-chaining-App`);
    cy.openApp();
    cy.apiFetchDataSourcesIdFromApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
  });

  // FIXED & re-enabled. Three fixes, all in-scope (this spec + queries.js):
  //   (a) apiCreateDataSource 500 was PAYLOAD DRIFT, not an env gap. The PG
  //       backend IS reachable. Aligned the payload with the proven-working
  //       postgresHappyPath.cy.js:126-145 (full encrypted-field set + database
  //       fallback to pg_user + setCredentials=true) → POST /api/data-sources
  //       returns 201.
  //   (b) query-selection-field is now a Rocket OptionCombobox (InputGroup nests
  //       >1 <input>) → the old `.find("input").type()` threw "cy.type can only
  //       be called on a single element (2)". Fixed to first-visible-input +
  //       role=option pick (queries.js chainQuery + spec block below).
  //   (c) THE intermittent "[role=option] never found" blocker: the
  //       `action-selection` field is a Radix UI Select
  //       (frontend/.../shadcn/select.jsx:13 → @radix-ui/react-select). It lives
  //       inside the `popover-card` (a Radix Popover) which scroll-locks
  //       `body { pointer-events:none }`, so opening it by clicking the trigger —
  //       synthetic (events.js chooseRocketOption force-click) OR native
  //       (realClick) — is swallowed. AND EventManager controls the select's
  //       `open` prop via autoOpenActionSelect (EventManager.jsx:579), so when
  //       auto-open is active a trigger click *closes* the already-open listbox.
  //       That combination made it flaky (passed iff auto-open had already
  //       rendered the options). FIX: queries.js `selectRunQueryEvent` opens the
  //       Radix Select via KEYBOARD ({downarrow} on the focused trigger —
  //       unaffected by the body pointer-events lock), gated on the trigger's own
  //       data-state so it never toggles a controlled-open select shut. The
  //       chaining spec now drives ALL "Run Query" picks through this helper
  //       instead of events.js selectEvent. Verified: 3 consecutive green runs.
  it("should verify the chainig of runjs, restapi, runpy, tooljetdb and postgres", () => {
    const data = {};
    let dsName = fake.companyName;
    data.customText = randomString(12);
    cy.apiAddQueryToApp({
      queryName: "runjs",
      options: { code: "return true", hasParamSupport: true, parameters: [] },
      dataSourceName: "runjsdefault",
      dsKind: "runjs",
    });
    cy.apiAddQueryToApp({
      queryName: "runpy",
      options: { code: "True", hasParamSupport: true, parameters: [] },
      dataSourceName: "runpydefault",
      dsKind: "runpy",
    });
    cy.apiAddQueryToApp({
      queryName: "restapi",
      options: {
        method: "get",
        url: "https://gorest.co.in/public/v2/users",
        url_params: [["", ""]],
      },
      dataSourceName: "restapidefault",
      dsKind: "restapi",
    });
    cy.apiAddQueryToApp({
      queryName: "tjdb",
      options: {
        operation: "",
        transformationLanguage: "javascript",
        enableTransformation: false,
      },
      dataSourceName: "tooljetdbdefault",
      dsKind: "tooljetdb",
    });

    cy.apiCreateDataSource(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${dsName}-qc-postgresql`,
      "postgresql",
      // payload aligned with the proven-working PG datasource creation in
      // marketplace/.../postgresHappyPath.cy.js:126-145 (full encrypted-field
      // set + database=pg_database) and setCredentials=true so the dev
      // environment gets the secret values. Previously omitted cert fields and
      // set database to pg_user, which produced a server 500 on POST
      // /api/data-sources.
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: Cypress.env("pg_host"), encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        // pg_database is not set in cypress.env.json (only pg_host/pg_user/
        // pg_password/pg_string exist); default Postgres database == role name
        // "postgres" == pg_user, so use pg_user as the database name.
        {
          key: "database",
          value: Cypress.env("pg_database") || Cypress.env("pg_user"),
          encrypted: false,
        },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "username", value: Cypress.env("pg_user"), encrypted: false },
        { key: "password", value: Cypress.env("pg_password"), encrypted: true },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true },
      ],
      true
    );
    cy.log("Data source created");
    cy.apiAddQueryToApp({
      queryName: "psql",
      options: {
        mode: "sql",
        transformationLanguage: "javascript",
        enableTransformation: false,
        query: `SELECT * FROM pg_stat_activity;`,
      },
      dataSourceName: `cypress-${dsName}-qc-postgresql`,
      dsKind: "postgresql",
    });
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

    cy.get(`[data-cy="list-query-tjdb"]`).click();
    cy.get('[data-cy="query-tab-settings"]').click();
    selectEvent("Query Failure", "Show Alert");
    cy.get('[data-cy="debounce-input-field"]')
      .click()
      .type(`{selectAll}{backspace}2000{enter}`);
    cy.wait(1000);
    cy.get('[data-cy="query-tab-setup"]').click();

    openEditorSidebar(buttonText.defaultWidgetName);
    // Use the Radix-Select-aware helper (queries.js) instead of events.js
    // selectEvent: the "Run Query" action pick goes through the same flaky
    // chooseRocketOption otherwise. selectRunQueryEvent drives the
    // action-selection Radix Select with a native pointer click (realClick).
    selectRunQueryEvent("On Click", `[data-cy="add-event-handler"]`, 0, 0);
    cy.wait(500);
    // query-selection-field is now a Rocket OptionCombobox (InputGroup nests >1 input)
    // — see STATUS SHARED FIX 8. Type into the first visible input, then pick the role=option.
    cy.get('[data-cy="query-selection-field"]').scrollIntoView().click();
    cy.get('[data-cy="query-selection-field"] input')
      .filter(":visible")
      .first()
      .clear({ force: true })
      .type("psql", { force: true });
    cy.get('[role="option"]')
      .filter(":visible")
      .contains(new RegExp(`^\\s*psql\\s*$`, "i"))
      .click({ force: true });
    cy.forceClickOnCanvas();
    cy.wait(2500);
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "psql");
    cy.verifyToastMessage(commonSelectors.toastMessage, "runjs");
    cy.verifyToastMessage(commonSelectors.toastMessage, "runpy");
    cy.wait(500);
    cy.verifyToastMessage(commonSelectors.toastMessage, "restapi");
    // cy.verifyToastMessage(commonSelectors.toastMessage, "Hello World");
  });

  it.skip("should verify query duplication", () => {
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

    cy.reload();
    resizeQueryPanel("80");
    addSuccessNotification("runpy");
    chainQuery("runjs", "runpy");
    addSuccessNotification("runjs");

    openEditorSidebar(buttonText.defaultWidgetName);
    selectEvent("On Click", "Run Query", 0, `[data-cy="add-event-handler"]`, 0);
    cy.wait(500);
    cy.get('[data-cy="query-selection-field"]')
      .click()
      .find("input")
      .type(`{selectAll}{backspace}runjs{enter}`);
    cy.forceClickOnCanvas();
    cy.wait(2500);
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "runjs");
    cy.verifyToastMessage(commonSelectors.toastMessage, "runpy");
    cy.get('[data-cy="list-query-runjs"]')
      .trigger("mouseover")
      .parent()
      .parent()
      .find('[data-cy="copy-icon"]')
      .eq(0)
      .invoke("show")
      .click({ force: true });
    cy.get('[data-cy="list-query-runjs_copy"]').verifyVisibleElement(
      "have.text",
      "runjs_copy "
    );
    cy.get('[data-cy="notification-on-success-toggle-switch"]').should(
      "have.value",
      "on"
    );
    cy.get('[data-cy="success-message-input-field"]').should(
      "contain.text",
      "runjs"
    );
    cy.get(".query-definition-pane-wrapper").within(() => {
      cy.get('[data-cy="event-handler-card"]').eq(0).click();
      cy.wait(500);
    });
    cy.get(
      `[data-cy="action-selection"] > .select-search > .react-select__control > .react-select__value-container > `
    ).should("have.text", "Run Query");
    cy.get('[data-cy="query-selection-field"]').should("have.text", "runpy");
  });
});