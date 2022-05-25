import {commonSelectors} from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersSelector } from "Selectors/manageUsers";
import { usersText } from "Texts/manageUsers";
import * as users from "Support/utils/manageUsers";
import * as common from "Support/utils/common";
import { commonText, path } from "Texts/common";

const firstName = fake.firstName;
const lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
const email = `${firstName}@example.com`;
const newEmail = `${lastName}@example.com`;

describe("Manage Users", ()=>{
 before(()=>{
   cy.appUILogin();
 });
 it("Should verify the Manage users page", ()=>{
  common.navigateToManageUsers();
  users.ManageUsersElements();

  cy.get(usersSelector.cancelButton).click();
  cy.get(usersSelector.usersElements.nameTitile).should("be.visible");
  cy.get(usersSelector.inviteUserButton).click();
  
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.fisrtNameError).should("be.visible").and("have.text", usersText.fieldRequired);
  cy.get(usersSelector.lastNameError).should("be.visible").and("have.text", usersText.fieldRequired);
  cy.get(usersSelector.emailError).should("be.visible").and("have.text", usersText.fieldRequired);
 
  cy.clearAndType(usersSelector.firstNameInput, firstName);
  cy.get(usersSelector.lastNameInput).clear();
  cy.get(usersSelector.emailInput).clear();
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.lastNameError).should("be.visible").and("have.text", usersText.fieldRequired);
  cy.get(usersSelector.emailError).should("be.visible").and("have.text", usersText.fieldRequired);

  cy.get(usersSelector.firstNameInput).clear();
  cy.get(usersSelector.emailInput).clear();
  cy.clearAndType(usersSelector.lastNameInput, lastName);
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.fisrtNameError).should("be.visible").and("have.text", usersText.fieldRequired);
  cy.get(usersSelector.emailError).should("be.visible").and("have.text", usersText.fieldRequired);

  cy.get(usersSelector.firstNameInput).clear();
  cy.get(usersSelector.lastNameInput).clear();
  cy.clearAndType(usersSelector.emailInput, email);
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.fisrtNameError).should("be.visible").and("have.text", usersText.fieldRequired);
  cy.get(usersSelector.lastNameError).should("be.visible").and("have.text", usersText.fieldRequired);

  cy.get(usersSelector.firstNameInput).clear();
  cy.clearAndType(usersSelector.lastNameInput, lastName);
  cy.clearAndType(usersSelector.emailInput, email);
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.fisrtNameError).should("be.visible").and("have.text", usersText.fieldRequired);

  cy.get(usersSelector.lastNameInput).clear();
  cy.clearAndType(usersSelector.firstNameInput, firstName);
  cy.clearAndType(usersSelector.emailInput, email);
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.lastNameError).should("be.visible").and("have.text", usersText.fieldRequired);

  cy.get(usersSelector.emailInput).clear();
  cy.clearAndType(usersSelector.firstNameInput, firstName);
  cy.clearAndType(usersSelector.lastNameInput, lastName);
  cy.get(usersSelector.createUserButton).click();
  cy.get(usersSelector.emailError).should("be.visible").and("have.text", usersText.fieldRequired);

  cy.clearAndType(usersSelector.firstNameInput, firstName);
  cy.clearAndType(usersSelector.lastNameInput, lastName);
  cy.clearAndType(usersSelector.emailInput, usersText.usersElements.userEmail);
  cy.get(usersSelector.createUserButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.exsitingEmail);
 });

 it("Should verify the confirm invite page", ()=>{
  users.addNewUser(firstName,lastName,newEmail);
  cy.get(usersSelector.confirmInviteElements.acceptInvite).click();
  cy.url().should("include",path.loginPath);

  cy.appUILogin();
  common.navigateToManageUsers();
  cy.get(usersSelector.inviteUserButton).click();
  users.addNewUser(firstName,lastName,email);

  cy.get(usersSelector.finishSetup).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.passwordErrToast);
  cy.get(usersSelector.passwordInput).should("have.value", "");
  cy.get(usersSelector.confirmPasswordInput).should("have.value", "");

  cy.clearAndType(usersSelector.passwordInput, usersText.password);
  cy.wait(1000);
  cy.get(usersSelector.finishSetup).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.passwordErrToast);
  cy.get(usersSelector.passwordInput).should("have.value", usersText.password);
  cy.get(usersSelector.confirmPasswordInput).should("have.value", "");

  cy.get(usersSelector.passwordInput).clear();
  cy.clearAndType(usersSelector.confirmPasswordInput, usersText.password);
  cy.get(usersSelector.finishSetup).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.passwordErrToast);
  cy.get(usersSelector.passwordInput).should("have.value", "");
  cy.get(usersSelector.confirmPasswordInput).should("have.value", usersText.password);

  cy.clearAndType(usersSelector.passwordInput, usersText.password);
  cy.clearAndType(usersSelector.confirmPasswordInput, usersText.mismatchPassword);
  cy.get(usersSelector.finishSetup).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.passwordMismatchToast);
  cy.get(usersSelector.passwordInput).should("have.value", usersText.password);
  cy.get(usersSelector.confirmPasswordInput).should("have.value", usersText.mismatchPassword);

  cy.clearAndType(usersSelector.passwordInput, usersText.password);
  cy.clearAndType(usersSelector.confirmPasswordInput, usersText.password);
  cy.get(usersSelector.finishSetup).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.passwordSuccessToast);
  cy.url().should("include",path.loginPath);
 });

 it("should verify the new user account", ()=>{
  cy.login(email,usersText.password);
  cy.get(usersSelector.emptyImage).should("be.visible");
  cy.get(usersSelector.manageUsers).should('not.exist');
  cy.get(usersSelector.createNewApp).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, usersText.createAppPermissionToast);
  common.logout();

  cy.appUILogin();
  common.navigateToManageUsers();
  cy.contains('td', email).parent().within(() => {
   cy.get('td small').should("have.text", usersText.activeStatus);
  });
 });
 it("Should verify the archive functionality",()=>{
  cy.contains('td', email).parent().within(() => {
   cy.get('td button').click();
  });
  cy.wait(500);
  cy.contains('td', email).parent().within(() => {
   cy.get('td small').should("have.text", usersText.archivedStatus);
  });
  cy.verifyToastMessage(commonSelectors.toastMessage,usersText.archivedToast);
   
  common.logout();
  cy.clearAndType(commonSelectors.emailField, email);
  cy.clearAndType(commonSelectors.passwordField, usersText.password);
  cy.get(commonSelectors.signInButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage,commonText.loginErrorToast);
   
  cy.appUILogin();
  common.navigateToManageUsers();
  cy.contains('td', email).parent().within(() => {
   cy.get('td button').click();
  });
   
  cy.contains('td', email).parent().within(() => {
   cy.get('td small').should("have.text", usersText.invitedStatus);
  });
 });
});