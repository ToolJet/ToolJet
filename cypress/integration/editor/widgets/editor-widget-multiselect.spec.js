describe('Editor- Test multiselect widget', () => {
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

    it('should be able to drag and drop multiselect to canvas', () => {
        cy.get('input[placeholder="Search…"]').type('multiselect');

        cy.get('.draggable-box').contains('Multiselect').drag('.real-canvas', { force: true, position: 'topLeft' });
    });
});
