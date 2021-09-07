describe('Empty state of dashboard', () => {
  
      beforeEach(() => {
        //read data from fixtures
        cy.fixture('login-data').then(function (testdata) 
        {
          cy.login(testdata.email,testdata.password) 
        }) 
      })
      
      it('should show empty screen when there are no apps', () => {
          cy.wait(1000)
          cy.get('body').then(($title=>
          {
            //if user has not created any app yet
            if($title.text().includes('You haven\'t created any apps yet.'))
            {
              //image for empty state should be visible  
              cy.get('.empty-img').should('be.visible')
  
              //empty title should be visible
              cy.log('Testing empty state dashboard view.')
              cy.get('.empty-title').should('be.visible')
              .and('have.text','You haven\'t created any apps yet.')
              
              //Read Documentation button should be present and working
              cy.get('a.btn').eq(1).should('have.attr','href','https://docs.tooljet.io')
              .and('have.text','Read documentation')
              
              //test Create your first app button should be visible and working
              cy.get('a.btn').eq(0).should('be.visible')
              .and('have.text','Create your first app')
              .click()
              cy.get('title').should('have.text','ToolJet - Dashboard')
            }
            else
            {
              cy.log("User has already created few apps hence this test will be skipped.")
            }
          })) 
        })
  })