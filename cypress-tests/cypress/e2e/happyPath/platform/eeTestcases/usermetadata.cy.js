import { commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import {
  manageUsersElements,
  fillUserInviteForm,
  confirmInviteElements,
  selectUserGroup,
  inviteUserWithUserGroups,
  inviteUserWithUserRole,
  fetchAndVisitInviteLink,
  inviteUserWithUserRoleAndMetadata,
} from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import { visitWorkspaceInvitation, addNewUser } from "Support/utils/onboarding";

import {
  navigateToManageUsers,
  logout,
  searchUser,
  navigateToManageGroups,
} from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { onboardingSelectors } from "Selectors/onboarding";
describe("User Metadata and Validation", () => {
  const name = "Test User";
  const email = `testuser+${Date.now()}@example.com`;
  const metadata = {
    department: "Engineering",
    value: "QA",
  };
  const data = {};
  beforeEach(() => {
    // data = {
    //   workspaceName: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
    //   workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
    //   appName: `${fake.companyName}-IE-App`,
    //   appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
    //   dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    // };
    cy.apiLogin();
    cy.visit("/");
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonSelectors.workspaceSettings).click();

  });

  it("should invite user with metadata and validate values", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    navigateToManageUsers();
    inviteUserWithUserRoleAndMetadata("test", email, "admin");
  });


  // it.only("should invite user with metadata and validate values", () => {
  //   cy.pause();
  //   cy.addUserWithMetadata(name, email, metadata);
  //   cy.searchUser(email);
  //   cy.get(commonSelectors.userRow(email)).should("be.visible");

  //   Object.entries(metadata).forEach(([key, value]) => {
  //     const isSensitive = ["phone", "ssn"].includes(key);
  //     if (isSensitive) {
  //       cy.get(commonSelectors.userMetadataCell(email, key)).should("contain", "••••");
  //       cy.pinInspector();
  //       cy.get(commonSelectors.inspectorMetadataField(key)).should("contain", value);
  //     } else {
  //       cy.get(commonSelectors.userMetadataCell(email, key)).should("contain", value);
  //     }
  //   });
  // });

  //   it("should allow editing of user metadata", () => {
  //     const updates = { department: "Product", role: "Developer" };
  //     cy.editUserMetadata(email, updates);

  //     Object.entries(updates).forEach(([key, value]) => {
  //       cy.get(commonSelectors.userMetadataCell(email, key)).should("contain", value);
  //     });
  //   });

  //   it("should validate tooltip masking for sensitive metadata", () => {
  //     cy.get(commonSelectors.userMetadataCell(email, "ssn")).then(($el) => {
  //       cy.verifyTooltip($el, "Sensitive data. Hover to view.");
  //     });
  //   });

  //   it("should handle pagination and locate user", () => {
  //     cy.navigateToManageUsers();
  //     cy.manageUsersPagination(email);
  //     cy.get(commonSelectors.userRow(email)).should("be.visible");
  //   });
});

