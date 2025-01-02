import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import * as common from "Support/utils/common";

export const contantsNameValidation = (value, error) => {
    cy.clearAndType(commonSelectors.nameInputField, value);
    cy.get(commonSelectors.nameErrorText).verifyVisibleElement(
        "have.text",
        error
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
};

export const addNewconstants = (name, value, type = "global") => {
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(workspaceConstantsSelectors.nameInputFiled, name);
    cy.get(commonSelectors.valueInputField).click();
    cy.clearAndType(commonSelectors.valueInputField, value);
    cy.get(workspaceConstantsSelectors.constantsType(type)).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
};

export const existingNameValidation = (
    constName,
    constValue,
    type = "Global"
) => {
    cy.clearAndType(commonSelectors.nameInputField, constName);
    cy.get(workspaceConstantsSelectors.constantsType(type)).check();
    cy.get(commonSelectors.valueInputField).click();
    cy.clearAndType(commonSelectors.valueInputField, constValue);
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
    cy.get(commonSelectors.toastMessage)
        .as("toast")
        .should(
            "contain.text",
            workspaceConstantsText.constantsExisitToast("Global")
        );
};
