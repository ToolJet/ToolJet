import { selectDropdownOption, setColorPickerValue, setNumberInputValue, genralProperties } from "./common";

export const verifyZoomFeature = (componentSelector, zoomToggle) => {
    cy.get(zoomToggle).click();
    cy.get(componentSelector).find('.react-transform-component').dblclick();
    cy.get(componentSelector).find('.react-transform-component')
        .should('have.attr', 'style')
        .and('include', 'scale');
    cy.get(zoomToggle).click();
}

export const verifyRotateFeature = (componentSelector, rotateToggle) => {
    cy.get(rotateToggle).click();
    cy.get(componentSelector).first().click();
    cy.get(componentSelector).first().realHover();
    cy.get(componentSelector).find('.img-control-btn').click();
    cy.get(componentSelector).find('img')
        .should('have.attr', 'style')
        .and('include', 'rotate');
    cy.get(rotateToggle).click();
}

export const verifyBorderType = (componentSelector, dropdownSelector, borderOptions) => {
    borderOptions.forEach(({ label, css }) => {
        selectDropdownOption(dropdownSelector, label);
        const imgEl = cy.get(componentSelector).first().find('img');
        Object.entries(css).forEach(([prop, value]) => {
            imgEl.should('have.css', prop, value);
        });
    });
}

export const verifyImageLabel = (componentSelector, inputSelector, labelValues) => {
    labelValues.forEach(({ input, styles }) => {
        setNumberInputValue(inputSelector, input);
        styles.forEach((style) => {
            cy.get(componentSelector).first().find('img')
                .should('have.attr', 'style')
                .and('include', style);
        });
    });
}

export const verifyImageBackgroundColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedBg }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).first().find('img')
            .should('have.css', 'background-color', expectedBg);
    });
}

export const verifyImageFit = (componentSelector, dropdownSelector, fitOptions) => {
    fitOptions.forEach(({ label, value }) => {
        selectDropdownOption(dropdownSelector, label);
        cy.get(componentSelector)
            .first()
            .find('img')
            .should('have.css', 'object-fit', value);
    });
}

export const verifyDisabilityToggle = (componentSelector, disableToggle, jsSetBtn, jsResetBtn) => {
    const disabled = { attr: 'data-disabled', attrValue: 'true' };
    const enabled = { attr: 'data-disabled', attrValue: 'false' };

    cy.get(componentSelector).should('have.attr', 'data-disabled', 'false');

    genralProperties(componentSelector, disableToggle, disabled);
    genralProperties(componentSelector, jsResetBtn, enabled);
    genralProperties(componentSelector, jsSetBtn, disabled);
    genralProperties(componentSelector, disableToggle, enabled);
}

export const verifyImageFitAndBorderType = (componentSelector, fitDropdown, borderDropdown, fitOptions, borderOptions) => {
    fitOptions.forEach(({ label: fitLabel, value: fitValue }) => {
        selectDropdownOption(fitDropdown, fitLabel);
        borderOptions.forEach(({ label: borderLabel, css: borderCss }) => {
            selectDropdownOption(borderDropdown, borderLabel);
            const imgEl = cy.get(componentSelector).first().find('img');
            imgEl.should('have.css', 'object-fit', fitValue);
            Object.entries(borderCss).forEach(([prop, value]) => {
                imgEl.should('have.css', prop, value);
            });
        });
    });
}
