import { profileSelector } from "Selectors/profile";
import * as profile from "Support/utils/profile";
import * as common from "Support/utils/common";
import { profileText } from "Texts/profile";
import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText } from "Texts/common";

describe("Profile Settings", () => {
  const randomFirstName = fake.firstName;
  const randomLastName = fake.lastName;
  const avatarImage = "cypress/fixtures/Image/tooljet.png";
  beforeEach(() => {
    cy.appUILogin();
    common.navigateToProfile();
  });

  it("Should verify the elements on profile settings page and name reset functionality", () => {
    profile.profilePageElements();

    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.nameSuccessToast
    );

    cy.get(profileSelector.firstNameInput).clear();
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.firstNameErrorToast
    );

    cy.get(profileSelector.lastNameInput).clear();
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.firstNameErrorToast
    );

    // cy.clearAndType(profileSelector.firstNameInput, profileText.firstName);
    // cy.get(profileSelector.updateButton).click();
    // cy.verifyToastMessage(
    //   commonSelectors.toastMessage,
    //   profileText.lastNameNameErrorToast
    // );

    cy.clearAndType(profileSelector.firstNameInput, randomFirstName);
    cy.clearAndType(profileSelector.lastNameInput, randomLastName);
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.nameSuccessToast
    );
    cy.get(profileSelector.firstNameInput).verifyVisibleElement(
      "have.value",
      randomFirstName
    );
    cy.get(profileSelector.lastNameInput).verifyVisibleElement(
      "have.value",
      randomLastName
    );

    cy.clearAndType(profileSelector.firstNameInput, profileText.firstName);
    cy.clearAndType(profileSelector.lastNameInput, profileText.lastName);
    cy.get(profileSelector.avatarUploadField).selectFile(avatarImage);
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.nameSuccessToast
    );
    cy.get(profileSelector.firstNameInput).verifyVisibleElement(
      "have.value",
      profileText.firstName
    );
    cy.get(profileSelector.lastNameInput).verifyVisibleElement(
      "have.value",
      profileText.lastName
    );
    cy.get(commonSelectors.avatarImage).should("have.css", "background-image");
    common.logout();
  });

  it("Should verify the password reset functionality", () => {
    cy.get(profileSelector.currentPasswordField).should("have.value", "");
    cy.get(profileSelector.newPasswordField).should("have.value", "");
    cy.get(profileSelector.currentPasswordField).should("have.value", "");

    cy.clearAndType(profileSelector.currentPasswordField, profileText.password);
    cy.get(profileSelector.currentPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.newPasswordField).should("have.value", "");
    cy.get(profileSelector.confirmPasswordField).should("have.value", "");
    cy.get(profileSelector.changePasswordButton).should("be.disabled");

    cy.get(profileSelector.currentPasswordField).clear();
    cy.clearAndType(profileSelector.newPasswordField, profileText.password);
    cy.get(profileSelector.currentPasswordField).should("have.value", "");
    cy.get(profileSelector.newPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.confirmPasswordField).should("have.value", "");
    cy.get(profileSelector.changePasswordButton).should("be.disabled");

    cy.get(profileSelector.newPasswordField).clear();
    cy.clearAndType(profileSelector.confirmPasswordField, profileText.password);
    cy.get(profileSelector.currentPasswordField).should("have.value", "");
    cy.get(profileSelector.newPasswordField).should("have.value", "");
    cy.get(profileSelector.confirmPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.changePasswordButton).should("be.disabled");

    cy.get(profileSelector.confirmPasswordField).clear();
    cy.clearAndType(profileSelector.currentPasswordField, profileText.password);
    cy.clearAndType(profileSelector.newPasswordField, profileText.password);
    cy.get(profileSelector.currentPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.newPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.confirmPasswordField).should("have.value", "");
    cy.get(profileSelector.changePasswordButton).should("be.disabled");

    cy.get(profileSelector.currentPasswordField).clear();
    cy.clearAndType(profileSelector.newPasswordField, profileText.password);
    cy.clearAndType(profileSelector.confirmPasswordField, profileText.password);
    cy.get(profileSelector.currentPasswordField).should("have.value", "");
    cy.get(profileSelector.newPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.confirmPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.changePasswordButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.currentPasswordFieldEmptyToast
    );

    cy.get(profileSelector.currentPasswordField).clear();
    cy.get(profileSelector.newPasswordField).clear();
    cy.clearAndType(profileSelector.currentPasswordField, profileText.password);
    cy.clearAndType(profileSelector.confirmPasswordField, profileText.password);
    cy.get(profileSelector.newPasswordField).should("have.value", "");
    cy.get(profileSelector.currentPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.confirmPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.changePasswordButton).should("be.disabled");

    cy.clearAndType(profileSelector.currentPasswordField, profileText.password);
    cy.clearAndType(profileSelector.newPasswordField, profileText.password);
    cy.clearAndType(profileSelector.confirmPasswordField, profileText.password);
    cy.get(profileSelector.currentPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.newPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.confirmPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.changePasswordButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.samePasswordErrorToast
    );

    cy.clearAndType(profileSelector.currentPasswordField, profileText.password);
    cy.clearAndType(profileSelector.newPasswordField, profileText.newPassword);
    cy.clearAndType(
      profileSelector.confirmPasswordField,
      profileText.newPassword
    );
    cy.get(profileSelector.currentPasswordField).should(
      "have.value",
      profileText.password
    );
    cy.get(profileSelector.newPasswordField).should(
      "have.value",
      profileText.newPassword
    );
    cy.get(profileSelector.confirmPasswordField).should(
      "have.value",
      profileText.newPassword
    );
    cy.get(profileSelector.changePasswordButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.passwordSuccessToast
    );

    common.logout();

    cy.clearAndType(commonSelectors.workEmailInputField, commonText.email);
    cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
    cy.get(commonSelectors.loginButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.loginErrorToast
    );

    cy.clearAndType(
      commonSelectors.passwordInputField,
      profileText.newPassword
    );
    cy.get(commonSelectors.signInButton).click();
    common.navigateToProfile();

    cy.clearAndType(
      profileSelector.currentPasswordField,
      profileText.newPassword
    );
    cy.clearAndType(profileSelector.newPasswordField, profileText.password);
    cy.clearAndType(profileSelector.confirmPasswordField, profileText.password);
    cy.get(profileSelector.changePasswordButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.passwordSuccessToast
    );

    common.logout();

    cy.login(commonText.email, profileText.password);
    common.logout();
  });
});