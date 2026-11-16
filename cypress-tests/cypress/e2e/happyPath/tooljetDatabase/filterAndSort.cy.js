import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiSeedSql,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - filter and sort', () => {
  let envs;
  let table;
  let tableNames = [];

  const nameCells = tooljetDatabaseSelectors.columnCells('name');

  const openTable = () => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name), { timeout: 20000 }).click();
    cy.get(nameCells).should('have.length', 4);
  };

  const expectNames = (names) =>
    cy.get(nameCells).should(($cells) => {
      expect([...$cells].map((cell) => cell.innerText.trim())).to.deep.eq(names);
    });

  const choose = (fieldSelector, index, label) => {
    cy.get(fieldSelector).eq(index).click();
    cy.get(fieldSelector).eq(index).contains(tooljetDatabaseSelectors.dropdownOption, label).click();
  };

  const applyFilters = (conditions) => {
    cy.get(tooljetDatabaseSelectors.filterButton).click();
    conditions.forEach(([column, operator, value], index) => {
      if (index > 0) cy.contains('button', 'Add filter').click();
      choose(tooljetDatabaseSelectors.filterColumn, index, column);
      choose(tooljetDatabaseSelectors.filterOperation, index, operator);
      cy.get(tooljetDatabaseSelectors.filterValue).eq(index).type(value);
    });
    cy.get(tooljetDatabaseSelectors.filterFooter).contains('button', 'Apply').click();
    cy.get(tooljetDatabaseSelectors.filterFooter).should('not.exist');
  };

  const sortBy = (column, order) => {
    cy.get(tooljetDatabaseSelectors.sortButton).click();
    choose(tooljetDatabaseSelectors.sortColumn, 0, column);
    choose(tooljetDatabaseSelectors.sortOrder, 0, order);
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_filter');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name'), plainColumn('age', 'integer')]).then((id) => {
      table = { id, name };
      apiSeedSql(
        id,
        "INSERT INTO {{self}} (name, age) VALUES ('ada', 30), ('bob', 20), ('cy', 40), ('dee', 20)",
        envs.development
      )
        .its('status')
        .should('eq', 201);
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('filters rows by one condition', () => {
    openTable();
    applyFilters([['age', 'greater than', '25']]);
    expectNames(['ada', 'cy']);
  });

  it('filters rows by several conditions', () => {
    openTable();
    applyFilters([
      ['age', 'equals', '20'],
      ['name', 'equals', 'dee'],
    ]);
    expectNames(['dee']);
  });

  it('shows every row again after clearing the filters', () => {
    openTable();
    applyFilters([['name', 'equals', 'bob']]);
    expectNames(['bob']);

    // the applied chip has a clear icon on its right, so click its label
    cy.get(tooljetDatabaseSelectors.filterButton).click('left');
    cy.get(tooljetDatabaseSelectors.filterFooter).contains('button', 'Clear all').click();
    cy.get(tooljetDatabaseSelectors.filterFooter).contains('button', 'Apply').click();
    expectNames(['ada', 'bob', 'cy', 'dee']);
  });

  it('sorts rows in ascending and descending order', () => {
    openTable();
    sortBy('name', 'Descending');
    expectNames(['dee', 'cy', 'bob', 'ada']);

    choose(tooljetDatabaseSelectors.sortOrder, 0, 'Ascending');
    expectNames(['ada', 'bob', 'cy', 'dee']);
  });
});
