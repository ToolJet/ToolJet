import { commonSelectors, inspectorSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import {
  fillUserInviteForm,
  confirmInviteElements,
  fetchAndVisitInviteLink,
  verifyUserStatusAndMetadata,
  openEditUserDetails,
} from "Support/utils/manageUsers";
import {
  addUserMetadata,
  userMetadataOnboarding,
  verifyUserMetadataElements,
  selectUserGroup,
} from "Support/utils/onboarding";
import {
  navigateAndVerifyInspector,
  navigateToInspectorNodes,
} from "Support/utils/inspector";
import { navigateToManageUsers, logout } from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { onboardingText } from "Texts/onboarding";

const data = {};
const metadata = [["Department", "Engineering"]];
const index = 0;

describe("user invite flow cases", () => {
  beforeEach(() => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = fake.companyName;
    cy.defaultWorkspaceLogin();
    cy.viewport(1800, 1800);
  });

  it("Should verify all elements for user metadata", () => {
    navigateToManageUsers();

    fillUserInviteForm(data.firstName, data.email);

    selectUserGroup(onboardingText.builderUserRole);

    verifyUserMetadataElements(index);
  });

  it("Should verify add user metadata and verify on inspector", () => {
    navigateToManageUsers();

    fillUserInviteForm(data.firstName, data.email);

    selectUserGroup(onboardingText.builderUserRole);

    cy.get(onboardingSelectors.userMetadataLabel).should("be.visible");
    cy.get(onboardingSelectors.emptyKeyValueLabel).should("be.visible");

    addUserMetadata(metadata);

    cy.get(
      onboardingSelectors.deleteButton(
        onboardingText.userMetadataLabel,
        index + 1
      )
    ).should("be.visible");

    cy.get(".table-content-wrapper .row-container").then(($rows) => {
      const metadataCountBefore = $rows.length;

      cy.get(usersSelector.buttonInviteUsers).click();
      cy.wait(2000);

      fetchAndVisitInviteLink(data.email);

      confirmInviteElements(data.email);

      cy.waitForElement(onboardingSelectors.loginPasswordInput);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.waitForElement(commonSelectors.signUpButton);
      cy.get(commonSelectors.signUpButton).click();
      cy.get(commonSelectors.acceptInviteButton).click();

      cy.get(commonSelectors.workspaceName).verifyVisibleElement(
        "have.text",
        "My workspace"
      );
      cy.apiCreateApp(`${data.appName}-metadata-App`);
      cy.openApp();

      navigateAndVerifyInspector(
        ["globals", "currentUser", "metadata"],
        metadata,
        `{${metadataCountBefore}}`
      );
      cy.get('[data-cy="editor-page-logo"]').click();
      cy.get('[data-cy="back-to-app-option"]').click();

      cy.apiDeleteApp();

      logout();

      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      verifyUserStatusAndMetadata(data.email, usersText.activeStatus, "{..}");
    });
  });

  it("Should verify CRUD operation on user metadata and verify on inspector", () => {
    userMetadataOnboarding(
      data.firstName,
      data.email,
      "builder",
      metadata
    ).then((metadataCount) => {
      cy.intercept("GET", "/api/license/access").as("apiGetLicenseAccess");
      cy.wait("@apiGetLicenseAccess");
      cy.apiCreateApp(`${data.appName}-metadata-App`);
      cy.openApp();
      navigateAndVerifyInspector(
        ["globals", "currentUser", "metadata"],
        metadata,
        `{${metadataCount}}`
      );
    });

    cy.get('[data-cy="editor-page-logo"]').click();
    cy.get('[data-cy="back-to-app-option"]').click();

    logout();

    cy.defaultWorkspaceLogin();

    openEditUserDetails(data.email);

    cy.clearAndType(
      onboardingSelectors.keyInputField(
        onboardingText.userMetadataLabel,
        index
      ),
      "updatedkey"
    );
    cy.clearAndType(
      onboardingSelectors.valueInputField(
        onboardingText.userMetadataLabel,
        index
      ),
      "updatedvalue"
    );
    cy.get('[data-cy="button-invite-users"]').click();

    logout();

    cy.apiLogin(data.email, "password");
    cy.openApp(`${data.appName}-metadata-App`);

    navigateAndVerifyInspector(
      ["globals", "currentUser", "metadata"],
      [["updatedkey", `"updatedvalue"`]],
      `{2}`
    );

    cy.get('[data-cy="editor-page-logo"]').click();
    cy.get('[data-cy="back-to-app-option"]').click();

    cy.apiLogout();

    cy.defaultWorkspaceLogin();
    openEditUserDetails(data.email);

    cy.get(
      onboardingSelectors.deleteButton(onboardingText.userMetadataLabel, 1)
    ).click();
    cy.get(
      onboardingSelectors.deleteButton(onboardingText.userMetadataLabel, 0)
    ).click();
    cy.get('[data-cy="button-invite-users"]').click();

    cy.apiLogout();

    cy.apiLogin(data.email, "password");
    cy.openApp(`${data.appName}-metadata-App`);

    navigateToInspectorNodes(["globals", "currentUser"]);
    cy.get('[data-cy="editor-page-logo"]').click();
    cy.get('[data-cy="back-to-app-option"]').click();

    cy.apiDeleteApp();
    cy.apiLogout();
  });

  it("Should verify add all type of user metadata and verify on inspector", () => {
    const metadataList = [
      ["Location", "Remote"],
      ["Project", "ToolJet"],
      ["empty value", ""],
      ["", "emptyKey"],
      //[`"SpecialCharsKey!@#$"`, "SpecialCharsValue%^&*"],
    ];

    userMetadataOnboarding(
      data.firstName,
      data.email,
      "builder",
      metadataList
    ).then((metadataCount) => {
      cy.intercept("GET", "/api/license/access").as("apiGetLicenseAccess");
      cy.wait("@apiGetLicenseAccess");

      cy.apiCreateApp(`${data.appName}-metadataList-App`);
      cy.openApp();

      navigateAndVerifyInspector(
        ["globals", "currentUser", "metadata"],
        metadataList,
        `{${metadataCount}}`
      );
    });

    cy.apiDeleteApp();

    cy.apiLogout();
  });
});
