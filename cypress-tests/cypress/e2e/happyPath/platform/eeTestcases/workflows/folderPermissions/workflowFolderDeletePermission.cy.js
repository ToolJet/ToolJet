import { commonSelectors } from 'Selectors/common';
import { deleteFolder, viewFolderCardOptions } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openWorkflowsList } from 'Support/utils/platform/folderPermissions';
import { uiVerifyFolderCreated } from 'Support/utils/uiPermissions';

describe('Workflows — Folder Permissions: Custom Group Delete Override & Ownership', () => {
  // The workspace is created once in before(), so it keeps a suite-level id.
  // testId is per attempt: a retry reruns the test body, and reusing folder /
  // group / user names from the failed attempt throws 409 and hides the real cause.
  const wsName = `wf-folder-delete-${Date.now()}`;
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

    // Strip the builder ROLE's own workflowFolderDelete — delete access for a
    // folder a test user doesn't own comes only from that test's own custom group.
    cy.apiUpdateGroupPermission('builder', { workflowFolderDelete: false });
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
    cy.apiCreateWorkflowFolder(folderName);
    openWorkflowsList();
    uiVerifyFolderCreated(folderName);
  };

  it("non-owner is blocked, ownership overrides it, and a custom group grant then unlocks deleting another user's workflow folder", () => {
    const adminFolderName = `Admin Owned Workflow Folder ${testId}`;
    const builderFolderName = `Builder Own Workflow Folder ${testId}`;
    const groupName = `QA Workflow Folder Delete Group ${testId}`;
    const userEmail = `wf-folder-delete-${testId}@example.com`;

    // Admin creates a folder the builder does not own.
    createFolder(adminFolderName);
    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);

    // Non-owner without workflowFolderDelete cannot delete the admin's folder.
    openWorkflowsList();
    viewFolderCardOptions(adminFolderName);
    cy.get(commonSelectors.deleteFolderOption(adminFolderName)).should('not.exist');

    // Owner can always delete their own folder regardless of workflowFolderDelete.
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
    cy.apiUpdateGroupPermission(groupName, { workflowFolderDelete: true });

    cy.apiLogout();
    cy.apiLogin(userEmail, 'password');

    // Custom group with workflowFolderDelete ON allows deleting another user's folder.
    openWorkflowsList();
    deleteFolder(adminFolderName);
    cy.get(commonSelectors.folderListcard(adminFolderName)).should('not.exist');
  });
});
