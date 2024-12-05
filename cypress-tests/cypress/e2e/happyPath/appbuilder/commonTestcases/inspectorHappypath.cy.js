import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { multipageSelector } from "Selectors/multipage";
import { addSupportCSAData, selectEvent } from "Support/utils/events";
import { createNewVersion } from "Support/utils/exportImport";
import {
  deleteComponentFromInspector,
  openNode,
  verifyNodeData,
  verifyValue,
} from "Support/utils/inspector";
import { addNewPage } from "Support/utils/multipage";
import { navigateToCreateNewVersionModal } from "Support/utils/version";

describe("Editor- Inspector", () => {
  let currentVersion = "";
  let newVersion = [];
  let versionFrom = "";
  const globalsNodes = [
    { key: "theme", type: "Object", value: "1 entry " },
    { key: "urlparams", type: "Object", value: "1 entry " },
    { key: "currentUser", type: "Object", value: "8 entries " },
  ];

  const componentsNodes = [
    { key: "button1", type: "Object", value: "13 entries " },
    { key: "button2", type: "Object", value: "13 entries " },
    { key: "button3", type: "Object", value: "13 entries " },
  ];

  const pageNodes = [
    { key: "handle", type: "String", value: `"home"` },
    { key: "name", type: "String", value: `"Home"` },
  ];

  const testPageNodes = [
    { key: "pageVar", type: "String", value: `"pageVar"` },
    { key: "handle", type: "String", value: `"test-page"` },
    { key: "name", type: "String", value: `"test_page"` },
  ];

  const currentUserNodes = [
    { key: "email", type: "String", value: `"dev@tooljet.io"` },
    { key: "firstName", type: "String", value: `"The"` },
    { key: "lastName", type: "String", value: `"Developer"` },
    {
      key: "id",
      type: "String",
      value: `"3da1699a-988b-4df6-9772-3425c880651b"`,
    },
    // { key: "avatarId", type: "Null", value: `null` },
    // { key: "groups", type: "Array", value: "2 items" }, // Assuming it's an array of 2 items ("all_users" and "admin")
    { key: "role", type: "String", value: `"admin"` },
    //ssoUserInfo
  ];

  const themeNodes = [{ key: "name", type: "String", value: `"light"` }];

  const modeNodes = [{ key: "value", type: "String", value: `"edit"` }];

  const groupsNodes = [
    { key: "0", type: "String", value: `"all_users"` },
    { key: "1", type: "String", value: `"admin"` },
  ];

  const urlparamsNode = [{ key: "key", type: "String", value: `"value"` }];

  const variablesNodes = [
    { key: "globalVar", type: "String", value: `"globalVar"` },
    // { key: "pageVar", type: "String", value: `"pageVar"` }
  ];
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-inspector-App`);
    cy.openApp("?key=value");
  });
  it("should verify the values of inspector", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");

    openNode("globals");
    globalsNodes.forEach((node) => {
      verifyNodeData(node.key, node.type, node.value);
    });

    openNode("currentUser");
    currentUserNodes.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

    openNode("theme");
    themeNodes.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

    openNode("mode");
    modeNodes.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

    // Groups group
    // cy.wait(2000)
    // openNode("groups");
    // groupsNodes.forEach(node => {
    //   verifyValue(node.key, node.type, node.value);
    // });

    openNode("urlparams");
    urlparamsNode.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

    // Handle specific environment checks if needed
    if (Cypress.env("environment") !== "Community") {
      const ssoUserInfoNode = '[data-cy="inspector-node-ssouserinfo"]';
      const inspectorNodeId = '[data-cy="inspector-node-id"]';

      cy.get(`${ssoUserInfoNode} > .node-key`).should(
        "have.text",
        "ssoUserInfo"
      );
      cy.get(`${ssoUserInfoNode} > .mx-2`).should("have.text", "undefined");

      openNode("theme");
      openNode("environment");
      verifyValue("name", "String", `"development"`);
      cy.get(`${inspectorNodeId} > .node-key`).should("have.text", "id");
    }
    cy.apiDeleteApp();
  });

  it("should verify dynamic items items", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");

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
      if (
        $body.find('[data-cy="event-query-param-key-input-field"]').length == 0
      ) {
        cy.get('[data-cy="button-add-query-param"]').click();
      }
    });

    addSupportCSAData("event-query-param-key", "key");
    addSupportCSAData("event-query-param-value", "value");
    cy.get('[data-cy="switch-page-label-and-input"] > .select-search')
      .click()
      .type("home{enter}");

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
    // Variables group
    openNode("variables");
    variablesNodes.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

    openNode("page");
    openNode("variables", 1);
    testPageNodes.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

    // Components group
    openNode("components");
    componentsNodes.forEach((node) => {
      verifyNodeData(node.key, node.type, node.value);
    });

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.sidebarinspector).click();

    // Page group
    openNode("page");
    pageNodes.forEach((node) => {
      verifyValue(node.key, node.type, node.value);
    });

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
    cy.get(`[data-cy="inspector-node-button1"] > .mx-1`).realHover();
    cy.get('[style="height: 13px; width: 13px;"] > img').click();
    cy.notVisible(commonWidgetSelector.draggableWidget("button1"));
    cy.apiDeleteApp();
  });

  it("should verify deletion of component from inspector", () => {
    cy.dragAndDropWidget("button", 500, 500);
    cy.get(commonWidgetSelector.sidebarinspector).click();
    deleteComponentFromInspector("button1");
    cy.verifyToastMessage(
      `[class=go3958317564]`,
      "Component deleted! (⌘ + Z to undo)"
    );
    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    cy.notVisible(commonWidgetSelector.draggableWidget("button1"));
    cy.apiDeleteApp();
  });
});
