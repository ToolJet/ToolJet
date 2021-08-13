describe('Editor- Add "PostgreSQL" datasource', () => {

    beforeEach(() => {

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

    it('should add First data source successfully', () => {

        cy.get('.left-sidebar')
            .find('.datasources-container.w-100.mt-3')
            .find('.p-1.text-muted')
            .should('have.text', 'DATASOURCES')
            .and('be.visible')

        cy.get('.table-responsive')
            .find('.p-2')
            .should('include.text', "You haven't added data sources yet. ")

        cy.get('center[class="p-2 text-muted"]')
            .find('button[class="btn btn-sm btn-outline-azure mt-3"]')
            .should('have.text', 'add datasource')
            .click()

        cy.addPostgresDataSource()
    });

    it('should add data source from "Add new datasource button', () => {

        cy.get('.left-sidebar')
            .find('.datasources-container.w-100.mt-3')
            .find('.p-1.text-muted')
            .should('have.text', 'DATASOURCES')
            .and('be.visible')

        cy.get('[data-tip="Add new datasource"]').click()

        cy.addPostgresDataSource()
    });
})