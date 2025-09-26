import { commonSelectors, inspectorSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import {
  fillUserInviteForm,
  confirmInviteElements,
  fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import {
  addUserMetadata,
  userMetadataOnboarding,
} from "Support/utils/onboarding";
import {
  navigateAndVerifyInspector,
  navigateToInspectorNodes,
} from "Support/utils/inspector";
import {
  navigateToManageUsers,
  logout,
  searchUser,
} from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { enableInstanceSignup } from "Support/utils/manageSSO";
import { onboardingText } from "Texts/onboarding";

const data = {};
const metadata = [["Department", "Engineering"]];

const index = 0;
describe("user invite flow cases", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.ifEnv("Enterprise", () => {
      enableInstanceSignup();
    });
  });

  it("Should verify all elements for user metadata", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    navigateToManageUsers();
    fillUserInviteForm(data.firstName, data.email);
    cy.get(onboardingSelectors.userGroupSelect).should("be.visible").click();
    cy.contains(`[id*="react-select-"]`, onboardingText.builderUserRole)
      .should("be.visible")
      .click();
    cy.get(onboardingSelectors.userGroupSelect)
      .should("contain.text", onboardingText.builderUserRole)
      .click();
    cy.get(onboardingSelectors.userMetadataLabel).should("be.visible");
    cy.get(onboardingSelectors.emptyKeyValueLabel).should("be.visible");
    cy.get(commonSelectors.buttonSelector("add-more"))
      .should("be.visible")
      .click();
    cy.get(onboardingSelectors.encryptedLabel).should("be.visible");
    cy.get(
      onboardingSelectors.keyInputField(onboardingText.userMetadataLabel, index)
    ).should("be.visible");
    cy.get(
      onboardingSelectors.valueInputField(
        onboardingText.userMetadataLabel,
        index
      )
    ).should("be.visible");
  });
  it("Should verify add user metadata and verify on inspector", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    navigateToManageUsers();
    fillUserInviteForm(data.firstName, data.email);
    cy.get(onboardingSelectors.userGroupSelect).should("be.visible").click();
    cy.contains(`[id*="react-select-"]`, onboardingText.builderUserRole)
      .should("be.visible")
      .click();
    cy.get(onboardingSelectors.userGroupSelect)
      .should("contain.text", onboardingText.builderUserRole)
      .click();
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
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );
      cy.get(commonSelectors.signUpButton).should("not.be.disabled");
      cy.get(commonSelectors.signUpButton).click();

      cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
        "have.text",
        commonText.invitePageHeader
      );
      cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
        "have.text",
        commonText.invitePageSubHeader
      );
      cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
        "have.text",
        data.firstName
      );
      cy.wait(3000);
      cy.get(commonSelectors.invitedUseremail).verifyVisibleElement(
        "have.text",
        data.email
      );
      cy.get(commonSelectors.acceptInviteButton)
        .verifyVisibleElement("have.text", commonText.acceptInviteButton)
        .click();
      cy.get(commonSelectors.workspaceName).verifyVisibleElement(
        "have.text",
        "My workspace"
      );
      cy.apiCreateApp(`${fake.companyName}-metadata-App`);
      cy.openApp();
      navigateAndVerifyInspector(
        ["globals", "currentUser", "metadata"],
        metadata,
        `{${metadataCountBefore}}`
      );
      cy.get('[data-cy="editor-page-logo"]').click();
      cy.get('[data-cy="back-to-app-option"]').click();
      cy.apiDeleteApp(`${fake.companyName}-metadata-App`);
      logout();
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.contains("td", data.email)
        .parent()
        .within(() => {
          cy.get("td small").should("have.text", usersText.activeStatus);
          cy.get("td[data-name='meta-header'] .metadata")
            .should("be.visible")
            .and("have.text", "{..}");
        });
    });
  });
  it("Should verify CRUD operation on user metadata and verify on inspector", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    userMetadataOnboarding(
      data.firstName,
      data.email,
      "builder",
      metadata
    ).then((metadataCount) => {
      cy.intercept("GET", "/api/library_apps").as("apiGetLibraryApps");
      cy.wait("@apiGetLibraryApps");
      cy.apiCreateApp(`${fake.companyName}-metadata-App`);
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
    navigateToManageUsers();
    searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
        cy.get("td[data-name='meta-header'] .metadata")
          .should("be.visible")
          .and("have.text", "{..}");
        cy.get('[data-cy="user-actions-button"]').click();
      });
    cy.get('[data-cy="edit-user-details-button"]')
      .verifyVisibleElement("have.text", "Edit user details")
      .click();
    cy.clearAndType(
      onboardingSelectors.keyInputField(
        onboardingText.userMetadataLabel,
        index
      ),
      "updatedKey"
    );
    cy.clearAndType(
      onboardingSelectors.valueInputField(
        onboardingText.userMetadataLabel,
        index
      ),
      "updatedValue"
    );
    cy.get('[data-cy="button-invite-users"]').click();
    logout();
    cy.apiLogin(data.email, "password");
    cy.openApp(`${fake.companyName}-metadata-App`);
    navigateAndVerifyInspector(
      ["globals", "currentUser", "metadata"],
      [["updatedKey", "updatedValue"]],
      `{2}`
    );
    cy.get('[data-cy="editor-page-logo"]').click();
    cy.get('[data-cy="back-to-app-option"]').click();
    cy.apiLogout();
    cy.defaultWorkspaceLogin();
    navigateToManageUsers();
    searchUser(data.email);
    cy.contains("td", data.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", usersText.activeStatus);
        cy.get("td[data-name='meta-header'] .metadata")
          .should("be.visible")
          .and("have.text", "{..}");
        cy.get('[data-cy="user-actions-button"]').click();
      });
    cy.get('[data-cy="edit-user-details-button"]')
      .verifyVisibleElement("have.text", "Edit user details")
      .click();
    cy.get(
      onboardingSelectors.deleteButton(onboardingText.userMetadataLabel, 1)
    ).click();
    cy.get(
      onboardingSelectors.deleteButton(onboardingText.userMetadataLabel, 0)
    ).click();
    cy.get('[data-cy="button-invite-users"]').click();
    cy.apiLogout();
    cy.apiLogin(data.email, "password");
    cy.openApp(`${fake.companyName}-metadata-App`);
    navigateToInspectorNodes(["globals", "currentUser"]);
    cy.get('[data-cy="editor-page-logo"]').click();
    cy.get('[data-cy="back-to-app-option"]').click();

    cy.apiDeleteApp(`${fake.companyName}-metadata-App`);
    cy.apiLogout();
  });
  it("Should verify add all type of user metadata and verify on inspector", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    const metadataList = [
      ["Location", "Remote"],
      ["Project", "ToolJet"],
      ["empty value", ""],
      ["", "emptyKey"],
      ["SpecialCharsKey!@#$", "SpecialCharsValue%^&*"],
    ];
    userMetadataOnboarding(
      data.firstName,
      data.email,
      "builder",
      metadataList
    ).then((metadataCount) => {
      cy.intercept("GET", "/api/library_apps").as("apiGetLibraryApps");
      cy.wait("@apiGetLibraryApps");
      cy.apiCreateApp(`${fake.companyName}-metadataList-App`);
      cy.openApp();
      navigateAndVerifyInspector(
        ["globals", "currentUser", "metadata"],
        metadataList,
        `{${metadataCount}}`
      );
    });
    cy.apiDeleteApp(`${fake.companyName}-metadataList-App`);
    cy.apiLogout();
  });
});
