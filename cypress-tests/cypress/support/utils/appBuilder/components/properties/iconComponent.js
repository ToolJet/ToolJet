import { setColorPickerValue } from "./common";

export const verifyIconColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).first().find('svg')
            .should('have.css', 'color', expectedColor);
    });
}

export const verifyIconAlignment = (componentSelector, dropdownSelector, alignmentOptions) => {
    alignmentOptions.forEach(({ label, expectedAlign }) => {
        cy.get(dropdownSelector).click();
        cy.get('[class*="option"]').contains(label).click();
        cy.get(componentSelector).first()
            .should('have.css', 'text-align', expectedAlign);
    });
}

export const verifyIconOnClick = (componentSelector, toastSelector, expectedMessage) => {
    cy.get('body').click(0, 0);
    cy.get(toastSelector).should('not.exist');
    cy.get(componentSelector).first().realClick();
    cy.get('body').click(0, 0);
    cy.verifyToastMessage(toastSelector, expectedMessage);
}

export const verifyIconOnHover = (componentSelector, toastSelector, expectedMessage) => {
    cy.get(componentSelector).first().realHover();
    cy.verifyToastMessage(toastSelector, expectedMessage);
}
