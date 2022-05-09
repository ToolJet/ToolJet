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

  }).its('body').then(res=> localStorage.setItem('currentUser',JSON.stringify({"id":"5b7dc6ff-6b43-4023-9ffa-85b0edcef6f3","auth_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjViN2RjNmZmLTZiNDMtNDAyMy05ZmZhLTg1YjBlZGNlZjZmMyIsInN1YiI6ImRldkB0b29samV0LmlvIiwib3JnYW5pemF0aW9uSWQiOiIxMmQ5NGNjOC0wZWM3LTQ1YzctYjg4ZC01N2QwNWNjZWE5NmYiLCJpc1Bhc3N3b3JkTG9naW4iOnRydWUsImlhdCI6MTY1MjA5MjU5MiwiZXhwIjoxNjU0Njg0NTkyfQ.kqBox7MzZh12_KYmfQVtvMwAOLQeNlOh4QentRHwr5M","email":"dev@tooljet.io","first_name":"The","last_name":"Developer","organization_id":"12d94cc8-0ec7-45c7-b88d-57d05ccea96f","organization":"My organization","admin":true,"group_permissions":[{"id":"149a25f6-0a03-4afd-bd7c-67ce3ef44e1c","organization_id":"12d94cc8-0ec7-45c7-b88d-57d05ccea96f","group":"all_users","app_create":false,"app_delete":false,"folder_create":false},{"id":"2e98c794-0ab3-49b7-9f0f-6e7e1c29fce8","organization_id":"12d94cc8-0ec7-45c7-b88d-57d05ccea96f","group":"admin","app_create":true,"app_delete":true,"folder_create":true}],"app_group_permissions":[{"id":"1b2830ed-25d3-4352-8071-5e9108e16fa3","app_id":"78f4626f-1527-41e1-bab2-7b9c99b7766a","group_permission_id":"2e98c794-0ab3-49b7-9f0f-6e7e1c29fce8","read":true,"update":true,"delete":true}]})))
    
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