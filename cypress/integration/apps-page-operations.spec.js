describe('Dashboard operations on Apps', () => {

    const currentDate = new Date();
    const folderName= 'folder '+ currentDate.toJSON();
    
    beforeEach(() => {
        //read data from fixtures
        cy.fixture('login-data').then(function (testdata) {
            cy.login(testdata.email,testdata.password) 
        }) 
        
        cy.wait(1000)
        cy.get('body').then(($title=>
        {
            //check if dashboard is in empty state
            if($title.text().includes('You haven\'t created any apps yet.'))
            {
                cy.get('a.btn').eq(0).should('have.text','Create your first app')
                .click()
                cy.go('back')
            }
        }))    
    })

    it('should open app in app builder using Edit button', () => {
        
        cy.wait(2000)
        cy.get('.badge').contains('Edit').click()
        cy.get('title').should('have.text','ToolJet - Dashboard')
    });
      
    it('should open app in app viewer using Launch button ', () => {
       
        cy.get('a[target="_blank"]').invoke("removeAttr","target").click()
        cy.url().should('include','/applications')
        
    });
    
    it('should be able to add app to a folder', () => {
        
        //Pre-requisite: Create folder
        cy.get('a[class="mx-3"]').contains('+ Folder').click()
        cy.get('input[placeholder="folder name"]').should('have.attr','placeholder','folder name').type(folderName)
        cy.get('.btn').contains('Save').click() 

        //Steps to select the folder name and add app to folder. 
        cy.get('span[role="button"]').click()
        cy.get('span[role="button"]').contains('Add to folder ').click()
        cy.get('input[placeholder="Select folder"]').type(folderName)
        cy.get('[data-index="0"] > .select-search__option').click()
        
    });

    it('should be able to delete app', () => {
        cy.get('td img.svg-icon').eq(0).click()
        cy.get('[role="button"]').contains('Delete app').click()
        cy.get('.modal-body').should('have.text','The app and the associated data will be permanently deleted, do you want to continue?')
        cy.get('.btn').contains('Yes').click()

    });

})