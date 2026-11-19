import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiViewTable,
  apiMigrations,
  apiAddForeignKey,
  apiUpdateForeignKey,
  apiDeleteForeignKey,
  apiCreateResource,
  apiAddTableQuery,
  apiDeleteResource,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - migration history and environment views', () => {
  let envs;
  let tableNames = [];
  let resourceIds = [];

  const newTable = (prefix, columns = [plainColumn('name')]) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return apiCreateTable(name, columns).then((id) => ({ id, name }));
  };

  const openTable = (name) => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.switcherButton).should('be.visible');
  };

  beforeEach(() => {
    tableNames = [];
    resourceIds = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    resourceIds.forEach((resourceId) => apiDeleteResource(resourceId));
    apiDropTables(tableNames);
  });

  it('records foreign key create, update and delete in the migration chain', () => {
    newTable('qa_hist_parent').then((parent) => {
      newTable('qa_hist_child', [plainColumn('parent_id', 'integer')]).then((child) => {
        const foreignKey = (onDelete) => ({
          column_names: ['parent_id'],
          referenced_table_name: parent.name,
          referenced_table_id: parent.id,
          referenced_column_names: ['id'],
          on_update: 'NO ACTION',
          on_delete: onDelete,
        });
        apiMigrations(child.id).its('body.result.migrations').should('have.length', 1);

        apiAddForeignKey(child.name, foreignKey('CASCADE')).its('status').should('eq', 201);
        apiMigrations(child.id).its('body.result.migrations').should('have.length', 2);

        apiViewTable(child.name, envs.development)
          .its('body.result.foreign_keys.0.constraint_name')
          .then((foreignKeyId) => {
            apiUpdateForeignKey(child.name, foreignKeyId, foreignKey('SET NULL')).its('status').should('eq', 200);
            apiMigrations(child.id).its('body.result.migrations').should('have.length', 3);

            apiDeleteForeignKey(child.name, foreignKeyId).its('status').should('eq', 200);
            apiMigrations(child.id).its('body.result.migrations').should('have.length', 4);
          });
      });
    });
  });

  it('keeps the history per environment and offers new migrations in development only', () => {
    newTable('qa_hist_env').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      openTable(name);
      cy.get(tooljetDatabaseSelectors.historyButton).click();
      cy.get(tooljetDatabaseSelectors.drawer).should('be.visible');
      cy.get(tooljetDatabaseSelectors.newMigrationButton).should('exist');

      cy.contains(tooljetDatabaseSelectors.drawerTab, 'Staging').click();
      cy.get(tooljetDatabaseSelectors.drawerRow).should('have.length', 1);
      cy.get(tooljetDatabaseSelectors.newMigrationButton).should('not.exist');
    });
  });

  it('disables the environments that do not have the table yet', () => {
    newTable('qa_hist_absent').then(({ name }) => {
      openTable(name);
      cy.get(tooljetDatabaseSelectors.switcherButton).click();

      cy.get(tooljetDatabaseSelectors.environmentOption('development')).should('not.be.disabled');
      cy.get(tooljetDatabaseSelectors.environmentOption('staging')).should('be.disabled');
      cy.get(tooljetDatabaseSelectors.environmentOption('production')).should('be.disabled');
    });
  });

  it('lists the apps that use the table in the migration dialog', () => {
    newTable('qa_hist_dep', [plainColumn('name'), plainColumn('age', 'integer')]).then((table) => {
      apiCreateResource('front-end', `qa-app-${Date.now()}`).then((resource) => {
        resourceIds.push(resource.id);
        apiAddTableQuery(resource, table.id, 'list_rows');
      });
      openTable(table.name);

      cy.get(tooljetDatabaseSelectors.columnHeader('age'))
        .closest('[role="columnheader"]')
        .find('.tjdb-menu-icon')
        .click({ force: true });
      cy.get(tooljetDatabaseSelectors.deleteColumnOption).click();

      cy.get(tooljetDatabaseSelectors.migrationModal).should('be.visible');
      cy.get(tooljetDatabaseSelectors.migrationModal).should('contain.text', '1 resource depend on this table');
    });
  });

  it('creates a new migration from the history drawer and lists it', () => {
    newTable('qa_hist_new').then(({ id, name }) => {
      openTable(name);
      cy.get(tooljetDatabaseSelectors.historyButton).click();
      cy.get(tooljetDatabaseSelectors.newMigrationButton).click();

      cy.get(tooljetDatabaseSelectors.migrationTitleInput).type('Add note column');
      cy.get(tooljetDatabaseSelectors.migrationSqlEditor)
        .click()
        .type('ALTER TABLE "{{}{{}self}}" ADD COLUMN note varchar');
      cy.get(tooljetDatabaseSelectors.migrationRun).click();
      cy.get(tooljetDatabaseSelectors.migrationModal).should('not.exist');

      cy.get(tooljetDatabaseSelectors.drawerRow).should('have.length', 2);
      cy.get(tooljetDatabaseSelectors.drawerRow).eq(0).should('contain.text', 'Add note column');
      apiMigrations(id).its('body.result.migrations').should('have.length', 2);
      apiViewTable(name, envs.development)
        .its('body.result.columns')
        .then((columns) => {
          expect(columns.map((column) => column.column_name)).to.include('note');
        });
    });
  });

  it('runs the pending migrations in production from the staging tab', () => {
    newTable('qa_hist_prod').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      openTable(name);
      cy.get(tooljetDatabaseSelectors.historyButton).click();
      cy.contains(tooljetDatabaseSelectors.drawerTab, 'Staging').click();
      cy.contains('button', 'Run in production').click();
      cy.contains('button', 'Run in production').click();

      apiViewTable(name, envs.production).its('status').should('eq', 200);
    });
  });
});
