import { fake } from "Fixtures/fake";
import { tableSelector } from "Selectors/table";

import {
  verifyMultipleComponentValuesFromInspector,
  verifyComponentValueFromInspector,
  openEditorSidebar,
  openAccordion,
  verifyBoxShadowCss,
  selectColourFromColourPicker,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";

describe("Editor- Global Settings", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("should verify global settings", () => {
    const data = {};
    data.backgroundColor = fake.randomRgba;
    data.appName = `${fake.companyName}-App`;
    cy.renameApp(data.appName);
    cy.get("[data-cy='left-sidebar-settings-button']").click();

    cy.get('[data-cy="label-global settings"]').verifyVisibleElement(
      "have.text",
      "Global settings"
    );
    cy.get(
      '[data-cy="label-hide-header-for-launched-apps"]'
    ).verifyVisibleElement("have.text", "Hide header for launched apps");
    cy.get('[data-cy="label-maintenance-mode"]').verifyVisibleElement(
      "have.text",
      "Maintenance mode"
    );
    cy.get('[data-cy="label-max-canvas-width"]').verifyVisibleElement(
      "have.text",
      "Max width of canvas"
    );
    cy.get('[data-cy="label-max-canvas-height"]').verifyVisibleElement(
      "have.text",
      "Max height of canvas"
    );
    cy.get('[data-cy="label-bg-canvas"]').verifyVisibleElement(
      "have.text",
      "Background color of canvas"
    );
    // cy.get('[data-cy="canvas-bg-colour-picker"]').click();
    selectColourFromColourPicker(
      "canvas-bg-color",
      data.backgroundColor,
      0,
      ".canvas-codehinter-container"
    );

    verifyWidgetColorCss(
      ".canvas-area",
      "background-color",
      data.backgroundColor,
      true
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.get(".navbar").should("be.visible");

    cy.go("back");
    cy.wait(5000);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    cy.get('[data-cy="toggle-hide-header-for-launched-apps"]').realClick();
    cy.wait(700);
    cy.forceClickOnCanvas();
    cy.wait(1000);
    cy.waitForAutoSave();
    cy.wait(1000);
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(5000);
    cy.notVisible(".navbar");
    cy.go("back");
    cy.wait(5000);

    cy.get("[data-cy='left-sidebar-settings-button']").click();
    cy.get('[data-cy="toggle-maintenance-mode"]').realClick();
    cy.get('[data-cy="modal-confirm-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Application is on maintenance."
    );
    cy.forceClickOnCanvas();
    cy.wait(500);
    cy.waitForAutoSave();
    //Fix this after the release. 2.9.0
    // cy.get('[data-cy="button-release"]').click();
    // cy.get('[data-cy="yes-button"]').click();
    // cy.get('[data-cy="editor-page-logo"]').click();
    // cy.get(`[data-cy="${data.appName.toLowerCase()}-card"]`)
    //   .realHover()
    //   .find('[data-cy="launch-button"]')
    //   .invoke("attr", "class")
    //   .should("contains", "disabled-btn");

    cy.wait(2000);
  });
});
