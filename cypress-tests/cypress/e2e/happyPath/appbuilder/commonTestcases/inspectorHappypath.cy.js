import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { multipageSelector } from "Selectors/multipage";
import { addSupportCSAData, selectEvent } from "Support/utils/events";
import { createNewVersion } from "Support/utils/exportImport";
import { deleteComponentFromInspector, openNode, verifyNodeData, verifyValue, verifyNodes, openAndVerifyNode } from "Support/utils/inspector";
import { addNewPage } from "Support/utils/multipage";
import { navigateToCreateNewVersionModal } from "Support/utils/version";
import testData from "Fixtures/inspectorItems.json";

describe("Editor- Inspector", () => {
  let currentVersion = "";
  let newVersion = [];
  let versionFrom = "";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-inspector-App`);
    cy.openApp("?key=value");
    cy.viewport(1800, 1800);
  });

  it("should verify the values of inspector", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");

    openAndVerifyNode("globals", testData.globalsNodes, verifyNodeData);
    openAndVerifyNode("currentUser", testData.currentUserNodes, verifyValue);
    openAndVerifyNode("theme", testData.themeNodes, verifyValue);
    openAndVerifyNode("mode", testData.modeNodes, verifyValue);
    openAndVerifyNode("urlparams", testData.urlparamsNode, verifyValue);

    if (Cypress.env("environment") !== "Community") {
      const ssoUserInfoNode = '[data-cy="inspector-node-ssouserinfo"]';
      const inspectorNodeId = '[data-cy="inspector-node-id"]';

      cy.get(`${ssoUserInfoNode} > .node-key`).should("have.text", "ssoUserInfo");
      cy.get(`${ssoUserInfoNode} > .mx-2`).should("have.text", "undefined");

      openNode("theme");
      openNode("environment");
      verifyValue("name", "String", `"development"`);
      cy.get(`${inspectorNodeId} > .node-key`).should("have.text", "id");
    }

    cy.apiDeleteApp();
  });

  it("should verify dynamic items", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");

    cy.get(multipageSelector.sidebarPageButton).click();
    addNewPage("test_page");

    cy.dragAndDropWidget("Button", 100, 100);
    selectEvent("On click", "Switch page");
    cy.get('[data-cy="switch-page-label-and-input"] > .select-search').click().type("home{enter}");

    cy.get('[data-cy="button-add-query-param"]').click();
    cy.wait(3000);
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy="event-query-param-key-input-field"]').length == 0) {
        cy.get('[data-cy="button-add-query-param"]').click();
      }
    });

    addSupportCSAData("event-query-param-key", "key");
    addSupportCSAData("event-query-param-value", "value");
    cy.get('[data-cy="switch-page-label-and-input"] > .select-search').click().type("home{enter}");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 300);
    selectEvent("On click", "Set variable");
    addSupportCSAData("event-key", "globalVar");
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
    openAndVerifyNode("variables", testData.variablesNodes, verifyValue);

    cy.forceClickOnCanvas()
    cy.wait(500)
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");

    // openNode("page");

    openAndVerifyNode("page", testData.testPageNodes, verifyValue);
    openNode("variables", 1);
    verifyValue("pageVar", "String", `"pageVar"`);

    openAndVerifyNode("components", testData.componentsNodes, verifyNodeData);

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.sidebarinspector).click();

    openAndVerifyNode("page", testData.pageNodes, verifyValue);
    openNode("globals");
    openNode("urlparams");
    verifyValue("key", "String", `"value"`);

    cy.get(`[data-cy="inspector-node-key"] > .mx-1`)
      .realHover()
      .parent()
      .find('[data-cy="copy-path-to-clipboard"]')
      .realClick();
    cy.realPress("Escape");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("{{globals.urlparams.key}}");
      });
    });

    cy.get(`[data-cy="inspector-node-key"] > .mx-1`)
      .realHover()
      .parent()
      .find('[data-cy="copy-value-to-clicpboard"]')
      .realClick();
    cy.realPress("Escape");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(`"value"`);
      });
    });

    cy.dragAndDropWidget("Button", 500, 300);
    cy.get(commonWidgetSelector.sidebarinspector).click();
    openNode("components");
    cy.get(`[data-cy="inspector-node-button1"] > .mx-1`).eq(0).realHover();
    cy.get('[style="height: 13px; width: 13px;"] > img').last().click();
    cy.notVisible(commonWidgetSelector.draggableWidget("button1"));
    cy.apiDeleteApp();
  });

  it("should verify deletion of component from inspector", () => {
    cy.dragAndDropWidget("button", 500, 500);
    cy.get(commonWidgetSelector.sidebarinspector).click();
    deleteComponentFromInspector("button1");
    cy.verifyToastMessage(`[class=go3958317564]`, "Component deleted! (⌘ + Z to undo)");

    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    cy.notVisible(commonWidgetSelector.draggableWidget("button1"));
    cy.apiDeleteApp();
  });
});
