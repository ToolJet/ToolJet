import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiViewTable,
  apiSeedSql,
  apiSelectRows,
  apiMigrations,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - column management', () => {
  let envs;
  let table;
  let tableNames = [];

  const openTable = () => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(table.name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.columnHeader('id')).should('be.visible');
  };

  const openColumnMenu = (columnName) => {
    cy.get(tooljetDatabaseSelectors.columnHeader(columnName))
      .closest('[role="columnheader"]')
      .find('.tjdb-menu-icon')
      .click({ force: true });
  };

  const chooseDataType = (label) => {
    cy.get(tooljetDatabaseSelectors.dataTypeDropdown).click();
    cy.contains(tooljetDatabaseSelectors.dropdownOption, new RegExp(`^${label}`)).click();
  };

  // every schema change needs a migration confirmation
  const confirmMigration = () => {
    cy.get(tooljetDatabaseSelectors.migrationModal).should('be.visible');
    cy.get(tooljetDatabaseSelectors.migrationRun).click();
    cy.get(tooljetDatabaseSelectors.migrationModal).should('not.exist');
  };

  const addColumn = (name, type, defaultValue) => {
    cy.get(tooljetDatabaseSelectors.addColumnPlus).click();
    cy.get(tooljetDatabaseSelectors.columnNameInput).type(name);
    chooseDataType(type);
    if (defaultValue) cy.get(tooljetDatabaseSelectors.defaultValueInput).type(defaultValue);
    cy.get(tooljetDatabaseSelectors.createButton).click();
    confirmMigration();
    cy.get(tooljetDatabaseSelectors.columnHeader(name)).should('exist');
  };

  const columnTypeOf = (columnName) =>
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((columns) => columns.find((column) => column.column_name === columnName)?.data_type);

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_colmgmt');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name'), plainColumn('age', 'integer')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('drops a column and records it as a migration', () => {
    openTable();
    openColumnMenu('age');
    cy.get(tooljetDatabaseSelectors.deleteColumnOption).click();
    confirmMigration();

    cy.get(tooljetDatabaseSelectors.columnHeader('age')).should('not.exist');
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((columns) => {
        expect(columns.map((column) => column.column_name)).to.not.include('age');
      });
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 2);
  });

  it('adds a column with a default value that new rows pick up', () => {
    openTable();
    addColumn('status', 'varchar', 'new');

    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('ada')", envs.development)
      .its('status')
      .should('eq', 201);
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows[0].status).to.eq('new');
    });
  });

  [
    ['boolean', 'boolean'],
    ['float', 'double precision'],
    ['bigint', 'bigint'],
    ['jsonb', 'jsonb'],
  ].forEach(([label, databaseType]) => {
    it(`adds a ${label} column`, () => {
      openTable();
      addColumn(`col_${label}`, label);

      columnTypeOf(`col_${label}`).should('eq', databaseType);
    });
  });

  it('renames a column and records it as a migration', () => {
    openTable();
    openColumnMenu('age');
    cy.get(tooljetDatabaseSelectors.editColumnOption).click();
    cy.get(tooljetDatabaseSelectors.columnNameInput).clear().type('years');
    cy.get(tooljetDatabaseSelectors.saveChangesButton).click();
    confirmMigration();

    cy.get(tooljetDatabaseSelectors.columnHeader('years')).should('exist');
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((columns) => {
        const names = columns.map((column) => column.column_name);
        expect(names).to.include('years');
        expect(names).to.not.include('age');
      });
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 2);
  });
});
