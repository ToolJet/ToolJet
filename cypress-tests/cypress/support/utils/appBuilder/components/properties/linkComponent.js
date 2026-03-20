import { setColorPickerValue, selectDropdownOption, setNumberInputValue } from "./common";

export const verifyLinkAlignment = (componentSelector, dropdownSelector, alignmentOptions) => {
    alignmentOptions.forEach(({ label, expectedAlign }) => {
        selectDropdownOption(dropdownSelector, label);
        cy.get(componentSelector).find('a span.d-flex')
            .should('have.css', 'justify-content', expectedAlign);
    });
};

export const verifyLinkFontSize = (componentSelector, inputSelector, sizeOptions) => {
    sizeOptions.forEach(({ input, expectedSize }) => {
        setNumberInputValue(inputSelector, input);
        cy.get(componentSelector).find('a span.d-flex')
            .should('have.css', 'font-size', expectedSize);
    });
};

export const verifyLinkBoxShadowColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector)
            .should('have.css', 'box-shadow')
            .and('include', expectedColor);
    });
};

export const verifyLinkTargetType = (componentSelector, dropdownSelector, options) => {
    options.forEach(({ label, expectedTarget }) => {
        selectDropdownOption(dropdownSelector, label);
        if (expectedTarget) {
            cy.get(componentSelector).find('a')
                .should('have.attr', 'target', expectedTarget);
        } else {
            cy.get(componentSelector).find('a')
                .should('not.have.attr', 'target', '_blank');
        }
    });
};

export const verifyLinkUnderline = (componentSelector, dropdownSelector, options) => {
    options.forEach(({ label, expectedClass }) => {
        selectDropdownOption(dropdownSelector, label);
        cy.get(componentSelector)
            .should('have.class', expectedClass);
    });
};


export const verifyLinkIcon = (componentSelector, iconInput, iconName) => {
    cy.get(iconInput).click().clear().type(`${iconName}{enter}`);
    cy.get(componentSelector).find('svg').should('exist');
    cy.get(componentSelector).find('svg')
        .should('have.css', 'margin-right', '4px');
};

export const verifyLinkCSASetTarget = (csaButtonSelector, componentSelector, expectedHref) => {
    cy.get(csaButtonSelector).click();
    cy.get(componentSelector).find('a')
        .should('have.attr', 'href', expectedHref);
};

export const verifyLinkCSASetText = (csaButtonSelector, componentSelector, expectedText) => {
    cy.get(csaButtonSelector).click();
    cy.get(componentSelector).find('.link-text')
        .should('have.text', expectedText);
};
