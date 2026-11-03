'use strict';

// Tests run against the ncc build: `npm run build` first.
const Supabase = require('../dist').default || require('../dist');

describe('supabase', () => {
  const service = new Supabase();
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('connection type', () => {
    it('treats a missing connection_type as secret_key (existing data sources)', () => {
      const options = { project_url: 'https://x.supabase.co', service_role_secret: 'sk' };
      expect(service.getConnectionType(options)).toBe('secret_key');
      expect(service.getApiKey(options)).toBe('sk');
    });

    it('uses the publishable key in publishable_key mode', () => {
      const options = { connection_type: 'publishable_key', publishable_key: 'pk', service_role_secret: 'sk' };
      expect(service.getApiKey(options)).toBe('pk');
    });
  });

  describe('testConnection', () => {
    const options = { project_url: 'https://x.supabase.co/', service_role_secret: 'sk' };

    it('passes when the REST root responds 200, sending the key in apikey only', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      await expect(service.testConnection(options)).resolves.toEqual({ status: 'ok' });
      expect(global.fetch).toHaveBeenCalledWith('https://x.supabase.co/rest/v1/', { headers: { apikey: 'sk' } });
    });

    it('fails with the API message on 401', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Invalid API key' }) });
      await expect(service.testConnection(options)).rejects.toThrow('Connection test failed');
    });

    it('accepts a publishable key that is refused only for schema access', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Access to schema is forbidden' }),
      });
      await expect(
        service.testConnection({ connection_type: 'publishable_key', project_url: 'https://x.supabase.co', publishable_key: 'pk' })
      ).resolves.toEqual({ status: 'ok' });
    });
  });

  describe('run guards', () => {
    it('rejects Run SQL on a key connection', async () => {
      await expect(
        service.run({ project_url: 'https://x.supabase.co', service_role_secret: 'sk' }, { operation: 'sql_query', query: 'select 1' }, 'ds')
      ).rejects.toThrow('Query could not be completed');
    });

    it('rejects row operations on a connection string', async () => {
      await expect(
        service.run({ connection_type: 'connection_string', connection_string: 'postgresql://u:p@h/db' }, { operation: 'get_rows' }, 'ds')
      ).rejects.toThrow('Query could not be completed');
    });
  });

  describe('buildSqlConnection', () => {
    it('requires a connection string', () => {
      expect(() => service.buildSqlConnection({ connection_type: 'connection_string' })).toThrow('Connection string is required');
    });

    it('strips sslmode from the URL and disables cert verification unless a CA is given', async () => {
      const k = service.buildSqlConnection({ connection_string: 'postgresql://u:p@h:6543/postgres?sslmode=require' });
      const conn = k.client.config.connection;
      expect(conn.connectionString).not.toContain('sslmode');
      expect(conn.ssl).toEqual({ rejectUnauthorized: false });
      await k.destroy();
    });
  });
});
