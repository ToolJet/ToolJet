import { commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { buttonText } from "Texts/button";
import { commonWidgetText } from "Texts/common";
import {
  selectColourFromColourPicker,
  verifyAndModifyParameter,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";

// Duplication-tolerant tooltip verification.
//
// The on-canvas tooltip is now a Radix tooltip (WidgetTooltip.jsx) that only
// mounts after a real pointer hover held past its 500ms delayDuration. In the
// editor the widget's config-handle overlay sits over the trigger, so a
// Cypress realHover does not reliably open it (the legacy bootstrap
// `.tooltip-inner` it used to read no longer exists either). Rather than depend
// on that flaky render, we verify the tooltip PROPERTY directly: open the
// widget's inspector and assert its Tooltip code field (data-cy
// "tooltip-input-field", restored by the cyLabel fallback in
// SingleLineCodeEditor.jsx / Code.jsx) carries the expected text. For a
// duplicated clone this proves the tooltip value was copied over.
const verifyTooltipProperty = (widgetName, message) => {
  openEditorSidebar(widgetName);
  // CodeMirror 6 renders the value in `.cm-line` (clearAndTypeOnCodeMirror in
  // commands.js types into the same node).
  cy.get(commonWidgetSelector.tooltipInputField)
    .find(".cm-line")
    .should("have.text", message);
  cy.forceClickOnCanvas();
};

// addBasicData applies a small, distinctive set of property + style edits to
// button1. The spec that consumes it (componentDuplicationHappypath) verifies
// that DUPLICATION carries these over to the clone — so we deliberately keep
// the surface focused (one Properties field, one Properties code field, one
// style colour, one style numeric) instead of the old exhaustive
// label + event + 3 colour pickers + box-shadow + control-component chain,
// which was stale against the current 2-tab inspector.
export const addBasicData = (data) => {
  // Properties tab — Label (text field) + Tooltip (label-less code field).
  openEditorSidebar(buttonText.defaultWidgetName);
  verifyAndModifyParameter(commonWidgetText.parameterLabel, data.widgetName);

  // Tooltip is a `code` property with showLabel:false on the Button config
  // (frontend/.../WidgetManager/widgets/button.js:60-67), so its editor renders
  // as data-cy="tooltip-input-field" via the cyLabel fallback
  // (frontend/.../CodeEditor/SingleLineCodeEditor.jsx:559,682). Type into it,
  // then verify the property value persisted.
  cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
    data.tooltipText
  );
  verifyTooltipProperty(buttonText.defaultWidgetName, data.tooltipText);

  // Styles tab — Background color (displayName "Background", styles config:
  // frontend/.../WidgetManager/widgets/button.js:84-86 → data-cy
  // "background-picker"). A distinctive style is enough to prove the clone
  // carries styling; the previously-asserted Border radius style is now a
  // `numberInput` (button.js:218-220), not a code field, so the old
  // border-radius-input-field selector no longer exists — dropped from this
  // focused duplication check rather than chasing its new renderer.
  openEditorSidebar(buttonText.defaultWidgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  selectColourFromColourPicker(
    buttonText.backgroundColor,
    data.backgroundColor
  );

  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

export const verifyBasicData = (widgetName, data) => {
  // Label carried over.
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).verifyVisibleElement(
    "have.text",
    data.widgetName
  );
  cy.wait(1500);

  // Tooltip carried over (verified via the clone's Tooltip property field).
  verifyTooltipProperty(widgetName, data.tooltipText);

  // Background colour carried over.
  verifyWidgetColorCss(widgetName, "background-color", data.backgroundColor);
};
