'use strict';

/**
 * Tests for the SeaTable ToolJet marketplace plugin.
 *
 * Set environment variables SEATABLE_TEST_SERVER_URL and SEATABLE_TEST_API_TOKEN
 * to run integration tests against a real SeaTable instance.
 * Without these variables, integration tests are skipped.
 */

const SeaTableQueryService = require('../dist/index').default || require('../dist/index');

const SERVER_URL = process.env.SEATABLE_TEST_SERVER_URL;
const API_TOKEN = process.env.SEATABLE_TEST_API_TOKEN;
const HAS_CREDENTIALS = !!(SERVER_URL && API_TOKEN);

const sourceOptions = {
  server_url: SERVER_URL || 'https://cloud.seatable.io',
  api_token: API_TOKEN || 'missing',
};

describe('seatable', () => {
  let service;

  beforeAll(() => {
    service = new SeaTableQueryService();
  });

  // --- Minimum required stub (matches ToolJet convention) ---
  it.todo('needs more tests');

  // --- Integration tests (run only with credentials) ---

  const describeIntegration = HAS_CREDENTIALS ? describe : describe.skip;

  describeIntegration('integration: testConnection', () => {
    it('should connect successfully with valid credentials', async () => {
      const result = await service.testConnection(sourceOptions);
      expect(result.status).toBe('ok');
    });

    it('should fail with invalid API token', async () => {
      const result = await service.testConnection({
        server_url: sourceOptions.server_url,
        api_token: 'invalid_token_000000000000000000000000',
      });
      expect(result.status).toBe('failed');
      expect(result.message).toBeDefined();
    });

    it('should fail with invalid server URL', async () => {
      const result = await service.testConnection({
        server_url: 'https://nonexistent.invalid',
        api_token: sourceOptions.api_token,
      });
      expect(result.status).toBe('failed');
    });
  });

  describeIntegration('integration: get_metadata', () => {
    it('should return tables with columns', async () => {
      const result = await service.run(sourceOptions, { operation: 'get_metadata' });
      expect(result.status).toBe('ok');
      expect(result.data).toBeDefined();
      expect(result.data.tables).toBeInstanceOf(Array);
      expect(result.data.tables.length).toBeGreaterThan(0);

      const table = result.data.tables[0];
      expect(table.name).toBeDefined();
      expect(table._id).toBeDefined();
      expect(table.columns).toBeInstanceOf(Array);
    });
  });

  describeIntegration('integration: list_rows', () => {
    it('should return rows from a table', async () => {
      // First get table name from metadata
      const meta = await service.run(sourceOptions, { operation: 'get_metadata' });
      const tableName = meta.data.tables[0].name;

      const result = await service.run(sourceOptions, {
        operation: 'list_rows',
        table_name: tableName,
        page: '1',
        page_size: '10',
      });
      expect(result.status).toBe('ok');
      expect(result.data.rows).toBeInstanceOf(Array);
      expect(result.data).toHaveProperty('has_more');
    });

    it('should throw when table_name is missing', async () => {
      await expect(
        service.run(sourceOptions, { operation: 'list_rows' })
      ).rejects.toThrow();
    });
  });

  describeIntegration('integration: CRUD lifecycle', () => {
    let createdRowId;
    let tableName;

    beforeAll(async () => {
      const meta = await service.run(sourceOptions, { operation: 'get_metadata' });
      tableName = meta.data.tables[0].name;
    });

    it('should create a row', async () => {
      const result = await service.run(sourceOptions, {
        operation: 'create_row',
        table_name: tableName,
        row_data: JSON.stringify({ Name: 'ToolJet Test Row' }),
      });
      expect(result.status).toBe('ok');
      expect(result.data._id).toBeDefined();
      createdRowId = result.data._id;
    });

    it('should get the created row', async () => {
      expect(createdRowId).toBeDefined();
      const result = await service.run(sourceOptions, {
        operation: 'get_row',
        table_name: tableName,
        row_id: createdRowId,
      });
      expect(result.status).toBe('ok');
      expect(result.data._id).toBe(createdRowId);
      expect(result.data.Name).toBe('ToolJet Test Row');
    });

    it('should update the row', async () => {
      expect(createdRowId).toBeDefined();
      const result = await service.run(sourceOptions, {
        operation: 'update_row',
        table_name: tableName,
        row_id: createdRowId,
        row_data: JSON.stringify({ Name: 'ToolJet Updated Row' }),
      });
      expect(result.status).toBe('ok');
      expect(result.data.success).toBe(true);
    });

    it('should find the row via SQL', async () => {
      expect(createdRowId).toBeDefined();
      const result = await service.run(sourceOptions, {
        operation: 'search_rows',
        sql_query: `SELECT * FROM \`${tableName}\` WHERE Name = 'ToolJet Updated Row' LIMIT 5`,
      });
      expect(result.status).toBe('ok');
      expect(result.data.results).toBeInstanceOf(Array);
      expect(result.data.results.length).toBeGreaterThan(0);
    });

    it('should delete the row', async () => {
      expect(createdRowId).toBeDefined();
      const result = await service.run(sourceOptions, {
        operation: 'delete_row',
        table_name: tableName,
        row_id: createdRowId,
      });
      expect(result.status).toBe('ok');
      expect(result.data.deleted_rows).toBe(1);
      createdRowId = null;
    });

    afterAll(async () => {
      // Cleanup: if test failed before delete, try to clean up
      if (createdRowId) {
        try {
          await service.run(sourceOptions, {
            operation: 'delete_row',
            table_name: tableName,
            row_id: createdRowId,
          });
        } catch {
          // ignore cleanup errors
        }
      }
    });
  });

  describeIntegration('integration: error handling', () => {
    it('should throw on unknown operation', async () => {
      await expect(
        service.run(sourceOptions, { operation: 'nonexistent' })
      ).rejects.toThrow();
    });

    it('should throw when row_id is missing for get_row', async () => {
      await expect(
        service.run(sourceOptions, { operation: 'get_row', table_name: 'Table2' })
      ).rejects.toThrow();
    });

    it('should throw when sql_query is missing for search_rows', async () => {
      await expect(
        service.run(sourceOptions, { operation: 'search_rows' })
      ).rejects.toThrow();
    });

    it('should throw on invalid row_data JSON', async () => {
      await expect(
        service.run(sourceOptions, {
          operation: 'create_row',
          table_name: 'Table2',
          row_data: 'not valid json{{{',
        })
      ).rejects.toThrow();
    });
  });
});
