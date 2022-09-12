'use strict';

const cosmosdb = require('../lib');

const AZURE_COSMOSDB_ENDPOINT = '';
const AZURE_COSMOSDB_KEY = '';

describe('cosmosdb', () => {
  const _cosmosdb = new cosmosdb.default();
  let sourceOptions = {};
  let testDatabaseId = 'tj-test-datasource';
  let testContainerId = 'tj-test-container';
  let queryOptions = {
    database: testDatabaseId,
    container: testContainerId,
  };

  beforeAll(() => {
    sourceOptions = { endpoint: AZURE_COSMOSDB_ENDPOINT, key: AZURE_COSMOSDB_KEY };
  });

  afterAll(() => {
    return new Promise((resolve, reject) => {
      _cosmosdb
        .deleteDatabase(sourceOptions, testDatabaseId)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });

  it('should check connection', async () => {
    const { status } = await _cosmosdb.testConnection({ endpoint: AZURE_COSMOSDB_ENDPOINT, key: AZURE_COSMOSDB_KEY });
    expect(status).toBe('ok');
  });

  it('should list databases', async () => {
    queryOptions.operation = 'list_databases';
    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data instanceof Array).toBe(true);
  });

  it('should list containers of a database  ', async () => {
    queryOptions.operation = 'list_containers';
    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data instanceof Array).toBe(true);
  });

  it('should insert one or many records into a container', async () => {
    queryOptions.operation = 'insert_items';
    queryOptions.items = [
      { id: 'test-id-1', name: 'sam', email: 'sam@test.in', age: 25 },
      { id: 'test-id-2', name: 'jon', email: 'jon@test.io', age: 30 },
      { id: 'test-id-3', name: 'dev', email: 'dev@test.io', age: 15 },
    ];

    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data.message).toBe('Items inserted');
  });

  it('should read a single item from a container', async () => {
    queryOptions.operation = 'read_item';
    queryOptions.itemId = 'test-id-1';

    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data.id).toBe(queryOptions.itemId);
  });

  it('should delete a single item from a container', async () => {
    queryOptions.operation = 'delete_item';
    queryOptions.itemId = 'test-id-1';

    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data.message).toBe('Item deleted');
  });

  it('should query the items in a container using SQL-like syntax', async () => {
    queryOptions.operation = 'query_database';
    queryOptions.query = 'SELECT * FROM c WHERE c.age > 20 AND c.age <= 30';
    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data instanceof Array).toBe(true);
  });
});
