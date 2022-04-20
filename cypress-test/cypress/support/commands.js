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