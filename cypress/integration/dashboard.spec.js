describe('Dashboard', () => {
  // we can use these values to log in
  const email = 'dev@tooljet.io';
  const password = 'password';

  beforeEach(() => {
    cy.login(email, password);
  })

  it('site header is visible with nav items', () => {
    cy.get('.navbar')
      .find('.navbar-nav')
      .should('be.visible');
  });

  it('Users tab should navigate to Users page', () => {
    cy.get('.navbar')
      .find('.navbar-nav')
      .find('li').not('.active')
      .click();
    cy.location('pathname').should('equal', '/users');
    cy.get('.page-title').should('have.text', 'Users & Permissions');
    cy.get('[data-testid="usersTable"]').should('be.visible');
  })

  it('Apps tab should navigate to Apps page', () => {
    cy.get('.navbar')
      .find('.navbar-nav')
      .find('li.active')
      .click();
    cy.location('pathname').should('equal', '/');
    cy.get('.page-title').should('have.text', 'All applications');
    cy.get('[data-testid="appsTable"]').should('be.visible');
  })

  it('should show User avatar and logout the user when user clicks logout', () => {
    cy.get('[data-testid="userAvatarHeader"]').should('be.visible');
    // TODO - Add functionality to detect when user hovers over the avatar,
    // Issues with hover functionality and hide/show of dom elements
  })
  
  it('Application folders list is visible', () => {
    cy.get('[data-testid="applicationFoldersList"]')
      .should('be.visible');
  });

  it('Count bubble for "All applications should equal number of rows in table', () => {
    cy.get('[data-testid="allApplicationsCount"]').then(($countBubble) => {
      cy.get('[data-testid="appsTable"]')
        .wait(500)
        .find("tr")
        .then((row) => {
          expect(Number($countBubble.text())).to.equal(row.length)
        });
    });
  });
})
