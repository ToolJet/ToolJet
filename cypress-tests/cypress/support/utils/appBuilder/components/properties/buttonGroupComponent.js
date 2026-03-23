import { setColorPickerValue, setNumberInputValue } from "./common";

export const verifyButtonGroupLayout = (componentSelector, dropdownSelector, layoutOptions) => {
    layoutOptions.forEach(({ label, expectedFlexDir }) => {
        cy.get(dropdownSelector).click();
        cy.get('.dropdown-multiselect-widget-search-box').type(label);
        cy.get('.dropdown-multiselect-widget-custom-menu-list-body').contains(label).click();
        cy.get(componentSelector).find('.button-group-content')
            .should('have.css', 'flex-direction', expectedFlexDir);
    });
};

export const verifyButtonGroupAlignment = (componentSelector, dropdownSelector, alignmentOptions) => {
    alignmentOptions.forEach(({ label, expectedJustify }) => {
        cy.get(dropdownSelector).click();
        cy.get('.dropdown-multiselect-widget-search-box').type(label);
        cy.get('.dropdown-multiselect-widget-custom-menu-list-body').contains(label).click();
        cy.get(componentSelector).find('.button-group-content-wrapper')
            .should('have.attr', 'style')
            .and('include', 'justify-content: ' + expectedJustify);
    });
};

export const verifyLabelAlignment = (componentSelector, dropdownSelector, alignmentOptions) => {
    alignmentOptions.forEach(({ label, expectedFlexDir }) => {
        cy.get(dropdownSelector).click();
        cy.get('.dropdown-multiselect-widget-search-box').type(label);
        cy.get('.dropdown-multiselect-widget-custom-menu-list-body').contains(label).click();
        cy.get(componentSelector)
            .should('have.css', 'flex-direction', expectedFlexDir);
    });
};

export const verifySelectedButtonBgColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
            .should('have.css', 'background-color', expectedColor);
    });
};

export const verifySelectedButtonTextColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
            .should('have.css', 'color', expectedColor);
    });
};

export const verifyUnselectedButtonBgColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]')
            .should('have.css', 'background-color', expectedColor);
    });
};

export const verifyUnselectedButtonTextColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]')
            .should('have.css', 'color', expectedColor);
    });
};

export const verifyButtonBorderColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]')
            .should('have.css', 'border-color', expectedColor);
    });
};

export const verifyBoxShadowColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
            .should('have.css', 'box-shadow')
            .and('include', expectedColor);
    });
};

export const verifyLabelColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedColor }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).find('label p')
            .should('have.css', 'color', expectedColor);
    });
};

export const verifyBorderRadius = (componentSelector, inputSelector, radiusValues) => {
    radiusValues.forEach(({ input, expectedRadius }) => {
        setNumberInputValue(inputSelector, input);
        cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
            .should('have.css', 'border-radius', expectedRadius);
    });
};

export const verifyButtonSelection = (componentSelector) => {
    // Initially button-0 is selected (green bg)
    cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
        .then($btn => {
            const initialBg = $btn.css('background-color');
            // Click button-1 to select it
            cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]').click();
            // Button-1 should now have the selected bg color
            cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]')
                .should('have.css', 'background-color', initialBg);
            // Button-0 should now be unselected
            cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
                .should('not.have.css', 'background-color', initialBg);
        });
};

export const verifyMultipleSelect = (componentSelector, multiSelectToggle) => {
    // Get the selected button bg color (button-0 is selected by default)
    cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
        .invoke('css', 'background-color').then((selectedBg) => {
            // Enable multiple select
            cy.get(multiSelectToggle).click();
            // Click button-1 (unselected) to add to selection
            cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]').click();
            // Both button-0 and button-1 should now have the selected bg color
            cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
                .should('have.css', 'background-color', selectedBg);
            cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]')
                .should('have.css', 'background-color', selectedBg);
            // button-2 should still be unselected
            cy.get(componentSelector).find('[data-cy="buttongroup-button-2"]')
                .should('not.have.css', 'background-color', selectedBg);
            // Disable multiple select
            cy.get(multiSelectToggle).click();
        });
};

export const verifyClearSelectedOptions = (componentSelector, clearBtnSelector) => {
    // First select a button
    cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]').click();
    // Then clear selection via CSA
    cy.get(clearBtnSelector).click();
    // All buttons should now have same background (unselected)
    cy.get(componentSelector).find('[data-cy="buttongroup-button-0"]')
        .invoke('css', 'background-color').then((bg0) => {
            cy.get(componentSelector).find('[data-cy="buttongroup-button-1"]')
                .should('have.css', 'background-color', bg0);
            cy.get(componentSelector).find('[data-cy="buttongroup-button-2"]')
                .should('have.css', 'background-color', bg0);
        });
};
