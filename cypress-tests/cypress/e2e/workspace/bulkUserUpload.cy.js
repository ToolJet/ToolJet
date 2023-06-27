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
  data.firstName = fake.firstName;
  data.email = fake.email.toLowerCase();

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

  before(() => {
    userSignUp(data.firstName, data.email, "Test");
    common.logout();
  });
  beforeEach(() => {
    cy.login(data.email, usersText.password);
    common.navigateToManageUsers();
  });

  it("Verfiy bulk user upload invalid files", () => {
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();

    bulkUserUpload(
      without_name,
      "without_name",
      "Invalid row(s): [first_name, last_name] in [11] row(s). No users were uploaded."
    );
    bulkUserUpload(
      without_email,
      "without_email",
      "Invalid row(s): [email] in [11] row(s). No users were uploaded."
    );
    bulkUserUpload(
      without_group,
      "without_group",
      "Invalid row(s): [groups] in [5] row(s). No users were uploaded."
    );
    bulkUserUpload(
      same_email,
      "same_email",
      "Duplicate email found. Please provide a unique email address."
    );
    bulkUserUpload(
      invalid_group_name,
      "invalid_group_name",
      "11 groups doesn't exist. No users were uploaded"
    );
    bulkUserUpload(
      empty_first_and_last_name,
      "empty_first_and_last_name",
      "Invalid row(s): [first_name, last_name] in [1] row(s). No users were uploaded."
    );
    bulkUserUpload(
      limit_exceeded_list,
      "500_invite_users",
      "You can only invite 250 users at a time"
    );
    bulkUserUpload(
      non_existing_group,
      "non_existing_group",
      "1 group doesn't exist. No users were uploaded"
    );
    bulkUserUpload(
      multiple_groups,
      "multiple_groups",
      "Conflicting Group Memberships: User cannot be in both the Admin group and other groups simultaneously."
    );

    cy.get(usersSelector.inputFieldBulkUpload).selectFile(without_firstName, {
      force: true,
    });
    cy.get(usersSelector.uploadedFileData).should(
      "contain",
      "without_firstname"
    );
    cy.get(usersSelector.buttonUploadUsers).click();
    cy.get(".go2072408551")
      .should("be.visible")
      .and("have.text", "5 users are being added");

    cy.wait(1000);

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();
    cy.get(usersSelector.inputFieldBulkUpload).selectFile(without_lastName, {
      force: true,
    });
    cy.get(usersSelector.uploadedFileData).should(
      "contain",
      "without_lastname"
    );
    cy.get(usersSelector.buttonUploadUsers).click();
    cy.get(".go2072408551")
      .should("be.visible")
      .and("have.text", "5 users are being added");
  });

  it("Verify bulk user upload functionality", () => {
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();

    cy.get(usersSelector.inputFieldBulkUpload).selectFile(invite_users, {
      force: true,
    });
    cy.get(usersSelector.uploadedFileData).should("contain", "invite_users");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();
    cy.get(usersSelector.inputFieldBulkUpload).selectFile(invite_users, {
      force: true,
    });
    cy.get(usersSelector.buttonUploadUsers).click();
    cy.get(".go2072408551")
      .should("be.visible")
      .and("have.text", "250 users are being added");
    cy.wait(500);
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
