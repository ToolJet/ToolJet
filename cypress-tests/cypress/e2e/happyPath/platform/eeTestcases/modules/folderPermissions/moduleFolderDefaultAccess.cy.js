import { commonSelectors } from 'Selectors/common';
import { deleteFolder, viewFolderCardOptions } from 'Support/utils/common';
import { openModulesList } from 'Support/utils/platform/modules';
import { uiCreateFolder, uiVerifyFolderCreated } from 'Support/utils/uiPermissions';

describe('Modules — Folder Permissions: Default Role Access', () => {
  const testId = Date.now();
  const wsName = `role-${testId}`;
  const wsSlug = wsName;

  let workspaceId;



  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
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

    openModulesList();
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

  it('admin and builder can create, edit and delete a module folder by default', () => {
    const adminEmail = `admin-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', adminEmail, 'admin', 'password', wsName);
    verifyFolderCreateEditDelete(`Admin Module Folder ${testId}`);

    const builderEmail = `qa-folder-builder-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', builderEmail, 'builder', 'password', wsName);
    verifyFolderCreateEditDelete(`Builder Module Folder ${testId}`);
  });
});
