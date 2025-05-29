import { commonSelectors } from "Selectors/common";
import { usersSelector } from "Selectors/manageUsers";
import { groupsSelector } from "Selectors/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { bulkUserUpload } from "Support/utils/manageUsers";

// Helper to resolve correct test data based on env
const getFile = (fileGroup) => {
  const env = Cypress.env("envVar");
  return env === "Enterprise" || env === "Cloud" ? fileGroup.default : fileGroup.alt;
};

describe("Bulk User Upload", () => {
  const TEST_FILES = {
    MISSING_NAME: {
      default: {
        path: "cypress/fixtures/bulkUser/missing_name.csv",
        fileName: "missing_name",
        error: "Missing first_name,last_name,groups information in 2 row(s);. No users were uploaded, please update and try again.",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/missing_name_ee.csv",
        fileName: "missing_name_ee",
        error: "Missing first_name,last_name,groups,metadata,userMetadata information in 2 row(s);. No users were uploaded, please update and try again.",
      },
    },
    MISSING_EMAIL: {
      default: {
        path: "cypress/fixtures/bulkUser/missing_email.csv",
        fileName: "missing_email",
        error: "Missing email,groups information in 2 row(s);. No users were uploaded, please update and try again.",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/missing_email_ee.csv",
        fileName: "missing_email_ee",
        error: "Missing first_name,last_name,groups,metadata,userMetadata information in 2 row(s);. No users were uploaded, please update and try again.",
      },
    },
    DUPLICATE_EMAIL: {
      default: {
        path: "cypress/fixtures/bulkUser/same_email.csv",
        fileName: "same_email",
        error: "Duplicate email found. Please provide a unique email address.",
        isDuplicate: true,
      },
      alt: {
        path: "cypress/fixtures/bulkUser/same_email_ee.csv",
        fileName: "same_email_ee",
        error: "Duplicate email found. Please provide a unique email address.",
        isDuplicate: true,
      },
    },
    EMPTY_NAMES: {
      default: {
        path: "cypress/fixtures/bulkUser/empty_names.csv",
        fileName: "empty_names",
        error: "Missing first_name,last_name,groups information in 1 row(s);. No users were uploaded, please update and try again.",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/empty_names_ee.csv",
        fileName: "empty_names_ee",
        error: "Missing first_name,last_name,groups,metadata,userMetadata information in 1 row(s);. No users were uploaded, please update and try again.",
      },
    },
    LIMIT_EXCEEDED: {
      default: {
        path: "cypress/fixtures/bulkUser/limit_exceeded.csv",
        fileName: "limit_exceeded",
        error: "You can only invite 250 users at a time",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/limit_exceeded_ee.csv",
        fileName: "limit_exceeded_ee",
        error: "You can only invite 250 users at a time",
      },
    },
    MISSING_ROLE: {
      default: {
        path: "cypress/fixtures/bulkUser/missing_role.csv",
        fileName: "missing_role",
        error: "Missing user_role,groups information in 2 row(s);. No users were uploaded, please update and try again.",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/missing_role_ee.csv",
        fileName: "missing_role_ee",
        error: "Missing user_role,groups,metadata,userMetadata information in 2 row(s);. No users were uploaded, please update and try again.",
      },
    },
    NONEXISTENT_GROUP: {
      default: {
        path: "cypress/fixtures/bulkUser/non_existing_group.csv",
        fileName: "non_existing_group",
        error: "2 groups doesn't exist. No users were uploaded",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/non_existing_group_ee.csv",
        fileName: "non_existing_group_ee",
        error: "2 groups doesn't exist. No users were uploaded",
      },
    },
    VALID_USERS: {
      default: {
        path: "cypress/fixtures/bulkUser/3_users_upload.csv",
        fileName: "3_users_upload",
        successMessage: "3 users are being added",
        email: "test12@gmail.com",
      },
      alt: {
        path: "cypress/fixtures/bulkUser/3_users_upload_ee.csv",
        fileName: "3_users_upload_ee",
        successMessage: "3 users are being added",
        email: "test12@gmail.com",
      },
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

    [
      TEST_FILES.MISSING_ROLE,
      TEST_FILES.MISSING_NAME,
      TEST_FILES.MISSING_EMAIL,
      TEST_FILES.DUPLICATE_EMAIL,
      TEST_FILES.EMPTY_NAMES,
      TEST_FILES.NONEXISTENT_GROUP,
      TEST_FILES.LIMIT_EXCEEDED,
    ].forEach((testCaseGroup) => {
      const testCase = getFile(testCaseGroup);
      bulkUserUpload(
        testCase.path,
        testCase.fileName,
        testCase.error,
        testCase.isDuplicate
      );
    });
  });

  it("Should successfully upload valid users", () => {
    const file = getFile(TEST_FILES.VALID_USERS);
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(usersSelector.buttonUploadCsvFile).click();

    cy.get(usersSelector.inputFieldBulkUpload).selectFile(file.path, {
      force: true,
    });

    cy.get(commonSelectors.fileSelector).should("contain", file.fileName);
    cy.get(usersSelector.buttonUploadUsers).click();
    cy.get(".go2072408551")
      .should("be.visible")
      .and("have.text", file.successMessage);

    common.searchUser(file.email);
    cy.contains("td", file.email)
      .parent()
      .within(() => {
        cy.get("td small").should("have.text", "invited");
      });

    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink("Admin")).click();
    cy.get(groupsSelector.usersLink).click();
    cy.contains(file.email).should("be.visible");
  });
});
