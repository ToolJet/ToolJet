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

  /**
 * KNOWN GAP — asserts CURRENT behaviour, which is not the intended behaviour.
 *
 * Observable invariant, reproducible through the public API: GET
 * /api/folder-data-sources returns EVERY data source folder in the workspace to
 * a non-admin whose granular grant covers only one of them. Folder CONTENTS are
 * still filtered by data source visibility, so what leaks is folder names, not
 * the data sources inside them. `FolderDataSourcesService.filterFoldersByPermissions`
 * returns all folders whenever no data source folder permission set resolves for
 * the caller.
 *
 * Intended: only the authorized folder is listed.
 * Actual:   both are listed.
 *
 * When the bucket is built, the `unauthorized ... should exist` assertion below
 * flips and this test must be updated — the failure is the signal.
 */
it('every data source folder is listed regardless of grant (known gap), and an empty authorized folder shows its empty state', () => {
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
        // Intended: not.exist. Actual: visible — see the block comment above.
        uiVerifyDataSourceFolderExists(unauthorizedFolderName);

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
});
