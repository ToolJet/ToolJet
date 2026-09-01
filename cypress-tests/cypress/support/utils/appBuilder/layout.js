// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// layout.js
//   verifyLayout                     toggle               → properties
// └──────────────────────────────────────────────────────────────────┘
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "./properties";

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
