describe('Editor- Add "PostgreSQL" datasource', () => {
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

    it.only('should add First data source successfully', () => {
        //test database icon
        cy.get('.left-sidebar')
            .find('.svg-icon[src="/assets/images/icons/editor/left-sidebar/database.svg"]')
            .should('be.visible')
            .click()

        cy.get('.table-responsive')
            .find('.p-2')
            .should('have.text', "You haven't added any datasources yet. ")

        cy.get('div[class="table-responsive"] button[class="btn btn-sm btn-outline-azure mt-3"]')
            .should('have.text', 'Add datasource')
            .click();

        //create database    
        cy.addPostgresDataSource();

        //verify if you can see postgres database in the list now.
        cy.get('.left-sidebar')
            .find('.svg-icon[src="/assets/images/icons/editor/left-sidebar/database.svg"]')
            .should('be.visible')
            .click()

        cy.get('.table-responsive')
            .find('tr td')
            .contains('PostgreSQL')
    });
});