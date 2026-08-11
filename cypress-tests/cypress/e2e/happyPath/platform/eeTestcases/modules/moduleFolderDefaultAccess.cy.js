import { commonSelectors } from 'Selectors/common';
import { openModulesList } from 'Support/utils/platform/modules';
import { uiCreateFolder, uiVerifyFolderCreated } from 'Support/utils/uiPermissions';
import { deleteFolder } from 'Support/utils/common';

describe('Modules — Folder Permissions: Default Role Access', { retries: 0 }, () => {
  const testId = Date.now();
  const wsName = `modules-folder-role-${testId}`;
  const wsSlug = wsName;
  const builderEmail = `qa-folder-builder-${testId}@example.com`;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense('valid');
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiFullUserOnboarding('QA Folder Builder', builderEmail, 'builder', 'password', wsName);
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.intercept('DELETE', '/api/folders/*').as('folderDeleted');
  });

  it('admin can create and delete a module folder by default', () => {
    const folderName = `Admin Module Folder ${testId}`;
    openModulesList();
    uiCreateFolder(folderName);
    uiVerifyFolderCreated(folderName);

    deleteFolder(folderName);
    cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');
  });

  it('builder can create and delete a module folder by default', () => {
    const folderName = `Builder Module Folder ${testId}`;
    cy.apiLogin(builderEmail, 'password');
    openModulesList();
    uiCreateFolder(folderName);
    uiVerifyFolderCreated(folderName);

    deleteFolder(folderName);
    cy.get(commonSelectors.folderListcard(folderName)).should('not.exist');
  });
});
