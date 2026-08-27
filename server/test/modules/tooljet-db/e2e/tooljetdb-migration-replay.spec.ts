/**
 * Replay engine e2e: reapplies a table's own migration chain into a different relation for the
 * same logical table, and proves the target introspects identically to the source - including
 * column identity - without minting anything.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  login,
  logout,
  getTooljetDbDataSource,
  getDefaultDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
// EE token: getProviders() registers the edition-resolved class as the DI token, so a CE-path
// import would not resolve against an EE-booted app. See app-import-export.service.spec.ts for
// the same pattern.
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';
import { buildTableSchemaSnapshot, TableSchemaSnapshot } from '@modules/tooljet-db/helpers/table-schema-snapshot';
// Imported only so this test can call the same DDL-synthesis method migration A itself uses,
// instead of hand-writing a second copy that could silently drift from what the real migration
// emits.
import { TjdbRolloutMigrationASubstrate1787564882760 } from '../../../../data-migrations/1787564882760-TjdbRolloutMigrationASubstrate';

describe('TooljetDb migration replay', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let tooljetDbAvailable: boolean;
    let tenantSchema: string;
    let targetEnvironmentId: string;
    let branchId: string;
    let tableOperationsService: TooljetDbTableOperationsService;

    async function ensureWorkspaceSchema(orgId: string): Promise<boolean> {
      const tjds = getTooljetDbDataSource();
      if (!tjds) return false;
      try {
        await tjds.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${orgId}"`);
        return true;
      } catch {
        return false;
      }
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();
      tableOperationsService = app.get(TooljetDbTableOperationsService);

      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      adminOrgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${adminOrgId}`;

      const environments = await ensureAppEnvironments(app, adminOrgId);
      const nonDevEnvironment = environments.find((environment) => environment.priority !== 1);
      targetEnvironmentId = nonDevEnvironment.id;

      const branch = await getDefaultDataSource().manager.findOneOrFail(WorkspaceBranch, {
        where: { organizationId: adminOrgId, isDefault: true },
      });
      branchId = branch.id;

      if (tooljetDbAvailable) {
        const schemaReady = await ensureWorkspaceSchema(adminOrgId);
        if (!schemaReady) tooljetDbAvailable = false;
      }

      const auth = await login(app);
      adminCookie = auth.tokenCookie;
    });

    afterEach(async () => {
      await logout(app, adminCookie, adminOrgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    /** A brand-new, empty relation row for `internalTableId` in the second environment. */
    async function createTargetRelation(internalTableId: string): Promise<InternalTableRelation> {
      const manager = getDefaultDataSource().manager;
      return manager.save(
        manager.create(InternalTableRelation, {
          id: uuidv4(),
          internalTableId,
          environmentId: targetEnvironmentId,
          branchId,
          configurations: null,
        })
      );
    }

    async function migrationChainFor(internalTableId: string): Promise<InternalTableMigration[]> {
      const manager = getDefaultDataSource().manager;
      const migrations = await manager.find(InternalTableMigration, { where: { internalTableId } });
      return migrations.sort((a, b) => Number(a.sequence) - Number(b.sequence));
    }

    /**
     * Every field the snapshot builder reports, except `foreign_keys[].referenced_table` - that's
     * a physical relation id, expected to differ between environments. Callers assert it
     * separately, against the *target* environment's own sibling. Constraint/index `name` is
     * Postgres' own auto-generated name, derived from the physical relation id - a different
     * relation always gets a different name for a structurally identical constraint, so names are
     * stripped too; only the shape (columns, referenced columns) is compared.
     */
    function snapshotWithoutReferencedTableIds(snapshot: Awaited<ReturnType<typeof buildTableSchemaSnapshot>>) {
      return {
        ...snapshot,
        unique_constraints: snapshot.unique_constraints.map(({ name, ...rest }) => rest),
        indexes: snapshot.indexes.map(({ name, ...rest }) => rest),
        foreign_keys: snapshot.foreign_keys.map(({ name, referenced_table, ...rest }) => rest),
      };
    }

    describe('Structured chain: foreign key, column edit, and rename', () => {
      it('replays into an empty relation in another environment, reproducing shape and column identity', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const idColumn = {
          column_name: 'id',
          data_type: 'integer',
          constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
        };

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'replay_parent',
            columns: [idColumn],
            foreign_keys: [],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'replay_child',
            columns: [
              idColumn,
              {
                column_name: 'parent_id',
                data_type: 'integer',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
              {
                column_name: 'label',
                data_type: 'character varying',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        // A foreign key.
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/replay_child/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'replay_parent',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        // A column edit (no rename).
        await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${adminOrgId}/table/replay_child/column`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            column: {
              column_name: 'label',
              data_type: 'character varying',
              constraints_type: { is_not_null: true, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect(res.statusCode).toBe(200));

        // A rename.
        await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${adminOrgId}/table/replay_child/column`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            column: {
              column_name: 'label',
              new_column_name: 'label_renamed',
              data_type: 'character varying',
              constraints_type: { is_not_null: true, is_primary_key: false, is_unique: false },
            },
          })
          .expect((res) => expect(res.statusCode).toBe(200));

        const appManager = getDefaultDataSource().manager;
        const tjDbManager = getTooljetDbDataSource();

        const parentInternalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'replay_parent' },
        });
        const childInternalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'replay_child' },
        });
        const sourceParentRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: parentInternalTable.id },
        });
        const sourceChildRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: childInternalTable.id },
        });

        // The referenced table must exist in the target environment before the foreign key can
        // replay - the sibling lookup fails closed otherwise.
        const targetParentRelation = await createTargetRelation(parentInternalTable.id);
        const parentMigrations = await migrationChainFor(parentInternalTable.id);
        await tableOperationsService.applyMigrations(
          parentMigrations.map((m) => m.id),
          targetParentRelation
        );

        const targetChildRelation = await createTargetRelation(childInternalTable.id);
        const childMigrations = await migrationChainFor(childInternalTable.id);
        expect(childMigrations.map((m) => (m.payload as any).action)).toEqual([
          'create_table',
          'create_foreign_key',
          'edit_column',
          'edit_column',
        ]);
        await tableOperationsService.applyMigrations(
          childMigrations.map((m) => m.id),
          targetChildRelation
        );

        // Re-read: applyMigrations writes configurations onto the entity it was handed via a
        // fresh queryRunner.manager, not the row this test still holds a stale copy of.
        const reloadedTargetChild = await appManager.findOneOrFail(InternalTableRelation, {
          where: { id: targetChildRelation.id },
        });
        const reloadedTargetParent = await appManager.findOneOrFail(InternalTableRelation, {
          where: { id: targetParentRelation.id },
        });

        const sourceSnapshot = await buildTableSchemaSnapshot(
          tjDbManager.createQueryRunner(),
          tenantSchema,
          sourceChildRelation.id,
          sourceChildRelation.configurations.columns.column_names
        );
        const targetSnapshot = await buildTableSchemaSnapshot(
          tjDbManager.createQueryRunner(),
          tenantSchema,
          reloadedTargetChild.id,
          reloadedTargetChild.configurations.columns.column_names
        );

        // Columns, type modifiers, nullability, defaults, primary-key order, unique constraints,
        // indexes, and foreign keys' shape (columns + referenced columns) all match.
        expect(snapshotWithoutReferencedTableIds(targetSnapshot)).toEqual(
          snapshotWithoutReferencedTableIds(sourceSnapshot)
        );

        // The column uuids are the *same* uuids, not merely the same count.
        expect(reloadedTargetChild.configurations.columns.column_names).toEqual(
          sourceChildRelation.configurations.columns.column_names
        );

        // The target's foreign key points at the referenced table's relation in the target's
        // environment - never development's.
        expect(targetSnapshot.foreign_keys).toHaveLength(1);
        expect(targetSnapshot.foreign_keys[0].referenced_table).toBe(reloadedTargetParent.id);
        expect(targetSnapshot.foreign_keys[0].referenced_table).not.toBe(sourceParentRelation.id);

        // Both sides have nothing left pending - the terminal, applied state is the same shape on
        // both sides even though the target reached it via one recorded replay instead of four
        // individually-recorded migrations.
        const pendingSource = await appManager.count(InternalTableMigrationApplication, {
          where: { relationId: sourceChildRelation.id, appliedAt: IsNull() },
        });
        const pendingTarget = await appManager.count(InternalTableMigrationApplication, {
          where: { relationId: reloadedTargetChild.id, appliedAt: IsNull() },
        });
        expect(pendingSource).toBe(0);
        expect(pendingTarget).toBe(0);
      });
    });

    describe('Baseline chain (migration A shape)', () => {
      it('replays a baselined table into a second relation, reproducing shape and column identity', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const appManager = getDefaultDataSource().manager;
        const tjDbManager = getTooljetDbDataSource();

        // Stand in for a row that predates any perform() history - what migration A baselines.
        // Built directly rather than by running the data migration in-process. `id serial` gives
        // this a self-owned sequence, the same shape TJDB's default `id` column type always has -
        // buildCreateTableDdl below must not let this table's own sequence name leak into the
        // baseline DDL literally.
        const relationId = uuidv4();
        await tjDbManager.query(
          `CREATE TABLE "${tenantSchema}"."${relationId}" (
             id serial PRIMARY KEY,
             note character varying
           )`
        );

        const internalTable = await appManager.save(
          appManager.create(InternalTable, {
            organizationId: adminOrgId,
            tableName: 'replay_baselined',
            co_relation_id: uuidv4(),
          })
        );

        const idUuid = uuidv4();
        const noteUuid = uuidv4();
        const columnUuids = { id: idUuid, note: noteUuid };

        const sourceRelation = await appManager.save(
          appManager.create(InternalTableRelation, {
            id: relationId,
            internalTableId: internalTable.id,
            environmentId: (
              await appManager.findOneOrFail(AppEnvironment, { where: { organizationId: adminOrgId, priority: 1 } })
            ).id,
            branchId,
            configurations: {
              columns: { column_names: columnUuids, configurations: { [idUuid]: {}, [noteUuid]: {} } },
            },
          })
        );

        const snapshot = await buildTableSchemaSnapshot(
          tjDbManager.createQueryRunner(),
          tenantSchema,
          relationId,
          columnUuids
        );

        // Same DDL-synthesis method migration A itself calls, not a hand-written second copy -
        // this is what actually exercises the self-referencing-sequence rewrite.
        const migrationA = new TjdbRolloutMigrationASubstrate1787564882760();
        const ddl: string = (migrationA as any).buildCreateTableDdl(
          tenantSchema,
          relationId,
          snapshot.columns,
          snapshot.primary_key
        );

        const createMigration = await appManager.save(
          appManager.create(InternalTableMigration, {
            internalTableId: internalTable.id,
            sequence: '1',
            branchId,
            kind: 'baseline',
            payload: {
              ddl,
              refs: {},
              column_uuids: columnUuids,
            },
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

        const targetRelation = await createTargetRelation(internalTable.id);
        await tableOperationsService.applyMigrations([createMigration.id], targetRelation);

        const reloadedTarget = await appManager.findOneOrFail(InternalTableRelation, {
          where: { id: targetRelation.id },
        });

        const sourceSnapshot = await buildTableSchemaSnapshot(
          tjDbManager.createQueryRunner(),
          tenantSchema,
          relationId,
          sourceRelation.configurations.columns.column_names
        );
        const targetSnapshot = await buildTableSchemaSnapshot(
          tjDbManager.createQueryRunner(),
          tenantSchema,
          reloadedTarget.id,
          reloadedTarget.configurations.columns.column_names
        );

        // A column whose default owns its own sequence (only `id` here) is expected to differ
        // between source and target - each has to get its own sequence, never the other's - so
        // only that default is excluded from the general shape comparison and asserted on
        // separately below. Any other column's default still has to match exactly.
        const withoutSelfSequenceDefault = (s: TableSchemaSnapshot) => ({
          ...snapshotWithoutReferencedTableIds(s),
          columns: s.columns.map((column) =>
            /nextval\(/.test(column.default || '') ? { ...column, default: null } : column
          ),
        });
        expect(withoutSelfSequenceDefault(targetSnapshot)).toEqual(withoutSelfSequenceDefault(sourceSnapshot));
        expect(reloadedTarget.configurations.columns.column_names).toEqual(columnUuids);

        // The replayed `id` column owns a sequence named after the *target* relation, not a
        // literal copy of the source's - two environments must never hand out ids from one
        // counter, and the source's sequence must not have leaked in verbatim.
        const sourceIdDefault = sourceSnapshot.columns.find((c) => c.name === 'id').default;
        const targetIdDefault = targetSnapshot.columns.find((c) => c.name === 'id').default;
        expect(targetIdDefault).toContain(`"${reloadedTarget.id}_id_seq"`);
        expect(targetIdDefault).not.toContain(relationId);
        expect(sourceIdDefault).toContain(`"${relationId}_id_seq"`);

        // Functional proof, not just a name match: inserting into the source advances the
        // source's own sequence; the target's sequence starts fresh at 1 regardless.
        await tjDbManager.query(`INSERT INTO "${tenantSchema}"."${relationId}" (note) VALUES ('source row')`);
        await tjDbManager.query(`INSERT INTO "${tenantSchema}"."${relationId}" (note) VALUES ('source row 2')`);
        const [{ id: targetFirstId }] = await tjDbManager.query(
          `INSERT INTO "${tenantSchema}"."${reloadedTarget.id}" (note) VALUES ('target row') RETURNING id`
        );
        expect(Number(targetFirstId)).toBe(1);
      });
    });

    describe('Guards', () => {
      it('refuses to replay a chain containing an unconfirmed migration, and writes nothing to the target', async function () {
        expect(tooljetDbAvailable).toBe(true);
        const appManager = getDefaultDataSource().manager;
        const tjDbManager = getTooljetDbDataSource();

        const internalTable = await appManager.save(
          appManager.create(InternalTable, {
            organizationId: adminOrgId,
            tableName: 'replay_unconfirmed',
            co_relation_id: uuidv4(),
          })
        );

        // Same pattern the adjudication e2e uses: write the pending row directly rather than race
        // a real crash. resulting_schema NULL is "authoring not yet confirmed".
        const pendingMigration = await appManager.save(
          appManager.create(InternalTableMigration, {
            internalTableId: internalTable.id,
            sequence: '1',
            branchId,
            kind: 'baseline',
            payload: {
              ddl: `CREATE TABLE "${tenantSchema}"."{{self}}" (\n  "id" integer NOT NULL,\n  PRIMARY KEY ("id")\n)`,
              refs: {},
              column_uuids: { id: uuidv4() },
            },
            resultingSchema: null,
          })
        );

        const targetRelation = await createTargetRelation(internalTable.id);

        await expect(tableOperationsService.applyMigrations([pendingMigration.id], targetRelation)).rejects.toThrow();

        const reloadedTarget = await appManager.findOneOrFail(InternalTableRelation, {
          where: { id: targetRelation.id },
        });
        expect(reloadedTarget.configurations).toBeNull();

        const [{ to_regclass: physicalTable }] = await tjDbManager.query(`SELECT to_regclass($1) AS to_regclass`, [
          `"${tenantSchema}"."${targetRelation.id}"`,
        ]);
        expect(physicalTable).toBeNull();
      });
    });
  });
});
