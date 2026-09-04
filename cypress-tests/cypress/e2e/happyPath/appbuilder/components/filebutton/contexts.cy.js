import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText } from "Texts/appBuilder/components/fileButton";
import {
  openEditorSidebar,
  waitForDropSettle,
} from "Support/utils/commonWidget";

// Contexts facet — the widget across device contexts.
// Covers both config.others items — source: fileButton.js:11-12
//   showOnDesktop:11 (default true) · showOnMobile:12 (default false)
// These gate whether the widget mounts per layout at all — a different code path from
// the `visibility` property in properties.cy.js.

// Desktop/mobile canvas switch in the editor header. A widget hidden by these toggles
// UNMOUNTS, so anything needing its Inspector must be done from the layout where it is
// still visible.
const switchLayout = (target) => {
  cy.get(`[data-cy="button-change-layout-to-${target}"]`).click();
  cy.waitForAutoSave();
};

describe(
  "File Button contexts",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  // The shared verifyLayout() helper walks a strict subset of this test, so it is not
  // also run here. This covers the DEFAULT state of both layouts and a round trip in
  // each direction, which verifyLayout does not.
  it("device context — show on desktop and show on mobile gate the widget per layout", () => {
    // Defaults: showOnDesktop true, showOnMobile false.
    cy.get(fileButtonSelector.widget(widget)).should("exist");

    switchLayout("mobile");
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");

    // Enable mobile from the DESKTOP layout: once hidden, the widget can't be
    // selected to reach its Inspector.
    switchLayout("desktop");
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Show on mobile")).click();
    cy.waitForAutoSave();

    switchLayout("mobile");
    cy.get(fileButtonSelector.widget(widget)).should("exist");

    switchLayout("desktop");
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Show on desktop")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");

    // Hidden on desktop but still mounted on mobile: the two flags are independent.
    switchLayout("mobile");
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    switchLayout("desktop");
  });
});
