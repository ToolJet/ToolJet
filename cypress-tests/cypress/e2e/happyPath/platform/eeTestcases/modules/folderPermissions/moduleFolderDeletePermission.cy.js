import { commonSelectors } from 'Selectors/common';
import { groupsSelector } from 'Selectors/manageGroups';
import { navigateToManageGroups, viewFolderCardOptions, deleteFolder } from 'Support/utils/common';
import { createGroupsAndAddUserInGroup } from 'Support/utils/manageGroups';
import { openModulesList } from 'Support/utils/platform/modules';
import { uiCreateFolder, uiVerifyFolderCreated } from 'Support/utils/uiPermissions';
import { groupsText } from 'Texts/manageGroups';

describe('Modules — Folder Permissions: Custom Group Delete Override & Ownership', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-delete-${testId}`;
  const wsSlug = wsName;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense('valid');
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

  it("non-owner without moduleFolderDelete cannot delete another user's module folder", () => {
    const folderName = `Admin Owned Module Folder ${testId}-blocked`;
    const userEmail = `qa-folder-delete-blocked-${testId}@example.com`;

    openModulesList();
    uiCreateFolder(folderName);
    uiVerifyFolderCreated(folderName);

    cy.apiFullUserOnboarding('QA Folder Delete Blocked User', userEmail, 'builder', 'password', wsName);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    viewFolderCardOptions(folderName);
    cy.get(commonSelectors.deleteFolderOption(folderName)).should('not.exist');
  });

  it('owner can always delete their own module folder regardless of moduleFolderDelete', () => {
    const folderName = `Own Module Folder ${testId}`;
    const userEmail = `qa-folder-delete-owner-${testId}@example.com`;

    cy.apiFullUserOnboarding('QA Folder Delete Owner User', userEmail, 'builder', 'password', wsName);
    cy.apiLogin(userEmail, 'password');

    openModulesList();
    uiCreateFolder(folderName);
    uiVerifyFolderCreated(folderName);

    deleteFolder(folderName);
    cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');
  });

  it("custom group with moduleFolderDelete ON allows deleting another user's module folder", () => {
    const folderName = `Admin Owned Module Folder ${testId}-allowed`;
    const groupName = `QA Module Folder Delete Allowed Group ${testId}`;
    const userEmail = `qa-folder-delete-allowed-${testId}@example.com`;

    openModulesList();
    uiCreateFolder(folderName);
    uiVerifyFolderCreated(folderName);

    cy.apiFullUserOnboarding('QA Folder Delete Allowed User', userEmail, 'builder', 'password', wsName);
    cy.visit(`/${wsSlug}`);
    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, userEmail);

    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.moduleFolderDeleteCheck).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

    cy.apiLogin(userEmail, 'password');
    openModulesList();
    deleteFolder(folderName);
    cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');
  });
});
