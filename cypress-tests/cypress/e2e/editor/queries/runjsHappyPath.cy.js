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

describe("RunJS", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel();
  });

  it("should verify actions", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run JavaScript code");
    addInputOnQueryField("runjs", "return true");
    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("preview");
    verifypreview("raw", "true");
    query("run");
    resizeQueryPanel("50");
  });
});
