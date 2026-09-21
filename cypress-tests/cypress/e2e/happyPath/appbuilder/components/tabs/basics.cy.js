import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
  openAndVerifyNode,
  openNode,
  verifyfunctions,
  verifyNodes,
  verifyNodeData,
} from "Support/utils/appBuilder/inspector";


describe("Tabs — basics facet", { testIsolation: false }, () => {
  const exposedValues = [
    {
      key: "currentTab",
      type: "String",
      value: '"t0"',
    },
    {
      key: "currentTabTitle",
      type: "String",
      value: '"Tab 1"',
    },
    {
      key: "isVisible",
      type: "Boolean",
      value: "true",
    },
    {
      key: "isDisabled",
      type: "Boolean",
      value: "false",
    },
    {
      key: "isLoading",
      type: "Boolean",
      value: "false",
    },
  ];

  const functions = [
    { key: "setTab",type: "Function" },
    { key: "setVisibility",type: "Function" },
    { key: "setDisable",type: "Function" },
    { key: "setLoading",type: "Function" },
    { key: "setTabDisable",type: "Function" },
    { key: "setTabLoading",type: "Function" },
    { key: "setTabVisibility",type: "Function" },
  ];

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Tabs-App`);
    cy.openApp();
    cy.dragAndDropWidget("Tabs", 500, 100);
    cy.get('[data-cy="query-manager-toggle-button"]').click();
  });

  it("should verify all the exposed values on inspector", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();

    openNode("components");
    openAndVerifyNode("tabs1", exposedValues, verifyNodeData);
    verifyNodes(functions, verifyNodeData);
  });
});
