'use strict';

const cosmosdb = require('../lib');

const AZURE_COSMOSDB_ENDPOINT = 'https://tj-test-datasource.documents.azure.com:443/';
const AZURE_COSMOSDB_KEY = 'DCui7qlTgPLy0Czl0UCJvJPjS1VhFo4i5kFkpWVcdOZjAFYm4vuOyfeLIGpvImDvKKOqDHCNNtZjB6oFrAACew==';

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
      { id: 'test-id-1', name: 'sam', email: 'sam@test.in' },
      { id: 'test-id-2', name: 'jon', email: 'jon@test.io' },
    ];

    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    expect(status).toBe('ok');
    expect(data.message).toBe('Items inserted');
  });

  it('should read a single item from a container', async () => {
    queryOptions.operation = 'read_item';
    queryOptions.itemId = 'test-id-1';

    const { status, data } = await _cosmosdb.run(sourceOptions, queryOptions, 'cosmos-db-test');
    console.log(data);
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
});
