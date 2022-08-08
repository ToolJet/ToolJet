import { profileSelector } from "Selectors/profile";
import * as profile from "Support/utils/profile"
import * as common from "Support/utils/common"
import { profileText } from "Texts/profile";
import {commonSelectors} from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText } from "Texts/common";

describe("Profile Settings",()=>{
 let user;
 const randomFirstName = fake.firstName;
 const randomLastName = fake.lastName;
 beforeEach(()=>{
  cy.fixture("credentials/login.json").then(login=>{
   user = login;
  });
  cy.appUILogin();   
  common.navigateToProfile();
 });

  it("Should verify the elements on profile settings page and name reset functionality",()=>{
   profile.profilePageElements();
   
   cy.get(profileSelector.updateButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.nameSuccessToast);

   cy.get(profileSelector.firstNameInput).clear();
   cy.get(profileSelector.updateButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.nameErrorToast);

   cy.get(profileSelector.lastNameInput).clear();
   cy.get(profileSelector.updateButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.nameErrorToast);

   cy.clearAndType(profileSelector.firstNameInput , profileText.firstName);
   cy.get(profileSelector.updateButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.nameErrorToast);

   cy.clearAndType(profileSelector.firstNameInput , randomFirstName);
   cy.clearAndType(profileSelector.lastNameInput , randomLastName);
   cy.get(profileSelector.updateButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.nameSuccessToast);
   cy.get(profileSelector.firstNameInput).should("be.visible").and("have.value", randomFirstName);
   cy.get(profileSelector.lastNameInput).should("be.visible").and("have.value", randomLastName);

   cy.clearAndType(profileSelector.firstNameInput , profileText.firstName);
   cy.clearAndType(profileSelector.lastNameInput , profileText.lastName);
   cy.get(profileSelector.updateButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.nameSuccessToast);
   cy.get(profileSelector.firstNameInput).should("be.visible").and("have.value", profileText.firstName);
   cy.get(profileSelector.lastNameInput).should("be.visible").and("have.value", profileText.lastName);
   common.logout();
  })

  it("Should verify the password reset functionality",()=>{
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, profileText.passwordErrorToast);
   cy.get(profileSelector.currentPasswordField).should("have.value", "");
   cy.get(profileSelector.newPasswordField).should("have.value", "");

   cy.clearAndType(profileSelector.currentPasswordField, user.password);
   cy.get(profileSelector.currentPasswordField).should("have.value", user.password);
   cy.get(profileSelector.newPasswordField).should("have.value", "");
   cy.wait(500);
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordSuccessToast);

   cy.clearAndType(profileSelector.currentPasswordField, profileText.newPassword);
   cy.get(profileSelector.currentPasswordField).should("have.value", profileText.newPassword )
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordErrorToast);

   cy.get(profileSelector.currentPasswordField).clear();
   cy.clearAndType(profileSelector.newPasswordField,profileText.newPassword);
   cy.get(profileSelector.newPasswordField).should("have.value", profileText.newPassword )
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordErrorToast);

   cy.clearAndType(profileSelector.currentPasswordField, profileText.newPassword);
   cy.get(profileSelector.currentPasswordField).should("have.value", profileText.newPassword)
   cy.clearAndType(profileSelector.newPasswordField, user.password);
   cy.get(profileSelector.newPasswordField).should("have.value", user.password )
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordErrorToast);

   cy.clearAndType(profileSelector.currentPasswordField, user.password);
   cy.get(profileSelector.currentPasswordField).should("have.value", user.password)
   cy.clearAndType(profileSelector.newPasswordField,profileText.newPassword);
   cy.get(profileSelector.newPasswordField).should("have.value", profileText.newPassword )
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordSuccessToast);

   cy.clearAndType(profileSelector.currentPasswordField, user.password);
   cy.get(profileSelector.currentPasswordField).should("have.value", user.password)
   cy.clearAndType(profileSelector.newPasswordField,profileText.newPassword);
   cy.get(profileSelector.newPasswordField).should("have.value", profileText.newPassword )
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordSuccessToast);

   common.logout();
   cy.wait(1000);
   cy.clearAndType(commonSelectors.emailField, commonText.email);
   cy.clearAndType(commonSelectors.passwordField, commonText.password);
   cy.get(commonSelectors.signInButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.loginErrorToast);

   cy.clearAndType(commonSelectors.passwordField, profileText.newPassword);
   cy.get(commonSelectors.signInButton).click();
   common.navigateToProfile();

   cy.clearAndType(profileSelector.currentPasswordField,profileText.newPassword);
   cy.clearAndType(profileSelector.newPasswordField, user.password);
   cy.get(profileSelector.changePasswordButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage,profileText.passwordSuccessToast);
   common.logout();

   cy.login(user.email,user.password);
   common.logout();
  })
});