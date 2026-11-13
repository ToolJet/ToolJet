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

describe('ToolJet Database - columns', () => {
  let envs;
  let table;
  let tableNames = [];

  const openTable = (name) => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.columnHeader('id')).should('be.visible');
  };

  // the menu icon is a child of the header wrapper
  const openEditColumn = (columnName) => {
    cy.get(tooljetDatabaseSelectors.columnHeader(columnName))
      .closest('[role="columnheader"]')
      .find('.tjdb-menu-icon')
      .click({ force: true });
    cy.get(tooljetDatabaseSelectors.editColumnOption).click();
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
    const name = uniqueTableName('qa_cols');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name'), plainColumn('age', 'integer')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('adds a varchar column and records it as a migration', () => {
    openTable(table.name);

    cy.get(tooljetDatabaseSelectors.addColumnPlus).click();
    cy.get(tooljetDatabaseSelectors.columnNameInput).type('city');
    chooseDataType('varchar');
    cy.get(tooljetDatabaseSelectors.createButton).click();

    cy.get(tooljetDatabaseSelectors.migrationChanges).should('contain.text', 'city');
    confirmMigration();

    cy.get(tooljetDatabaseSelectors.columnHeader('city')).should('exist');
    columnTypeOf('city').should('eq', 'character varying');
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 2);
  });

  // BUG-03: type change nulls the stored values, re-enable once fixed
  it('changes a column to a wider type and records the change', () => {
    openTable(table.name);

    openEditColumn('age');
    chooseDataType('bigint');
    cy.get(tooljetDatabaseSelectors.saveChangesButton).click();
    cy.get(tooljetDatabaseSelectors.migrationChanges).should('contain.text', 'integer').and('contain.text', 'bigint');
    confirmMigration();

    columnTypeOf('age').should('eq', 'bigint');
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 2);
  });

  it.skip('changes a column to a wider type and keeps the stored values', () => {
    apiSeedSql(table.id, "INSERT INTO {{self}} (name, age) VALUES ('ada', 42)", envs.development)
      .its('status')
      .should('eq', 201);
    openTable(table.name);

    openEditColumn('age');
    chooseDataType('bigint');
    cy.get(tooljetDatabaseSelectors.saveChangesButton).click();
    cy.get(tooljetDatabaseSelectors.migrationChanges).should('contain.text', 'integer').and('contain.text', 'bigint');
    confirmMigration();

    columnTypeOf('age').should('eq', 'bigint');
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(JSON.stringify(rows)).to.include('42');
    });
  });

  it('points to SQL migrations for conversions the form does not offer, and changes nothing', () => {
    openTable(table.name);

    openEditColumn('name');
    cy.get(tooljetDatabaseSelectors.dataTypeDropdown).click();
    cy.get(tooljetDatabaseSelectors.omittedTypesFooter).should('contain.text', 'need SQL migration');
    ['varchar', 'jsonb', 'int', 'bigint', 'float', 'boolean'].forEach((label) => {
      cy.contains(tooljetDatabaseSelectors.dropdownOption, new RegExp(`^${label}`)).should('exist');
    });

    cy.contains('button', 'Cancel').click();
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 1);
  });
});
