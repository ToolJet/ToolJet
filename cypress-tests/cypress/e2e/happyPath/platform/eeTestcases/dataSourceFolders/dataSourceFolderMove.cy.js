import { commonSelectors } from 'Selectors/common';
import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import {
  dragDataSourceToFolder,
  dragDataSourceToStrayList,
  multiSelectDataSources,
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

  const expectInsideFolder = (folderName, dataSourceName) => {
    uiEnsureFolderExpanded(folderName, dataSourceName);
    cy.get(dsFolder.folderRow(folderName))
      .closest('.datasource-folder')
      .find(dsFolder.folderContents)
      .find(dsFolder.dataSourceRow(dataSourceName))
      .should('be.visible');
    cy.get(dsFolder.strayDropZone)
      .find(dsFolder.dataSourceRow(dataSourceName))
      .should('not.exist');
  };

  const expectUnFoldered = (dataSourceName) => {
    cy.get(dsFolder.strayDropZone).find(dsFolder.dataSourceRow(dataSourceName)).should('be.visible');
    cy.get(`${dsFolder.folderContents} ${dsFolder.dataSourceRow(dataSourceName)}`).should('not.exist');
  };

  const expectFolderEmpty = (folderName, folderId) => {
    cy.get('body').then(($body) => {
      if ($body.find(dsFolder.folderEmptyText(folderId)).length === 0) {
        cy.get(dsFolder.folderRow(folderName)).click();
      }
    });
    cy.get(dsFolder.folderEmptyText(folderId)).should('have.text', 'This folder is empty');
  };

  it('moves data sources in, across and out of folders — by drag, by multi-select and through the move modal', () => {
    const attemptId = Date.now();
    const one = `ds-one-${attemptId}`;
    const two = `ds-two-${attemptId}`;
    const three = `ds-three-${attemptId}`;
    const alpha = `Alpha ${attemptId}`;
    const beta = `Beta ${attemptId}`;
    const ids = {};

    cy.apiCreateGlobalDataSource(one).then((id) => (ids.one = id));
    cy.apiCreateGlobalDataSource(two).then((id) => (ids.two = id));
    cy.apiCreateGlobalDataSource(three).then((id) => (ids.three = id));

    cy.apiCreateDataSourceFolder(alpha).then((alphaFolder) => {
      cy.apiCreateDataSourceFolder(beta).then((betaFolder) => {
        openDataSourcesList();

        [one, two, three].forEach(expectUnFoldered);
        expectFolderEmpty(alpha, alphaFolder.id);

        dragDataSourceToFolder(one, alpha, { expectDragLabel: one });
        cy.apiGetDataSourceIdsInFolder(alphaFolder.id).then((inFolder) => {
          expect(inFolder, 'landed in the first folder').to.deep.equal([ids.one]);
        });
        expectInsideFolder(alpha, one);

        dragDataSourceToFolder(one, beta);
        cy.apiGetDataSourceIdsInFolder(betaFolder.id).then((inFolder) => {
          expect(inFolder, 're-homed into the second folder').to.deep.equal([ids.one]);
        });
        cy.apiGetDataSourceIdsInFolder(alphaFolder.id).then((inFolder) => {
          expect(inFolder, 'the first folder no longer holds it').to.be.empty;
        });
        expectInsideFolder(beta, one);
        expectFolderEmpty(alpha, alphaFolder.id);

        uiEnsureFolderExpanded(beta, one);
        dragDataSourceToStrayList(one);
        cy.apiGetDataSourceIdsInFolder(betaFolder.id).then((inFolder) => {
          expect(inFolder, 'removed from the folder').to.be.empty;
        });
        expectUnFoldered(one);

        multiSelectDataSources([two]);
        cy.get(dsFolder.dataSourceRow(two)).click({ shiftKey: true });
        cy.get(dsFolder.dataSourceRow(two)).parents('.datasource-draggable').should('not.have.class', 'is-selected');

        multiSelectDataSources([two, three]);
        cy.get(dsFolder.dataSourceRow(one)).click(); // a plain click clears everything
        cy.get('.datasource-draggable.is-selected').should('not.exist');
        openDataSourcesList();

        multiSelectDataSources([two, three]);
        dragDataSourceToFolder(three, alpha, { expectDragLabel: '2 data sources' });
        cy.apiGetDataSourceIdsInFolder(alphaFolder.id).then((inFolder) => {
          expect(inFolder, 'both selected data sources moved together').to.have.length(2);
          expect(inFolder).to.include(ids.two);
          expect(inFolder).to.include(ids.three);
        });
        expectInsideFolder(alpha, two);
        expectInsideFolder(alpha, three);

        cy.apiAddDataSourceToFolder(ids.one, betaFolder.id);
        openDataSourcesList();

        uiEnsureFolderExpanded(alpha, two);
        uiOpenMoveDataSourceModal(two);

        cy.get('.modal-content').should('contain.text', 'Update folder');
        cy.contains('.move-ds-label', 'Move selected data sources').should('be.visible');
        cy.contains('.move-ds-label', 'Folder name').should('be.visible');
        cy.get(dsFolder.moveModalSelectedDataSource).should('have.length', 1).and('have.text', two);
        cy.get(dsFolder.moveToFolderButton).should('have.text', 'Add to folder').and('be.disabled');

        // No data-cy on either react-select; scope by field label and click the control.
        cy.contains('.move-ds-field', 'Folder name').find(dsFolder.moveModalControl).click();
        cy.get('.move-ds-select__menu').should('have.length', 1).and('not.contain.text', alpha);
        cy.contains(dsFolder.moveModalOption, beta).click();
        cy.get(dsFolder.moveToFolderButton).should('not.be.disabled');

        cy.get(dsFolder.moveModalRemoveDataSource).first().click();
        cy.contains('.move-ds-field', 'Move selected data sources').find(dsFolder.moveModalControl).click();
        cy.contains(dsFolder.moveModalOption, one).click();
        cy.get(dsFolder.moveModalSelectedFolder).should('not.exist');
        cy.get(dsFolder.moveToFolderButton).should('be.disabled');

        cy.contains('.move-ds-field', 'Folder name').find(dsFolder.moveModalControl).click();
        cy.get('.move-ds-select__menu').should('not.contain.text', beta);
        cy.contains(dsFolder.moveModalOption, alpha).click();
        cy.get(dsFolder.moveToFolderButton).should('not.be.disabled').click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'Data sources moved successfully!');

        cy.apiGetDataSourceIdsInFolder(alphaFolder.id).then((inFolder) => {
          expect(inFolder, 'the modal move landed it in the destination').to.have.length(3);
          expect(inFolder).to.include(ids.one);
        });
        cy.apiGetDataSourceIdsInFolder(betaFolder.id).then((inFolder) => {
          expect(inFolder, 'and emptied the folder it came from').to.be.empty;
        });
        expectInsideFolder(alpha, one);

        const serverMessage = 'You do not have permission to access this resource';
        cy.intercept('POST', '/api/folder-data-sources*', {
          statusCode: 403,
          body: { statusCode: 403, message: serverMessage },
        }).as('refusedMove');

        uiEnsureFolderExpanded(alpha, three);
        uiOpenMoveDataSourceModal(three);
        cy.contains('.move-ds-field', 'Folder name').find(dsFolder.moveModalControl).click();
        cy.contains(dsFolder.moveModalOption, beta).click();
        cy.get(dsFolder.moveToFolderButton).click();
        cy.wait('@refusedMove');

        cy.verifyToastMessage(commonSelectors.toastMessage, serverMessage);
        cy.get(dsFolder.moveToFolderButton).should('be.visible');
        cy.get(dsFolder.cancelButton).click();

        cy.apiGetDataSourceIdsInFolder(alphaFolder.id).then((inFolder) => {
          expect(inFolder, 'the refused move changed nothing').to.include(ids.three);
        });
        cy.apiGetDataSourceIdsInFolder(betaFolder.id).then((inFolder) => {
          expect(inFolder, 'and nothing reached the target folder').to.be.empty;
        });
      });
    });
  });
});
