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

  }).its('body').then(res=> localStorage.setItem('currentUser',JSON.stringify({"id":"818bb04c-fc8a-4dac-812b-ca48fffe4329","auth_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjgxOGJiMDRjLWZjOGEtNGRhYy04MTJiLWNhNDhmZmZlNDMyOSIsInN1YiI6ImRldkB0b29samV0LmlvIiwib3JnYW5pemF0aW9uSWQiOiI3NTVhMjU4Yi0zMzIzLTQ0MzctYjc5MC0zZTZlOGVhZGMyYzYiLCJpc1Bhc3N3b3JkTG9naW4iOnRydWUsImlhdCI6MTY1MTc2MTI2OSwiZXhwIjoxNjU0MzUzMjY5fQ.S_SWk3AZZJcjWgrDArAdLSgz-kWnBon1uO2kZXdQeR4","email":"dev@tooljet.io","first_name":"The","last_name":"Developer","organization_id":"755a258b-3323-4437-b790-3e6e8eadc2c6","organization":"My organization","admin":true,"group_permissions":[{"id":"1b72010a-57ed-4116-8b3c-d1e569dfe84f","organization_id":"755a258b-3323-4437-b790-3e6e8eadc2c6","group":"all_users","app_create":false,"app_delete":false,"folder_create":false,"created_at":"2022-05-05T14:27:19.957Z","updated_at":"2022-05-05T14:27:19.957Z"},{"id":"d0291248-029a-4e2b-8b7c-24ac788c24af","organization_id":"755a258b-3323-4437-b790-3e6e8eadc2c6","group":"admin","app_create":true,"app_delete":true,"folder_create":true,"created_at":"2022-05-05T14:27:19.957Z","updated_at":"2022-05-05T14:27:19.957Z"}],"app_group_permissions":[{"id":"784a3dea-002e-4d72-a937-e4deb2f4a63d","app_id":"e6f4e596-a125-406f-9b04-d2b972a3c2ea","group_permission_id":"d0291248-029a-4e2b-8b7c-24ac788c24af","read":true,"update":true,"delete":true,"created_at":"2022-05-05T14:33:17.525Z","updated_at":"2022-05-05T14:33:17.525Z"}]})))
    
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