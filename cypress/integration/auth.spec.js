describe('User login', () => {
  it('should take user to login page', () => {
    cy.visit('/login');
    cy.get('.card-title').should('have.text', 'Login to your account');
  });

  it('should redirect unauthenticated user to login page', () => {
    cy.visit('/');
    cy.location('pathname').should('equal', '/login');
  });

  it('should display invalid email or password error', () => {
    cy.login('fake_email', 'abcdefg');
    cy.checkToastMessage('toast-login-auth-error', 'Invalid email or password');
  });

  it('should take user to the forgot password page', () => {
    cy.visit('/forgot-password');
    cy.get('.card-title').should('have.text', 'Forgot Password');
  });

  it('should take user to the signup page', () => {
    cy.visit('/signup');
    cy.get('.card-title').should('have.text', 'Create a ToolJet account');
  });

  it('should sign in the user', () => {
    cy.visit('/login');
    cy.login('dev@tooljet.io', 'password');
    cy.location('pathname').should('equal', '/');
    cy.get('.page-title').should('have.text', 'All applications');
  });

  it('should display error if email is not found for "Forgot password"', () => {
    cy.visit('/forgot-password');
    cy.get('[data-testid="emailField"]').type('abc@def.com');
    cy.get('[data-testid="submitButton"').click();
    cy.checkToastMessage(
      'toast-forgot-password-email-error',
      'Email address is not associated with a ToolJet cloud account.'
    );
  });

  it('should send reset password confirmation code to email', () => {
    cy.intercept('POST', '/password/forgot').as('forgotPasswordConfirmationCode');

    cy.visit('/forgot-password');
    cy.get('[data-testid="emailField"]').type('dev@tooljet.io');
    cy.get('[data-testid="submitButton"').click();

    cy.wait('@forgotPasswordConfirmationCode').its('response.statusCode').should('eq', 200);
    cy.checkToastMessage(
      'toast-forgot-password-confirmation-code',
      "We've sent the confirmation code to your email address"
    );
  });
});
