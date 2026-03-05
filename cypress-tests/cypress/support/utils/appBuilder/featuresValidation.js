export const verifyExistance = (componentSelector, state = 'exist') => {
    cy.get(componentSelector).should(state);
}


export const genralProperties = (componentSelector, controllerSelector, state = '', className = '') => {
    cy.get(controllerSelector).click();
    if (state) cy.get(componentSelector).should(state);
    if (className) cy.get(componentSelector).find(`.${className}`).should("exist");
}

export const verifyImageFeature = (componentSelector, featureConfig) => {
    const { toggleSelector, action, assertion, resetAfter } = featureConfig;

    if (toggleSelector) {
        cy.get(toggleSelector).click();
    }

    if (action) {
        if (action.preClick) {
            cy.get(componentSelector).first().click();
        }
        if (action.hover) {
            cy.get(componentSelector).first().trigger('mouseover');
        }
        const clickMethod = action.dblclick ? 'dblclick' : 'click';
        if (action.coordinates) {
            cy.get(componentSelector).first()[clickMethod](action.coordinates.x, action.coordinates.y);
        } else {
            const actionTarget = action.target
                ? cy.get(componentSelector).first().find(action.target)
                : cy.get(componentSelector).first();
            actionTarget[clickMethod](action.options || {});
        }
    }

    if (assertion) {
        const assertTarget = assertion.target
            ? cy.get(componentSelector).first().find(assertion.target)
            : cy.get(componentSelector).first();

        if (assertion.style) {
            assertTarget
                .should('have.attr', 'style')
                .and('include', assertion.style);
        }

        if (assertion.state) {
            assertTarget.should(assertion.state);
        }

        if (assertion.ariaLabel) {
            assertTarget.should('have.attr', 'aria-label', assertion.ariaLabel);
        }
    }

    if (resetAfter && toggleSelector) {
        cy.get(toggleSelector).click();
    }
}