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
    cy.get(dsFolder.createFolderIcon).should('be.visible');
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
    openDataSourcesList();
    cy.get(dsFolder.createFolderIcon).should('be.visible');
    cy.get('[data-cy^="datasource-folder-"]').should('not.exist');

    const adminEmail = `ds-folder-admin-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', adminEmail, 'admin', 'password', wsName);
    verifyFolderCreateRenameDelete(`Admin DS Folder ${testId}`);

    const builderEmail = `ds-folder-builder-${testId}@example.com`;
    cy.apiFullUserOnboarding('QA', builderEmail, 'builder', 'password', wsName);
    verifyFolderCreateRenameDelete(`Builder DS Folder ${testId}`);
  });

  it('removing a data source from a folder, then deleting the folder, leaves every data source intact', () => {
    const folderName = `Survivor Folder ${testId}`;
    const removedName = `ds-removed-${testId}`;
    const deletedName = `ds-deleted-${testId}`;
    const keptName = `ds-kept-${testId}`;

    cy.apiCreateGlobalDataSource(removedName).then((removedId) => {
      cy.apiCreateGlobalDataSource(deletedName).then((deletedId) => {
        cy.apiCreateGlobalDataSource(keptName).then((keptId) => {
          cy.apiCreateDataSourceFolder(folderName).then((folder) => {
            cy.apiAddDataSourceToFolder(removedId, folder.id);
            cy.apiAddDataSourceToFolder(deletedId, folder.id);
            cy.apiAddDataSourceToFolder(keptId, folder.id);

            openDataSourcesList();
            uiVerifyDataSourceFolderExists(folderName);
            cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
              expect(ids, 'all three data sources start in the folder').to.have.length(3);
            });

            // 1 — Remove one from the folder. Membership only: the data source
            // itself survives and reappears in the un-foldered list.
            cy.apiRemoveDataSourceFromFolder(removedId, folder.id).then((response) => {
              expect(response.status).to.equal(200);
            });
            cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
              expect(ids, 'the removed data source left the folder').to.not.include(removedId);
              expect(ids).to.have.length(2);
            });
            openDataSourcesList();
            cy.get(dsFolder.dataSourceRow(removedName)).should('be.visible');

            // 2 — Delete a data source that is still in the folder. Its mapping
            // row goes with it rather than dangling.
            cy.apiDeleteDataSource(deletedName);
            cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
              expect(ids, 'the deleted data source left no membership row').to.deep.equal([keptId]);
            });

            // 3 — Delete the folder. It only deletes the folder, never the data
            // sources inside it, which become stray entries.
            openDataSourcesList();
            uiDeleteDataSourceFolder(folder.id);
            uiVerifyDataSourceFolderExists(folderName, false);

            cy.get(dsFolder.dataSourceRow(keptName)).should('be.visible');
            cy.get(dsFolder.dataSourceRow(removedName)).should('be.visible');
          });
        });
      });
    });
  });
});
