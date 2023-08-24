import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText } from "Texts/common";
import * as common from "Support/utils/common";

export const contantsNameValidation = (value, error) => {
    cy.clearAndType(commonSelectors.nameInputField, value);
    cy.get(commonSelectors.nameErrorText).verifyVisibleElement("have.text", error)
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
}

export const AddNewconstants = (name, value) => {
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(commonSelectors.nameInputField, name);
    cy.clearAndType(commonSelectors.valueInputField, value);
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
}