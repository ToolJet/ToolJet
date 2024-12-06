import { profileSelector } from "Selectors/profile";
import * as profile from "Support/utils/profile";
import * as common from "Support/utils/common";
import { profileText } from "Texts/profile";
import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText } from "Texts/common";
import { onboardingSelectors } from "Selectors/onboarding";

describe("Profile Settings", () => {
  const randomFirstName = fake.firstName;
  const randomLastName = fake.lastName;
  const avatarImage = "cypress/fixtures/Image/tooljet.png";
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    common.navigateToProfile();
  });

  // neeed to reset and seed bd after 1 run (as password changes will get 401 error )
  it("Should verify the elements on profile settings page and name reset functionality", () => {
    profile.profilePageElements();

    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.nameSuccessToast
    );

    cy.get(profileSelector.userNameInput).clear();
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Name can't be empty!");

    cy.clearAndType(profileSelector.userNameInput, randomFirstName);
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.nameSuccessToast
    );
    cy.get(profileSelector.userNameInput).verifyVisibleElement(
      "have.value",
      randomFirstName
    );

    cy.clearAndType(profileSelector.userNameInput, profileText.userName);
    cy.get(profileSelector.avatarUploadField).selectFile(avatarImage);
    cy.get(profileSelector.updateButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.nameSuccessToast
    );
    cy.get(profileSelector.userNameInput).verifyVisibleElement(
      "have.value",
      profileText.userName
    );
    common.navigateToManageUsers();
    cy.clearAndType(commonSelectors.inputUserSearch, "dev@tooljet.io");
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
    cy.clearAndType(onboardingSelectors.loginEmailInput, commonText.email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, commonText.password);
    cy.get(onboardingSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      profileText.loginErrorToast
    );

    cy.clearAndType(onboardingSelectors.loginPasswordInput, profileText.newPassword);
    cy.get(onboardingSelectors.signInButton).click();
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

    cy.appUILogin(commonText.email, profileText.password);
    common.logout();
  });
});
