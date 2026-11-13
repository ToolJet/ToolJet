import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  getEnvironmentIds,
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiAddColumn,
  apiPromote,
  apiSeedSql,
  apiColumnNames,
  apiPromotePreview,
  apiDropTables,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database environments - UI lifecycle', () => {
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

  it('TC-01 the switcher offers development, staging and production', () => {
    newTable('qa_ui_sw').then(({ name }) => {
      openTable(name);
      cy.get(tooljetDatabaseSelectors.switcherButton).should('contain.text', 'Development');
      cy.get(tooljetDatabaseSelectors.switcherButton).click();
      ['development', 'staging', 'production'].forEach((environment) => {
        cy.get(tooljetDatabaseSelectors.environmentOption(environment)).should('exist');
      });
    });
  });

  it('TC-03 TC-04 TC-48 TC-52 the history drawer numbers migrations and says how far behind each environment is', () => {
    newTable('qa_ui_hist').then(({ id, name }) => {
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiPromote(id, envs.development).its('status').should('eq', 201);
      apiAddColumn(name, plainColumn('city'));

      openTable(name);
      openHistory();

      cy.get(tooljetDatabaseSelectors.drawer).should('contain.text', 'Migration history');
      cy.get(tooljetDatabaseSelectors.drawerStatus).should(
        'contain.text',
        'Development is 1 migration ahead of staging'
      );

      // newest first, four-digit numbers, and the create-table migration is there
      cy.get(tooljetDatabaseSelectors.drawerRow).should('have.length', 3);
      cy.get(tooljetDatabaseSelectors.drawerRow).eq(0).should('contain.text', '0003').and('contain.text', 'Latest');
      cy.get(tooljetDatabaseSelectors.drawerRow).eq(1).should('contain.text', '0002');
      cy.get(tooljetDatabaseSelectors.drawerRow)
        .eq(2)
        .should('contain.text', '0001')
        .and('contain.text', `Create table "${name}"`);

      // production has no copy of the table yet, so its tab is not usable
      cy.contains(tooljetDatabaseSelectors.drawerTab, 'Production').should('have.class', 'disabled');

      cy.contains(tooljetDatabaseSelectors.drawerTab, 'Staging').click();
      cy.get(tooljetDatabaseSelectors.drawerStatus).should(
        'contain.text',
        'Staging is 2 migrations ahead of production'
      );
    });
  });

  it('TC-12 TC-13 TC-55 running pending migrations in staging shows what will run and a backup warning', () => {
    newTable('qa_ui_run').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiAddColumn(name, plainColumn('city'));

      openTable(name);
      openHistory();
      cy.contains('button', 'Run in staging').click();

      // the history drawer also has role="dialog", so the confirmation is found by its text
      cy.contains('The following 2 migrations will be applied to the staging table.').should('be.visible');
      cy.contains('it is recommended to download backup before proceeding').should('be.visible');
      cy.contains('button', 'Download backup').should('be.visible');
      cy.contains('button', 'Cancel').should('be.visible');

      // nothing is applied until the dialog is confirmed
      apiColumnNames(name, envs.staging).should('not.include', 'gpa');

      cy.contains('button', 'Run in staging').click();
      cy.contains('The following 2 migrations will be applied to the staging table.').should('not.exist');

      apiColumnNames(name, envs.staging).should('include.members', ['gpa', 'city']);
      apiPromotePreview(id, envs.development).its('body.result.missing_migrations').should('have.length', 0);

      // the next step in the pipeline is offered
      cy.contains(tooljetDatabaseSelectors.drawerTab, 'Staging').click();
      cy.contains('button', 'Run in production').should('be.visible');
    });
  });

  it('TC-11 TC-58 outside development tables cannot be created but rows can still be added', () => {
    newTable('qa_ui_ro').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      openTable(name);

      cy.get(tooljetDatabaseSelectors.addTableButton).should('not.be.disabled');
      selectEnvironment('staging');
      cy.get(tooljetDatabaseSelectors.addTableButton).should('be.disabled');
      cy.contains('button', 'Add new data').should('not.be.disabled');
    });
  });

  it('TC-22 TC-23 each environment shows its own rows', () => {
    newTable('qa_ui_rows').then(({ id, name }) => {
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
    });
  });
});
