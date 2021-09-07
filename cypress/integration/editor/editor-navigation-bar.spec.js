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

    it('should hide left sidebar', () => {
        //check left sidebar visibility
        cy.get('.left-sidebar').should('be.visible');

        //click on hide left sidebar button
        cy.get('.editor-buttons')
            .find('[data-tip="Hide left sidebar"] img')
            .click()
            .get('[data-tip="Show left sidebar"] img');

        //check left sidebar should not be visible
        cy.get('.left-sidebar').should('not.be.visible');
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
        cy.get('.canvas-buttons').find('small').should('have.text', '100%');

        //check maximize button
        cy.get('.canvas-buttons')
            .find('button:nth-child(3)')
            .find('img[src="/assets/images/icons/zoom-in.svg"]')
            .should('be.visible');

        cy.get('.canvas-container.align-items-center').should('have.attr', 'style', 'transform: scale(1);');

        //check minimize button
        var scale;
        var styleString = 'transform: scale(1);';
        for (var i = 100; i >= 70; i = i - 10) {
            cy.get('.canvas-buttons')
                .find('button:nth-child(1)')
                .find('img[src="/assets/images/icons/zoom-out.svg"]')
                .should('be.visible')
                .click();
            scale = (i - 10) / 100;
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
        cy.get('.form-check').find('img').should('have.attr', 'src', '/assets/images/icons/day.svg').and('be.visible');

        cy.get('.navbar').find('.form-check-input').click();

        cy.get('.theme-dark');
        cy.get('.form-check').find('img').should('have.attr', 'src', '/assets/images/icons/night.svg').and('be.visible');
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
        cy.get('.navbar')
            .find('.navbar-nav')
            .find('.nav-item')
            .find('button[class="btn btn-primary btn-sm"]')
            .should('have.text', 'Deploy')
            .and('be.visible')
            .click();

        cy.get('.modal-title.h4').should('have.text', 'Versions and deployments').and('be.visible');

        cy.get('.btn.btn-primary.btn-sm.mx-2').contains('+ Version').click();

        cy.get('input[placeholder="version name"]').type('1.0');

        cy.get('button[class="btn btn-primary"]').should('have.text', 'Create').click();

        cy.get('table').contains('td', 'save').click().contains('td', 'deploy').click();
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
