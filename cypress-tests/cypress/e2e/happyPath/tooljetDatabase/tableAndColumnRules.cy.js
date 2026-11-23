import {
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiViewTable,
  apiSeedSql,
  apiSelectRows,
  apiDropTables,
  getEnvironmentIds,
  tooljetDatabaseRequest,
  primaryKeyColumn,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database - table and column rules', () => {
  let envs;
  let table;
  let tableNames = [];

  const createTableRequest = (tableName) =>
    tooljetDatabaseRequest('POST', '/table', {
      table_name: tableName,
      columns: [primaryKeyColumn, plainColumn('name')],
      foreign_keys: [],
    });

  const addColumnRequest = (column) => tooljetDatabaseRequest('POST', `/table/${table.name}/column`, { column });

  const columnNamesOf = () =>
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((columns) => columns.map((column) => column.column_name));

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
    const name = uniqueTableName('qa_rules');
    tableNames.push(name);
    apiCreateTable(name, [plainColumn('name')]).then((id) => {
      table = { id, name };
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('refuses a table name with spaces or special characters', () => {
    ['bad name', 'bad-name!', 'bad;drop'].forEach((tableName) => {
      createTableRequest(tableName).its('status').should('be.gte', 400);
      apiViewTable(tableName, envs.development).its('status').should('eq', 404);
    });
  });

  it('refuses a table name longer than 32 characters', () => {
    const tooLong = 'qa_name_that_is_far_too_long_for_the_limit';
    createTableRequest(tooLong).its('status').should('be.gte', 400);
    apiViewTable(tooLong, envs.development).its('status').should('eq', 404);
  });

  it('refuses a column name that already exists', () => {
    addColumnRequest(plainColumn('name')).its('status').should('be.gte', 400);
    columnNamesOf().then((names) => {
      expect(names.filter((columnName) => columnName === 'name')).to.have.length(1);
    });
  });

  it('adds columns of the common types and reports the stored type', () => {
    const columns = [
      ['col_int', 'integer', 'integer'],
      ['col_ts', 'timestamp with time zone', 'timestamp with time zone'],
      ['col_bool', 'boolean', 'boolean'],
    ];
    columns.forEach(([columnName, dataType]) => {
      addColumnRequest(plainColumn(columnName, dataType)).its('status').should('eq', 201);
    });
    apiViewTable(table.name, envs.development)
      .its('body.result.columns')
      .then((stored) => {
        columns.forEach(([columnName, , databaseType]) => {
          expect(stored.find((column) => column.column_name === columnName)?.data_type).to.eq(databaseType);
        });
      });
  });

  it('keeps a unique column free of duplicate values', () => {
    addColumnRequest({
      column_name: 'code',
      data_type: 'character varying',
      constraints_type: { is_not_null: false, is_unique: true },
    })
      .its('status')
      .should('eq', 201);

    apiSeedSql(table.id, "INSERT INTO {{self}} (code) VALUES ('a')", envs.development).its('status').should('eq', 201);
    apiSeedSql(table.id, "INSERT INTO {{self}} (code) VALUES ('a')", envs.development)
      .its('status')
      .should('not.eq', 201);
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows).to.have.length(1);
    });
  });

  it('refuses a row without a value for a not-null column', () => {
    addColumnRequest({
      column_name: 'required_name',
      data_type: 'character varying',
      column_default: 'x',
      constraints_type: { is_not_null: true, is_unique: false },
    })
      .its('status')
      .should('eq', 201);

    apiSeedSql(table.id, 'INSERT INTO {{self}} (required_name) VALUES (NULL)', envs.development)
      .its('status')
      .should('not.eq', 201);
    apiSelectRows(table.id, envs.development).then((rows) => {
      expect(rows).to.have.length(0);
    });
  });
});
