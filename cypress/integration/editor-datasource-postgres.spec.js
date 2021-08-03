describe('Editor- Add "PostgreSQL" datasource', () => {

    beforeEach(() => {

        //read data from fixtures
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

    it('should add first postgres data source successfully', () => {
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

        cy.get('div[class="modal-title h4"] span[class="text-muted"]')
            .should('have.text', 'Add new datasource')
            .and('be.visible')

        cy.get('.modal-body')
            .find('div[class="row row-deck"]')
            .find('h4[class="text-muted mb-2"]')
            .should('have.text', 'DATABASES')

        cy.get('.modal-body')
            .find('.col-md-2')
            .contains('PostgreSQL')
            .and('be.visible')
            .click()

        //add your postgres username and password in file: '/fixtures/datasources.json' 
        cy.fixture('datasources').then(function (dbData) {

            cy.get('.row.mt-3')
                .find('.col-md-4')
                .find('.form-label')
                .contains('Database Name')

            cy.get('div[class="row mt-3"] div:nth-child(1)')
                .find('.form-control')
                .should('have.attr', 'type', 'text')
                .type(dbData.postgresDBName)

            cy.get('.row.mt-3')
                .find('.col-md-4')
                .find('.form-label')
                .contains('Username')

            cy.get('div[class="row mt-3"] div:nth-child(2)')
                .find('.form-control')
                .should('have.attr', 'type', 'text')
                .type(dbData.username)

            cy.get('.row.mt-3')
                .find('.col-md-4')
                .find('.form-label')
                .contains('Password')

            cy.get('div[class="row mt-3"] div:nth-child(3)')
                .find('.form-control')
                .should('have.attr', 'type', 'password')
                .type(dbData.password)

            cy.get('button[class="m-2 btn btn-success"]')
                .should('have.text', 'Test Connection')
                .click()

            cy.get('.badge')
                .should('have.text', 'connection verified')

            cy.get('div[class="col-auto"] button[type="button"]')
                .should('have.text', 'Save')
                .click()
        })
    });
})
