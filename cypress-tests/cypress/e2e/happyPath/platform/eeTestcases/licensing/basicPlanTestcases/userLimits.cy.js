import { commonSelectors } from "Selectors/common";
import { usersSelector } from "Selectors/platform/manageUsers";
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
import { cleanAllUsers } from "Support/utils/manageUsers";

describe("License - User Limits", () => {
  const builderEmail = `builder-${Date.now()}@example.com`;
  const thirdBuilderEmail = `builder-${Date.now()}-3@example.com`;
  const thirdBuilderName = `Builder Three ${Date.now()}`;
  const tenthViewerEmail = `viewer-${Date.now()}-10@example.com`;
  const tenthViewerName = `Viewer Tenth ${Date.now()}`;
  const endUserEmail = `enduser-${Date.now()}@example.com`;
  const secondEndUserEmail = `enduser-${Date.now()}-2@example.com`;

  const allUserEmails = [thirdBuilderEmail, endUserEmail, tenthViewerEmail];

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

    createUserAndExpectStatus(builderEmail, "builder", 451);

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

    createUserViaAPI(endUserEmail, "end-user");

    changeRoleAndExpectLimit(endUserEmail, "builder");
  });

  it("should enforce viewer limit, show upgrade modal, and verify role change restriction", () => {
    openUsersPageAndverifyBasicResourceLimit("viewers");

    let bulkViewerEmails = [];
    bulkUploadUsersViaCSV(9, "end-user", "viewer").then(
      ({ response, emails }) => {
        expect(response.status).to.equal(201);
        bulkViewerEmails = emails;
      }
    );

    cy.wait(2000);

    createUserAndExpectStatus(endUserEmail, "end-user", 201);

    verifyLimitReachedBanner(
      tenthViewerName,
      tenthViewerEmail,
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

    createUserAndExpectStatus(tenthViewerEmail, "end-user", 201);
    cy.wait(500);

    /* Workaround: the upgrade modal only renders once per page load, so reload
       before the second limit-reached invite. Remove once the modal bug is fixed. */
    cy.reload();
    cy.get(usersSelector.buttonAddUsers).click();

    openInviteUserModal(thirdBuilderName, thirdBuilderEmail, "end-user");

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
