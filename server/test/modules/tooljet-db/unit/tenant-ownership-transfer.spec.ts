import { DataSource, QueryRunner } from 'typeorm';
import { tooljetDbOrmconfig } from 'ormconfig';
import { transferSequenceOwnershipToTenant, transferTableOwnershipToTenant } from '@helpers/tooljet_db.helper';

/** @group database */

// Managed Postgres (Azure, RDS, Cloud SQL) never gives the ToolJet Database user superuser. A
// non-superuser can only hand a table to a role that has CREATE on the table's schema, and tenant
// roles hold only USAGE. `SET ROLE` to a non-superuser admin reproduces that on the test database.
describe('Tenant ownership transfer as a non-superuser ToolJet Database admin', () => {
  const suffix = Math.random().toString(36).slice(2, 10);
  const adminRole = `tjdb_admin_${suffix}`;
  const tenantRole = `user_${suffix}`;
  const schema = `workspace_${suffix}`;

  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const ownerOf = async (relationName: string): Promise<string> => {
    const [row] = await dataSource.query(
      `SELECT pg_get_userbyid(relowner) AS owner FROM pg_class
       WHERE relname = $1 AND relnamespace = $2::regnamespace`,
      [relationName, `"${schema}"`]
    );
    return row?.owner;
  };

  const tenantCanCreateInSchema = async (): Promise<boolean> => {
    const [row] = await dataSource.query(`SELECT has_schema_privilege($1, $2, 'CREATE') AS can_create`, [
      tenantRole,
      schema,
    ]);
    return row.can_create;
  };

  beforeAll(async () => {
    dataSource = new DataSource({ ...tooljetDbOrmconfig, name: `ownership-transfer-${suffix}` } as never);
    await dataSource.initialize();
    // Mirrors workspace onboarding: the admin creates the schema and is a member of the tenant role.
    await dataSource.query(`CREATE ROLE "${adminRole}" NOSUPERUSER`);
    await dataSource.query(`CREATE ROLE "${tenantRole}" NOSUPERUSER`);
    await dataSource.query(`GRANT "${tenantRole}" TO "${adminRole}"`);
    await dataSource.query(`CREATE SCHEMA "${schema}" AUTHORIZATION "${adminRole}"`);
    await dataSource.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${tenantRole}"`);
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`SET ROLE "${adminRole}"`);
  });

  afterEach(async () => {
    if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
    await queryRunner.query('RESET ROLE');
    await queryRunner.release();
    await dataSource.query(`REVOKE CREATE ON SCHEMA "${schema}" FROM "${tenantRole}"`);
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await dataSource.query(`DROP ROLE IF EXISTS "${tenantRole}"`);
    await dataSource.query(`DROP ROLE IF EXISTS "${adminRole}"`);
    await dataSource.destroy();
  });

  describe('transferTableOwnershipToTenant', () => {
    it('should hand the table to the tenant without leaving it CREATE on the schema, outside a transaction', async () => {
      await queryRunner.query(`CREATE TABLE "${schema}"."outside_tx" (id serial PRIMARY KEY)`);

      await transferTableOwnershipToTenant(queryRunner, schema, 'outside_tx', tenantRole);

      expect(await ownerOf('outside_tx')).toBe(tenantRole);
      expect(await tenantCanCreateInSchema()).toBe(false);
    });

    it("should hand the table to the tenant inside the caller's transaction", async () => {
      await queryRunner.startTransaction();
      await queryRunner.query(`CREATE TABLE "${schema}"."inside_tx" (id int)`);

      await transferTableOwnershipToTenant(queryRunner, schema, 'inside_tx', tenantRole);
      await queryRunner.commitTransaction();

      expect(await ownerOf('inside_tx')).toBe(tenantRole);
      expect(await tenantCanCreateInSchema()).toBe(false);
    });

    it('should keep a CREATE grant the tenant already had', async () => {
      await dataSource.query(`GRANT CREATE ON SCHEMA "${schema}" TO "${tenantRole}"`);
      await queryRunner.query(`CREATE TABLE "${schema}"."already_granted" (id int)`);

      await transferTableOwnershipToTenant(queryRunner, schema, 'already_granted', tenantRole);

      expect(await ownerOf('already_granted')).toBe(tenantRole);
      expect(await tenantCanCreateInSchema()).toBe(true);
    });

    it('should leave no CREATE grant behind when the transfer fails outside a transaction', async () => {
      await expect(transferTableOwnershipToTenant(queryRunner, schema, 'missing_table', tenantRole)).rejects.toThrow(
        /does not exist/
      );

      expect(queryRunner.isTransactionActive).toBe(false);
      expect(await tenantCanCreateInSchema()).toBe(false);
    });

    it('should skip a workspace that has no tenant role', async () => {
      await queryRunner.query(`CREATE TABLE "${schema}"."no_role" (id int)`);

      await transferTableOwnershipToTenant(queryRunner, schema, 'no_role', `user_missing_${suffix}`);

      expect(await ownerOf('no_role')).toBe(adminRole);
    });
  });

  describe('transferSequenceOwnershipToTenant', () => {
    it('should hand the sequence to the tenant without leaving it CREATE on the schema', async () => {
      await queryRunner.query(`CREATE SEQUENCE "${schema}"."seq_one"`);

      await transferSequenceOwnershipToTenant(queryRunner, schema, `"${schema}"."seq_one"`, tenantRole);

      expect(await ownerOf('seq_one')).toBe(tenantRole);
      expect(await tenantCanCreateInSchema()).toBe(false);
    });
  });
});
