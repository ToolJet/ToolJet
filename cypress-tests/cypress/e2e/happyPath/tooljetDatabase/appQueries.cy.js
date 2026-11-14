import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiAddColumn,
  apiSeedSql,
  apiSelectRows,
  apiCreateResource,
  apiAddTableQuery,
  apiRunTableQuery,
  apiPublishVersion,
  apiPromoteAppVersion,
  apiDeleteResource,
  apiDropTables,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - queries in apps', () => {
  let envs;
  let table;
  let app;
  let tableNames = [];
  let resourceIds = [];

  const runQuery = (queryId, environmentId) =>
    apiRunTableQuery(app, queryId, environmentId).then((response) => {
      expect(response.status, 'run query').to.eq(201);
      return response.body;
    });

  const seedDevelopment = (sql) => apiSeedSql(table.id, sql, envs.development).its('status').should('eq', 201);

  beforeEach(() => {
    tableNames = [];
    resourceIds = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_appq');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
    apiCreateResource('front-end', `qa-app-${Date.now()}`).then((resource) => {
      app = resource;
      resourceIds.push(resource.id);
    });
  });

  afterEach(() => {
    resourceIds.forEach((resourceId) => apiDeleteResource(resourceId));
    apiDropTables(tableNames);
  });

  it('lists rows in development', () => {
    seedDevelopment("INSERT INTO {{self}} (name) VALUES ('ada'), ('bob')");
    apiAddTableQuery(app, table.id, 'list_rows').then((queryId) => {
      runQuery(queryId, envs.development).then((body) => {
        expect(body.status).to.eq('ok');
        expect(body.data.map((row) => row.name)).to.deep.eq(['ada', 'bob']);
      });
    });
  });

  it('creates a row in development', () => {
    apiAddTableQuery(app, table.id, 'create_row', {
      operation: 'create_row',
      create_row: { 0: { column: 'name', value: 'ada' } },
    }).then((queryId) => {
      runQuery(queryId, envs.development).its('status').should('eq', 'ok');
      apiSelectRows(table.id, envs.development).then((rows) => {
        expect(rows.map((row) => row.name)).to.deep.eq(['ada']);
      });
    });
  });

  it('updates rows in development', () => {
    seedDevelopment("INSERT INTO {{self}} (name) VALUES ('ada')");
    apiAddTableQuery(app, table.id, 'update_rows', {
      operation: 'update_rows',
      update_rows: {
        columns: { 0: { column: 'name', value: 'bob' } },
        where_filters: { 0: { column: 'name', operator: 'eq', value: 'ada' } },
      },
    }).then((queryId) => {
      runQuery(queryId, envs.development).its('status').should('eq', 'ok');
      apiSelectRows(table.id, envs.development).then((rows) => {
        expect(rows.map((row) => row.name)).to.deep.eq(['bob']);
      });
    });
  });

  it('deletes rows in development', () => {
    seedDevelopment("INSERT INTO {{self}} (name) VALUES ('ada'), ('bob')");
    apiAddTableQuery(app, table.id, 'delete_rows', {
      operation: 'delete_rows',
      delete_rows: { where_filters: { 0: { column: 'name', operator: 'eq', value: 'ada' } }, limit: 1, order_column: 'id' },
    }).then((queryId) => {
      runQuery(queryId, envs.development).its('status').should('eq', 'ok');
      apiSelectRows(table.id, envs.development).then((rows) => {
        expect(rows.map((row) => row.name)).to.deep.eq(['bob']);
      });
    });
  });

  it('reads each environment its own rows with the same saved query', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
    seedDevelopment("INSERT INTO {{self}} (name) VALUES ('dev-row')");
    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('staging-row')", envs.staging)
      .its('status')
      .should('eq', 201);

    apiAddTableQuery(app, table.id, 'list_rows').then((queryId) => {
      runQuery(queryId, envs.development).then((body) => {
        expect(body.data.map((row) => row.name)).to.deep.eq(['dev-row']);
      });
      runQuery(queryId, envs.staging).then((body) => {
        expect(body.data.map((row) => row.name)).to.deep.eq(['staging-row']);
      });
    });
  });

  it('reports a missing table when a query runs in an environment that does not have it yet', () => {
    apiAddTableQuery(app, table.id, 'list_rows').then((queryId) => {
      runQuery(queryId, envs.staging).then((body) => {
        expect(body.status).to.eq('failed');
        expect(body.message).to.include('has no relation in this environment');
      });
    });
  });

  it('promotes the app when its table is only behind in the target environment', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
    apiAddColumn(table.name, plainColumn('gpa', 'integer'));
    apiAddTableQuery(app, table.id, 'list_rows').then(() => {
      apiPublishVersion(app, 'v1').its('status').should('eq', 200);
      apiPromoteAppVersion(app, envs.development).its('status').should('eq', 200);
    });
  });
});
