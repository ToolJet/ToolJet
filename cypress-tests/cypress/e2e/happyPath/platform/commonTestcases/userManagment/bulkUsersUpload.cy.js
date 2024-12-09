import { commonSelectors } from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { bulkUserUpload } from "Support/utils/manageUsers";
import * as common from "Support/utils/common";
import { path } from "Texts/common";
import { groupsSelector } from "Selectors/manageGroups";
import { fake } from "Fixtures/fake";
import { userSignUp } from "Support/utils/onboarding";

describe("Bulk user upload", () => {
  const data = {};
  const without_name = "cypress/fixtures/bulkUser/without_name - Sheet1.csv";
  const without_email = "cypress/fixtures/bulkUser/without_email - Sheet1.csv";
  const without_group = "cypress/fixtures/bulkUser/without_group - Sheet1.csv";
  const same_email = "cypress/fixtures/bulkUser/same_email - Sheet1.csv";
  const invalid_group_name =
    "cypress/fixtures/bulkUser/invalid_group_name - Sheet1.csv";
  const empty_first_and_last_name =
    "cypress/fixtures/bulkUser/empty_first_and_last_name - Sheet1.csv";
  const limit_exceeded_list =
    "cypress/fixtures/bulkUser/500_invite_users - Sheet1.csv";
  const non_existing_group =
    "cypress/fixtures/bulkUser/non_existing_group -Sheet1 .csv";
  const multiple_groups =
    "cypress/fixtures/bulkUser/multiple_groups - Sheet1.csv";
  const without_firstName =
    "cypress/fixtures/bulkUser/without_firstname - Sheet1.csv";
  const without_lastName =
    "cypress/fixtures/bulkUser/without_lastname - Sheet1.csv";
  const invite_users = "cypress/fixtures/bulkUser/invite_users - Sheet1 .csv";
  const Validinvite = "cypress/fixtures/bulkUser/10usersupload.csv";

  it("Verfiy bulk user upload invalid files", () => {
    data.firstName = fake.firstName;
    data.workspaceName = data.firstName.toLowerCase();

    cy.apiLogin();
    cy.apiCreateWorkspace(data.firstName, data.workspaceName);
    cy.visit(`${data.workspaceName}`);

    common.navigateToManageUsers();

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();
    bulkUserUpload(
      without_name,
      "without_name",
      "Missing first_name,last_name,groups information in 10 row(s);. No users were uploaded, please update and try again."
    );

    bulkUserUpload(
      without_email,
      "without_email",
      "Missing email,groups information in 10 row(s);. No users were uploaded, please update and try again."
    );
    // bulkUserUpload(
    //   without_group,
    //   "without_group",
    //   "Invalid row(s): [groups] in [5] row(s). No users were uploaded."
    // );

    //Add automation for modal data-cy="close-button"
    // bulkUserUpload(
    //   same_email,
    //   "same_email",
    //   "Duplicate email found. Please provide a unique email address."
    // );

    // bulkUserUpload(
    //   invalid_group_name,
    //   "invalid_group_name",
    //   "11 groups doesn't exist. No users were uploaded"
    // );
    bulkUserUpload(
      empty_first_and_last_name,
      "empty_first_and_last_name",
      "Missing first_name,last_name,groups information in 1 row(s);. No users were uploaded, please update and try again."
    );
    bulkUserUpload(
      limit_exceeded_list,
      "500_invite_users",
      "You can only invite 250 users at a time"
    );

    bulkUserUpload(
      non_existing_group,
      "non_existing_group",
      "2 groups doesn't exist. No users were uploaded"
    );

    //add more groups and verify

    // bulkUserUpload(
    //   multiple_groups,
    //   "multiple_groups",
    //   "Conflicting Group Memberships: User cannot be in both the Admin group and other groups simultaneously."
    // );

    // cy.get(usersSelector.inputFieldBulkUpload).selectFile(without_firstName, {
    //   force: true,
    // });
    // cy.get(usersSelector.uploadedFileData).should(
    //   "contain",
    //   "without_firstname"
    // );
    // cy.get(usersSelector.buttonUploadUsers).click();
    // cy.get(".go2072408551")
    //   .should("be.visible")
    //   .and("have.text", "Missing first_name,user_role,groups information in 5 row(s);. No users were uploaded, please update and try again.Missing first_name,user_role,groups information in 5 row(s);. No users were uploaded, please update and try again.");

    //   cy.wait(5000);
    //   // cy.get(usersSelector.buttonAddUsers).click();
    //   cy.get(usersSelector.buttonUploadCsvFile).click();
    //   cy.get(usersSelector.inputFieldBulkUpload).selectFile(without_lastName, {
    //     force: true,
    //   });
    //   cy.get(usersSelector.uploadedFileData).should(
    //     "contain",
    //     "without_lastname"
    //   );
    //   cy.get(usersSelector.buttonUploadUsers).click();
    //   cy.get(".go2072408551")
    //     .should("be.visible")
    //     .and("have.text", "Missing last_name,user_role,groups information in 5 row(s);. No users were uploaded, please update and try again.Missing last_name,user_role,groups information in 5 row(s);. No users were uploaded, please update and try again.");
  });

  it("Verify bulk user upload functionality", () => {
    data.firstName = fake.firstName;
    data.workspaceName = data.firstName.toLowerCase();

    cy.apiLogin();
    cy.apiCreateWorkspace(data.firstName, data.workspaceName);
    cy.visit(`${data.workspaceName}`);
    common.navigateToManageUsers();

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();

    cy.get(usersSelector.inputFieldBulkUpload).selectFile(Validinvite, {
      force: true,
    });
    cy.get(commonSelectors.fileSelector).should("contain", " 10usersupload");
    cy.get(usersSelector.buttonUploadUsers).click();
    cy.get(".go2072408551")
      .should("be.visible")
      .and("have.text", "10 users are being added");
    common.searchUser("test12@gmail.com");
    cy.contains("td", "test12@gmail.com")
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", "invited");
      });
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink("Admin")).click();
    cy.get(groupsSelector.usersLink).click();
    cy.contains("test12@gmail.com").should("be.visible");
  });
});
