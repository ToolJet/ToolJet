import { dataSourceFolderSelectors as dsFolder } from 'Selectors/platform/dataSourceFolders';

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

  // Both pickers give a folder header the same data-cy, and the "+" popover opens over the landing
  // picker without unmounting it, so each pass has to address its own picker by header class.
  const landingHeader = (folderName) => `${dsFolder.pickerFolderHeader(folderName)}.query-datasource-quick-action`;
  const popoverHeader = (folderName) => `${dsFolder.pickerFolderHeader(folderName)}.ds-select-item`;

  const verifyFolderGrouping = (item, search, header) => {
    cy.get(header(names.folderA)).should('be.visible');
    cy.get(header(names.folderB)).should('be.visible');
    cy.get(header(names.emptyFolder)).should('not.exist');
    cy.get(item(names.a1)).should('not.exist');
    cy.get(item(names.b1)).should('not.exist');

    // Folders list first, so the loose data source sits at the bottom of the picker, below the
    // fold and under the query pane's fixed bottom bar until it is scrolled into view.
    cy.get(item(names.stray)).scrollIntoView().should('be.visible');

    cy.get(header(names.folderB)).click();
    cy.get(item(names.b1)).should('have.length', 1);
    cy.get(item(names.b2)).should('have.length', 1);
    cy.get(item(names.a1)).should('not.exist');
    cy.get(header(names.folderB)).click();

    cy.get(search).type(names.folderA);
    cy.get(item(names.a1)).should('be.visible');
    cy.get(header(names.folderB)).should('not.exist');

    cy.get(search).clear().type(names.b2);
    cy.get(header(names.folderB)).should('be.visible');
    cy.get(item(names.b2)).should('be.visible');
    cy.get(item(names.b1)).should('not.exist');
    cy.get(header(names.folderA)).should('not.exist');
    cy.get(item(names.stray)).should('not.exist');
    cy.get(search).clear();
  };

  it('both data source pickers group by folder, search across folders, and reflect a folder change after reload', () => {
    cy.openApp('', workspaceId, Cypress.env('appId'));

    verifyFolderGrouping(dsFolder.pickerDataSourceCard, dsFolder.emptyPickerSearch, landingHeader);

    cy.get(dsFolder.addQueryPopoverButton).click();
    verifyFolderGrouping(dsFolder.selectDataSourceOption, dsFolder.addQueryPopoverSearch, popoverHeader);
    cy.get('body').type('{esc}');

    // A folder change made outside the builder shows up after a reload, and the data source moves rather than duplicates.
    cy.get(dsFolder.pickerDataSourceCard(names.stray)).should('be.visible');
    cy.then(() => cy.apiAddDataSourceToFolder(Cypress.env('strayId'), Cypress.env('folderAId')));
    cy.reload();

    cy.get(dsFolder.pickerFolderHeader(names.folderA)).click();
    cy.get(dsFolder.pickerDataSourceCard(names.stray)).should('have.length', 1).and('be.visible');
    cy.get(dsFolder.pickerDataSourceCard(names.a1)).should('be.visible');
  });
});
