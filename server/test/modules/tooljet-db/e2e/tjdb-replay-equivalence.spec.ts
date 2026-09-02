/**
 * DEV-83's headline release bar: a table authored through the real `perform()` path and promoted
 * through the real `/promote` endpoint introspects **identically** to its source - columns, type
 * modifiers, defaults, nullability, primary-key column order, unique constraints, indexes, and
 * foreign keys. Run twice, on a structured chain (authored after this feature) and a baseline
 * chain (shaped like a pre-existing table migration A carried over) - they reach the same shape by
 * different paths, and only running both proves either.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  login,
  logout,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { buildTableSchemaSnapshot, TableSchemaSnapshot } from '@modules/tooljet-db/helpers/table-schema-snapshot';
import { buildCreateTableDdl } from '@modules/tooljet-db/helpers/baseline-synthesis';

describe('TooljetDb replay equivalence', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let devEnvId: string;
    let stagingEnvId: string;
    let branchId: string;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${orgId}`;

      const environments = await ensureAppEnvironments(app, orgId);
      devEnvId = environments.find((e) => e.priority === 1).id;
      stagingEnvId = environments.find((e) => e.priority === 2).id;

      const branch = await getDefaultDataSource().manager.findOneOrFail(WorkspaceBranch, {
        where: { organizationId: orgId, isDefault: true },
      });
      branchId = branch.id;

      if (tjdbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app));
    });

    afterEach(async () => {
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    async function createTable(tableName: string, columns: any[], foreignKeys: any[] = []) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(adminCookie))
        .send({ table_name: tableName, columns, foreign_keys: foreignKeys })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function internalTableId(tableName: string): Promise<string> {
      const row = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName },
      });
      return row.id;
    }

    async function relationFor(tableId: string, environmentId: string): Promise<InternalTableRelation | null> {
      return getDefaultDataSource().manager.findOne(InternalTableRelation, {
        where: { internalTableId: tableId, environmentId },
      });
    }

    async function promote(tableId: string, sourceEnvironmentId: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/promote`)
        .set(headers(adminCookie))
        .send({ environment_id: sourceEnvironmentId });
      expect([200, 201]).toContain(res.statusCode);
      return res;
    }

    /**
     * Every field the snapshot builder reports, except `foreign_keys[].referenced_table` - a
     * physical relation id, expected to differ between environments (asserted separately). The
     * auto-generated `name` on a constraint/index is derived from the physical relation id too, so
     * it differs for a structurally identical constraint - stripped for the same reason.
     */
    function withoutNonPortableIdentifiers(snapshot: TableSchemaSnapshot) {
      return {
        ...snapshot,
        unique_constraints: snapshot.unique_constraints.map(({ name, ...rest }) => rest),
        indexes: snapshot.indexes.map(({ name, ...rest }) => rest),
        foreign_keys: snapshot.foreign_keys.map(({ name, referenced_table, ...rest }) => rest),
      };
    }

    /** Raw `format_type(atttypid, atttypmod)` per column, keyed by name - the one thing
     *  `buildTableSchemaSnapshot` doesn't carry (it reports `information_schema`'s bare
     *  `data_type`, which drops a length/precision modifier). TJDB's column types have no
     *  user-settable modifier today, so this is expected to be a no-op comparison; it exists so a
     *  future modifier-bearing type can't silently divide source and target without this test
     *  noticing. */
    async function fullTypesByColumn(relationId: string): Promise<Record<string, string>> {
      const rows: Array<{ attname: string; full_type: string }> = await getTooljetDbDataSource().query(
        `SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS full_type
         FROM pg_attribute a
         JOIN pg_class t ON t.oid = a.attrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname = $1 AND t.relname = $2 AND a.attnum > 0 AND NOT a.attisdropped`,
        [tenantSchema, relationId]
      );
      return Object.fromEntries(rows.map((r) => [r.attname, r.full_type]));
    }

    describe('Structured chain: authored via create_table, foreign key, edit, and rename', () => {
      it('promotes into an empty environment and introspects identically to the source', async () => {
        expect(tjdbAvailable).toBe(true);

        await createTable('req_parent', [
          {
            column_name: 'id',
            data_type: 'integer',
            constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
          },
        ]);

        // A composite primary key given in reverse-alphabetical order - order is only proven
        // load-bearing if the test can't pass by accident on a naturally-sorted key.
        await createTable('req_child', [
          {
            column_name: 'seq',
            data_type: 'integer',
            constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
          },
          {
            column_name: 'order_id',
            data_type: 'integer',
            constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
          },
          {
            column_name: 'email',
            data_type: 'character varying',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: true },
          },
          {
            column_name: 'parent_id',
            data_type: 'integer',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          },
          {
            column_name: 'title',
            data_type: 'character varying',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          },
        ]);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table/req_child/foreignkey`)
          .set(headers(adminCookie))
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'req_parent',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${orgId}/table/req_child/column`)
          .set(headers(adminCookie))
          .send({
            column: {
              column_name: 'title',
              new_column_name: 'title_renamed',
              data_type: 'character varying',
              constraints_type: { is_not_null: true, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect(res.statusCode).toBe(200));

        const parentTableId = await internalTableId('req_parent');
        const childTableId = await internalTableId('req_child');

        // Parent must exist in staging before the child's foreign key can replay against it -
        // the same order a real promotion would happen in.
        await promote(parentTableId, devEnvId);
        await promote(childTableId, devEnvId);

        const devRelation = await relationFor(childTableId, devEnvId);
        const stagingRelation = await relationFor(childTableId, stagingEnvId);
        expect(stagingRelation).toBeTruthy();

        const tjdb = getTooljetDbDataSource();
        const sourceSnapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          devRelation.id,
          devRelation.configurations.columns.column_names
        );
        const targetSnapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          stagingRelation.id,
          stagingRelation.configurations.columns.column_names
        );

        expect(withoutNonPortableIdentifiers(targetSnapshot)).toEqual(withoutNonPortableIdentifiers(sourceSnapshot));
        // Composite PK column order specifically - the field most likely to silently transpose.
        expect(targetSnapshot.primary_key).toEqual(['seq', 'order_id']);
        expect(targetSnapshot.primary_key).toEqual(sourceSnapshot.primary_key);
        // Same column uuids, not merely the same count.
        expect(stagingRelation.configurations.columns.column_names).toEqual(
          devRelation.configurations.columns.column_names
        );
        // The foreign key points at the target's own sibling, never development's.
        expect(targetSnapshot.foreign_keys[0].referenced_table).toBe(
          (await relationFor(parentTableId, stagingEnvId)).id
        );
        expect(targetSnapshot.foreign_keys[0].referenced_table).not.toBe(
          (await relationFor(parentTableId, devEnvId)).id
        );

        expect(await fullTypesByColumn(stagingRelation.id)).toEqual(await fullTypesByColumn(devRelation.id));
      });
    });

    describe('Baseline chain: shaped like a pre-existing table migration A carried over', () => {
      it('promotes into an empty environment and introspects identically to the source', async () => {
        expect(tjdbAvailable).toBe(true);

        const appManager = getDefaultDataSource().manager;
        const tjdb = getTooljetDbDataSource();

        // Built directly, standing in for a row that predates any perform() history - what
        // migration A baselines. `id serial` gives it a self-owned sequence; `email` a unique
        // constraint (and its backing index) so this chain covers the same shapes the structured
        // chain does, reached by a different path.
        const relationId = uuidv4();
        await tjdb.query(
          `CREATE TABLE "${tenantSchema}"."${relationId}" (
             id serial PRIMARY KEY,
             email character varying UNIQUE,
             note character varying
           )`
        );

        const internalTable = await appManager.save(
          appManager.create(InternalTable, {
            organizationId: orgId,
            tableName: 'baseline_tbl',
            co_relation_id: uuidv4(),
          })
        );

        const columnUuids = { id: uuidv4(), email: uuidv4(), note: uuidv4() };
        await appManager.save(
          appManager.create(InternalTableRelation, {
            id: relationId,
            internalTableId: internalTable.id,
            environmentId: devEnvId,
            branchId,
            configurations: { columns: { column_names: columnUuids, configurations: {} } },
          })
        );

        const snapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          relationId,
          columnUuids
        );
        // Same DDL-synthesis function migration A itself calls - not a hand-written second copy
        // that could silently drift from what the real migration emits.
        const ddl: string = buildCreateTableDdl(
          tenantSchema,
          relationId,
          snapshot.columns,
          snapshot.primary_key,
          snapshot.unique_constraints
        );

        const createMigration = await appManager.save(
          appManager.create(InternalTableMigration, {
            internalTableId: internalTable.id,
            sequence: '1',
            branchId,
            kind: 'baseline',
            payload: { ddl, refs: {}, column_uuids: columnUuids },
            resultingSchema: snapshot,
          })
        );
        await appManager.save(
          appManager.create(InternalTableMigrationApplication, {
            migrationId: createMigration.id,
            relationId,
            appliedAt: new Date(),
          })
        );

        await promote(internalTable.id, devEnvId);

        const stagingRelation = await relationFor(internalTable.id, stagingEnvId);
        expect(stagingRelation).toBeTruthy();

        const sourceSnapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          relationId,
          columnUuids
        );
        const targetSnapshot = await buildTableSchemaSnapshot(
          tjdb.createQueryRunner(),
          tenantSchema,
          stagingRelation.id,
          stagingRelation.configurations.columns.column_names
        );

        // `id`'s default owns its own sequence - the one column expected to differ, since each
        // environment must get its own counter, never the source's. Excluded here and asserted on
        // separately below; every other field still has to match exactly.
        const withoutSelfSequenceDefault = (s: TableSchemaSnapshot) => ({
          ...withoutNonPortableIdentifiers(s),
          columns: s.columns.map((c) => (/nextval\(/.test(c.default || '') ? { ...c, default: null } : c)),
        });
        expect(withoutSelfSequenceDefault(targetSnapshot)).toEqual(withoutSelfSequenceDefault(sourceSnapshot));
        expect(targetSnapshot.primary_key).toEqual(sourceSnapshot.primary_key);
        expect(stagingRelation.configurations.columns.column_names).toEqual(columnUuids);

        const targetIdDefault = targetSnapshot.columns.find((c) => c.name === 'id').default;
        expect(targetIdDefault).toContain(`"${stagingRelation.id}_id_seq"`);
        expect(targetIdDefault).not.toContain(relationId);

        expect(await fullTypesByColumn(stagingRelation.id)).toEqual(await fullTypesByColumn(relationId));
      });
    });
  });
});
