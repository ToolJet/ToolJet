import { fake } from "Fixtures/fake";
import {
  verifyMultipleComponentValuesFromInspector,
  verifyComponentValueFromInspector,
} from "Support/utils/commonWidget";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addNewPage } from "Support/utils/multipage";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";
import { multipageSelector } from "Selectors/multipage";

describe("Editor- Inspector", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-App`);
    cy.openApp();
  });

  it("should verify the values of inspector", () => {
    const countGlobal =
      Cypress.env("environment") === "Community" ? "4 entries " : "5 entries ";
    const countUser =
      Cypress.env("environment") === "Community" ? "4 entries " : "5 entries ";
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("queries", "Object", "0 entry ");
    verifyNodeData("components", "Object", "0 entry ");
    verifyNodeData("globals", "Object", countGlobal);
    verifyNodeData("variables", "Object", "0 entry ");
    verifyNodeData("page", "Object", "4 entries ");

    openNode("globals");
    verifyNodeData("theme", "Object", "1 entry ");
    verifyNodeData("urlparams", "Object", "0 entry ");
    verifyNodeData("currentUser", "Object", countUser);

    openNode("theme");
    verifyValue("name", "String", `"light"`);

    openNode("currentUser");
    verifyValue("email", "String", `"dev@tooljet.io"`);
    verifyValue("firstName", "String", `"The"`);
    verifyValue("lastName", "String", `"Developer"`);
    verifyNodeData("groups", "Array", "2 items ");
    if (Cypress.env("environment") !== "Community") {
      cy.get(
        '[data-cy="inspector-node-ssouserinfo"] > .node-key'
      ).verifyVisibleElement("have.text", "ssoUserInfo");
      cy.get(
        '[data-cy="inspector-node-ssouserinfo"] > .mx-2'
      ).verifyVisibleElement("have.text", "undefined");
      openNode("theme");
      openNode("environment");
      verifyValue("name", "String", `"development"`);
      cy.get('[data-cy="inspector-node-id"] > .node-key').verifyVisibleElement(
        "have.text",
        "id"
      );
    }
    openNode("mode");
    verifyValue("value", "String", `"edit"`);

    openNode("groups");
    verifyValue("0", "String", `"all_users"`);
    verifyValue("1", "String", `"admin"`);
    verifyNodeData("constants", "Object", "0 entry ");

    openNode("globals");
    openNode("page");
    verifyValue("handle", "String", `"home"`);
    verifyValue("name", "String", `"Home"`);

    cy.get(multipageSelector.sidebarPageButton).click();
    addNewPage("test_page");

    cy.dragAndDropWidget("Button", 500, 500);
    selectEvent("On click", "Switch page");
    cy.get('[data-cy="switch-page-label-and-input"] > .select-search')
      .click()
      .type("home{enter}");

    cy.get('[data-cy="button-add-query-param"]').click();
    cy.wait(3000);
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="query-param-key-input-field"]').length == 0) {
        cy.get('[data-cy="button-add-query-param"]').click();
      }
    });

    addSupportCSAData("query-param-key", "key");
    addSupportCSAData("query-param-value", "value");
    cy.get('[data-cy="switch-page-label-and-input"] > .select-search')
      .click()
      .type("home{enter}");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 300);
    selectEvent("On click", "Set variable");
    addSupportCSAData("key", "globalVar");
    addSupportCSAData("variable", "globalVar");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.draggableWidget("button2")).click();

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 400);
    selectEvent("On click", "Set page variable");
    addSupportCSAData("key", "pageVar");
    addSupportCSAData("variable", "pageVar");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.draggableWidget("button3")).click();

    cy.get(commonWidgetSelector.sidebarinspector).click();
    openNode("variables");
    verifyValue("globalVar", "String", `"globalVar"`);

    openNode("page");
    openNode("variables", 1);
    verifyValue("pageVar", "String", `"pageVar"`);
    verifyValue("handle", "String", `"test-page"`);
    verifyValue("name", "String", `"test_page"`);

    openNode("components");
    verifyNodeData("button1", "Object", "7 entries ");
    verifyNodeData("button2", "Object", "7 entries ");
    verifyNodeData("button3", "Object", "7 entries ");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.sidebarinspector).click();

    openNode("page");
    verifyValue("handle", "String", `"home"`);
    verifyValue("name", "String", `"Home"`);

    openNode("globals");
    verifyNodeData("urlparams", "Object", "1 entry ");

    openNode("urlparams");
    verifyValue("key", "String", `"value"`);

    cy.get(`[data-cy="inspector-node-key"] > .mx-1`).realHover();
    cy.get('[data-cy="copy-path-to-clipboard"]').realClick();
    cy.realPress("Escape");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("{{globals.urlparams.key}}");
      });
    });

    cy.get('[data-cy="copy-value-to-clicpboard"]').realClick();
    cy.realPress("Escape");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(`"value"`);
      });
    });

    cy.dragAndDropWidget("Button", 500, 300);
    cy.get(commonWidgetSelector.sidebarinspector).click();
    openNode("components");
    cy.get(`[data-cy="inspector-node-button1"] > .mx-1`).realHover();
    cy.get('[style="height: 13px; width: 13px;"] > img').click();
    cy.notVisible(commonWidgetSelector.draggableWidget("button1"));
    cy.apiDeleteApp();
  });
});
