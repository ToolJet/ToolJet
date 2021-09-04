import '@4tw/cypress-drag-drop';
describe('Editor- Test Button widget', () => {

    beforeEach(() => {

        cy.viewport(1536, 960);
        //read login data from fixtures
        cy.fixture('login-data').then(function (testdata) {
            cy.login(testdata.email, testdata.password)
        })
        cy.wait(1000)
        cy.get('body').then(($title => {
            //check you are not running tests on empty dashboard state
            if ($title.text().includes('You haven\'t created any apps yet.')) {
                cy.get('a.btn').eq(0).should('have.text', 'Create your first app')
                    .click()
                cy.go('back')
            }
            cy.wait(2000)
            cy.get('.badge').contains('Edit').click()
            cy.get('title').should('have.text', 'ToolJet - Dashboard')
        }))
    })

    it('should be able to drag and drop button to canvas', () => {
        cy.get('input[placeholder="Search…"]').type('button')

        cy.get('.draggable-box')
           .drag('.real-canvas',{force: true, position: 'topLeft' })
    });
})