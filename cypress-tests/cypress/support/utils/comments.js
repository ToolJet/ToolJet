export const addComments = () => {
    cy.get('[data-cy="left-sidebar-comments-button"]').click();
    cy.get('[data-cy=real-canvas]').click();
    cy.get('.comment').click();
    cy.get('textarea').type("name");
    cy.get('.col-2 > .btn').click();
};
