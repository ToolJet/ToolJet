import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiPromote,
  apiBaselineReport,
  apiRepairBaseline,
  apiDropTables,
  dbQuery,
  getEnvironmentIds,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - baseline errors', () => {
  let envs;
  let table;
  let tableNames = [];

  const markBaselineFailed = () =>
    dbQuery(
      `UPDATE internal_table_relations SET baseline_error = 'qa baseline failure' WHERE internal_table_id = '${table.id}'`
    );

  const forgetRecordedMigrations = () =>
    dbQuery(
      `DELETE FROM internal_table_migration_applications WHERE migration_id IN (SELECT id FROM internal_table_migrations WHERE internal_table_id = '${table.id}')`
    ).then(() => dbQuery(`DELETE FROM internal_table_migrations WHERE internal_table_id = '${table.id}'`));

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_baseline');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('refuses to promote a table whose baseline failed and lists it in the report', () => {
    markBaselineFailed();

    apiPromote(table.id, envs.development).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include('qa baseline failure');
    });
    apiBaselineReport().then((response) => {
      expect(response.status).to.eq(200);
      expect(JSON.stringify(response.body)).to.include(table.id);
    });
  });

  it('refuses to repair a table that already has recorded migrations', () => {
    markBaselineFailed();

    apiRepairBaseline(table.id).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include('recorded migration');
    });
  });

  it('repairs a failed baseline when no migration was recorded, then promotes', () => {
    markBaselineFailed();
    forgetRecordedMigrations();

    apiRepairBaseline(table.id).then((response) => {
      expect(response.status).to.be.within(200, 201);
      expect(response.body.result.baseline_error).to.eq(null);
      expect(response.body.result.migrations_recorded).to.be.greaterThan(0);
    });
    apiBaselineReport().then((response) => {
      expect(JSON.stringify(response.body)).to.not.include(table.id);
    });
    apiPromote(table.id, envs.development).its('status').should('eq', 201);
  });
});
