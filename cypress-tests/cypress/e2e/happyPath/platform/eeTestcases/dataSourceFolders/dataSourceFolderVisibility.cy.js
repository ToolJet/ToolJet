import { commonSelectors } from 'Selectors/common';
import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';
import { apiCreateGroup } from 'Support/utils/manageGroups';
import {
  openDataSourcesList,
  uiExpandDataSourceFolder,
  uiVerifyDataSourceFolderExists,
} from 'Support/utils/platform/dataSourceFolders';

describe('Data Source Folders — Folder & Data Source Visibility', () => {
  let workspaceId, wsName, wsSlug;

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    wsName = `ds-folder-visibility-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiDeleteGranularPermission('builder', ['data_source', 'data_source_folder']);
  });

  it('a user sees only the folders their grant reaches, including an empty authorized folder', () => {
    const attemptId = Date.now();
    const authorizedFolderName = `Authorized DS Folder ${attemptId}`;
    const unauthorizedFolderName = `Unauthorized DS Folder ${attemptId}`;
    const groupName = `QA DS Visibility Group ${attemptId}`;
    const userEmail = `ds-visibility-${attemptId}@example.com`;

    cy.apiCreateDataSourceFolder(unauthorizedFolderName);
    cy.apiCreateDataSourceFolder(authorizedFolderName).then((folder) => {
      apiCreateGroup(groupName).then(() =>
        cy.apiCreateGranularPermission(
          groupName,
          `${groupName} folder view`,
          'data_source_folder',
          { canEditFolder: false, canEditApps: false, canViewApps: true },
          [folder.id],
          false
        )
      );

      cy.then(() => {
        cy.apiFullUserOnboarding('QA DS Visibility User', userEmail, 'builder', 'password', wsName, {}, [groupName]);

        cy.apiLogin(userEmail, 'password');
        openDataSourcesList();

        uiVerifyDataSourceFolderExists(authorizedFolderName);
        uiVerifyDataSourceFolderExists(unauthorizedFolderName, false);

        // The authorized folder is empty and still listed, showing its empty state.
        uiExpandDataSourceFolder(authorizedFolderName);
        cy.get(dsFolder.folderEmptyText(folder.id)).should('be.visible');
      });
    });
  });

  it('search matches data sources inside folders as well as stray ones', () => {
    const attemptId = Date.now();
    const folderName = `Searchable Folder ${attemptId}`;
    const folderedDataSource = `ds-inside-${attemptId}`;
    const strayDataSource = `ds-stray-${attemptId}`;

    cy.apiCreateGlobalDataSource(folderedDataSource).then((folderedId) => {
      cy.apiCreateGlobalDataSource(strayDataSource);
      cy.apiCreateDataSourceFolder(folderName).then((folder) => {
        cy.apiAddDataSourceToFolder(folderedId, folder.id);

        openDataSourcesList();

        // Search is CLIENT-SIDE — List.handleSearch filters the already-loaded
        // dataSources array. There is no second /api/folder-data-sources request to
        // wait on, and the searchKey query param the API supports is not used here.
        // The search input only mounts after the icon is clicked; type into it
        // directly (a .clear() on the freshly mounted input loses the first keystrokes).
        cy.get(dsFolder.searchIcon).click();
        cy.get(dsFolder.searchBar).type(folderedDataSource);

        // A folder with matching contents auto-expands (searchActive && contents.length),
        // so the row surfaces without expanding by hand.
        cy.get(dsFolder.dataSourceRow(folderedDataSource)).should('be.visible');
        cy.get(dsFolder.dataSourceRow(strayDataSource)).should('not.exist');

        // Folder rows stay listed while searching.
        uiVerifyDataSourceFolderExists(folderName);
      });
    });
  });

  it('a failed folder listing is reported as an error, not shown as data sources with no folder', () => {
    const attemptId = Date.now();
    const folderName = `Listed Folder ${attemptId}`;
    const folderedDataSource = `ds-listed-${attemptId}`;

    cy.apiCreateGlobalDataSource(folderedDataSource).then((dataSourceId) => {
      cy.apiCreateDataSourceFolder(folderName).then((folder) =>
        cy.apiAddDataSourceToFolder(dataSourceId, folder.id)
      );
    });

    cy.intercept('GET', '/api/folder-data-sources*', {
      statusCode: 500,
      body: { statusCode: 500, message: 'Internal server error' },
    }).as('failedFolderList');

    cy.visit(`/${wsSlug}`);
    cy.get(commonSelectors.globalDataSourceIcon, { timeout: 50000 }).click();
    cy.wait('@failedFolderList');

    // The failure is surfaced to the user...
    cy.get(commonSelectors.toastMessage).should('be.visible');
    // ...and the foldered data source is not presented as an un-foldered row.
    cy.get(dsFolder.dataSourceRow(folderedDataSource)).should('not.exist');
  });
});

