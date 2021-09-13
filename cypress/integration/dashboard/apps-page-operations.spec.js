describe('Dashboard operations on Apps', () => {
    const currentDate = new Date();
    const folderName = 'folder ' + currentDate.toJSON();

    beforeEach(() => {
        //read data from fixtures
        cy.fixture('login-data').then(function (testdata) {
            cy.login(testdata.email, testdata.password);
        });
        cy.wait(1000);
        cy.createAppIfEmptyDashboard();
    });

    it('should open app in app builder using Edit button', () => {
        cy.wait(2000);
        cy.get('.badge').contains('Edit').click();
        cy.get('title').should('have.text', 'ToolJet - Dashboard');
    });

    it('should show Tooltip "App does not have a deployed version" on Launch button', () => {
        cy.get('tbody a:nth-child(2)').find('span[class="badge bg-light-grey mx-2"]')
            .trigger('mouseover')
            .should('have.attr', 'aria-describedby', 'button-tooltip')
        cy.get('div[id="button-tooltip"]').should('have.text', 'App does not have a deployed version')
    });

    it('should launch app and show Tooltip -"Open in app viewer", when App is deployed with a single version', () => {
        //Create and save App with version 1.0
        cy.get('.badge').contains('Edit').click();
        cy.deployAppWithSingleVersion();

        //Go back to dashboard
        cy.go('back');

        //Check Tooltip text
        cy.get('tbody a:nth-child(2)').find('span[class="badge bg-light-grey mx-2"]')
            .trigger('mouseover')
            .should('have.attr', 'aria-describedby', 'button-tooltip')
        cy.get('div[id="button-tooltip"]').should('have.text', 'Open in app viewer');

        //Click to launch app
        cy.get('tbody a:nth-child(2)').find('span[class="badge bg-light-grey mx-2"]').click();
    });

    it('should be able to add app to a folder', () => {
        //Pre-requisite: Create folder
        cy.get('a[class="mx-3"]').contains('+ Folder').click();
        cy.get('input[placeholder="folder name"]').should('have.attr', 'placeholder', 'folder name').type(folderName);
        cy.get('.btn').contains('Save').click();

        //Steps to select the folder name and add app to folder.
        cy.get('span[role="button"]').click();
        cy.get('span[role="button"]').contains('Add to folder ').click();
        cy.get('input[placeholder="Select folder"]').type(folderName);
        cy.get('[data-index="0"] > .select-search__option').click();
    });

    it('should be able to delete app', () => {
        cy.get('td img.svg-icon').eq(0).click();
        cy.get('[role="button"]').contains('Delete app').click();
        cy.get('.modal-body').should(
            'have.text',
            'The app and the associated data will be permanently deleted, do you want to continue?'
        );
        cy.get('.btn').contains('Yes').click();
        cy.get('.Toastify__toast-body').should('have.text', 'App deleted successfully.')
    });
});
