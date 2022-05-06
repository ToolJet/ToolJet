import { commonSelectors } from "Selectors/common";
import { loginSelectors} from "Selectors/login";

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

  }).its('body').then(res=> localStorage.setItem('currentUser',JSON.stringify({"id":"043e7726-45b8-400c-924c-5f7654854f6c","auth_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjA0M2U3NzI2LTQ1YjgtNDAwYy05MjRjLTVmNzY1NDg1NGY2YyIsInN1YiI6ImRldkB0b29samV0LmlvIiwib3JnYW5pemF0aW9uSWQiOiI0OTY2OTk2Yi01MjY3LTRkMzEtYTY5Mi0xYjJmZWE5YjY5NGYiLCJpc1Bhc3N3b3JkTG9naW4iOnRydWUsImlhdCI6MTY1MTgyMzc0NCwiZXhwIjoxNjU0NDE1NzQ0fQ.0XBW9RudNR5x6diG4rqh2gxUuvYy4_EglGtE-rlm04o","email":"dev@tooljet.io","first_name":"The","last_name":"Developer","organization_id":"4966996b-5267-4d31-a692-1b2fea9b694f","organization":"My organization","admin":true,"group_permissions":[{"id":"517e8d29-a8ae-41fd-a3f1-598360277733","organization_id":"4966996b-5267-4d31-a692-1b2fea9b694f","group":"all_users","app_create":false,"app_delete":false,"folder_create":false,"created_at":"2022-05-06T07:51:44.923Z","updated_at":"2022-05-06T07:51:44.923Z"},{"id":"d48594ac-68ca-4ba6-9002-8c80c8b558ca","organization_id":"4966996b-5267-4d31-a692-1b2fea9b694f","group":"admin","app_create":true,"app_delete":true,"folder_create":true,"created_at":"2022-05-06T07:51:44.923Z","updated_at":"2022-05-06T07:51:44.923Z"}],"app_group_permissions":[]})))
    
  cy.visit('/');
})

Cypress.Commands.add('createAppIfEmptyDashboard', fn => {
  cy.get('.empty-title').then(($title => {
    if ($title.text().includes('You can get started by creating a new application or by creating an application using a template in ToolJet Library.')) {
      cy.get(".empty-action > :nth-child(1)").click();
      cy.get(".modal-footer > .btn").click()
      cy.go('back')
    }
  }))
});

Cypress.Commands.add("dragAndDropWidget" , (widgetName, position = "top") => {
  const dataTransfer = new DataTransfer();

  cy.get(commonSelectors.searchField).type(widgetName);
  cy.get(commonSelectors.firstWidget).trigger("dragstart", { dataTransfer }, { force: true });
  cy.get(commonSelectors.canvas).trigger("drop", position, { dataTransfer, force: true });
  cy.get(commonSelectors.toastMessage, { timeout: 8000 }).should("have.text", "Saved!");
});