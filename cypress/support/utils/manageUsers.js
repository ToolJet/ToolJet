import { path } from "Texts/common";
import {commonSelectors} from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import * as common from "Support/utils/common";

export const ManageUsersElements=()=>{
 for( const element in usersSelector.usersElements){
  cy.get(usersSelector.usersElements[element]).should("be.visible").and("have.text", usersText.usersElements[element]);
 }
 cy.get(usersSelector.inviteUserButton).should("be.visible").and("have.text", usersText.inviteUserButton).click();

 cy.get(usersSelector.cardTitle).should("be.visible").and("have.text", usersText.cardTitle);
 cy.get(usersSelector.firstNameInput).should("be.visible");
 cy.get(usersSelector.lastNameInput).should("be.visible");
 cy.get(usersSelector.emailLabel).should("be.visible").and("have.text", usersText.emailLabel);
 cy.get(usersSelector.lastNameInput).should("be.visible");
 cy.get(usersSelector.cancelButton).should("be.visible").and("have.text", usersText.cancelButton);
 cy.get(usersSelector.createUserButton).should("be.visible").and("have.text", usersText.createUserButton);
};

export const addNewUser = (firstName,lastName,email) => {
cy.clearAndType(usersSelector.firstNameInput, firstName);
cy.clearAndType(usersSelector.lastNameInput, lastName);
cy.clearAndType(usersSelector.emailInput, email);

cy.get(usersSelector.createUserButton).click();
cy.wait(1000);
cy.window().then(win => {
  cy.stub(win, 'prompt').returns(win.prompt).as('copyToClipboardPrompt');
});
cy.contains('td', email).parent().within(() => {
 cy.get('td img').click();
});
cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteCopiedToast);
cy.get('@copyToClipboardPrompt').then(prompt => {
 common.logout();
 cy.visit(prompt.args[0][1]);
 cy.url().should("include",path.confirmInvite);
});
};

export const confirmInviteElements =()=>{
 cy.get(usersSelector.confirmInvitePage).should("be.visible");
 cy.get(usersSelector.pageLogo).should("be.visible");
 for( const element in usersSelector.confirmInviteElements){
  cy.get(usersSelector.confirmInviteElements[element]).should("be.visible").and("have.text", usersText.confirmInviteElements[element]);
 }
 cy.get(usersSelector.passwordInput).should("be.visible");
 cy.get(usersSelector.confirmPasswordInput).should("be.visible");
 cy.get(usersSelector.finishSetup).should("be.visible").and("have.text", usersText.finishSetup);
};