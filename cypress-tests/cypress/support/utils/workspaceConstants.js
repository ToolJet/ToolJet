import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import * as common from "Support/utils/common";

export const contantsNameValidation = (value, error) => {
    cy.get(commonSelectors.workspaceConstantNameInput).click();
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, value);
    cy.get(commonSelectors.nameErrorText).verifyVisibleElement(
        "have.text",
        error
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
};

export const AddNewconstants = (name, value, type = "global") => {
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, name);
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(commonSelectors.workspaceConstantValueInput, value);
    cy.get(workspaceConstantsSelectors.constantsType(type)).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
};

export const existingNameValidation = (
    constName,
    constValue,
    type = "Global"
) => {
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, constName);
    cy.get(workspaceConstantsSelectors.constantsType(type)).check();
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(commonSelectors.workspaceConstantValueInput, constValue);
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
    cy.get(commonSelectors.toastMessage)
        .as("toast")
        .should(
            "contain.text",
            workspaceConstantsText.constantsExisitToast("Global")
        );
};
