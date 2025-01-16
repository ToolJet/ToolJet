import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
} from "Support/utils/commonWidget";

export const addAndVerifyOnSingleLine = (data, property = '', componentName = 'text1',) => {
    cy.intercept("PUT", "/api/v2/apps/**/*").as("editorAPI");
    cy.get(
        commonWidgetSelector.parameterInputField(property)
    ).clearAndTypeOnCodeMirror(data)
    cy.forceClickOnCanvas()
    cy.wait("@editorAPI");
    openEditorSidebar(componentName)
    cy.get(
        commonWidgetSelector.parameterInputField(property)
    )
        .realClick()
        .find(".cm-line")
        .invoke("text").should("equals", data)
};