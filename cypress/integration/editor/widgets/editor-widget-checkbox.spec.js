describe('Editor- Test checkbox widget', () => {
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

    it('should drag and drop checkbox to canvas', () => {
        cy.get('input[placeholder="Search…"]').type('checkbox');

        cy.get('.draggable-box').drag('.real-canvas', { force: true, position: 'topLeft' });
    });

    it('should be able to set checkbox value to true', () => {
        cy.get('input[placeholder="Search…"]').type('checkbox');

        cy.get('.draggable-box').drag('.real-canvas', { force: true, position: 'topLeft' });

        cy.get('.form-check-label').click();
    });
});
