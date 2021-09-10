describe('Editor- Test map widget', () => {
    beforeEach(() => {
        //read login data from fixtures
        cy.fixture('login-data').then(function (testdata) {
            cy.login(testdata.email, testdata.password);
        });
        cy.wait(1000);
        cy.createAppIfEmptyDashboard();
        cy.wait(2000);
        cy.get('.badge').contains('Edit').click();
        cy.get('title').should('have.text', 'ToolJet - Dashboard');
    });

    it('should be able to drag and drop map to canvas', () => {
        cy.get('input[placeholder="Search…"]').type('map');

        cy.get('.draggable-box').contains('Map').drag('.real-canvas', { force: true, position: 'topLeft' });
    });
});
