describe('Editor - Navigation Bar', () => {
    beforeEach(() => {
        //read data from fixtures
        cy.fixture('login-data').then(function (testdata) {
            cy.login(testdata.email, testdata.password);
        });
        cy.wait(1000);
        cy.createAppIfEmptyDashboard();
        cy.wait(2000);
        cy.get('.badge').contains('Edit').click();
        cy.get('title').should('have.text', 'ToolJet - Dashboard');
    });

    it('should show site header with nav items', () => {
        cy.get('.navbar').find('.navbar-nav').should('be.visible');
    });

    it('should show tooljet brand image and clicking on it should take user to dashboard', () => {
        cy.get('.navbar')
            .find('.navbar-brand-image')
            .should('be.visible')
            .click()
            .get('title')
            .should('have.text', 'ToolJet - Dashboard');
    });

    it('should hide query editor', () => {
        //check query pane is visible
        cy.get('.query-pane').should('be.visible');

        //click on Hide query editor button
        cy.get('.editor-buttons')
            .find('[data-tip="Hide query editor"] img')
            .click()
            .get('[data-tip="Show query editor"] img');

        //check the query editor pane should not be visible
        cy.get('.query-pane').find('.row.main-row').should('not.be.visible');
    });

    it('should resize canvas', () => {
        //default size should be 100%
        cy.get('.sidebar-zoom').should('have.text', '100 %');

        cy.get('.sidebar-zoom').click();

        //check minimize button
        var scale;
        var styleString = 'transform: scale(1);';
        for (var i = 100; i >= 60; i = i - 10) {
            cy.get('.sidebar-zoom').click();
            cy.get('div[class="card popover zoom-popover show"]')
                .find('tbody tr')
                .contains(i + '%')
                .click();
            scale = i / 100;
            styleString = 'transform: scale(' + scale + ');';
            cy.get('.canvas-container.align-items-center').should('have.attr', 'style', styleString);
        }
    });

    it('should switch from desktop layout to mobile view ', () => {
        //check canvas default(desktop view) dimensions
        cy.get('.real-canvas').should('have.css', 'width').and('eq', '1292px');

        cy.get('.real-canvas').should('have.css', 'height').and('eq', '2400px');

        //check default layout(Desktop view) button. it should be disabled
        cy.get('.layout-buttons').find('button:nth-child(1)').should('be.disabled');

        //mobile button should be enabled.
        cy.get('.layout-buttons').find('button:nth-child(2)').should('be.enabled').click();

        //clicking on layout button should change view to mobile canvas. check canvas dimensions
        cy.get('.real-canvas').should('have.css', 'width').and('eq', '450px');

        cy.get('.real-canvas').should('have.css', 'height').and('eq', '2400px');
    });

    it('should switch to dark theme', () => {
        cy.get('.main-wrapper');
        cy.get('div:nth-child(3) > svg:nth-child(1)').should('have.attr', 'color', '#808080').click();
        cy.get('div:nth-child(3) > svg:nth-child(1)').should('have.attr', 'color', '#fff').click();
    });

    it('should be able to share app', () => {
        //check share button
        cy.get('.navbar')
            .find('.navbar-nav')
            .find('.nav-item')
            .find('button[class="btn btn-sm"]')
            .should('have.text', 'Share')
            .and('be.visible')
            .click();

        //check clicking on share should open sharing dialog
        cy.get('.modal-content').find('.modal-header').find('.modal-title').should('have.text', 'Share');

        cy.get('.form-label').should('have.text', 'Get shareable link for this application');

        cy.get('.input-group').find('.btn.btn-secondary.btn-sm').should('have.text', 'Copy').click(); //check how to validate clipboard content
    });

    it('should deploy app', () => {
        cy.deployAppWithSingleVersion();
    });

    it('should launch app', () => {
        cy.get('.navbar-nav.flex-row.order-md-last')
            .find('a[target="_blank"]')
            .should('have.text', 'Launch')
            .invoke('removeAttr', 'target')
            .click();

        cy.url().should('include', '/applications');
    });
});
