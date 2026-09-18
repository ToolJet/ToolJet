import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import {
  dragDataSourceToFolder,
  openDataSourcesList,
  uiEnsureFolderExpanded,
  uiOpenMoveDataSourceModal,
} from 'Support/utils/platform/dataSourceFolders';

describe('Data Source Folders — Moving Data Sources Between Folders', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `ds-folder-move-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });
  });

  it('a data source belongs to only one folder — moving it to another removes it from the previous one', () => {
    const attemptId = Date.now();
    const dataSourceName = `ds-mover-${attemptId}`;

    cy.apiCreateGlobalDataSource(dataSourceName).then((dataSourceId) => {
      cy.apiCreateDataSourceFolder(`Folder A ${attemptId}`).then((folderA) => {
        cy.apiCreateDataSourceFolder(`Folder B ${attemptId}`).then((folderB) => {
          cy.apiAddDataSourceToFolder(dataSourceId, folderA.id);
          cy.apiGetDataSourceIdsInFolder(folderA.id).then((ids) => {
            expect(ids).to.include(dataSourceId);
          });

          // Re-homing, not duplicating: the mapping moves rather than being added twice.
          cy.apiAddDataSourceToFolder(dataSourceId, folderB.id);

          cy.apiGetDataSourceIdsInFolder(folderA.id).then((ids) => {
            expect(ids).to.not.include(dataSourceId);
          });
          cy.apiGetDataSourceIdsInFolder(folderB.id).then((ids) => {
            expect(ids).to.have.length(1);
            expect(ids).to.include(dataSourceId);
          });
        });
      });
    });
  });

  it('re-adding a data source to the folder it already sits in is idempotent', () => {
    const attemptId = Date.now();
    const dataSourceName = `ds-idempotent-${attemptId}`;

    cy.apiCreateGlobalDataSource(dataSourceName).then((dataSourceId) => {
      cy.apiCreateDataSourceFolder(`Idempotent Folder ${attemptId}`).then((folder) => {
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id);
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id).then((response) => {
          expect(response.status).to.be.oneOf([200, 201]);
        });

        cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
          expect(ids).to.have.length(1);
        });
      });
    });
  });

  it('bulk move sends the plural body and lands every selected data source in the target folder', () => {
    const attemptId = Date.now();
    const names = [`ds-bulk-a-${attemptId}`, `ds-bulk-b-${attemptId}`, `ds-bulk-c-${attemptId}`];
    const createdIds = [];

    names.forEach((name) => {
      cy.apiCreateGlobalDataSource(name).then((id) => createdIds.push(id));
    });

    cy.apiCreateDataSourceFolder(`Bulk Folder ${attemptId}`).then((folder) => {
      cy.then(() => {
        cy.apiBulkAddDataSourcesToFolder(createdIds, folder.id).then((response) => {
          expect(response.status).to.equal(201);
        });

        cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
          expect(ids).to.have.length(createdIds.length);
          createdIds.forEach((id) => expect(ids).to.include(id));
        });
      });
    });
  });

  it('removing a data source from a folder makes it stray again without deleting it', () => {
    const attemptId = Date.now();
    const dataSourceName = `ds-removable-${attemptId}`;

    cy.apiCreateGlobalDataSource(dataSourceName).then((dataSourceId) => {
      cy.apiCreateDataSourceFolder(`Removal Folder ${attemptId}`).then((folder) => {
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id);
        cy.apiRemoveDataSourceFromFolder(dataSourceId, folder.id).then((response) => {
          expect(response.status).to.equal(200);
        });

        cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
          expect(ids).to.not.include(dataSourceId);
        });

        openDataSourcesList();
        cy.get(dsFolder.dataSourceRow(dataSourceName)).should('be.visible');
      });
    });
  });

  it('a data source can be dragged into a folder and the move modal offers the valid destinations', () => {
    const attemptId = Date.now();
    const dataSourceName = `ds-draggable-${attemptId}`;
    const folderName = `Drop Target ${attemptId}`;

    cy.apiCreateGlobalDataSource(dataSourceName);
    cy.apiCreateDataSourceFolder(folderName).then((folder) => {
      openDataSourcesList();

      // dnd-kit PointerSensor, 8px activation distance — needs real pointer events.
      dragDataSourceToFolder(dataSourceName, folderName);

      cy.apiGetDataSourceIdsInFolder(folder.id).then((ids) => {
        expect(ids, 'data source landed in the folder after drag').to.have.length(1);
      });

      // The same move is reachable from the row's ⋮ menu — but only for a row
      // INSIDE a folder, and only once the folder is expanded.
      uiEnsureFolderExpanded(folderName, dataSourceName);
      uiOpenMoveDataSourceModal(dataSourceName);
      cy.get(dsFolder.moveToFolderButton).should('be.visible');
      cy.get(dsFolder.cancelButton).click();
    });
  });
});
