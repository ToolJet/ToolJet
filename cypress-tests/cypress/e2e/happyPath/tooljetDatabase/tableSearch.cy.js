import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiDropTables,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - table list search', () => {
  let tableNames = [];

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('lists only the tables that match the search text', () => {
    const matching = uniqueTableName('qa_srchmatch');
    const other = uniqueTableName('qa_srchother');
    tableNames.push(matching, other);
    apiCreateTable(matching, [plainColumn('name')]);
    apiCreateTable(other, [plainColumn('name')]);

    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(matching), { timeout: 20000 }).should('be.visible');
    cy.get(tooljetDatabaseSelectors.tableItem(other)).should('be.visible');

    cy.get(tooljetDatabaseSelectors.searchIcon).click();
    cy.get(tooljetDatabaseSelectors.searchInput).type('qa_srchmatch');

    cy.get(tooljetDatabaseSelectors.tableItem(matching)).should('be.visible');
    cy.get(tooljetDatabaseSelectors.tableItem(other)).should('not.exist');
  });
});
