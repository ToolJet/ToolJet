import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiSelectRows,
  apiColumnNames,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - seed data with SQL', () => {
  let envs;
  let table;
  let tableNames = [];

  const openTable = () => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should('be.visible');
  };

  const selectEnvironment = (name) => {
    cy.get(tooljetDatabaseSelectors.switcherButton).click();
    cy.get(tooljetDatabaseSelectors.environmentOption(name)).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should(
      'contain.text',
      name.charAt(0).toUpperCase() + name.slice(1)
    );
  };

  // the editor closes brackets and quotes itself, and "{{}" types a literal brace
  const runSeedSql = (sql) => {
    cy.get(tooljetDatabaseSelectors.addNewDataButton).first().click();
    cy.get(tooljetDatabaseSelectors.seedDataOption).click();
    cy.get(tooljetDatabaseSelectors.seedSqlEditor).click().type(sql);
    cy.get(tooljetDatabaseSelectors.createButton).click();
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_seed');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('inserts rows with a seed SQL statement', () => {
    openTable();
    runSeedSql("INSERT INTO {{}{{}self}} (name) VALUES ('ada'), ('bob')");

    cy.contains('SQL executed successfully').should('be.visible');
    cy.get(tooljetDatabaseSelectors.totalRecords, { timeout: 20000 }).should('contain.text', '2 records');
    apiSelectRows(table.id, envs.development).should('have.length', 2);
  });

  it('seeds the environment that is selected', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
    openTable();
    selectEnvironment('staging');
    runSeedSql("INSERT INTO {{}{{}self}} (name) VALUES ('staging-row')");

    cy.contains('SQL executed successfully').should('be.visible');
    apiSelectRows(table.id, envs.staging).should('have.length', 1);
    apiSelectRows(table.id, envs.development).should('have.length', 0);
  });

  it('refuses a schema statement and changes nothing', () => {
    openTable();
    runSeedSql('ALTER TABLE {{}{{}self}} ADD COLUMN extra integer');

    cy.contains(/restricted/i).should('be.visible');
    apiColumnNames(table.name, envs.development).should('not.include', 'extra');
  });
});
