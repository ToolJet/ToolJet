import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';

/**
 * Folder grouping inside the app builder. Two pickers group connected data
 * sources by folder:
 *   - the "+" add-query popover (DataSourceSelect)   → ds-folder-* / ds-<name>
 *   - the empty query panel picker (DataSourcePicker) → ds-folder-* / <name>-add-query-card
 * Both are virtualized lists; the fixture stays small so every row renders.
 */
describe('Data Source Folders — Query Panel Grouping', () => {
  let workspaceId, wsName, wsSlug, testId, names;

  beforeEach(() => {
    testId = Date.now();
    wsName = `ds-folder-picker-${testId}`;
    wsSlug = wsName;
    names = {
      folderA: `Alpha Group ${testId}`,
      folderB: `Beta Group ${testId}`,
      emptyFolder: `Empty Group ${testId}`,
      a1: `ds-a1-${testId}`,
      b1: `ds-b1-${testId}`,
      b2: `ds-b2-${testId}`,
      stray: `ds-loose-${testId}`,
    };

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env('workspaceId', workspaceId);
      Cypress.env('workspaceSlug', wsSlug);
    });

    cy.apiCreateDataSourceFolder(names.emptyFolder);
    cy.apiCreateDataSourceFolder(names.folderA).then((folderA) => {
      Cypress.env('folderAId', folderA.id);
      cy.apiCreateGlobalDataSource(names.a1).then((id) => cy.apiAddDataSourceToFolder(id, folderA.id));
    });
    cy.apiCreateDataSourceFolder(names.folderB).then((folderB) => {
      cy.apiCreateGlobalDataSource(names.b1).then((id) => cy.apiAddDataSourceToFolder(id, folderB.id));
      cy.apiCreateGlobalDataSource(names.b2).then((id) => cy.apiAddDataSourceToFolder(id, folderB.id));
    });
    cy.apiCreateGlobalDataSource(names.stray).then((id) => Cypress.env('strayId', id));
    cy.apiCreateApp(`picker-app-${testId}`);
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  /** Same checks for both pickers; `item` maps a data source name to its row selector. */
  const verifyFolderGrouping = (item, search) => {
    // Headers for folders with contents, collapsed; an empty folder is not offered.
    cy.get(dsFolder.pickerFolderHeader(names.folderA)).should('be.visible');
    cy.get(dsFolder.pickerFolderHeader(names.folderB)).should('be.visible');
    cy.get(dsFolder.pickerFolderHeader(names.emptyFolder)).should('not.exist');
    cy.get(item(names.a1)).should('not.exist');
    cy.get(item(names.b1)).should('not.exist');

    // Un-foldered data sources are listed on their own.
    cy.get(item(names.stray)).should('be.visible');

    // Expanding a folder shows exactly its members, each once.
    cy.get(dsFolder.pickerFolderHeader(names.folderB)).click();
    cy.get(item(names.b1)).should('have.length', 1);
    cy.get(item(names.b2)).should('have.length', 1);
    cy.get(item(names.a1)).should('not.exist');
    cy.get(dsFolder.pickerFolderHeader(names.folderB)).click();

    // Searching a folder name opens that folder with all its data sources.
    cy.get(search).type(names.folderA);
    cy.get(item(names.a1)).should('be.visible');
    cy.get(dsFolder.pickerFolderHeader(names.folderB)).should('not.exist');

    // Searching a data source name keeps only the folders that contain it.
    cy.get(search).clear().type(names.b2);
    cy.get(dsFolder.pickerFolderHeader(names.folderB)).should('be.visible');
    cy.get(item(names.b2)).should('be.visible');
    cy.get(item(names.b1)).should('not.exist');
    cy.get(dsFolder.pickerFolderHeader(names.folderA)).should('not.exist');
    cy.get(item(names.stray)).should('not.exist');
    cy.get(search).clear();
  };

  it('the add-query popover groups data sources by folder and searches across folders', () => {
    cy.openApp('', workspaceId, Cypress.env('appId'));
    cy.get(dsFolder.addQueryPopoverButton).click();
    verifyFolderGrouping(dsFolder.selectDataSourceOption, dsFolder.addQueryPopoverSearch);
  });

  it('the empty query panel picker groups data sources by folder and searches across folders', () => {
    cy.openApp('', workspaceId, Cypress.env('appId'));
    verifyFolderGrouping(dsFolder.pickerDataSourceCard, dsFolder.emptyPickerSearch);
  });

  it('a folder change made outside the builder shows in the picker after a reload', () => {
    cy.openApp('', workspaceId, Cypress.env('appId'));
    cy.get(dsFolder.pickerDataSourceCard(names.stray)).should('be.visible');

    cy.then(() => cy.apiAddDataSourceToFolder(Cypress.env('strayId'), Cypress.env('folderAId')));
    cy.reload();

    cy.get(dsFolder.pickerFolderHeader(names.folderA)).click();
    cy.get(dsFolder.pickerDataSourceCard(names.stray)).should('have.length', 1).and('be.visible');
    cy.get(dsFolder.pickerDataSourceCard(names.a1)).should('be.visible');
  });
});
