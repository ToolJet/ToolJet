import { fake } from "Fixtures/fake";
import { textInputText } from "Texts/textInput";
import { commonWidgetText, widgetValue, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import {
  verifyControlComponentAction,
  randomString,
} from "Support/utils/textInput";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  verifyComponentValueFromInspector,
  selectColourFromColourPicker,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  closeAccordions,
} from "Support/utils/commonWidget";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

import {
  selectQuery,
  deleteQuery,
  query,
  changeQueryToggles,
  renameQueryFromEditor,
  addInputOnQueryField,
} from "Support/utils/queries";

import {
  verifyCouldnotConnectWithAlert,
  resizeQueryPanel,
  verifypreview,
  addInput,
} from "Support/utils/dataSource";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";

describe("RunJS", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("50");
  });

  it("should verify basic runjs", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run JavaScript code");
    addInputOnQueryField("runjs", "return true");
    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("preview");
    verifypreview("raw", "true");
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    openNode("queries");
    openNode("runjs1");
    verifyValue("data", "Boolean", "true");
    verifyValue("rawData", "Boolean", "true");
  });

  it.only("should verify actions", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run JavaScript code");
    addInputOnQueryField(
      "runjs",
      `setTimeout(() => {
        actions.setVariable('var', 'test');
      actions.setPageVariable('pageVar', 'pageTest');
    }, [0]) `
    );
    query("run");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "1 entry ");
    openNode("variables", 0);

    verifyValue("var", "String", `"test"`);

    openNode("page");
    openNode("variables", 1);
    verifyValue("pageVar", "String", `"pageTest"`);

    addInputOnQueryField(
      "runjs",
      `setTimeout(() => {
          actions.unSetVariable('var');
        actions.unsetPageVariable('pageVar');
      }, [0]) `
    );
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "0 entry ");

    openNode("page");
    openNode("variables", 1);
    verifyNodeData("variables", "Object", "0 entry ", 1);
  });
});
