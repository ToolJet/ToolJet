import { commonSelectors } from 'Selectors/common';
import { deleteFolder, viewFolderCardOptions } from 'Support/utils/common';
import { openAppsDashboard } from 'Support/utils/platform/folderPermissions';
import { uiCreateFolder, uiVerifyFolderCreated } from 'Support/utils/uiPermissions';

describe('Apps — Folder Permissions: Default Role Access', () => {
  const testId = Date.now();

  // A fresh workspace per test: the slug is unique-constrained, so a shared
  // fixed name would make every test after the first fail its beforeEach with
  // "This workspace slug is already taken."
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `app-folder-role-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.intercept('DELETE', '/api/folders/*').as('folderDeleted');
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  const verifyFolderCreateEditDelete = (folderName) => {
    const renamedFolderName = `${folderName} Renamed`;

    openAppsDashboard();
    uiCreateFolder(folderName);
    uiVerifyFolderCreated(folderName);

    viewFolderCardOptions(folderName);
    cy.get(commonSelectors.editFolderOption(folderName)).click();
    cy.clearAndType(commonSelectors.folderNameInput, renamedFolderName);
    cy.get(commonSelectors.buttonSelector('update folder')).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, 'Folder has been updated.');
    cy.get(commonSelectors.folderListcard(renamedFolderName)).should('exist');
    cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');

    deleteFolder(renamedFolderName);
    cy.get(commonSelectors.folderListcard(renamedFolderName)).should('not.exist');
  };

  it('admin and builder can create, edit and delete an app folder by default', () => {
    const adminEmail = `app-folder-admin-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', adminEmail, 'admin', 'password', wsName);
    verifyFolderCreateEditDelete(`Admin App Folder ${testId}`);

    const builderEmail = `app-folder-builder-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', builderEmail, 'builder', 'password', wsName);
    verifyFolderCreateEditDelete(`Builder App Folder ${testId}`);
  });

  it('an end-user gets no folder-create affordance on the apps dashboard by default', () => {
    const endUserEmail = `app-folder-enduser-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', endUserEmail, 'end-user', 'password', wsName);

    openAppsDashboard();
    cy.get(commonSelectors.createNewFolderButton).should('not.exist');
  });
});
