import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import {
  openDataSourcesList,
  uiCreateDataSourceFolder,
  uiDeleteDataSourceFolder,
  uiRenameDataSourceFolder,
  uiVerifyDataSourceFolderExists,
} from 'Support/utils/platform/dataSourceFolders';

describe('Data Source Folders — Default Role Access', () => {
  let workspaceId, testId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  // A fresh workspace PER TEST. Hoisting the name to describe scope makes the
  // second test POST an already-taken slug and the server answers 409.
  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-role-${testId}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  const verifyFolderCreateRenameDelete = (folderName) => {
    const renamedFolderName = `${folderName} Renamed`;

    openDataSourcesList();
    uiCreateDataSourceFolder(folderName);
    uiVerifyDataSourceFolderExists(folderName);

    cy.apiGetDataSourceFolderId(folderName).then((folderId) => {
      uiRenameDataSourceFolder(folderId, renamedFolderName);
      uiVerifyDataSourceFolderExists(renamedFolderName);
      uiVerifyDataSourceFolderExists(folderName, false);

      uiDeleteDataSourceFolder(folderId);
      uiVerifyDataSourceFolderExists(renamedFolderName, false);
    });
  };

  it('admin and builder can create, rename and delete a data source folder by default', () => {
    const adminEmail = `ds-folder-admin-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', adminEmail, 'admin', 'password', wsName);
    verifyFolderCreateRenameDelete(`Admin DS Folder ${testId}`);

    const builderEmail = `ds-folder-builder-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', builderEmail, 'builder', 'password', wsName);
    verifyFolderCreateRenameDelete(`Builder DS Folder ${testId}`);
  });

  it('deleting a folder leaves the data sources that were inside it', () => {
    const folderName = `Survivor Folder ${testId}`;
    const dataSourceName = `ds-survivor-${testId}`;

    cy.apiCreateGlobalDataSource(dataSourceName).then((dataSourceId) => {
      cy.apiCreateDataSourceFolder(folderName).then((folder) => {
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id);

        openDataSourcesList();
        uiVerifyDataSourceFolderExists(folderName);

        uiDeleteDataSourceFolder(folder.id);
        uiVerifyDataSourceFolderExists(folderName, false);

        // The data source survives as a stray, un-foldered entry.
        cy.get(dsFolder.dataSourceRow(dataSourceName)).should('be.visible');
      });
    });
  });
});
