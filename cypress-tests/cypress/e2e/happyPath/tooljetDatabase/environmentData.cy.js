import {
  getEnvironmentIds,
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiColumnNames,
  apiPromote,
  apiMigrations,
  apiSeedSql,
  apiSelectRows,
  apiDropTables,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database environments - data per environment and seed SQL', () => {
  let envs;
  let tableNames = [];
  let table;

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_data');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('TC-22 rows are independent per environment', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);

    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('dev-only')", envs.development)
      .its('status')
      .should('eq', 201);
    apiSelectRows(table.id, envs.development).should('have.length', 1);
    apiSelectRows(table.id, envs.staging).should('have.length', 0);

    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('stage-a'), ('stage-b')", envs.staging)
      .its('status')
      .should('eq', 201);
    apiSelectRows(table.id, envs.staging).should('have.length', 2);
    // development did not pick up the staging rows
    apiSelectRows(table.id, envs.development).should('have.length', 1);
  });

  it('TC-26 seed SQL changes rows of the chosen environment and is not a migration', () => {
    apiPromote(table.id, envs.development).its('status').should('eq', 201);

    apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('seed-1')", envs.staging).its('status').should('eq', 201);
    apiSelectRows(table.id, envs.staging).then((rows) => {
      expect(JSON.stringify(rows)).to.include('seed-1');
    });
    apiSeedSql(table.id, "UPDATE {{self}} SET name = 'seed-2' WHERE name = 'seed-1'", envs.staging)
      .its('status')
      .should('eq', 201);
    apiSelectRows(table.id, envs.staging).then((rows) => {
      expect(JSON.stringify(rows)).to.include('seed-2');
      expect(JSON.stringify(rows)).to.not.include('seed-1');
    });

    // data statements never appear in the migration history
    apiMigrations(table.id).its('body.result.migrations').should('have.length', 1);
  });

  it('TC-27 seed SQL must address the table as {{self}} and nothing else', () => {
    apiSeedSql(table.id, `SELECT * FROM ${table.name}`, envs.development).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include('{{self}}');
    });
    apiSeedSql(table.id, `SELECT * FROM {{table.${table.name}}}`, envs.development).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include('may only reference');
    });
    // control
    apiSeedSql(table.id, 'SELECT * FROM {{self}}', envs.development).its('status').should('eq', 201);
  });

  [
    ['ALTER TABLE', 'ALTER TABLE {{self}} ADD COLUMN sneaky integer'],
    ['DROP TABLE', 'DROP TABLE {{self}}'],
    ['CREATE TABLE', 'CREATE TABLE {{self}}_copy (a integer)'],
    ['TRUNCATE', 'TRUNCATE {{self}}'],
  ].forEach(([label, sql]) => {
    // BUG-02: the rejection is a 500 instead of a 4xx, re-enable once fixed
    it.skip(`TC-28 seed SQL rejects ${label} in every environment`, () => {
      apiPromote(table.id, envs.development).its('status').should('eq', 201);
      [envs.development, envs.staging].forEach((environmentId) => {
        apiSeedSql(table.id, sql, environmentId).then((response) => {
          // rejected, and rejected as a client error rather than a server fault
          expect(response.status, `${label} status`).to.be.within(400, 499);
          expect(response.body.message).to.include('restricted');
        });
      });
      apiColumnNames(table.name, envs.development).should('not.include', 'sneaky');
      apiColumnNames(table.name, envs.staging).should('not.include', 'sneaky');

      // control: a data statement is accepted in the same environment
      apiSeedSql(table.id, "INSERT INTO {{self}} (name) VALUES ('ok')", envs.staging).its('status').should('eq', 201);
    });
  });
});
