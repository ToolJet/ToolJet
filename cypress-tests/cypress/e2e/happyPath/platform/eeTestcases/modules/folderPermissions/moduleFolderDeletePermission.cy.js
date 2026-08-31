import { commonSelectors } from 'Selectors/common';
import { deleteFolder, viewFolderCardOptions } from 'Support/utils/common';
import { apiAddUserToGroup, apiCreateGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';
import { uiVerifyFolderCreated } from 'Support/utils/uiPermissions';

describe('Modules — Folder Permissions: Custom Group Delete Override & Ownership', () => {
  const testId = Date.now();
  const wsName = `folder-delete-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    // Strip the builder ROLE's own moduleFolderDelete — delete access for a
    // folder a test user doesn't own comes only from that test's own custom group.
    cy.apiUpdateGroupPermission('builder', { moduleFolderDelete: false });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.intercept('DELETE', '/api/folders/*').as('folderDeleted');
  });

  const createFolder = (folderName) => {
    cy.apiCreateModuleFolder(folderName);
    openModulesList();
    uiVerifyFolderCreated(folderName);
  };

  it("non-owner is blocked, ownership overrides it, and a custom group grant then unlocks deleting another user's module folder", () => {
    const adminFolderName = `Admin Owned Module Folder ${testId}`;
    const builderFolderName = `Builder Own Module Folder ${testId}`;
    const groupName = `QA Module Folder Delete Group ${testId}`;
    const userEmail = `qa-folder-delete-${testId}@example.com`;

    // Admin creates a folder the builder does not own.
    createFolder(adminFolderName);
    cy.apiFullUserOnboarding('QA', userEmail, 'builder', 'password', wsName);

    // Non-owner without moduleFolderDelete cannot delete the admin's folder.
    openModulesList();
    viewFolderCardOptions(adminFolderName);
    cy.get(commonSelectors.deleteFolderOption(adminFolderName)).should('not.exist');

    // Owner can always delete their own folder regardless of moduleFolderDelete.
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
    cy.apiUpdateGroupPermission(groupName, { moduleFolderDelete: true });

    cy.apiLogout();
    cy.apiLogin(userEmail, 'password');

    // Custom group with moduleFolderDelete ON allows deleting another user's folder.
    openModulesList();
    deleteFolder(adminFolderName);
    cy.get(commonSelectors.folderListcard(adminFolderName)).should('not.exist');
  });
});
