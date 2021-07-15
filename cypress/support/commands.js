Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="emailField"]').type(email);
  cy.get('[data-testid="passwordField"]').type(password);
  cy.get('[data-testid="loginButton"').click();
})



Cypress.Commands.add('checkToastMessage', (toastId, message) => {
  cy.get(`[id=${toastId}]`).should('contain', message);
});
