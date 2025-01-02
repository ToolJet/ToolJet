import { commonSelectors } from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import {
  bulkUserUpload,
  bulkUserUploadDuplicate,
} from "Support/utils/manageUsers";
import * as common from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { fake } from "Fixtures/fake";

describe("Bulk user upload", () => {
  const data = {};
  const without_name = "cypress/fixtures/bulkUser/without_name - Sheet1.csv";
  const without_email = "cypress/fixtures/bulkUser/without_email - Sheet1.csv";
  const without_group = "cypress/fixtures/bulkUser/without_group - Sheet1.csv";
  const same_email = "cypress/fixtures/bulkUser/same_email - Sheet1.csv";
  const empty_first_and_last_name =
    "cypress/fixtures/bulkUser/empty_first_and_last_name - Sheet1.csv";
  const limit_exceeded_list =
    "cypress/fixtures/bulkUser/500_invite_users - Sheet1.csv";
  const non_existing_group =
    "cypress/fixtures/bulkUser/non_existing_group -Sheet1 .csv";
  const multiple_groups =
    "cypress/fixtures/bulkUser/multiple_groups - Sheet1.csv";
  const without_Role = "cypress/fixtures/bulkUser/without_Role - Sheet1.csv";
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

    bulkUserUploadDuplicate(
      same_email,
      "same_email",
      "Duplicate email found. Please provide a unique email address."
    );

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

    bulkUserUpload(
      without_Role,
      "without_Role",
      "Missing user_role,groups information in 5 row(s);. No users were uploaded, please update and try again."
    );

    //add more groups and verify

    // bulkUserUpload(
    //   multiple_groups,
    //   "multiple_groups",
    //   "Conflicting Group Memberships: User cannot be in both the Admin group and other groups simultaneously."
    // );

    //   );
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
