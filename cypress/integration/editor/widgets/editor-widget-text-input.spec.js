import '@4tw/cypress-drag-drop';
describe('Editor- Test text-input widget', () => {
    beforeEach(() => {
        cy.viewport(1536, 960);
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

    it('should be able to drag and drop text-input to canvas', () => {
        cy.get('input[placeholder="Search…"]').type('text input');

        cy.get('.draggable-box').contains('Text Input').drag('.real-canvas', { force: true, position: 'topLeft' });
    });
});
