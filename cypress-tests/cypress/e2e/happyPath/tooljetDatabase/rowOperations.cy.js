import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import { commonSelectors } from 'Selectors/common';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiSeedSql,
  apiSelectRows,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - row operations', () => {
  let envs;
  let table;
  let tableNames = [];

  const openTable = (name) => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.columnHeader('id')).should('be.visible');
  };

  const selectRow = (rowId) => {
    cy.get(tooljetDatabaseSelectors.rowOf(rowId))
      .closest('tr')
      .find('input[type="checkbox"]')
      .first()
      .check({ force: true });
  };

  const seedRows = () =>
    apiSeedSql(
      table.id,
      "INSERT INTO {{self}} (name, age) VALUES ('ada', 30), ('bob', 20), ('cy', 40)",
      envs.development
    )
      .its('status')
      .should('eq', 201)
      .then(() => apiSelectRows(table.id, envs.development))
      .then((rows) => expect(rows, 'seeded rows').to.have.length(3));

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_rows');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name'), plainColumn('age', 'integer')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('adds a row from the Add new data menu', () => {
    openTable(table.name);

    cy.get(tooljetDatabaseSelectors.addNewDataButton).first().click();
    cy.get(tooljetDatabaseSelectors.addNewRowOption).click();
    cy.get(tooljetDatabaseSelectors.rowInput('name')).type('ada');
    cy.get(tooljetDatabaseSelectors.rowInput('age')).type('30');
    cy.get(commonSelectors.buttonSelector('Create')).click();

    cy.get(tooljetDatabaseSelectors.totalRecords).should('contain.text', '1 records');
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows).to.have.length(1);
      expect(rows[0].name).to.eq('ada');
      expect(rows[0].age).to.eq(30);
    });
  });

  it('edits a selected row', () => {
    seedRows();
    openTable(table.name);

    selectRow(1);
    cy.get(tooljetDatabaseSelectors.editRowButton).click();
    cy.get(tooljetDatabaseSelectors.rowInput('name')).clear().type('ada-edited');
    cy.get(commonSelectors.buttonSelector('Save changes')).click();

    cy.get(tooljetDatabaseSelectors.cell('1', 'name')).should('contain.text', 'ada-edited');
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows.find((row) => row.id === 1).name).to.eq('ada-edited');
    });
  });

  it('deletes a selected row', () => {
    seedRows();
    openTable(table.name);

    selectRow(2);
    cy.get(tooljetDatabaseSelectors.deleteRowsButton).click();
    // scoped to the modal so the toolbar's "Delete row" button is not matched
    cy.get('.modal-content').contains('button', 'Delete').click();

    cy.get(tooljetDatabaseSelectors.totalRecords).should('contain.text', '2 records');
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows.map((row) => row.name)).to.deep.eq(['ada', 'cy']);
    });
  });
});
