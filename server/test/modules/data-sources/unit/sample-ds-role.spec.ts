import { Client, ClientConfig } from 'pg';
import { ConfigService } from '@nestjs/config';
import { getEnvVars } from 'scripts/database-config-utils';
import { SampleDataSourceService, SampleDbCredentials } from '@modules/data-sources/services/sample-ds.service';
import { SAMPLE_DB_LOCK_SQL, SampleDbRole, provisionSampleDbRole, sampleDbRole } from '@helpers/sample-db-role.helper';
import { populateSampleData } from 'scripts/populate-sample-db';

type ConnectionOption = { key: string; value: string | boolean };
type ServiceInternals = { connectionOptions(credentials: SampleDbCredentials): ConnectionOption[] };

const env = getEnvVars();
const admin: ClientConfig = {
  host: env.PG_HOST,
  port: Number(env.PG_PORT),
  user: env.PG_USER,
  password: env.PG_PASS,
};
// CE and EE projects run this spec in parallel workers.
const RUN = `${Date.now()}_${process.pid}`;
const SPEC_DB = `sample_role_spec_${RUN}`;
const role: SampleDbRole = { name: `tj_sample_role_spec_${RUN}`, password: 'spec-password' };
const specAdmin = { ...admin, database: SPEC_DB };
// Postgres 13/14 checkpoint on CREATE DATABASE; slow while other suites write.
const CREATE_DATABASE_TIMEOUT = 120_000;

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

/**
 * @group platform
 */
describe('Sample data source role', () => {
  describe('provisionSampleDbRole', () => {
    beforeAll(async () => {
      await withClient({ ...admin, database: 'postgres' }, (c) => c.query(`CREATE DATABASE ${SPEC_DB}`));
      await asAdmin((c) => c.query('CREATE TABLE customers (id serial PRIMARY KEY, name text)'));
      await provisionSampleDbRole(specAdmin, role);
    }, CREATE_DATABASE_TIMEOUT);

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

    it('should undo password and setting changes made through the role on the next provision', async () => {
      await asRole(async (c) => {
        await c.query(`ALTER ROLE CURRENT_USER SET default_transaction_read_only = on`);
        await c.query(`ALTER ROLE CURRENT_USER IN DATABASE ${SPEC_DB} SET statement_timeout = 1`);
        await c.query(`ALTER ROLE CURRENT_USER PASSWORD 'hijacked'`);
      });

      await provisionSampleDbRole(specAdmin, role);

      const { rows } = await asAdmin((c) =>
        c.query(
          `SELECT count(*)::int AS settings FROM pg_db_role_setting s JOIN pg_roles r ON r.oid = s.setrole WHERE r.rolname = $1`,
          [role.name]
        )
      );
      expect(rows[0]).toMatchObject({ settings: 0 });
      await expect(asRole((c) => c.query('SELECT 1'))).resolves.toBeDefined();
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

    it('should make populate-sample-db wait while role setup holds the lock', async () => {
      const holder = new Client(specAdmin);
      await holder.connect();
      await holder.query('BEGIN');
      await holder.query(SAMPLE_DB_LOCK_SQL);
      let finished = false;
      const populate = populateSampleData({
        SAMPLE_PG_DB_HOST: admin.host,
        SAMPLE_PG_DB_PORT: admin.port,
        SAMPLE_PG_DB_USER: admin.user,
        SAMPLE_PG_DB_PASS: admin.password,
        SAMPLE_DB: SPEC_DB,
      }).then(() => (finished = true));

      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(finished).toBe(false);
      await holder.query('COMMIT');
      await holder.end();
      await populate;

      const { rows } = await asRole((c) => c.query('SELECT count(*)::int AS products FROM products'));
      expect(rows[0].products).toBeGreaterThan(0);
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
    const SERVICE_DB = `sample_service_spec_${RUN}`;
    const base = {
      PG_HOST: env.PG_HOST,
      PG_PORT: String(env.PG_PORT),
      PG_USER: env.PG_USER,
      PG_PASS: env.PG_PASS,
      SAMPLE_DB: SERVICE_DB,
      LOCKBOX_MASTER_KEY: `sample-service-spec-${RUN}`,
    };
    const expected = sampleDbRole(base.LOCKBOX_MASTER_KEY);
    const server = { host: base.PG_HOST, port: base.PG_PORT };
    const credentialsFor = (config: Record<string, string>) => service(config).sampleDbCredentials();
    const asPostgres = <T>(fn: (client: Client) => Promise<T>) => withClient({ ...admin, database: 'postgres' }, fn);

    beforeAll(async () => {
      await asPostgres((c) => c.query(`CREATE DATABASE ${SERVICE_DB}`));
    }, CREATE_DATABASE_TIMEOUT);

    afterAll(async () => {
      await asPostgres(async (c) => {
        await c.query(`DROP DATABASE IF EXISTS ${SERVICE_DB} WITH (FORCE)`);
        await c.query(`DROP ROLE IF EXISTS ${expected.name}`);
      });
    });

    it('should provision with SAMPLE_PG_DB_USER as the admin when it is set', async () => {
      await expect(
        credentialsFor({
          ...base,
          PG_USER: 'no_such_user',
          PG_PASS: 'wrong',
          SAMPLE_PG_DB_USER: env.PG_USER,
          SAMPLE_PG_DB_PASS: env.PG_PASS,
        })
      ).resolves.toEqual({ ...server, user: expected.name, password: expected.password });
    });

    it('should provision the restricted role and use it', async () => {
      await expect(credentialsFor(base)).resolves.toEqual({
        ...server,
        user: expected.name,
        password: expected.password,
      });
      await expect(
        withClient({ ...admin, database: SERVICE_DB, user: expected.name, password: expected.password }, (c) =>
          c.query('SELECT 1')
        )
      ).resolves.toBeDefined();
    });

    it('should provision the role even when PG_DB_OWNER is false', async () => {
      await expect(credentialsFor({ ...base, PG_DB_OWNER: 'false' })).resolves.toMatchObject({ user: expected.name });
    });

    it('should disable sample SQL, never falling back to the application user, when provisioning fails', async () => {
      await expect(credentialsFor({ ...base, SAMPLE_DB: 'no_such_database' })).resolves.toEqual({
        ...server,
        user: expected.name,
        password: '',
        disabled: true,
      });
    });

    it('should flag disabled sample SQL in the connection options', () => {
      const options = (service(base) as unknown as ServiceInternals).connectionOptions({
        ...server,
        user: expected.name,
        password: '',
        disabled: true,
      });

      expect(Object.fromEntries(options.map(({ key, value }) => [key, value]))).toMatchObject({
        database: SERVICE_DB,
        username: expected.name,
        sample_sql_disabled: true,
      });
    });
  });
});
