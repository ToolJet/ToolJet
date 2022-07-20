import { loginSelectors } from "Selectors/login";
import { loginTexts} from "Texts/login";
import { path } from "Texts/common";

export const loginPageElements=()=>{
    cy.url().should("include",path.loginPath);
    cy.get(loginSelectors.logo).should("be.visible");
    cy.get(loginSelectors.cardTitle).should("be.visible").should("have.text", loginTexts.cardTitle);
    cy.get(loginSelectors.emailLabel).should("be.visible").should("have.text", loginTexts.emailLabel);
    cy.get(loginSelectors.passwordLabel).should(($el) => {
     expect($el.contents().first().text().trim()).to.eq(loginTexts.passwordLabel);}).should("be.visible");
    cy.get(loginSelectors.forgotPassword).should("be.visible").should("have.text", loginTexts.forgotPassword);
    cy.get(loginSelectors.showPassword).should("have.text", loginTexts.showPassword);
    cy.get(loginSelectors.signUpText).should("be.visible",);
    cy.get(loginSelectors.checkBox).check();
    cy.get(loginSelectors.checkBox).uncheck();
    cy.get(loginSelectors.signUpText).should(($el) => {
     expect($el.contents().first().text().trim() ).to.eq(loginTexts.signUpText);}).should("be.visible");
    cy.get(loginSelectors.signUpLink).should("be.visible").should("have.text", loginTexts.signUpLink);

}