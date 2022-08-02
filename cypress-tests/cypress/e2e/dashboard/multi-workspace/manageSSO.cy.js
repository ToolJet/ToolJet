import { ssoSelector } from "Selectors/manageSSO";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";

describe("Manage SSO for multi workspace", ()=>{
  before(()=>{     
    cy.appUILogin();
  });
  it("Should verify General settings page elements", ()=>{
   common.navigateToManageSSO();  
   cy.get(ssoSelector.pagetitle).should("be.visible").and("have.text", ssoText.pagetitle);

   cy.get(ssoSelector.generalSettings).should("be.visible").and("have.text", ssoText.generalSettings);
   cy.get(ssoSelector.cardTitle).should("be.visible").and("have.text", ssoText.generalSettings);
   cy.get(ssoSelector.enableCheckbox).should("be.visible");
   cy.get(ssoSelector.enableSignupLabel).should("be.visible").and("have.text", ssoText.enableSignupLabel);
   cy.get(ssoSelector.helperText).should("be.visible").and("have.text", ssoText.helperText );
   cy.get(ssoSelector.domainLabel).should("be.visible").and("have.text", ssoText.domainLabel);
   cy.get(ssoSelector.domainInput).should("be.visible");
   cy.get(ssoSelector.cancelButton).should("be.visible").and("have.text", ssoText.cancelButton);
   cy.get(ssoSelector.saveButton).should("be.visible").and("have.text", ssoText.saveButton);

   SSO.generalSettings();

   cy.get(ssoSelector.loginUrlLabel).should("be.visible").and("have.text", ssoText.loginUrlLabel);
   cy.get(ssoSelector.loginUrl).should("be.visible");
   cy.get(ssoSelector.loginHelpText).should("be.visible").and("have.text", ssoText.loginHelpText);
  });

  it("Should verify Google SSO page elements", ()=>{
    cy.wait(1000);
    cy.get(ssoSelector.google).should("be.visible").click();
    cy.get(ssoSelector.cardTitle).should(($el) => {
     expect($el.contents().first().text().trim()).to.eq(ssoText.googleTitle);}).and(("be.visible"));
    cy.get(ssoSelector.enableCheckbox).should("be.visible");
    cy.get(ssoSelector.clientIdLabel).should("be.visible").and("have.text", ssoText.clientIdLabel);
    cy.get(ssoSelector.clientIdInput).should("be.visible");
    cy.get(ssoSelector.cancelButton).should("be.visible").and("have.text", ssoText.cancelButton);
    cy.get(ssoSelector.saveButton).should("be.visible").and("have.text", ssoText.saveButton);

    SSO.googleSSO();

    cy.get(ssoSelector.generalSettings).click();
    cy.get(ssoSelector.loginUrl).then(($temp)=>{
      const txt = $temp.text();
      common.logout();
      cy.visit(txt);
    });
    cy.get(ssoSelector.googleTile).should("be.visible");
    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSignInText).should("be.visible").and("have.text", ssoText.googleSignInText);
  });

  it("Should verify Git SSO page elements", ()=>{
    cy.appUILogin();
    common.navigateToManageSSO();  

    cy.get(ssoSelector.git).should("be.visible").click();
    cy.get(ssoSelector.cardTitle).should(($el) => {
     expect($el.contents().first().text().trim()).to.eq(ssoText.gitTitle);}).and(("be.visible"));
    cy.get(ssoSelector.enableCheckbox).should("be.visible");
    cy.get(ssoSelector.clientIdLabel).should("be.visible").and("have.text", ssoText.clientIdLabel);
    cy.get(ssoSelector.clientIdInput).should("be.visible");
    cy.get(ssoSelector.clientSecretLabel).should(($el) => {
     expect($el.contents().first().text().trim()).to.eq(ssoText.clientSecretLabel);}).and(("be.visible"));
    cy.get(ssoSelector.encriptedLabel).should("be.visible").and("have.text", ssoText.encriptedLabel);
    cy.get(ssoSelector.clientSecretInput).should("be.visible");
    cy.get(ssoSelector.cancelButton).should("be.visible").and("have.text", ssoText.cancelButton);
    cy.get(ssoSelector.saveButton).should("be.visible").and("have.text", ssoText.saveButton);

    SSO.gitSSO();

    cy.get(ssoSelector.generalSettings).click();
    cy.get(ssoSelector.loginUrl).then(($temp)=>{
      const txt = $temp.text();
      common.logout();
      cy.visit(txt);
    });
    cy.get(ssoSelector.googleTile).should("be.visible");
    cy.get(ssoSelector.googleIcon).should("be.visible");
    cy.get(ssoSelector.googleSignInText).should("be.visible").and("have.text", ssoText.googleSignInText);
  });

  it("Should verify Password login page elements",()=>{
    cy.appUILogin();
    common.navigateToManageSSO();

    cy.get(ssoSelector.password).should("be.visible").click();
    cy.get(ssoSelector.cardTitle).should(($el) => {
     expect($el.contents().first().text().trim()).to.eq(ssoText.passwordTitle);}).and(("be.visible"));
    cy.get(ssoSelector.enableCheckbox).should("be.visible"); 

    SSO.password();
  })
});



