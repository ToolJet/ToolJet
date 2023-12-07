import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import { verifyControlComponentAction } from "Support/utils/button";

import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  verifyComponentFromInspector,
  verifyAndModifyStylePickerFx,
  verifyWidgetColorCss,
  selectColourFromColourPicker,
  verifyLoaderColor,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
} from "Support/utils/commonWidget";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

describe("Editor- Test Button widget", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`visualEditor-App1`);
    cy.openApp();
    // cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 500);
  });

  it("should verify position of component after dragging", () => {
    const data = {};
    data.widgetName = buttonText.defaultWidgetName;
    cy.percySnapshot("Editor");
    cy.dragAndDropWidget("table", 300, 100);
    cy.wait(500);
    cy.percySnapshot("Table");

    cy.apiDeleteApp(data.appName);
  });
});
