import {
  getEnvironmentIds,
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiViewTable,
  apiPromote,
  apiDependents,
  apiDropTable,
  apiDropTables,
  apiCreateResource,
  apiAddTableQuery,
  apiDeleteResource,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database environments - delete and dependents', () => {
  let envs;
  let tableNames = [];
  let resourceIds = [];

  const trackedTable = (prefix, columns, foreignKeys) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return apiCreateTable(name, columns, foreignKeys).then((id) => ({ id, name }));
  };

  beforeEach(() => {
    tableNames = [];
    resourceIds = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    resourceIds.forEach((resourceId) => apiDeleteResource(resourceId));
    apiDropTables(tableNames);
  });

  const addResourceUsing = (type, table, name) =>
    apiCreateResource(type, name).then((resource) => {
      resourceIds.push(resource.id);
      return apiAddTableQuery(resource, table.id, `list_${type}`);
    });

  it('TC-32 TC-33 TC-53 an app, a module and a workflow that query the table are listed and block the delete', () => {
    trackedTable('qa_dep').then((table) => {
      // no references yet
      apiDependents(table.id).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.result.count).to.eq(0);
        expect(response.body.result.dependents).to.have.length(0);
      });

      [
        ['front-end', `qa-app-${Date.now()}`],
        ['module', `qa-module-${Date.now()}`],
        ['workflow', `qa-workflow-${Date.now()}`],
      ].forEach(([type, name]) => {
        addResourceUsing(type, table, name);
        apiDependents(table.id).then((response) => {
          const { dependents } = response.body.result;
          expect(
            dependents.map((d) => d.type),
            `after adding ${type}`
          ).to.include(type);
          expect(dependents.find((d) => d.type === type).queries.map((q) => q.name)).to.deep.eq([`list_${type}`]);
        });
        // each kind of resource blocks the delete on its own
        apiDropTable(table.name).then((response) => {
          expect(response.status, `delete while a ${type} uses it`).to.eq(400);
          // "1 resource depends on…" / "2 resources depend on…"
          expect(response.body.message).to.match(/resources? depends? on this table/);
        });
      });

      apiDependents(table.id).its('body.result.count').should('eq', 3);
      // the table is untouched
      apiViewTable(table.name, envs.development).its('status').should('eq', 200);
    });
  });

  it('TC-34 deleting an unreferenced table drops it in every environment and frees the name', () => {
    trackedTable('qa_del').then((table) => {
      apiPromote(table.id, envs.development).its('status').should('eq', 201);
      apiPromote(table.id, envs.staging).its('status').should('eq', 201);
      [envs.development, envs.staging, envs.production].forEach((environmentId) => {
        apiViewTable(table.name, environmentId).its('status').should('eq', 200);
      });

      apiDropTable(table.name).its('status').should('eq', 200);
      [envs.development, envs.staging, envs.production].forEach((environmentId) => {
        apiViewTable(table.name, environmentId).its('status').should('eq', 404);
      });

      // the name can be reused straight away
      apiCreateTable(table.name).then((newId) => {
        expect(newId).to.not.eq(table.id);
      });
    });
  });

  it("TC-35 a table referenced by another table's foreign key cannot be deleted", () => {
    trackedTable('qa_fkparent').then((parent) => {
      trackedTable(
        'qa_fkchild',
        [plainColumn('parent_id', 'integer')],
        [
          {
            column_names: ['parent_id'],
            referenced_table_name: parent.name,
            referenced_table_id: parent.id,
            referenced_column_names: ['id'],
            on_update: 'NO ACTION',
            on_delete: 'CASCADE',
          },
        ]
      ).then((child) => {
        apiDependents(parent.id)
          .its('body.result.foreignKeyTables')
          .then((tables) => {
            expect(tables.map((t) => t.name)).to.deep.eq([child.name]);
          });
        apiDropTable(parent.name).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.message).to.include('foreign key referencing it');
          expect(response.body.message).to.include(child.name);
        });
        apiViewTable(parent.name, envs.development).its('status').should('eq', 200);

        // control: child first, then the parent goes
        apiDropTable(child.name).its('status').should('eq', 200);
        apiDropTable(parent.name).its('status').should('eq', 200);
      });
    });
  });
});
