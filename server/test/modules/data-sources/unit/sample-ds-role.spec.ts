import { Client, ClientConfig } from 'pg';
import { ConfigService } from '@nestjs/config';
import { getEnvVars } from 'scripts/database-config-utils';
import { SampleDataSourceService } from '@modules/data-sources/services/sample-ds.service';
import { SampleDbRole, provisionSampleDbRole, sampleDbRole } from '@helpers/sample-db-role.helper';

type ConnectionOption = { key: string; value: string | boolean };
type ServiceInternals = { connectionOptions(): ConnectionOption[] };

const env = getEnvVars();
const admin: ClientConfig = {
  host: env.PG_HOST,
  port: Number(env.PG_PORT),
  user: env.PG_USER,
  password: env.PG_PASS,
};
const SPEC_DB = `sample_role_spec_${Date.now()}`;
const role: SampleDbRole = { name: `tj_sample_role_spec_${Date.now()}`, password: 'spec-password' };
const specAdmin = { ...admin, database: SPEC_DB };

async function withClient<T>(config: ClientConfig, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(config);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

const asAdmin = <T>(fn: (client: Client) => Promise<T>) => withClient(specAdmin, fn);
const asRole = <T>(fn: (client: Client) => Promise<T>, password = role.password) =>
  withClient({ ...specAdmin, user: role.name, password }, fn);

function service(config: Record<string, string>): SampleDataSourceService {
  return new SampleDataSourceService(null, new ConfigService(config), null);
}

function optionsFor(config: Record<string, string>): Record<string, string | boolean> {
  const options = (service(config) as unknown as ServiceInternals).connectionOptions();
  return Object.fromEntries(options.map(({ key, value }) => [key, value]));
}

/**
 * @group platform
 */
describe('Sample data source role', () => {
  describe('provisionSampleDbRole', () => {
    beforeAll(async () => {
      await withClient({ ...admin, database: 'postgres' }, (c) => c.query(`CREATE DATABASE ${SPEC_DB}`));
      await asAdmin((c) => c.query('CREATE TABLE customers (id serial PRIMARY KEY, name text)'));
      await provisionSampleDbRole(specAdmin, role);
    });

    afterAll(async () => {
      await withClient({ ...admin, database: 'postgres' }, async (c) => {
        await c.query(`DROP DATABASE IF EXISTS ${SPEC_DB} WITH (FORCE)`);
        await c.query(`DROP ROLE IF EXISTS ${role.name}`);
      });
    });

    it('should create a login role with no elevated attributes or role memberships', async () => {
      const { rows } = await asAdmin((c) =>
        c.query(
          `SELECT rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls,
                  (SELECT count(*)::int FROM pg_auth_members m WHERE m.member = r.oid) AS memberships
           FROM pg_roles r WHERE rolname = $1`,
          [role.name]
        )
      );

      expect(rows[0]).toMatchObject({
        rolcanlogin: true,
        rolsuper: false,
        rolcreaterole: false,
        rolcreatedb: false,
        rolreplication: false,
        rolbypassrls: false,
        memberships: 0,
      });
    });

    it('should let the role read and write existing sample tables', async () => {
      const rows = await asRole(async (c) => {
        await c.query("INSERT INTO customers (name) VALUES ('Ada')");
        return (await c.query('SELECT name FROM customers')).rows;
      });

      expect(rows).toEqual(expect.arrayContaining([{ name: 'Ada' }]));
    });

    it('should cover tables recreated after provisioning', async () => {
      await asAdmin(async (c) => {
        await c.query('DROP TABLE customers');
        await c.query('CREATE TABLE customers (id serial PRIMARY KEY, name text)');
      });

      const rows = await asRole(async (c) => {
        await c.query("INSERT INTO customers (name) VALUES ('Grace')");
        return (await c.query('SELECT name FROM customers')).rows;
      });

      expect(rows).toEqual([{ name: 'Grace' }]);
    });

    it('should not let the role manage roles or databases', async () => {
      await expect(asRole((c) => c.query(`CREATE ROLE ${role.name}_child`))).rejects.toThrow(/permission denied/);
      await expect(asRole((c) => c.query(`CREATE DATABASE ${SPEC_DB}_child`))).rejects.toThrow(/permission denied/);
    });

    it('should not hold server file or program privileges', async () => {
      const { rows } = await asAdmin((c) =>
        c.query(
          `SELECT pg_has_role($1, 'pg_execute_server_program', 'MEMBER') AS program,
                  pg_has_role($1, 'pg_read_server_files', 'MEMBER') AS read_files,
                  pg_has_role($1, 'pg_write_server_files', 'MEMBER') AS write_files`,
          [role.name]
        )
      );

      expect(rows[0]).toMatchObject({ program: false, read_files: false, write_files: false });
    });

    it('should not read tables outside the sample schema grants', async () => {
      await asAdmin(async (c) => {
        await c.query('CREATE SCHEMA app_private');
        await c.query('CREATE TABLE app_private.settings (key text)');
      });

      await expect(asRole((c) => c.query('SELECT * FROM app_private.settings'))).rejects.toThrow(/permission denied/);
    });

    it('should be idempotent', async () => {
      await expect(provisionSampleDbRole(specAdmin, role)).resolves.toBeUndefined();
    });

    it('should refuse an elevated pre-existing role without changing its password', async () => {
      await asAdmin((c) => c.query(`ALTER ROLE ${role.name} CREATEDB`));

      await expect(provisionSampleDbRole(specAdmin, { ...role, password: 'new-password' })).rejects.toThrow(/elevated/);
      await expect(asRole((c) => c.query('SELECT 1'))).resolves.toBeDefined();
      await expect(asRole((c) => c.query('SELECT 1'), 'new-password')).rejects.toThrow(/password authentication/);

      await asAdmin((c) => c.query(`ALTER ROLE ${role.name} NOCREATEDB`));
    });
  });

  describe('sampleDbRole', () => {
    it('should be stable per master key and distinct across keys', () => {
      expect(sampleDbRole('k1')).toEqual(sampleDbRole('k1'));
      expect(sampleDbRole('k1').name).not.toBe(sampleDbRole('k2').name);
      expect(sampleDbRole('k1').password).not.toBe(sampleDbRole('k2').password);
    });
  });

  describe('SampleDataSourceService', () => {
    const base = {
      PG_HOST: 'db.internal',
      PG_PORT: '5432',
      PG_USER: 'app_user',
      PG_PASS: 'app_password',
      LOCKBOX_MASTER_KEY: 'a'.repeat(64),
    };

    it('should connect as the dedicated role, not the application user, when SAMPLE_PG_DB_USER is unset', () => {
      const expected = sampleDbRole(base.LOCKBOX_MASTER_KEY);

      expect(optionsFor(base)).toMatchObject({
        host: 'db.internal',
        database: 'sample_db',
        username: expected.name,
        password: expected.password,
      });
    });

    it('should keep operator-supplied credentials when SAMPLE_PG_DB_USER is set', () => {
      expect(optionsFor({ ...base, SAMPLE_PG_DB_USER: 'sample_reader', SAMPLE_PG_DB_PASS: 'sample_pw' })).toMatchObject(
        { username: 'sample_reader', password: 'sample_pw' }
      );
    });

    it('should skip provisioning when SAMPLE_PG_DB_USER is set', async () => {
      await expect(service({ ...base, SAMPLE_PG_DB_USER: 'sample_reader' }).provisionRestrictedRole()).resolves.toBe(
        false
      );
    });
  });
});
