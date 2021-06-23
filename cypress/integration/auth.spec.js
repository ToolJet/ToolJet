describe('User login', () => {
  it('should take user to login page', () => {
    cy.visit('/login');
    cy.get('.card-title')
      .should('have.text', 'Login to your account');
  });

  it('should redirect unauthenticated user to login page', () => {
    cy.visit('/');
    cy.location('pathname').should('equal', '/login');
  });

  it('should display invalid email or password error',  () => {
    cy.login('fake_email', 'abcdefg');
    cy.checkToastMessage('toast-login-auth-error', 'Invalid email or password')
  });

  it('should take user to the forgot password page', () => {
    cy.visit('/forgot-password');
    cy.get('.card-title')
      .should('have.text', 'Forgot Password');
  })

  it('should take user to the signup page', () => {
    cy.visit('/signup');
    cy.get('.card-title')
      .should('have.text', 'Create a ToolJet account');
  })

  it('should sign in the user', () => {
    cy.visit('/login');
    cy.login('dev@tooljet.io', 'password');
    cy.location('pathname').should('equal', '/');
    cy.get('.page-title')
      .should('have.text', 'All applications');
  })
})