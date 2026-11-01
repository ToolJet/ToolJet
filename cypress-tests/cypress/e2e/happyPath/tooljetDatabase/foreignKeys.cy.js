import { tooljetDatabaseSelectors } from 'Selectors/tooljetDatabase/tooljetDatabase';
import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiViewTable,
  apiSeedSql,
  apiSelectRows,
  apiDependents,
  apiDropTable,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - foreign keys', () => {
  let envs;
  let parent;
  let child;
  let tableNames = [];

  const foreignKeyTo = (referenced, onDelete = 'CASCADE') => [
    {
      column_names: ['parent_id'],
      referenced_table_name: referenced.name,
      referenced_table_id: referenced.id,
      referenced_column_names: ['id'],
      on_update: 'NO ACTION',
      on_delete: onDelete,
    },
  ];

  const trackedTable = (prefix, columns, foreignKeys) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return apiCreateTable(name, columns, foreignKeys).then((id) => ({ id, name }));
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    cy.skipWalkthrough();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    trackedTable('qa_fk_parent').then((table) => {
      parent = table;
      trackedTable('qa_fk_child', [plainColumn('parent_id', 'integer')], foreignKeyTo(table)).then((created) => {
        child = created;
      });
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('creates a child table with a foreign key to the parent', () => {
    apiViewTable(child.name, envs.development)
      .its('body.result.foreign_keys')
      .then((foreignKeys) => {
        expect(foreignKeys).to.have.length(1);
        expect(foreignKeys[0].referenced_table_name).to.eq(parent.name);
        expect(foreignKeys[0].column_names).to.deep.eq(['parent_id']);
      });
  });

  it('only accepts child rows that point at an existing parent row', () => {
    apiSeedSql(child.id, 'INSERT INTO {{self}} (parent_id) VALUES (999)', envs.development).then((response) => {
      expect(response.status).to.not.eq(201);
    });
    apiSeedSql(parent.id, "INSERT INTO {{self}} (name) VALUES ('p1')", envs.development)
      .its('status')
      .should('eq', 201);
    apiSeedSql(child.id, 'INSERT INTO {{self}} (parent_id) VALUES (1)', envs.development)
      .its('status')
      .should('eq', 201);
    apiSelectRows(child.id, envs.development).should('have.length', 1);
  });

  it('deletes child rows with their parent row when the foreign key cascades', () => {
    apiSeedSql(parent.id, "INSERT INTO {{self}} (name) VALUES ('p1')", envs.development)
      .its('status')
      .should('eq', 201);
    apiSeedSql(child.id, 'INSERT INTO {{self}} (parent_id) VALUES (1), (1)', envs.development)
      .its('status')
      .should('eq', 201);

    apiSeedSql(parent.id, 'DELETE FROM {{self}} WHERE id = 1', envs.development).its('status').should('eq', 201);
    apiSelectRows(child.id, envs.development).should('have.length', 0);
  });

  it('lists the child as a dependent and refuses to drop a referenced parent', () => {
    apiDependents(parent.id)
      .its('body.result.foreignKeyTables')
      .then((tables) => {
        expect(tables.map((table) => table.name)).to.deep.eq([child.name]);
      });

    apiDropTable(parent.name).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include('foreign key referencing it');
    });
    apiViewTable(parent.name, envs.development).its('status').should('eq', 200);

    // child first, then the parent can go
    apiDropTable(child.name).its('status').should('eq', 200);
    apiDropTable(parent.name).its('status').should('eq', 200);
  });

  it("shows the child table's foreign key relation in the edit table drawer", () => {
    cy.visit('/my-workspace/database');
    cy.get(tooljetDatabaseSelectors.tableItem(child.name), { timeout: 20000 }).click();
    cy.get(tooljetDatabaseSelectors.tableItem(child.name)).trigger('mouseover');
    cy.get(tooljetDatabaseSelectors.tableItem(child.name)).find(tooljetDatabaseSelectors.tableKebabIcon).click();
    cy.get(tooljetDatabaseSelectors.renameTableOption).click();

    cy.contains('Foreign key relation').should('be.visible');
    cy.contains(parent.name).should('be.visible');
  });
});
