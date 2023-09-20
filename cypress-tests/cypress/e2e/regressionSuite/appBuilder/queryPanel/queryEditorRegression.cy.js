import {
  verifyElemtsNoGds,
  verifyElemtsWithGds,
} from "Support/utils/queryPanel/queryEditor";
import {
  resizeQueryPanel,
  query,
  verifypreview,
} from "Support/utils/dataSource";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

describe("Query Editor", () => {
  beforeEach(() => {
    cy.apiLogin();
  });

  it("should verify Elements on query editor", () => {
    cy.apiCreateApp();
    cy.openApp();
    verifyElemtsNoGds();
    verifyElemtsWithGds("cypress-psql");
    cy.apiDeleteDS(`cypress-psql`);
  });

  it("should verify Functionality of query editor", () => {
    cy.apiCreateApp();
    cy.openApp();
    resizeQueryPanel("80");

    cy.get('[data-cy="restapi-add-query-card"]').click();
    cy.get('[data-cy="query-rename-input"]').clear();
    cy.forceClickOnCanvas();
    cy.get('[data-cy="query-name-label"]').click();
    cy.get('[data-cy="query-rename-input"]').clear().type("new name");
    cy.forceClickOnCanvas();
    cy.get('[data-cy="query-name-label"]').click();
    cy.get('[data-cy="query-rename-input"]').clear().type("new_name");
    cy.waitForAutoSave();
    cy.wait(3000);
    cy.get('[data-cy="-input-field"]:eq(0)').clearCodeMirror();
    cy.get('[data-cy="-input-field"]:eq(0)').type(
      "https://gorest.co.in/public/v2/users"
    );
    query("preview");
    verifypreview("raw", '"gender":"male"');
  });

  it("should verify imported app's queries", () => {
    cy.visit("/");
    cy.window({ log: false }).then((win) => {
      win.localStorage.setItem("walkthroughCompleted", "true");
    });
    cy.get('[data-testid="applicationFoldersList"]').should("be.visible");
    cy.importApp(
      "cypress/fixtures/templates/appbuilderApps/querytest-export-1695183432845.json"
    );
    resizeQueryPanel("70");
    cy.get('[data-cy="draggable-widget-text1"]').verifyVisibleElement(
      "have.text",
      "dataPresent"
    );

    query("preview");
    verifypreview("raw", "dataPresent");
  });

  it("should verify transformation", () => {
    cy.apiCreateApp();
    cy.openApp();
    resizeQueryPanel("80");

    cy.get('[data-cy="restapi-add-query-card"]').click();
    cy.get('[data-cy="query-rename-input"]').clear();
    cy.get('[data-cy="query-rename-input"]').clear().type("new_name");
    cy.waitForAutoSave();
    cy.get('[data-cy="-input-field"]:eq(0)').clearCodeMirror();
    cy.get('[data-cy="-input-field"]:eq(0)').type(
      "https://gorest.co.in/public/v2/users"
    );

    cy.get("span.d-flex > .custom-toggle-switch > .switch > .slider").click();
    cy.get('[data-cy="transformation-input-input-field"]').clearCodeMirror();
    cy.get(
      '[data-cy="transformation-input-input-field"]'
    ).clearAndTypeOnCodeMirror(
      'return data.filter(person => person.gender === "female").length'
    );

    query("preview");
    verifypreview("raw", "6");

    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();
    openNode("queries");
    openNode("new_name");
    verifyValue("data", "Number", "6");
  });

  it("should verify Event Handler", () => {
    cy.apiCreateApp();
    cy.openApp();
    resizeQueryPanel("80");

    cy.get('[data-cy="restapi-add-query-card"]').should("be.visible").click();
    cy.wait(500);

    selectEvent("Query Failure", "Set variable");
    addSupportCSAData("key", "globalVar");
    addSupportCSAData("variable", "globalVar");
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    openNode("variables");
    verifyValue("globalVar", "String", `"globalVar"`);

    cy.get('[data-cy="event-handler-card"] ')
      .realHover()
      .find(".tj-base-btn")
      .click();
    cy.notVisible('[data-cy="event-handler-card"] ');
  });
});
