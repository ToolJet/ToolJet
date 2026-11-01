import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  getEnvironmentIds,
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiViewTable,
  apiSeedSql,
  apiSelectRows,
  apiMigrations,
  apiDropTables,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database environments - authoring schema changes in the UI', () => {
  let envs;
  let tableNames = [];
  let table;

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

  const confirmMigration = () => {
    cy.get(tooljetDatabaseSelectors.migrationModal).should('be.visible');
    cy.get(tooljetDatabaseSelectors.migrationModal).should('contain.text', 'Schema changes require migration');
    cy.get(tooljetDatabaseSelectors.migrationRun).click();
    cy.get(tooljetDatabaseSelectors.migrationModal).should('not.exist');
  };

  const latestHistoryRow = () => {
    cy.get(tooljetDatabaseSelectors.historyButton).click();
    return cy.get(tooljetDatabaseSelectors.drawerRow).first();
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_ui_schema');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name'), plainColumn('age', 'integer')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('TC-05 adding a column asks for a migration, applies it, and records it', () => {
    openTable(table.name);

    cy.get(tooljetDatabaseSelectors.addColumnPlus).click();
    cy.get(tooljetDatabaseSelectors.columnNameInput).type('city');
    chooseDataType('varchar');
    cy.get(tooljetDatabaseSelectors.createButton).click();

    // the change is shown before anything runs
    cy.get(tooljetDatabaseSelectors.migrationModal).should('be.visible');
    cy.get(tooljetDatabaseSelectors.migrationChanges)
      .should('contain.text', 'city')
      .and('contain.text', 'character varying');
    confirmMigration();

    cy.get(tooljetDatabaseSelectors.columnHeader('city')).should('exist');
    latestHistoryRow().should('contain.text', '0002').and('contain.text', `Add column "city"`);
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((columns) => {
        expect(columns.map((column) => column.column_name)).to.include('city');
      });
  });

  const changeAgeToBigint = () => {
    openTable(table.name);
    openEditColumn('age');
    cy.contains('Editing the column could break queries and apps connected with this table.').should('be.visible');
    chooseDataType('bigint');
    cy.get(tooljetDatabaseSelectors.saveChangesButton).click();

    cy.get(tooljetDatabaseSelectors.migrationChanges).should('contain.text', 'integer').and('contain.text', 'bigint');
    confirmMigration();
  };

  it('TC-06 changing a column to a compatible type records a migration and changes the type', () => {
    changeAgeToBigint();

    latestHistoryRow().should('contain.text', '0002').and('contain.text', `Edit column "age"`);
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((columns) => {
        expect(columns.find((column) => column.column_name === 'age').data_type).to.eq('bigint');
      });
  });

  // BUG-03: type change nulls the stored values, re-enable once fixed
  it.skip("TC-06 widening a column's type keeps the values already stored in it", () => {
    apiSeedSql(table.id, "INSERT INTO {{self}} (name, age) VALUES ('ada', 42)", envs.development)
      .its('status')
      .should('eq', 201);

    changeAgeToBigint();

    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(JSON.stringify(rows)).to.include('42');
    });
  });

  it('TC-07 conversions the form does not offer point the user to a SQL migration and change nothing', () => {
    openTable(table.name);

    openEditColumn('name');
    cy.get(tooljetDatabaseSelectors.dataTypeDropdown).click();
    // the footer also carries a tooltip that lists the conversions that are not offered
    cy.get(tooljetDatabaseSelectors.omittedTypesFooter)
      .should('contain.text', 'Not seeing the type you need? Some conversions')
      .and('contain.text', 'need SQL migration')
      .and('contain.text', 'Auto-incrementing columns')
      .and('contain.text', 'Date conversions');
    // a varchar column can be changed to these, and to nothing else
    ['varchar', 'jsonb', 'int', 'bigint', 'float', 'boolean'].forEach((label) => {
      cy.contains(tooljetDatabaseSelectors.dropdownOption, new RegExp(`^${label}`)).should('exist');
    });

    // leaving without saving records no migration
    cy.contains('button', 'Cancel').click();
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 1);
  });
});
