export const verifyExistance = (componentSelector, state = 'exist') => {
    cy.get(componentSelector).should(state);
}


export const genralProperties = (componentSelector, controllerSelector, state = '', className = '') => {
    cy.get(controllerSelector).click();
    if (state) cy.get(componentSelector).should(state);
    if (className) cy.get(componentSelector).find(`.${className}`).should("exist");
}