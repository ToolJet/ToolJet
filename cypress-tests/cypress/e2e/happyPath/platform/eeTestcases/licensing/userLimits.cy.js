import { usersSelector } from "Selectors/manageUsers";
import { navigateToManageUsers } from "Support/utils/common";
import {
  archiveUserAndVerify,
  bulkUploadUsersViaCSV,
  changeRoleAndExpectLimit,
  createUserAndExpectStatus,
  createUserViaAPI,
  openInviteUserModal,
  verifyLimitBanner,
  verifyResourceLimit,
  verifyUpgradeModal,
} from "Support/utils/license";

describe("License - User Limits", () => {
  const builderEmail = `builder-${Date.now()}@test.com`;
  const thirdBuilderEmail = `builder-${Date.now()}-3@test.com`;
  const thirdBuilderName = `Builder Three ${Date.now()}`;
  const fiftiethViewerEmail = `viewer-${Date.now()}-50@test.com`;
  const fiftiethViewerName = `Viewer Fiftieth ${Date.now()}`;
  const endUserEmail = `enduser-${Date.now()}@test.com`;

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("should enforce builder limit, show upgrade modal, and verify role change restriction", () => {
    navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();

    verifyResourceLimit("builders", "basic", "usage");
    createUserAndExpectStatus(builderEmail, "builder", 201);

    cy.wait(500);

    createUserAndExpectStatus(thirdBuilderEmail, "builder", 451);

    openInviteUserModal(thirdBuilderName, thirdBuilderEmail, "builder");

    verifyLimitBanner(
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
    navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();

    verifyResourceLimit("viewers", "basic", "usage");

    let bulkViewerEmails = [];
    bulkUploadUsersViaCSV(49, "end-user", "viewer").then(
      ({ response, emails }) => {
        expect(response.status).to.equal(201);
        bulkViewerEmails = emails;
      }
    );

    cy.wait(2000);
    createUserAndExpectStatus(fiftiethViewerEmail, "end-user", 451);

    openInviteUserModal(fiftiethViewerName, fiftiethViewerEmail, "end-user");

    verifyLimitBanner(
      "Builder and End user limit reached",
      "You've reached your limit for number of builders & end-users in this instance. Upgrade for more.  "
    );

    cy.wait(500);
    cy.get(usersSelector.buttonInviteUsers).click();

    verifyUpgradeModal("You have reached your limit for number of users.");

    cy.then(() => {
      archiveUserAndVerify(endUserEmail);
    });

    cy.wait(500);

    createUserAndExpectStatus(fiftiethViewerEmail, "end-user", 201);

    //update after fix
    // changeRoleAndExpectLimit(thirdBuilderEmail, "end-user");
  });
});
