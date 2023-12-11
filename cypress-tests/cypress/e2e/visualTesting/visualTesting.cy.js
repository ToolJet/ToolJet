import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import { verifyControlComponentAction } from "Support/utils/button";
import { resizeQueryPanel } from "Support/utils/dataSource";

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
    cy.apiCreateApp(`visualEditor-App12`);
    cy.openApp();
    cy.wait(500);
    // cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 500);
  });

  it("should verify position of component after dragging", () => {
    const data = {};
    data.widgetName = buttonText.defaultWidgetName;
    cy.percySnapshot("Editor lite mode");
    cy.get(
      '[class="unstyled-button dark-theme-toggle-btn  sidebar-svg-icon  left-sidebar-item "]'
    ).click();
    cy.percySnapshot("Editor dark mode");

    cy.dragAndDropWidget("table", 300, 100);
    cy.wait(500);
    cy.percySnapshot("Table dark mode");
    cy.get(
      '[class="unstyled-button dark-theme-toggle-btn  sidebar-svg-icon  left-sidebar-item "]'
    ).click();
    cy.percySnapshot("Table lite mode");

    cy.get('[data-cy="left-sidebar-page-button"]').click();
    cy.wait(500);
    cy.percySnapshot("Page menu lite mode");

    cy.get(
      '[class="unstyled-button dark-theme-toggle-btn  sidebar-svg-icon  left-sidebar-item "]'
    ).click();
    cy.get('[data-cy="left-sidebar-page-button"]').click();
    cy.wait(500);
    cy.percySnapshot("Page menu dark mode");

    // cy.get(
    //   '[class="unstyled-button dark-theme-toggle-btn  sidebar-svg-icon  left-sidebar-item "]'
    // ).click();
    cy.get('[data-cy="left-sidebar-settings-button"]').click();
    cy.wait(500);
    cy.percySnapshot("Global settings dark mode");

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get('[data-cy="ds-rest api"]').click();
    resizeQueryPanel(100);
    cy.percySnapshot("RestApi dark mode");

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get('[data-cy="ds-run javascript code"]').click();
    cy.percySnapshot("RunJs dark mode");

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get('[data-cy="ds-run python code"]').click();
    cy.percySnapshot("RunPy dark mode");

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get('[data-cy="ds-tooljet database"]').click();
    cy.percySnapshot("TJDB dark mode");

    cy.apiDeleteApp(data.appName);
  });
});
