import { commonSelectors } from "Selectors/common";
import { usersSelector } from "Selectors/platform/manageUsers";
import { licenseSelectors } from "Selectors/platform/license";
import { navigateToManageUsers } from "Support/utils/common";
import {
  archiveUserAndVerify,
  bulkUploadUsersViaCSV,
  changeRoleAndExpectLimit,
  changeUserRole,
  createUserAndExpectStatus,
  createUserViaAPI,
  getCurrentCountFromLimitCounter,
  openInviteUserModal,
  verifyLimitCounter,
  verifyLimitReachedModal,
} from "Support/utils/license";
import { cleanAllUsers } from "Support/utils/manageUsers";


describe("License - User Limits", () => {
  const builderEmail = `builder-${Date.now()}@example.com`;
  const thirdBuilderEmail = `builder-${Date.now()}-3@example.com`;
  const thirdBuilderName = `Builder Three ${Date.now()}`;
  const overLimitViewerEmail = `viewer-${Date.now()}-over@example.com`;
  const endUserEmail = `enduser-${Date.now()}@example.com`;

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cleanAllUsers();
  });

  afterEach(() => {
    cleanAllUsers();
  });

  it("should show the builder counter and open the limit-reached modal when inviting past the builder limit", () => {
  
    navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(".css-1mlj61j").type("builder{enter}");
    cy.get(licenseSelectors.limitCounter)
      .should("be.visible")
      .and("contain.text", "/2");
   
    verifyLimitCounter();
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.be.gte(1);
      expect(counts.total).to.equal(2);
    });
    cy.get(commonSelectors.cancelButton).click();
    createUserAndExpectStatus(builderEmail, "builder", 201);

    openInviteUserModal(thirdBuilderName, thirdBuilderEmail, "builder");
    cy.get(usersSelector.buttonInviteUsers).click();
    verifyLimitReachedModal("User limit reached", {
      bodyText: [
        "You've reached your limit for builders and/or end-users.",
        "Builders",
        "End-users",
      ],
    });

    archiveUserAndVerify(builderEmail);
    createUserAndExpectStatus(thirdBuilderEmail, "builder", 201);
    createUserViaAPI(endUserEmail, "end-user");
    changeRoleAndExpectLimit(endUserEmail, "builder");

    changeUserRole(thirdBuilderEmail, "end-user").then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
    });

    changeUserRole(endUserEmail, "builder").then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
    });
  });

  it("should show the end-user counter and open the limit-reached modal when both roles are full", () => {
    createUserAndExpectStatus(builderEmail, "builder", 201);
    bulkUploadUsersViaCSV(49, "end-user", "viewer").then(({ response }) => {
      expect(response.status).to.equal(201);
    });
    cy.wait(2000);

    navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(".css-1mlj61j").type("end-user{enter}");
    cy.get(licenseSelectors.limitCounter)
      .should("be.visible")
      .and("contain.text", "/50");
  
    verifyLimitCounter();
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.be.gte(49);
      expect(counts.total).to.equal(50);
    });
    cy.get(commonSelectors.cancelButton).click();

    createUserAndExpectStatus(endUserEmail, "end-user", 201);

    cy.get(usersSelector.buttonAddUsers).click();
    verifyLimitReachedModal("User limit reached", {
      bodyText: [
        "You've reached your limit for builders and/or end-users.",
        "Builders",
        "End-users",
      ],
    });

    createUserAndExpectStatus(overLimitViewerEmail, "end-user", 451);
  });
});
