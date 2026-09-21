// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// components.js
//   verifyWidgetText                 -                    → properties
//   addTextWidgetToVerifyValue       -                    → canvas
//   verifyContainerElements          -                    → properties
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/components: on-canvas **widget** render/verify helpers.
 * FOR AI: assert what a dropped widget renders (text/value) and drop a probe Text
 * widget to read a component's exposed value on the canvas. Widget-level, not the config panel.
 * NOT here: config Properties → properties.js · Styles → styles.js · exposed-value tree → inspectorTree.js.
 */
import { commonWidgetSelector } from "Selectors/common";
import { codeMirrorInputLabel } from "Texts/common";
import { openEditorSidebar } from "./properties";

/**
 * @tjBlock  properties
 * @tjUsage  verifyWidgetText('textinput1', 'Hello')
 * @tjDom    draggable-widget text content assertion
 */
export const verifyWidgetText = (widgetName, text) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
    "have.text",
    text
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  addTextWidgetToVerifyValue('components.textinput1.value')
 * @tjDom    canvas drag-drop Text widget → textcomponenttextinput CodeMirror
 */
export const addTextWidgetToVerifyValue = (customfunction) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("Text", 600, 80);
  openEditorSidebar("text1");
  // The Text widget's content field data-cy is `text-input-field` (the legacy
  // `textcomponenttextinput-input-field` no longer exists — verified via probe).
  cy.get('[data-cy="text-input-field"]').clearAndTypeOnCodeMirror(
    codeMirrorInputLabel(customfunction)
  );
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  properties
 * @tjUsage  verifyContainerElements()
 * @tjDom    widget-accordion-container + label-padding + togglr-button-default / none
 */
export const verifyContainerElements = () => {
  cy.get('[data-cy="widget-accordion-container"]').verifyVisibleElement(
    "have.text",
    "container"
  );
  cy.get('[data-cy="label-padding"]').verifyVisibleElement(
    "have.text",
    "Padding"
  );
  cy.get('[data-cy="togglr-button-default"]').verifyVisibleElement(
    "have.text",
    "Default"
  );
  cy.get('[data-cy="togglr-button-none"]').verifyVisibleElement(
    "have.text",
    "None"
  );
};
