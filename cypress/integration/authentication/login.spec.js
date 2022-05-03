import { loginSelectors} from "Selectors/login";
import {commonSelectors} from "Selectors/common";
import {loginTexts} from "Texts/login";
import { fake } from "Fixtures/fake";
import * as login from "Support/utils/login"; 

describe("Login functionality",()=>{
    let user;
    const invalidEmail = fake.email;
    const invalidPassword = fake.password;

    before(()=>{
        cy.fixture("credentials/login.json").then(login=>{
            user = login;
        });
        cy.visit("/");

    });
    it("Should verify elements on the login page", ()=>{
        login.loginPageElements();
    });
    it("Should not be able to login with invalid credentials", ()=>{
        cy.get(loginSelectors.signInButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, loginTexts.toastMessage);

        cy.clearAndType(loginSelectors.emailField, invalidEmail);
        cy.get(loginSelectors.signInButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, loginTexts.toastMessage);
        
        cy.get(loginSelectors.emailField).clear();
        cy.clearAndType(loginSelectors.passwordField, invalidPassword);
        cy.get(loginSelectors.signInButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, loginTexts.toastMessage);
        
        cy.clearAndType(loginSelectors.emailField, user.email);
        cy.get(loginSelectors.passwordField).clear();
        cy.get(loginSelectors.signInButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, loginTexts.toastMessage);

        cy.get(loginSelectors.emailField).clear();
        cy.clearAndType(loginSelectors.passwordField, user.password);
        cy.get(loginSelectors.signInButton).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, loginTexts.toastMessage);
        
    });
    it("Should be able to login with valid credentials", ()=>{
        cy.login(user.email,user.password);
    });
});
