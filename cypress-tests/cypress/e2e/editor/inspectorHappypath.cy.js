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
    cy.appUILogin();
    cy.createApp();
  });

  it("should verify the values of inspector", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("queries", "Object", "0 entry ");
    verifyNodeData("components", "Object", "0 entry ");
    verifyNodeData("globals", "Object", "3 entries ");
    verifyNodeData("variables", "Object", "0 entry ");
    verifyNodeData("page", "Object", "4 entries ");

    openNode("globals");
    verifyNodeData("theme", "Object", "1 entry ");
    verifyNodeData("urlparams", "Object", "0 entry ");
    verifyNodeData("currentUser", "Object", "4 entries ");

    openNode("theme");
    verifyValue("name", "String", `"light"`);

    openNode("currentUser");
    verifyValue("email", "String", `"dev@tooljet.io"`);
    verifyValue("firstName", "String", `"The"`);
    verifyValue("lastName", "String", `"Developer"`);
    verifyNodeData("groups", "Array", "2 items ");

    openNode("groups");
    verifyValue("0", "String", `"all_users"`);
    verifyValue("1", "String", `"admin"`);

    openNode("globals");
    openNode("page");
    verifyValue("handle", "String", `"home"`);
    verifyValue("name", "String", `"Home"`);

    cy.get(multipageSelector.sidebarPageButton).click();
    addNewPage("test_page");

    cy.dragAndDropWidget("Button", 100, 200);
    selectEvent("On click", "Switch page");
    cy.get('[data-cy="switch-page-label-and-input"] > .select-search')
      .click()
      .type("home{enter}");
    cy.get('[data-cy="button-add-query-param"]').click();
    addSupportCSAData("query-param-key", "key");
    addSupportCSAData("query-param-value", "value");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 100, 300);
    selectEvent("On click", "Set variable");
    addSupportCSAData("key", "globalVar");
    addSupportCSAData("variable", "globalVar");
    cy.get(commonWidgetSelector.draggableWidget("button2")).click();

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 100, 400);
    selectEvent("On click", "Set page variable");
    addSupportCSAData("key", "pageVar");
    addSupportCSAData("variable", "pageVar");
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
    cy.get(".mx-1 > img").realClick();
    cy.realPress("Escape");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("{{globals.urlparams.key}}");
      });
    });

    cy.get(".action-icons-group > .d-flex > :nth-child(2)").click();
    cy.get(".list-group-item").click();
    cy.realPress("Escape");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(`"value"`);
      });
    });

    cy.dragAndDropWidget("Button", 100, 300);
    cy.get(commonWidgetSelector.sidebarinspector).click();
    openNode("components");
    cy.get(`[data-cy="inspector-node-button1"] > .mx-1`).realHover();
    cy.get('[style="height: 13px; width: 13px;"] > img').click();
    cy.notVisible(commonWidgetSelector.draggableWidget("button1"));
  });
});
