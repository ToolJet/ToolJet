// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// layout.js
//   switchLayout                     -                    → editor
//   verifyLayout                     toggle               → properties
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/layout: device **layout** helpers.
 * FOR AI: verifyLayout asserts a widget's Show-on-desktop / Show-on-mobile behaviour in one
 * call — the `others` device-visibility facet, not styling. switchLayout is the primitive
 * underneath it: switch the editor canvas between layouts and wait for the save, for specs
 * that need a different sequence than verifyLayout walks.
 * NOT here: dynamic/auto height → dynamicHeight.js (planned) · styles → styles.js.
 */
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "./properties";

// A map, not an interpolated selector, so a typo throws instead of landing on desktop.
const layoutButton = {
  mobile: commonWidgetSelector.changeLayoutToMobileButton,
  desktop: commonWidgetSelector.changeLayoutToDesktopButton,
};

/**
 * @tjBlock  editor
 * @tjUsage  switchLayout('mobile')
 * @tjDom    editor header change-layout-to-<mobile|desktop> button, then the autosave indicator
 */
export const switchLayout = (target) => {
  const button = layoutButton[target];
  if (!button) {
    throw new Error(`switchLayout: unknown layout "${target}" — expected "mobile" or "desktop"`);
  }
  cy.get(button).click();
  cy.waitForAutoSave();
};

/**
 * @tjType   toggle
 * @tjBlock  properties
 * @tjUsage  verifyLayout('textinput1')
 * @tjDom    Layout accordion → Show on Desktop / Show on Mobile toggles
 */
export const verifyLayout = (
  widgetName,
  layout = commonWidgetText.accordionLayout
) => {
  openEditorSidebar(widgetName);
  openAccordion(layout);
  verifyAndModifyToggleFx(
    commonWidgetText.parameterShowOnDesktop,
    commonWidgetText.codeMirrorLabelTrue
  );
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("not.exist");

  verifyAndModifyToggleFx(
    commonWidgetText.parameterShowOnMobile,
    commonWidgetText.codeMirrorLabelFalse
  );
  cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("exist");
};
