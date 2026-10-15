import { createHmac } from 'crypto';
import { Client, ClientConfig } from 'pg';

// No path aliases: imported by scripts/ run under plain ts-node.

export type SampleDbRole = { name: string; password: string };

export type SampleDbEnv = {
  SAMPLE_PG_DB_HOST?: string;
  SAMPLE_PG_DB_PORT?: string | number;
  SAMPLE_PG_DB_USER?: string;
  SAMPLE_PG_DB_PASS?: string;
  SAMPLE_DB?: string;
  CA_CERT?: string;
};

// Keyed by master key: stable across boots, distinct per instance sharing a Postgres server.
export function sampleDbRole(masterKey: string): SampleDbRole {
  const derive = (purpose: string) => createHmac('sha256', masterKey).update(`sample-db-role:${purpose}`).digest('hex');
  return { name: `tooljet_sample_${derive('name').slice(0, 16)}`, password: derive('password') };
}

export function sampleDbAdminConfig(env: SampleDbEnv): ClientConfig {
  return {
    host: env.SAMPLE_PG_DB_HOST,
    port: Number(env.SAMPLE_PG_DB_PORT),
    user: env.SAMPLE_PG_DB_USER,
    password: env.SAMPLE_PG_DB_PASS,
    database: env.SAMPLE_DB,
    ...(env.CA_CERT && { ssl: { rejectUnauthorized: false, ca: env.CA_CERT } }),
  };
}

const ELEVATED_ROLE_SQL = `SELECT rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls
         OR EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member = r.oid) AS elevated
  FROM pg_roles r WHERE rolname = $1`;

async function assertNotElevated(client: Client, name: string): Promise<void> {
  const { rows } = await client.query(ELEVATED_ROLE_SQL, [name]);
  if (rows[0]?.elevated) {
    throw new Error(`Role ${name} has elevated attributes or role memberships`);
  }
}

export async function assertSampleDbRoleNotElevated(admin: ClientConfig, name: string): Promise<void> {
  const client = new Client(admin);
  await client.connect();
  try {
    await assertNotElevated(client, name);
  } finally {
    await client.end();
  }
}

export async function provisionSampleDbRole(admin: ClientConfig, role: SampleDbRole): Promise<void> {
  const client = new Client(admin);
  await client.connect();
  try {
    const roleId = client.escapeIdentifier(role.name);
    await client.query('BEGIN');
    // Replicas boot together
    await client.query("SELECT pg_advisory_xact_lock(hashtext('tooljet_sample_db_role'))");

    const existing = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role.name]);
    if (!existing.rowCount) {
      await client.query(`CREATE ROLE ${roleId} LOGIN`);
    }

    await assertNotElevated(client, role.name);

    await client.query(`ALTER ROLE ${roleId} WITH LOGIN PASSWORD ${client.escapeLiteral(role.password)}`);
    await client.query(`GRANT CONNECT ON DATABASE ${client.escapeIdentifier(admin.database)} TO ${roleId}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${roleId}`);
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleId}`);
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${roleId}`);
    // populate-sample-db recreates the tables on every boot
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${roleId}`
    );
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${roleId}`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
