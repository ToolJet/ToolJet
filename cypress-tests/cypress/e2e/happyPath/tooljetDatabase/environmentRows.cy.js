import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import { commonSelectors } from 'Selectors/common';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiSelectRows,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - rows in a higher environment', () => {
  let envs;
  let table;
  let tableNames = [];

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_envrows');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('adds a row in staging without touching development', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).click();
    cy.get(tooljetDatabaseSelectors.environmentOption('staging')).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should('contain.text', 'Staging');
    // the add row form needs the environment's columns, so let the grid finish loading
    cy.get(tooljetDatabaseSelectors.columnHeader('name')).should('be.visible');
    cy.get(tooljetDatabaseSelectors.totalRecords).should('contain.text', '0 records');

    cy.get(tooljetDatabaseSelectors.addNewDataButton).first().click();
    cy.get(tooljetDatabaseSelectors.addNewRowOption).click();
    cy.get(tooljetDatabaseSelectors.rowInput('name')).type('staging-row');
    cy.get(commonSelectors.buttonSelector('Create')).click();

    cy.get(tooljetDatabaseSelectors.totalRecords, { timeout: 20000 }).should('contain.text', '1 records');
    apiSelectRows(table.id, envs.staging).then((rows) => {
      expect(rows.map((row) => row.name)).to.deep.eq(['staging-row']);
    });
    apiSelectRows(table.id, envs.development).should('have.length', 0);
  });
});
