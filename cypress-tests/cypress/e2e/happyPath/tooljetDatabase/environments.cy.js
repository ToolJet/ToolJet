import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiAddColumn,
  apiPromote,
  apiPromotePreview,
  apiSeedSql,
  apiColumnNames,
  apiViewTable,
  apiMigrations,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - environments and promote', () => {
  let envs;
  let tableNames = [];

  const newTable = (prefix) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return apiCreateTable(name, [plainColumn('name')]).then((id) => ({ id, name }));
  };

  const openTable = (name) => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should('be.visible');
  };

  const openHistory = () => {
    cy.get(tooljetDatabaseSelectors.historyButton).click();
    cy.get(tooljetDatabaseSelectors.drawer).should('be.visible');
  };

  const selectEnvironment = (name) => {
    cy.get(tooljetDatabaseSelectors.switcherButton).click();
    cy.get(tooljetDatabaseSelectors.environmentOption(name)).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should(
      'contain.text',
      name.charAt(0).toUpperCase() + name.slice(1)
    );
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('creates a new table in development only', () => {
    newTable('qa_env_dev').then(({ name }) => {
      apiViewTable(name, envs.development).its('status').should('eq', 200);
      apiViewTable(name, envs.staging).its('status').should('eq', 404);
      apiViewTable(name, envs.production).its('status').should('eq', 404);
    });
  });

  it('offers development, staging and production in the environment switcher', () => {
    newTable('qa_env_sw').then(({ name }) => {
      openTable(name);
      cy.get(tooljetDatabaseSelectors.switcherButton).should('contain.text', 'Development');
      cy.get(tooljetDatabaseSelectors.switcherButton).click();
      ['development', 'staging', 'production'].forEach((environment) => {
        cy.get(tooljetDatabaseSelectors.environmentOption(environment)).should('exist');
      });
    });
  });

  it('promotes a table from development to staging and then to production', () => {
    newTable('qa_env_pr').then(({ id, name }) => {
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiSeedSql(id, "INSERT INTO {{self}} (name) VALUES ('dev-row')", envs.development)
        .its('status')
        .should('eq', 201);

      apiPromotePreview(id, envs.development).its('body.result.missing_migrations').should('have.length', 2);

      apiPromote(id, envs.development).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.result.promoted_to).to.eq('staging');
      });
      apiColumnNames(name, envs.staging).should('include.members', ['name', 'gpa']);
      // promote moves the schema, not the rows
      apiSeedSql(id, 'SELECT * FROM {{self}}', envs.staging).its('body.result.data').should('have.length', 0);

      apiPromote(id, envs.staging).its('status').should('eq', 201);
      apiViewTable(name, envs.production).its('status').should('eq', 200);
    });
  });

  it('shows the migration history and how far each environment is behind', () => {
    newTable('qa_env_hist').then(({ id, name }) => {
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiPromote(id, envs.development).its('status').should('eq', 201);
      apiAddColumn(name, plainColumn('city'));

      openTable(name);
      openHistory();

      cy.get(tooljetDatabaseSelectors.drawerStatus).should(
        'contain.text',
        'Development is 1 migration ahead of staging'
      );
      cy.get(tooljetDatabaseSelectors.drawerRow).should('have.length', 3);
      cy.get(tooljetDatabaseSelectors.drawerRow).eq(0).should('contain.text', '0003').and('contain.text', 'Latest');
      cy.get(tooljetDatabaseSelectors.drawerRow)
        .eq(2)
        .should('contain.text', '0001')
        .and('contain.text', `Create table "${name}"`);
    });
  });

  it('runs pending migrations in staging from the history drawer after a confirmation', () => {
    newTable('qa_env_run').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiAddColumn(name, plainColumn('city'));

      openTable(name);
      openHistory();
      cy.contains('button', 'Run in staging').click();

      cy.contains('The following 2 migrations will be applied to the staging table.').should('be.visible');
      cy.contains('button', 'Download backup').should('be.visible');
      // nothing runs until the dialog is confirmed
      apiColumnNames(name, envs.staging).should('not.include', 'gpa');

      cy.contains('button', 'Run in staging').click();
      cy.contains('The following 2 migrations will be applied to the staging table.').should('not.exist');

      apiColumnNames(name, envs.staging).should('include.members', ['gpa', 'city']);
      apiPromotePreview(id, envs.development).its('body.result.missing_migrations').should('have.length', 0);
    });
  });

  it('blocks schema changes outside development but still allows row edits', () => {
    newTable('qa_env_ro').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      openTable(name);

      cy.get(tooljetDatabaseSelectors.addTableButton).should('not.be.disabled');
      selectEnvironment('staging');
      cy.get(tooljetDatabaseSelectors.addTableButton).should('be.disabled');
      cy.contains('button', 'Add new data').should('not.be.disabled');
    });
  });

  it('keeps rows separate in each environment', () => {
    newTable('qa_env_rows').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      apiSeedSql(id, "INSERT INTO {{self}} (name) VALUES ('d1'), ('d2')", envs.development)
        .its('status')
        .should('eq', 201);
      apiSeedSql(id, "INSERT INTO {{self}} (name) VALUES ('s1')", envs.staging).its('status').should('eq', 201);

      openTable(name);
      cy.get(tooljetDatabaseSelectors.totalRecords).should('contain.text', '2 records');
      selectEnvironment('staging');
      cy.get(tooljetDatabaseSelectors.totalRecords).should('contain.text', '1 records');
      selectEnvironment('development');
      cy.get(tooljetDatabaseSelectors.totalRecords).should('contain.text', '2 records');
      apiMigrations(id).its('body.result.migrations').should('have.length', 1);
    });
  });
});
