// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// codehinter.js
//   addAndVerifyOnSingleLine         code                 → common
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/codehinter: CodeMirror (fx / code-editor) input helpers.
 * FOR AI: type into a component's single-line CodeMirror fx field and confirm the
 * value round-trips after a canvas commit + sidebar re-open. Targets
 * commonWidgetSelector.parameterInputField(property) `.cm-line` text.
 * NOT here: property/toggle setters → properties.js · style fx → styles.js.
 */
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
} from "Support/utils/commonWidget";

/**
 * @tjType   code
 * @tjBlock  common
 * @tjUsage  addAndVerifyOnSingleLine('Hello', 'text', 'text1')
 * @tjDom    parameterInputField(property) CodeMirror → asserts .cm-line text equals input
 */
export const addAndVerifyOnSingleLine = (data, property = '', componentName = 'text1',) => {
    cy.intercept("PUT", "/api/v2/apps/**/*").as("editorAPI");
    cy.get(
        commonWidgetSelector.parameterInputField(property)
    ).clearAndTypeOnCodeMirror(data)
    cy.forceClickOnCanvas()
    openEditorSidebar(componentName)
    cy.get(
        commonWidgetSelector.parameterInputField(property)
    )
        .realClick()
        .find(".cm-line")
        .invoke("text").should("equals", data)
};