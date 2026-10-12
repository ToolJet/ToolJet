import { commonSelectors } from 'Selectors/common';
import { deleteFolder, viewFolderCardOptions } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openAppsDashboard } from 'Support/utils/platform/folderPermissions';
import { uiVerifyFolderCreated } from 'Support/utils/uiPermissions';

describe('Apps — Folder Permissions: Custom Group Delete Override & Ownership', () => {
  // The workspace is created once in before(), so it keeps a suite-level id.
  // testId is per attempt: a retry reruns the test body, and reusing folder /
  // group / user names from the failed attempt throws 409 and hides the real cause.
  const wsName = `app-folder-delete-${Date.now()}`;
  const wsSlug = wsName;
  let testId;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Strip the builder ROLE's own folderDelete — delete access for a folder a
    // test user doesn't own comes only from that test's own custom group.
    cy.apiUpdateGroupPermission('builder', { folderDelete: false });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    testId = Date.now();
    cy.apiLogin();
    cy.intercept('DELETE', '/api/folders/*').as('folderDeleted');
  });

  const createFolder = (folderName) => {
    cy.apiCreateAppFolder(folderName);
    openAppsDashboard();
    uiVerifyFolderCreated(folderName);
  };

  it("non-owner is blocked, ownership overrides it, and a custom group grant then unlocks deleting another user's app folder", () => {
    const adminFolderName = `Admin Owned App Folder ${testId}`;
    const builderFolderName = `Builder Own App Folder ${testId}`;
    const groupName = `QA App Folder Delete Group ${testId}`;
    const userEmail = `app-folder-delete-${testId}@example.com`;

    // Admin creates a folder the builder does not own.
    createFolder(adminFolderName);
    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);

    // Non-owner without folderDelete cannot delete the admin's folder.
    openAppsDashboard();
    viewFolderCardOptions(adminFolderName);
    cy.get(commonSelectors.deleteFolderOption(adminFolderName)).should('not.exist');

    // Owner can always delete their own folder regardless of folderDelete.
    createFolder(builderFolderName);
    deleteFolder(builderFolderName);
    cy.get(commonSelectors.folderListcard(builderFolderName)).should('not.exist');

    cy.apiLogout();
    cy.apiLogin();

    // Grant delete access to the admin's folder via a custom group — set up
    // entirely via API, no Manage Groups UI involved.
    apiCreateGroup(groupName).then((groupId) => {
      apiAddUserToGroup(groupId, userEmail);
    });
    cy.apiUpdateGroupPermission(groupName, { folderDelete: true });

    cy.apiLogout();
    cy.apiLogin(userEmail, 'password');

    // Custom group with folderDelete ON allows deleting another user's folder.
    openAppsDashboard();
    deleteFolder(adminFolderName);
    cy.get(commonSelectors.folderListcard(adminFolderName)).should('not.exist');
  });
});
