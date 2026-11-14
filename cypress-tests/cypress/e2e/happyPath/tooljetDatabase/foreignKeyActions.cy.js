import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiSeedSql,
  apiSelectRows,
  apiViewTable,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - foreign key actions', () => {
  let envs;
  let tableNames = [];

  const trackedTable = (prefix, columns, foreignKeys) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return apiCreateTable(name, columns, foreignKeys).then((id) => ({ id, name }));
  };

  const parentAndChild = (onDelete, onUpdate) =>
    trackedTable('qa_fka_parent').then((parent) =>
      trackedTable(
        'qa_fka_child',
        [plainColumn('parent_id', 'integer')],
        [
          {
            column_names: ['parent_id'],
            referenced_table_name: parent.name,
            referenced_table_id: parent.id,
            referenced_column_names: ['id'],
            on_update: onUpdate,
            on_delete: onDelete,
          },
        ]
      ).then((child) => ({ parent, child }))
    );

  const seed = (table, sql) => apiSeedSql(table.id, sql, envs.development).its('status').should('eq', 201);

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('sets the child reference to NULL when the parent row is deleted', () => {
    parentAndChild('SET NULL', 'NO ACTION').then(({ parent, child }) => {
      seed(parent, "INSERT INTO {{self}} (name) VALUES ('p1')");
      seed(child, 'INSERT INTO {{self}} (parent_id) VALUES (1)');

      seed(parent, 'DELETE FROM {{self}} WHERE id = 1');

      apiSelectRows(child.id, envs.development).then((rows) => {
        expect(rows).to.have.length(1);
        expect(rows[0].parent_id).to.eq(null);
      });
    });
  });

  it('updates the child reference when the parent key is updated', () => {
    parentAndChild('NO ACTION', 'CASCADE').then(({ parent, child }) => {
      seed(parent, "INSERT INTO {{self}} (name) VALUES ('p1')");
      seed(child, 'INSERT INTO {{self}} (parent_id) VALUES (1)');

      seed(parent, 'UPDATE {{self}} SET id = 10 WHERE id = 1');

      apiSelectRows(child.id, envs.development).then((rows) => {
        expect(rows[0].parent_id).to.eq(10);
      });
    });
  });

  it('creates a foreign key relation from the edit table drawer', () => {
    cy.skipWalkthrough();
    trackedTable('qa_fkui_parent').then((parent) => {
      trackedTable('qa_fkui_child', [plainColumn('parent_id', 'integer')]).then((child) => {
        // the relation form uses popover dropdowns without data-cy, each opened by the same button
        const dropdown = (index) => cy.get('[data-cy="show-ds-popover-button"]').eq(index);
        const choose = (index, label) => {
          dropdown(index).click();
          // exact match, so the dropdown's screen-reader live region is never picked
          cy.get('.popover')
            .contains(new RegExp(`^${label}$`))
            .click();
        };

        cy.visit('/my-workspace/database');
        cy.get(tooljetDatabaseSelectors.tableItem(child.name), { timeout: 20000 }).click();
        // the relation form needs the loaded columns, so wait for the grid
        cy.get(tooljetDatabaseSelectors.columnHeader('parent_id')).should('be.visible');
        cy.get(tooljetDatabaseSelectors.tableItem(child.name)).trigger('mouseover');
        cy.get(tooljetDatabaseSelectors.tableItem(child.name)).find(tooljetDatabaseSelectors.tableKebabIcon).click();
        cy.get(tooljetDatabaseSelectors.renameTableOption).click();
        cy.contains('Add relation').click();

        choose(1, 'parent_id');
        choose(2, parent.name);
        dropdown(3).click();
        cy.get('.popover').contains(/^id$/).click();
        choose(5, 'CASCADE');
        // creating the relation opens the migration confirmation directly
        cy.get(tooljetDatabaseSelectors.createButton).click();
        cy.get(tooljetDatabaseSelectors.migrationModal).should('be.visible');
        cy.get(tooljetDatabaseSelectors.migrationRun).click();
        cy.get(tooljetDatabaseSelectors.migrationModal).should('not.exist');

        apiViewTable(child.name, envs.development)
          .its('body.result.foreign_keys')
          .then((foreignKeys) => {
            expect(foreignKeys).to.have.length(1);
            expect(foreignKeys[0].referenced_table_name).to.eq(parent.name);
            expect(foreignKeys[0].on_delete).to.eq('CASCADE');
          });
      });
    });
  });
});
