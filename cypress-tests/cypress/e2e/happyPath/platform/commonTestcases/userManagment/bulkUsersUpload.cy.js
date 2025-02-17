import { commonSelectors } from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { groupsSelector } from "Selectors/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { bulkUserUpload } from "Support/utils/manageUsers";

describe("Bulk User Upload", () => {
  // Test data configuration
  const TEST_FILES = {
    MISSING_NAME: {
      path: "cypress/fixtures/bulkUser/without_name.csv",
      fileName: "without_name",
      error:
        "Missing first_name,last_name,groups information in 2 row(s);. No users were uploaded, please update and try again.",
    },
    MISSING_EMAIL: {
      path: "cypress/fixtures/bulkUser/without_email.csv",
      fileName: "without_email",
      error:
        "Missing email,groups information in 2 row(s);. No users were uploaded, please update and try again.",
    },
    DUPLICATE_EMAIL: {
      path: "cypress/fixtures/bulkUser/same_email.csv",
      fileName: "same_email",
      error: "Duplicate email found. Please provide a unique email address.",
      isDuplicate: true,
    },
    EMPTY_NAMES: {
      path: "cypress/fixtures/bulkUser/empty_first_and_last_name.csv",
      fileName: "empty_first_and_last_name",
      error:
        "Missing first_name,last_name,groups information in 1 row(s);. No users were uploaded, please update and try again.",
    },
    LIMIT_EXCEEDED: {
      path: "cypress/fixtures/bulkUser/500_invite_users.csv",
      fileName: "500_invite_users",
      error: "You can only invite 250 users at a time",
    },
    MISSING_ROLE: {
      path: "cypress/fixtures/bulkUser/without_role.csv",
      fileName: "without_role",
      error:
        "Missing user_role,groups information in 2 row(s);. No users were uploaded, please update and try again.",
    },
    NONEXISTENT_GROUP: {
      path: "cypress/fixtures/bulkUser/non_existing_group.csv",
      fileName: "non_existing_group",
      error: "2 groups doesn't exist. No users were uploaded",
    },
    VALID_USERS: {
      path: "cypress/fixtures/bulkUser/3usersupload.csv",
      fileName: "3usersupload",
      testEmail: "test12@gmail.com",
      successMessage: "3 users are being added",
    },
  };

  beforeEach(() => {
    const firstName = fake.firstName;
    const workspaceName = firstName.toLowerCase();
    cy.apiLogin();
    cy.apiCreateWorkspace(firstName, workspaceName);
    cy.visit(`${workspaceName}`);
    common.navigateToManageUsers();
  });

  it("Should validate error cases for invalid bulk user uploads", () => {
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();

    // Test all error cases
    [
      TEST_FILES.MISSING_ROLE,
      TEST_FILES.MISSING_NAME,
      TEST_FILES.MISSING_EMAIL,
      TEST_FILES.DUPLICATE_EMAIL,
      TEST_FILES.EMPTY_NAMES,
      TEST_FILES.NONEXISTENT_GROUP,
      TEST_FILES.LIMIT_EXCEEDED,
    ].forEach((testCase) => {
      bulkUserUpload(
        testCase.path,
        testCase.fileName,
        testCase.error,
        testCase.isDuplicate
      );
    });
  });

  it("Should successfully upload valid users", () => {
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();

    cy.get(usersSelector.inputFieldBulkUpload).selectFile(
      TEST_FILES.VALID_USERS.path,
      {
        force: true,
      }
    );
    cy.get(commonSelectors.fileSelector).should(
      "contain",
      TEST_FILES.VALID_USERS.fileName
    );
    cy.get(usersSelector.buttonUploadUsers).click();
    cy.get(".go2072408551")
      .should("be.visible")
      .and("have.text", TEST_FILES.VALID_USERS.successMessage);
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
