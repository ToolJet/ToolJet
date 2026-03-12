export const verifyExistance = (componentSelector, state = 'exist') => {
    cy.get(componentSelector).should(state);
}


export const genralProperties = (componentSelector, controllerSelector, options = {}) => {
    const { state, stateValue, className, classNameState = 'exist', target, attr, attrValue, attrState = 'have.attr' } = options;

    cy.get(controllerSelector).click();

    const el = target
        ? cy.get(componentSelector).find(target)
        : cy.get(componentSelector);

    if (state && stateValue) el.should(state, stateValue);
    else if (state) el.should(state);
    if (className) cy.get(componentSelector).find(`.${className}`).should(classNameState);
    if (attr && attrValue !== undefined) el.should(attrState, attr, attrValue);
    else if (attr) el.should(attrState, attr);
}

export const selectDropdownOption = (dropdownSelector, label) => {
    cy.get(dropdownSelector).click();
    cy.get('.dropdown-multiselect-widget-search-box').type(label);
    cy.get('.dropdown-multiselect-widget-custom-menu-list-body').contains(label).click();
}

export const setColorPickerValue = (colorPickerSelector, hex) => {
    cy.get(colorPickerSelector).first().click();
    cy.get('.sketch-picker input').first().clear().type(`${hex}{enter}`);
    cy.get('body').click(0, 0);
}

export const setNumberInputValue = (inputSelector, value) => {
    cy.get(inputSelector).click().type(`{selectall}${value}{enter}`);
}