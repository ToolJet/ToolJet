// API helpers for ToolJet Database specs, non-2xx responses do not fail the request

const tooljetDatabaseBase = () =>
  `${Cypress.env('server_host')}/api/tooljet-db/organizations/${Cypress.env('workspaceId')}`;

/**
 * @tjBlock  shared
 * @tjUsage  tooljetDatabaseRequest('GET', '/baseline-report')
 */
export const tooljetDatabaseRequest = (method, path, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${tooljetDatabaseBase()}${path}`,
      headers,
      body,
      failOnStatusCode: false,
      log: false,
    })
  );

// { development, staging, production } -> environment id, ordered by priority.
/**
 * @tjType   environmentIds.get
 * @tjBlock  tooljetDatabase
 * @tjUsage  getEnvironmentIds()
 */
export const getEnvironmentIds = () =>
  cy.apiGetEnvironments().then((environments) => {
    const byPriority = [...environments].sort((a, b) => a.priority - b.priority);
    return {
      development: byPriority[0].id,
      staging: byPriority[1].id,
      production: byPriority[2].id,
    };
  });

export const primaryKeyColumn = {
  column_name: 'id',
  data_type: 'serial',
  constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
};

/**
 * @tjBlock  shared
 * @tjUsage  plainColumn('name')
 */
export const plainColumn = (columnName, dataType = 'character varying') => ({
  column_name: columnName,
  data_type: dataType,
  constraints_type: { is_primary_key: false, is_not_null: false, is_unique: false },
});

// table names are limited to 32 characters
/**
 * @tjBlock  shared
 * @tjUsage  uniqueTableName(prefix)
 */
export const uniqueTableName = (prefix = 'qa_tooljet_db') =>
  `${prefix.slice(0, 20)}_${Date.now().toString(36)}${Math.floor(Math.random() * 36 * 36).toString(36)}`;

// PostgREST reloads its schema cache after DDL, new tables answer 409 PGRST205 until then
export const apiWaitForTableInProxy = (tableId, environmentId, attemptsLeft = 40) =>
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        url: `${Cypress.env('server_host')}/api/tooljet-db/proxy/${tableId}?limit=1&offset=0&environment_id=${environmentId}`,
        headers,
        failOnStatusCode: false,
        log: false,
      })
      .then((response) => {
        if (response.status === 200) return;
        expect(
          attemptsLeft,
          `table ${tableId} never became queryable (last status ${response.status})`
        ).to.be.greaterThan(0);
        cy.wait(500, { log: false });
        return apiWaitForTableInProxy(tableId, environmentId, attemptsLeft - 1);
      })
  );

/**
 * @tjType   table.create
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiCreateTable(name, [plainColumn('name')])
 */
export const apiCreateTable = (tableName, columns = [plainColumn('name')], foreignKeys = []) =>
  tooljetDatabaseRequest('POST', '/table', {
    table_name: tableName,
    columns: [primaryKeyColumn, ...columns],
    foreign_keys: foreignKeys,
  }).then((response) => {
    expect(response.status, `create table ${tableName}`).to.equal(201);
    const tableId = response.body.result.id;
    return getEnvironmentIds()
      .then((envs) => apiWaitForTableInProxy(tableId, envs.development))
      .then(() => tableId);
  });

/**
 * @tjType   column.add
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiAddColumn(name, plainColumn('gpa', 'integer'))
 */
export const apiAddColumn = (tableName, column) =>
  tooljetDatabaseRequest('POST', `/table/${tableName}/column`, { column }).then((response) => {
    expect(response.status, `add column to ${tableName}`).to.equal(201);
  });

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiViewTable(name, envs.production)
 */
export const apiViewTable = (tableName, environmentId) =>
  tooljetDatabaseRequest('GET', `/table/${tableName}?environment_id=${environmentId}`);

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiColumnNames(name, envs.staging)
 */
export const apiColumnNames = (tableName, environmentId) =>
  apiViewTable(tableName, environmentId).then((response) => {
    expect(response.status, `view ${tableName}`).to.equal(200);
    return response.body.result.columns.map((column) => column.column_name);
  });

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiPromote(id, envs.development)
 */
export const apiPromote = (tableId, sourceEnvironmentId) =>
  tooljetDatabaseRequest('POST', `/table/${tableId}/promote`, { environment_id: sourceEnvironmentId });

/**
 * @tjType   preview.promote
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiPromotePreview(id, envs.development)
 */
export const apiPromotePreview = (tableId, sourceEnvironmentId) =>
  tooljetDatabaseRequest('GET', `/table/${tableId}/promote/preview?environment_id=${sourceEnvironmentId}`);

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiMigrations(table.id)
 */
export const apiMigrations = (tableId) => tooljetDatabaseRequest('GET', `/table/${tableId}/migrations`);

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiRawSqlMigration(id, 'ALTER TABLE "{{nope}}" ADD COLUMN x integer')
 */
export const apiRawSqlMigration = (tableId, sql, name = 'qa migration', refs = {}) =>
  tooljetDatabaseRequest('POST', `/table/${tableId}/migrations/sql`, {
    sql,
    name,
    description: 'created by cypress',
    refs,
  });

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiRevertMigration(id, migrationId, 'ALTER TABLE "{{self}}" DROP COLUMN note')
 */
export const apiRevertMigration = (tableId, migrationId, sql, refs = {}) =>
  tooljetDatabaseRequest('POST', `/table/${tableId}/migrations/${migrationId}/revert`, { sql, refs });

// seed-data SQL route, "{{self}}" stands for the table
/**
 * @tjType   sql.seed
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiSeedSql(id, "INSERT INTO {{self}} (name) VALUES ('s1')", envs.staging)
 */
export const apiSeedSql = (tableId, sql, environmentId) =>
  tooljetDatabaseRequest('POST', `/table/${tableId}/sql`, { sql, environment_id: environmentId });

/**
 * @tjType   rows.select
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiSelectRows(table.id, envs.development)
 */
export const apiSelectRows = (tableId, environmentId) =>
  apiSeedSql(tableId, 'SELECT * FROM {{self}}', environmentId).then((response) => {
    expect(response.status, 'select rows').to.equal(201);
    return response.body.result.data;
  });

/**
 * @tjType   table.drop
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiDropTable(parent.name)
 */
export const apiDropTable = (tableName) => tooljetDatabaseRequest('DELETE', `/table/${tableName}`);

/**
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiDependents(table.id)
 */
export const apiDependents = (tableId) => tooljetDatabaseRequest('GET', `/table/${tableId}/dependents`);

// resources that reference a table: app, module or workflow

const serverApi = (method, path, body) =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({
      method,
      url: `${Cypress.env('server_host')}/api${path}`,
      headers,
      body,
      failOnStatusCode: false,
      log: false,
    })
  );

// type is "front-end", "module" or "workflow"
/**
 * @tjType   resource.create
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiCreateResource(type, name)
 */
export const apiCreateResource = (type, name) =>
  serverApi('POST', '/apps', { type, name, creation_mode: 'DEFAULT' }).then((created) => {
    expect(created.status, `create ${type}`).to.eq(201);
    return serverApi('GET', `/apps/${created.body.id}`).then((app) => ({
      id: created.body.id,
      versionId: app.body.editing_version.id,
      environmentId: app.body.editorEnvironment.id,
    }));
  });

// adds a "list rows" query on the table to the editing version
/**
 * @tjType   tableQuery.add
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiAddTableQuery(resource, table.id, `list_${type}`)
 */
export const apiAddTableQuery = (resource, tableId, queryName) =>
  serverApi(
    'GET',
    `/data-sources/${Cypress.env('workspaceId')}/environments/${resource.environmentId}/versions/${resource.versionId}`
  ).then((response) => {
    const dataSource = response.body.data_sources.find((ds) => ds.kind === 'tooljetdb');
    return serverApi('POST', `/data-queries/data-sources/${dataSource.id}/versions/${resource.versionId}`, {
      app_id: resource.id,
      app_version_id: resource.versionId,
      name: queryName,
      kind: 'tooljetdb',
      options: { operation: 'list_rows', table_id: tableId, list_rows: {} },
      data_source_id: dataSource.id,
      plugin_id: null,
    }).then((created) => {
      expect(created.status, `add query ${queryName}`).to.eq(201);
    });
  });

/**
 * @tjType   resource.delete
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiDeleteResource(resourceId)
 */
export const apiDeleteResource = (resourceId) => serverApi('DELETE', `/apps/${resourceId}`);

// drop child tables first, failures are ignored so cleanup never masks the real error
/**
 * @tjType   tables.drop
 * @tjBlock  tooljetDatabase
 * @tjUsage  apiDropTables(tableNames)
 */
export const apiDropTables = (tableNames) => {
  [...tableNames].reverse().forEach((tableName) => apiDropTable(tableName));
};
