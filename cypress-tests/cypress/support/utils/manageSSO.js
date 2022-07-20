import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";

export const generalSettings=()=>{
  cy.get(ssoSelector.enableCheckbox).then(($el) => {
   if($el.is(':checked')){
    cy.get(ssoSelector.enableCheckbox).check()
    cy.get(ssoSelector.cancelButton).click();
    cy.get(ssoSelector.enableCheckbox).should("be.checked");
  
    cy.get(ssoSelector.enableCheckbox).check();
    cy.clearAndType(ssoSelector.domainInput, ssoText.allowedDomain);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
   }
   else{   
    cy.get(ssoSelector.enableCheckbox).check()
    cy.get(ssoSelector.cancelButton).click();
    cy.get(ssoSelector.enableCheckbox).should("not.be.checked");

    cy.get(ssoSelector.enableCheckbox).check();
    cy.clearAndType(ssoSelector.domainInput, ssoText.allowedDomain);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
   }
  });
};

export const googleSSO=()=>{
  cy.get(ssoSelector.enableCheckbox).then(($el) => {
   if($el.is(':checked')){
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
    cy.get(ssoSelector.enableCheckbox).uncheck();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleDisableToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.get(ssoSelector.enableCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleEnabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
   
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast2);
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.testClientId);
    cy.get(ssoSelector.cancelButton).click();
    cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
   }
   else{
     cy.get(ssoSelector.enableCheckbox).check();
     cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleEnabledToast);
     cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
     cy.get(ssoSelector.enableCheckbox).uncheck();
     cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleDisableToast);
     cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
     cy.get(ssoSelector.enableCheckbox).check();
     cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
    
     cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
     cy.get(ssoSelector.saveButton).click();
     cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast2);
     cy.clearAndType(ssoSelector.clientIdInput, ssoText.testClientId);
     cy.get(ssoSelector.cancelButton).click();
     cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
   }
  });
};

export const gitSSO=()=>{
  cy.get(ssoSelector.enableCheckbox).then(($el) => {
   if($el.is(':checked')){
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
    cy.get(ssoSelector.enableCheckbox).uncheck();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitDisabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.wait(1000);
    cy.get(ssoSelector.enableCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitEnabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
 
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
    cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast2);
   }
   else{
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.get(ssoSelector.enableCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitEnabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
    cy.wait(1000);
    cy.get(ssoSelector.enableCheckbox).uncheck();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitDisabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.wait(1000);
    cy.get(ssoSelector.enableCheckbox).check();
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
 
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
    cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast2);
   }
  });
}

export const password=()=>{
  cy.get(ssoSelector.enableCheckbox).then(($el) => {
   if($el.is(':checked')){
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
    cy.get(ssoSelector.enableCheckbox).uncheck();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.passwordDisabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.wait(1000);
    cy.get(ssoSelector.enableCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.passwordEnabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
   }
   else{
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.get(ssoSelector.enableCheckbox).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.passwordEnabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.enabledLabel);
    cy.wait(1000);
    cy.get(ssoSelector.enableCheckbox).uncheck();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.passwordDisabledToast);
    cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text",ssoText.disabledLabel);
    cy.wait(1000);
    cy.get(ssoSelector.enableCheckbox).check();
   }
  });
};