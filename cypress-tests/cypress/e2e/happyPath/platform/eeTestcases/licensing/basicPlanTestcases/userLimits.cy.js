import { commonSelectors } from "Selectors/common";
import { usersSelector } from "Selectors/manageUsers";
import { navigateToManageUsers } from "Support/utils/common";
import {
  archiveUserAndVerify,
  bulkUploadUsersViaCSV,
  changeRoleAndExpectLimit,
  changeUserRole,
  createUserAndExpectStatus,
  createUserViaAPI,
  openInviteUserModal,
  verifyLimitBanner,
  verifyResourceLimit,
  verifyUpgradeModal,
} from "Support/utils/license";
import { cleanAllUsers } from "Support/utils/manageUsers";

describe("License - User Limits", () => {
  const builderEmail = `builder-${Date.now()}@example.com`;
  const thirdBuilderEmail = `builder-${Date.now()}-3@example.com`;
  const thirdBuilderName = `Builder Three ${Date.now()}`;
  const fiftiethViewerEmail = `viewer-${Date.now()}-50@example.com`;
  const fiftiethViewerName = `Viewer Fiftieth ${Date.now()}`;
  const endUserEmail = `enduser-${Date.now()}@example.com`;
  const secondEndUserEmail = `enduser-${Date.now()}-2@example.com`;

  const allUserEmails = [thirdBuilderEmail, endUserEmail, fiftiethViewerEmail];

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cleanAllUsers();
  });

  afterEach(() => {
    cleanAllUsers();
  });

  it("should enforce builder limit, show upgrade modal, and verify role change restriction", () => {
    openUsersPageAndverifyBasicResourceLimit("builders");

    cy.get(commonSelectors.cancelButton).click();
    verifyUserLimitReachingBanner(
      "Builder limit nearing - 1/2",
      "You're nearing your limit for number of builders in this instance. Upgrade for more. "
    );

    createUserAndExpectStatus(builderEmail, "builder", 201);

    verifyLimitReachedBanner(
      thirdBuilderName,
      thirdBuilderEmail,
      "builder",
      "Builder limit reached",
      "You've reached your limit for number of builders in this instance. Upgrade for more. "
    );

    cy.wait(500);
    cy.get(usersSelector.buttonInviteUsers).click();

    verifyUpgradeModal(
      "You have reached your limit for number of builders.",
      true
    );

    archiveUserAndVerify(builderEmail);

    cy.wait(500);

    createUserAndExpectStatus(thirdBuilderEmail, "builder", 201);

    createUserViaAPI(endUserEmail, "end-user");

    changeRoleAndExpectLimit(endUserEmail, "builder");
  });

  it("should enforce viewer limit, show upgrade modal, and verify role change restriction", () => {
    openUsersPageAndverifyBasicResourceLimit("viewers");

    createUserAndExpectStatus(builderEmail, "builder", 201);

    let bulkViewerEmails = [];
    bulkUploadUsersViaCSV(49, "end-user", "viewer").then(
      ({ response, emails }) => {
        expect(response.status).to.equal(201);
        bulkViewerEmails = emails;
      }
    );

    cy.wait(2000);
    cy.get(commonSelectors.cancelButton).click();
    verifyUserLimitReachingBanner(
      "Nearing limits for builder - 2/2 and end user- 49/50",
      "You're nearing your limit for number of builders & end-users in this instance. Upgrade for more. "
    );

    createUserAndExpectStatus(endUserEmail, "end-user", 201);

    verifyLimitReachedBanner(
      fiftiethViewerName,
      fiftiethViewerEmail,
      "end-user",
      "Builder and End user limit reached",
      "You've reached your limit for number of builders & end-users in this instance. Upgrade for more.  "
    );

    cy.wait(500);
    cy.get(usersSelector.buttonInviteUsers).click();

    verifyUpgradeModal("You have reached your limit for number of users.");

    cy.then(() => {
      archiveUserAndVerify(endUserEmail);
    });

    createUserAndExpectStatus(fiftiethViewerEmail, "end-user", 201);
    cy.wait(500);

    changeUserRole(builderEmail, "end-user");

    openInviteUserModal(thirdBuilderEmail, thirdBuilderEmail, "builder");

    cy.wait(500);
    cy.get(usersSelector.buttonInviteUsers).click();

    verifyUpgradeModal("You have reached your limit for number of users.");
  });
});

const openUsersPageAndverifyBasicResourceLimit = (role) => {
  navigateToManageUsers();
  cy.get(usersSelector.buttonAddUsers).click();
  verifyResourceLimit(role, "basic", "usage");
};

const verifyUserLimitReachingBanner = (expectedHeading, expectedInfoText) => {
  cy.get(commonSelectors.manageGroupsOption).click();
  cy.get(commonSelectors.manageUsersOption).click();
  cy.get(usersSelector.buttonAddUsers).click();
  verifyLimitBanner(expectedHeading, expectedInfoText);
};

const verifyLimitReachedBanner = (
  name,
  email,
  role,
  expectedHeading,
  expectedInfoText
) => {
  openInviteUserModal(name, email, role);
  verifyLimitBanner(expectedHeading, expectedInfoText);
};
