import {
  verifyMultipleComponentValuesFromInspector,
  verifyComponentValueFromInspector,
} from "Support/utils/commonWidget";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addNewPage } from "Support/utils/multipage";

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

    addNewPage("test_page");

    cy.dragAndDropWidget("Button", 100, 200);
    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 100, 300);
    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 100, 200);
  });
});
