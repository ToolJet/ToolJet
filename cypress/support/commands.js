import { commonSelectors } from "Selectors/common";
import { loginSelectors} from "Selectors/login";
import { commonText } from "Texts/common";
import { emptyDashboardText } from "Texts/dashboard";

Cypress.Commands.add("login",(email,password)=>{
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, email);
  cy.clearAndType(loginSelectors.passwordField, password);
  cy.get(loginSelectors.signInButton).click();
  cy.get(loginSelectors.homePage).should("be.visible");
})

Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.get(selector).clear().type(text);
  });

  Cypress.Commands.add("verifyToastMessage", (selector,message) => {
    cy.get(selector)
      .should("be.visible")
      .should("have.text", message);
})

Cypress.Commands.add("appLogin",()=>{
  cy.request({
    url: "http://localhost:3000/api/authenticate",
    method: "POST",
    body:{
        email: "dev@tooljet.io", password: "password"

    }

  }).its('body').then(res=> localStorage.setItem('currentUser',JSON.stringify({"id":res.id,"auth_token":res.auth_token,"email":res.email,"first_name":res.first_name,"last_name":res.last_name,"organization_id":res.organization_id,"organization":res.organization,"admin":true,"group_permissions":[{"id":res.id,"organization_id":res.organization_id,"group":res.group,"app_create":false,"app_delete":false,"folder_create":false,},{"id":res.id,"organization_id":res.organization_id,"group":res.group,"app_create":true,"app_delete":true,"folder_create":true,}],"app_group_permissions":[]})))
    
  cy.visit('/');
})

Cypress.Commands.add('createApp',(appName) => {
  cy.get('body').then(($title => {
    if($title.text().includes(emptyDashboardText.emptyPageDescription)){
      cy.get(commonSelectors.emptyAppCreateButton).click();
      cy.wait(2000);
      cy.get('body').then($el =>{
        if($el.text().includes('Skip')){
          Cypress.$(commonSelectors.skipButton).trigger('click');
        }
        else{
          cy.log("instructions modal is skipped ");
        }
      });
      cy.clearAndType(commonSelectors.appNameInput, appName);
      cy.get(commonSelectors.backButton).click();
    }
    else{
      cy.get(commonSelectors.appCreateButton).click();
      cy.wait(2000);
      cy.get('body').then($el =>{
        if($el.text().includes('Skip')){
          Cypress.$(commonSelectors.skipButton).trigger('click');
        }
        else{
          cy.log("instructions modal is skipped ");
        }
      });
      cy.clearAndType(commonSelectors.appNameInput, appName);
      cy.get(commonSelectors.backButton).click();
    }
  }))
});

Cypress.Commands.add("dragAndDropWidget" , (widgetName, position = "top") => {
  const dataTransfer = new DataTransfer();

  cy.get(commonSelectors.searchField).type(widgetName);
  cy.get(commonSelectors.firstWidget).trigger("dragstart", { dataTransfer }, { force: true });
  cy.get(commonSelectors.canvas).trigger("drop", position, { dataTransfer, force: true });
  cy.get(commonSelectors.autoSave, { timeout: 9000 }).should("have.text", commonText.autoSave);
});

Cypress.Commands.add("appUILogin",()=>{
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, 'dev@tooljet.io');
  cy.clearAndType(loginSelectors.passwordField, 'password');
  cy.get(loginSelectors.signInButton).click();
  cy.get(commonSelectors.homePageLogo).should("be.visible");
  cy.wait(1000)
  cy.get('body').then($el =>{
  if ($el.text().includes('Skip')){ 
    cy.get(commonSelectors.skipInstallationModal).click();
   }
   else{
     cy.log("Installation is Finished")
  }
})
})