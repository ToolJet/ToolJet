'use strict';

const Cloudflare_d1 = require('../dist').default;
const { parseParams, CloudflareD1Client } = require('../dist');

describe('cloudflare_d1 plugin', () => {
  const validSourceOptions = {
    account_id: 'test_account_123',
    api_token: 'test_token_xyz',
  };

  describe('parseParams helper', () => {
    it('returns empty array for null, undefined, or empty string', () => {
      expect(parseParams(undefined)).toEqual([]);
      expect(parseParams(null)).toEqual([]);
      expect(parseParams('')).toEqual([]);
      expect(parseParams('   ')).toEqual([]);
    });

    it('returns array as-is when already an array', () => {
      expect(parseParams([1, 'active', true])).toEqual([1, 'active', true]);
    });

    it('parses JSON string array', () => {
      expect(parseParams('["active", 100]')).toEqual(['active', 100]);
    });

    it('parses comma-separated values when not JSON', () => {
      expect(parseParams('active, 100')).toEqual(['active', '100']);
    });

    it('wraps single string as single-element array', () => {
      expect(parseParams('active')).toEqual(['active']);
    });

    it('wraps single number or boolean as single-element array', () => {
      expect(parseParams(42)).toEqual([42]);
      expect(parseParams(true)).toEqual([true]);
    });
  });

  describe('Validation Checks', () => {
    let service;

    beforeEach(() => {
      service = new Cloudflare_d1();
    });

    it('fails testConnection if account_id is missing or whitespace', async () => {
      const res1 = await service.testConnection({ account_id: '', api_token: 'token' });
      expect(res1.status).toBe('failed');
      expect(res1.message).toMatch(/Account ID and API token are required/i);

      const res2 = await service.testConnection({ account_id: '   ', api_token: 'token' });
      expect(res2.status).toBe('failed');
      expect(res2.message).toMatch(/Account ID and API token are required/i);
    });

    it('fails testConnection if api_token is missing or whitespace', async () => {
      const res1 = await service.testConnection({ account_id: 'acc', api_token: '' });
      expect(res1.status).toBe('failed');
      expect(res1.message).toMatch(/Account ID and API token are required/i);

      const res2 = await service.testConnection({ account_id: 'acc', api_token: '   ' });
      expect(res2.status).toBe('failed');
      expect(res2.message).toMatch(/Account ID and API token are required/i);
    });

    it('throws QueryError for unsupported operation', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'unknown_op' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Unsupported operation: unknown_op/);
      }
    });

    it('throws QueryError for query operation without database_id or whitespace database_id', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'query', sql: 'SELECT 1' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database ID is required for running queries/);
      }

      try {
        await service.run(validSourceOptions, { operation: 'query', database_id: '   ', sql: 'SELECT 1' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database ID is required for running queries/);
      }
    });

    it('throws QueryError for query operation without sql or whitespace sql', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'query', database_id: 'db1' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/SQL query is required/);
      }

      try {
        await service.run(validSourceOptions, { operation: 'query', database_id: 'db1', sql: '   ' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/SQL query is required/);
      }
    });

    it('throws QueryError for raw_query operation without database_id', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'raw_query', sql: 'SELECT 1' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database ID is required for running raw queries/);
      }
    });

    it('throws QueryError for raw_query operation without sql', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'raw_query', database_id: 'db1' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/SQL query is required/);
      }
    });

    it('throws QueryError for get_database without database_id', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'get_database' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database ID is required/);
      }
    });

    it('throws QueryError for create_database without name or whitespace name', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'create_database' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database name is required/);
      }

      try {
        await service.run(validSourceOptions, { operation: 'create_database', name: '   ' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database name is required/);
      }
    });

    it('throws QueryError for delete_database without database_id', async () => {
      try {
        await service.run(validSourceOptions, { operation: 'delete_database' }, 'ds1');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toMatch(/Database ID is required/);
      }
    });
  });

  describe('Operations Execution with Mocked Cloudflare API', () => {
    let service;

    beforeEach(() => {
      service = new Cloudflare_d1();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('successfully tests connection', async () => {
      jest.spyOn(CloudflareD1Client.prototype, 'listDatabases').mockResolvedValueOnce({
        result: [],
        success: true,
      });

      const res = await service.testConnection(validSourceOptions);
      expect(res).toEqual({ status: 'ok' });
    });

    it('handles testConnection failure on API error', async () => {
      jest.spyOn(CloudflareD1Client.prototype, 'listDatabases').mockRejectedValueOnce({
        response: {
          data: {
            errors: [{ code: 10000, message: 'Authentication error' }],
          },
        },
      });

      const res = await service.testConnection(validSourceOptions);
      expect(res.status).toBe('failed');
      expect(res.message).toBe('Authentication error');
    });

    it('executes SELECT query and returns rows array with meta attached', async () => {
      const mockMeta = { duration: 1.2, changes: 0, last_row_id: 0, rows_read: 2, rows_written: 0 };
      const mockRows = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const querySpy = jest.spyOn(CloudflareD1Client.prototype, 'query').mockResolvedValueOnce({
        success: true,
        result: [
          {
            success: true,
            results: mockRows,
            meta: mockMeta,
          },
        ],
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'query',
          database_id: 'db-uuid-123',
          sql: 'SELECT * FROM users WHERE status = ?',
          params: '["active"]',
        },
        'ds1'
      );

      expect(querySpy).toHaveBeenCalledWith('db-uuid-123', 'SELECT * FROM users WHERE status = ?', ['active']);
      expect(res.status).toBe('ok');
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data).toEqual(mockRows);
      expect(res.data.meta).toEqual(mockMeta);
      expect(res.data.success).toBe(true);
    });

    it('executes INSERT/UPDATE query and returns statement result object', async () => {
      const mockMeta = { duration: 2.5, changes: 1, last_row_id: 42, rows_read: 0, rows_written: 1 };
      const mockStmt = {
        success: true,
        results: [],
        meta: mockMeta,
      };

      jest.spyOn(CloudflareD1Client.prototype, 'query').mockResolvedValueOnce({
        success: true,
        result: [mockStmt],
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'query',
          database_id: 'db-uuid-123',
          sql: 'INSERT INTO users (name) VALUES (?)',
          params: ['Charlie'],
        },
        'ds1'
      );

      expect(res.status).toBe('ok');
      expect(res.data).toEqual(mockStmt);
    });

    it('executes raw_query and returns raw columns and rows format', async () => {
      const mockRaw = {
        columns: ['id', 'name'],
        rows: [
          [1, 'Alice'],
          [2, 'Bob'],
        ],
        meta: { duration: 3.0 },
      };

      const rawQuerySpy = jest.spyOn(CloudflareD1Client.prototype, 'rawQuery').mockResolvedValueOnce({
        success: true,
        result: [mockRaw],
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'raw_query',
          database_id: 'db-uuid-123',
          sql: 'SELECT id, name FROM users;',
        },
        'ds1'
      );

      expect(rawQuerySpy).toHaveBeenCalledWith('db-uuid-123', 'SELECT id, name FROM users;', []);
      expect(res.status).toBe('ok');
      expect(res.data).toEqual(mockRaw);
    });

    it('executes list_databases with filtering and pagination parameters', async () => {
      const mockDatabases = [
        { uuid: 'db-1', name: 'prod_db' },
        { uuid: 'db-2', name: 'dev_db' },
      ];

      const listSpy = jest.spyOn(CloudflareD1Client.prototype, 'listDatabases').mockResolvedValueOnce({
        success: true,
        result: mockDatabases,
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'list_databases',
          name: 'prod',
          page: 1,
          per_page: 10,
        },
        'ds1'
      );

      expect(listSpy).toHaveBeenCalledWith({ name: 'prod', page: 1, per_page: 10 });
      expect(res.status).toBe('ok');
      expect(res.data).toEqual(mockDatabases);
    });

    it('executes get_database', async () => {
      const mockDb = {
        uuid: 'db-uuid-123',
        name: 'my-db',
        version: 'production',
        num_tables: 5,
      };

      const getSpy = jest.spyOn(CloudflareD1Client.prototype, 'getDatabase').mockResolvedValueOnce({
        success: true,
        result: mockDb,
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'get_database',
          database_id: 'db-uuid-123',
        },
        'ds1'
      );

      expect(getSpy).toHaveBeenCalledWith('db-uuid-123');
      expect(res.status).toBe('ok');
      expect(res.data).toEqual(mockDb);
    });

    it('executes create_database with location hint', async () => {
      const mockCreated = {
        uuid: 'db-uuid-new',
        name: 'new_app_db',
        created_at: '2026-10-13T00:00:00Z',
      };

      const createSpy = jest.spyOn(CloudflareD1Client.prototype, 'createDatabase').mockResolvedValueOnce({
        success: true,
        result: mockCreated,
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'create_database',
          name: 'new_app_db',
          primary_location_hint: 'weur',
        },
        'ds1'
      );

      expect(createSpy).toHaveBeenCalledWith('new_app_db', 'weur');
      expect(res.status).toBe('ok');
      expect(res.data).toEqual(mockCreated);
    });

    it('executes delete_database', async () => {
      const deleteSpy = jest.spyOn(CloudflareD1Client.prototype, 'deleteDatabase').mockResolvedValueOnce({
        success: true,
        result: null,
      });

      const res = await service.run(
        validSourceOptions,
        {
          operation: 'delete_database',
          database_id: 'db-uuid-to-delete',
        },
        'ds1'
      );

      expect(deleteSpy).toHaveBeenCalledWith('db-uuid-to-delete');
      expect(res.status).toBe('ok');
      expect(res.data).toEqual({
        success: true,
        message: 'Database deleted successfully',
        database_id: 'db-uuid-to-delete',
      });
    });

    it('handles and formats Cloudflare API errors properly', async () => {
      jest.spyOn(CloudflareD1Client.prototype, 'query').mockRejectedValueOnce({
        response: {
          data: {
            errors: [
              { code: 7500, message: 'no such table: nonexistent_table' },
            ],
          },
        },
      });

      try {
        await service.run(
          validSourceOptions,
          {
            operation: 'query',
            database_id: 'db-uuid-123',
            sql: 'SELECT * FROM nonexistent_table',
          },
          'ds1'
        );
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.description).toBe('no such table: nonexistent_table');
      }
    });
  });
});
