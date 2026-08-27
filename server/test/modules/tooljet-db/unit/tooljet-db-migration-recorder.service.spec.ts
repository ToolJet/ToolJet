/**
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
import {
  TooljetDbMigrationRecorderService,
  ADJUDICATION_PREDICATES,
  StructuredMigrationPayload,
} from '@modules/tooljet-db/services/tooljet-db-migration-recorder.service';
import { buildTableSchemaSnapshot, TableSchemaSnapshot } from '@modules/tooljet-db/helpers/table-schema-snapshot';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import {
  resetDB,
  createUser,
  setDataSources,
  closeTestApp,
  ensureAppEnvironments,
  resolveOrSeedDefaultBranch,
} from 'test-helper';
import { setupTestTables } from '../../../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { ormconfig, tooljetDbOrmconfig } from 'ormconfig';
import { getEnvVars } from 'scripts/database-config-utils';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { AppVersion } from '@entities/app_version.entity';
import { GroupPermission } from '@entities/group_permission.entity';
import { UserGroupPermission } from '@entities/user_group_permission.entity';
import { App } from '@entities/app.entity';
import { LicenseService } from '@modules/licensing/service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

function emptySnapshot(overrides: Partial<TableSchemaSnapshot> = {}): TableSchemaSnapshot {
  return { columns: [], primary_key: [], unique_constraints: [], indexes: [], foreign_keys: [], ...overrides };
}

function column(name: string): TableSchemaSnapshot['columns'][number] {
  return { name, uuid: `${name}-uuid`, data_type: 'text', is_nullable: true, default: null, is_primary_key: false };
}

describe('TooljetDbMigrationRecorderService', () => {
  describe('.ADJUDICATION_PREDICATES | pure predicate logic', () => {
    it('create_table confirms only when every requested column exists', () => {
      const request = { columns: [{ column_name: 'id' }, { column_name: 'name' }] };
      const matching = emptySnapshot({ columns: [column('id'), column('name')] });
      const partial = emptySnapshot({ columns: [column('id')] });

      expect(ADJUDICATION_PREDICATES.create_table(request, matching)).toBe(true);
      expect(ADJUDICATION_PREDICATES.create_table(request, partial)).toBe(false);
    });

    it('drop_table confirms only when the relation has no columns left', () => {
      expect(ADJUDICATION_PREDICATES.drop_table({}, emptySnapshot())).toBe(true);
      expect(ADJUDICATION_PREDICATES.drop_table({}, emptySnapshot({ columns: [column('id')] }))).toBe(false);
    });

    it('add_column confirms only when the new column is present', () => {
      const request = { column: { column_name: 'age' } };
      expect(ADJUDICATION_PREDICATES.add_column(request, emptySnapshot({ columns: [column('age')] }))).toBe(true);
      expect(ADJUDICATION_PREDICATES.add_column(request, emptySnapshot())).toBe(false);
    });

    it('drop_column confirms only when the column is gone', () => {
      const request = { column: { column_name: 'age' } };
      expect(ADJUDICATION_PREDICATES.drop_column(request, emptySnapshot())).toBe(true);
      expect(ADJUDICATION_PREDICATES.drop_column(request, emptySnapshot({ columns: [column('age')] }))).toBe(false);
    });

    it('edit_table confirms deletions, renames and insertions together, and rejects a partial result', () => {
      const request = {
        columns: [
          { old_column: { column_name: 'legacy' }, new_column: {} }, // deleted
          { old_column: {}, new_column: { column_name: 'fresh' } }, // inserted
          { old_column: { column_name: 'a' }, new_column: { column_name: 'b' } }, // renamed
        ],
      };
      const fullyApplied = emptySnapshot({ columns: [column('fresh'), column('b')] });
      const renameNotApplied = emptySnapshot({ columns: [column('fresh'), column('a')] });
      const deletionNotApplied = emptySnapshot({ columns: [column('fresh'), column('b'), column('legacy')] });

      expect(ADJUDICATION_PREDICATES.edit_table(request, fullyApplied)).toBe(true);
      expect(ADJUDICATION_PREDICATES.edit_table(request, renameNotApplied)).toBe(false);
      expect(ADJUDICATION_PREDICATES.edit_table(request, deletionNotApplied)).toBe(false);
    });

    it('edit_column confirms a plain type/config edit with no rename', () => {
      const request = { column: { column_name: 'age' } };
      expect(ADJUDICATION_PREDICATES.edit_column(request, emptySnapshot({ columns: [column('age')] }))).toBe(true);
      expect(ADJUDICATION_PREDICATES.edit_column(request, emptySnapshot())).toBe(false);
    });

    it('edit_column confirms a rename only once the old name is gone and the new one exists', () => {
      const request = { column: { column_name: 'age', new_column_name: 'years' } };
      const renamed = emptySnapshot({ columns: [column('years')] });
      const notYetRenamed = emptySnapshot({ columns: [column('age')] });
      const bothPresent = emptySnapshot({ columns: [column('age'), column('years')] });

      expect(ADJUDICATION_PREDICATES.edit_column(request, renamed)).toBe(true);
      expect(ADJUDICATION_PREDICATES.edit_column(request, notYetRenamed)).toBe(false);
      expect(ADJUDICATION_PREDICATES.edit_column(request, bothPresent)).toBe(false);
    });

    it('create_foreign_key confirms only once a matching foreign key exists', () => {
      const request = { foreign_keys: [{ column_names: ['user_id'], referenced_column_names: ['id'] }] };
      const matching = emptySnapshot({
        foreign_keys: [
          { name: 'fk_1', column_names: ['user_id'], referenced_table: 'r1', referenced_column_names: ['id'] },
        ],
      });

      expect(ADJUDICATION_PREDICATES.create_foreign_key(request, matching)).toBe(true);
      expect(ADJUDICATION_PREDICATES.create_foreign_key(request, emptySnapshot())).toBe(false);
    });

    it('update_foreign_key confirms only once the old constraint is gone and the new one exists', () => {
      const request = {
        foreign_key_id: 'fk_old',
        foreign_keys: [{ column_names: ['user_id'], referenced_column_names: ['id'] }],
      };
      const swapped = emptySnapshot({
        foreign_keys: [
          { name: 'fk_new', column_names: ['user_id'], referenced_table: 'r1', referenced_column_names: ['id'] },
        ],
      });
      const oldStillThere = emptySnapshot({
        foreign_keys: [
          { name: 'fk_old', column_names: ['user_id'], referenced_table: 'r1', referenced_column_names: ['id'] },
          { name: 'fk_new', column_names: ['user_id'], referenced_table: 'r1', referenced_column_names: ['id'] },
        ],
      });

      expect(ADJUDICATION_PREDICATES.update_foreign_key(request, swapped)).toBe(true);
      expect(ADJUDICATION_PREDICATES.update_foreign_key(request, oldStillThere)).toBe(false);
      expect(ADJUDICATION_PREDICATES.update_foreign_key(request, emptySnapshot())).toBe(false);
    });

    it('delete_foreign_key confirms only once the named constraint is gone', () => {
      const request = { foreign_key_id: 'fk_old' };
      const gone = emptySnapshot();
      const stillThere = emptySnapshot({
        foreign_keys: [
          { name: 'fk_old', column_names: ['user_id'], referenced_table: 'r1', referenced_column_names: ['id'] },
        ],
      });

      expect(ADJUDICATION_PREDICATES.delete_foreign_key(request, gone)).toBe(true);
      expect(ADJUDICATION_PREDICATES.delete_foreign_key(request, stillThere)).toBe(false);
    });
  });

  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let appManager: EntityManager;
    let tjDbManager: EntityManager;
    let tableOperationsService: TooljetDbTableOperationsService;
    let service: TooljetDbMigrationRecorderService;
    let organizationId: string;

    beforeAll(async () => {
      const mockLicenseService = { getLicenseTerms: jest.fn() };
      const mockLicenseTermsService = { getLicenseTerms: jest.fn().mockResolvedValue(true) };
      const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env.test'], load: [() => getEnvVars()] }),
          TypeOrmModule.forRoot(ormconfig),
          TypeOrmModule.forRoot(tooljetDbOrmconfig),
          TypeOrmModule.forFeature([
            User,
            Organization,
            OrganizationUser,
            App,
            AppVersion,
            GroupPermission,
            UserGroupPermission,
            InternalTable,
            InternalTableRelation,
            InternalTableMigration,
            InternalTableMigrationApplication,
          ]),
        ],
        providers: [
          TooljetDbTableOperationsService,
          TooljetDbRelationResolverService,
          TooljetDbMigrationRecorderService,
          AppEnvironmentUtilService,
          LicenseService,
          { provide: LicenseTermsService, useValue: mockLicenseTermsService },
          EventEmitter2,
        ],
      })
        .overrideProvider(LicenseService)
        .useValue(mockLicenseService)
        .overrideProvider(LicenseTermsService)
        .useValue(mockLicenseTermsService)
        .overrideProvider(EventEmitter2)
        .useValue(mockEventEmitter)
        .compile();

      app = moduleFixture.createNestApplication();
      await app.init();
      setDataSources(app);

      appManager = app.get<TypeOrmDataSource>(getDataSourceToken('default')).manager;
      tjDbManager = app.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb')).manager;
      tableOperationsService = moduleFixture.get(TooljetDbTableOperationsService);
      service = app.get(TooljetDbMigrationRecorderService);
    });

    beforeEach(async () => {
      await resetDB();
      const adminUserData = await createUser(app, { email: 'admin@tooljet.io', groups: ['all_users', 'admin'] });
      organizationId = adminUserData.organization.id;
      await ensureAppEnvironments(app, organizationId);
      await resolveOrSeedDefaultBranch(organizationId);

      await tjDbManager.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${organizationId}"`);
      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
    });

    afterEach(async () => {
      await tjDbManager.query(`DROP SCHEMA IF EXISTS "workspace_${organizationId}" CASCADE`);
    });

    afterAll(async () => {
      await resetDB();
      await closeTestApp(app);
    }, 60_000);

    async function usersTableAndRelation() {
      const internalTable = await appManager.findOne(InternalTable, { where: { organizationId, tableName: 'users' } });
      const relation = await appManager.findOne(InternalTableRelation, {
        where: { internalTableId: internalTable.id },
      });
      return { internalTable, relation };
    }

    function payload(action: StructuredMigrationPayload['action'], request: any = {}): StructuredMigrationPayload {
      return { action, request };
    }

    describe('buildTableSchemaSnapshot | introspection', () => {
      async function snapshotOf(tableName: string) {
        const queryRunner = tjDbManager.connection.createQueryRunner();
        await queryRunner.connect();
        try {
          return await buildTableSchemaSnapshot(queryRunner, `workspace_${organizationId}`, tableName, {});
        } finally {
          await queryRunner.release();
        }
      }

      it('orders a composite primary key by conkey ordinality, not attnum or column name', async () => {
        const tableName = `pk_order_${uuidv4().replace(/-/g, '')}`;
        await tjDbManager.query(
          `CREATE TABLE "workspace_${organizationId}"."${tableName}" (
             col_a integer NOT NULL,
             col_b integer NOT NULL,
             CONSTRAINT ${tableName}_pk PRIMARY KEY (col_b, col_a)
           )`
        );

        const snapshot = await snapshotOf(tableName);

        expect(snapshot.primary_key).toEqual(['col_b', 'col_a']);
        expect(snapshot.columns.find((c) => c.name === 'col_a').is_primary_key).toBe(true);
      });

      it('captures a multi-column unique constraint in declared order', async () => {
        const tableName = `unique_${uuidv4().replace(/-/g, '')}`;
        await tjDbManager.query(
          `CREATE TABLE "workspace_${organizationId}"."${tableName}" (
             id integer PRIMARY KEY,
             col_b integer NOT NULL,
             col_a integer NOT NULL,
             CONSTRAINT ${tableName}_uq UNIQUE (col_b, col_a)
           )`
        );

        const snapshot = await snapshotOf(tableName);

        expect(snapshot.unique_constraints).toEqual([{ name: `${tableName}_uq`, column_names: ['col_b', 'col_a'] }]);
      });

      it('captures a standalone index alongside the implicit primary-key index', async () => {
        const tableName = `indexed_${uuidv4().replace(/-/g, '')}`;
        await tjDbManager.query(
          `CREATE TABLE "workspace_${organizationId}"."${tableName}" (id integer PRIMARY KEY, label text NOT NULL)`
        );
        await tjDbManager.query(
          `CREATE INDEX ${tableName}_label_idx ON "workspace_${organizationId}"."${tableName}" (label)`
        );

        const snapshot = await snapshotOf(tableName);

        expect(snapshot.indexes).toEqual(
          expect.arrayContaining([{ name: `${tableName}_label_idx`, column_names: ['label'], is_unique: false }])
        );
        expect(snapshot.indexes.some((i) => i.column_names.includes('id'))).toBe(true);
      });
    });

    describe('.record | sequence assignment', () => {
      it('assigns a clock-derived sequence when the clock is ahead of any recorded migration', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const before = Date.now();

        const migration = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );

        expect(Number(migration.sequence)).toBeGreaterThanOrEqual(before);
      });

      it('falls back to max + 1 when the clock is behind the table’s highest recorded sequence', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const farFuture = Date.now() + 10_000_000;
        await appManager.query(
          `INSERT INTO internal_table_migrations (internal_table_id, sequence, branch_id, kind, payload, resulting_schema, created_at)
           VALUES ($1, $2, $3, 'baseline', '{}', null, now())`,
          [internalTable.id, farFuture, relation.branchId]
        );

        const migration = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );

        expect(Number(migration.sequence)).toBe(farFuture + 1);
      });

      it('keeps incrementing for several migrations recorded within the same request', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const fixedNow = Date.now();
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

        try {
          const first = await service.record(
            payload('add_column', { column: { column_name: 'age' } }),
            internalTable,
            relation
          );
          const second = await service.record(
            payload('add_column', { column: { column_name: 'score' } }),
            internalTable,
            relation
          );

          expect(Number(first.sequence)).toBe(fixedNow);
          expect(Number(second.sequence)).toBe(fixedNow + 1);
        } finally {
          nowSpy.mockRestore();
        }
      });
    });

    describe('.record | row states', () => {
      it('inserts a pending migration and a pending application', async () => {
        const { internalTable, relation } = await usersTableAndRelation();

        const migration = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );

        expect(migration).toMatchObject({ kind: 'structured', resultingSchema: null, branchId: relation.branchId });

        const application = await appManager.findOne(InternalTableMigrationApplication, {
          where: { migrationId: migration.id, relationId: relation.id },
        });
        expect(application.appliedAt).toBeNull();
      });

      it('writes through a given manager instead of opening its own transaction', async () => {
        // The test harness's suite-level transaction proxy no-ops real commit/rollback, so this
        // asserts the routing decision directly rather than through observed rollback behaviour.
        const { internalTable, relation } = await usersTableAndRelation();
        const transactionSpy = jest.spyOn(appManager, 'transaction');

        await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation,
          appManager
        );
        expect(transactionSpy).not.toHaveBeenCalled();

        await service.record(payload('add_column', { column: { column_name: 'score' } }), internalTable, relation);
        expect(transactionSpy).toHaveBeenCalledTimes(1);

        transactionSpy.mockRestore();
      });
    });

    describe('.confirm and .discard | row states', () => {
      it('confirm fills resulting_schema and applied_at from live introspection', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const migration = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );
        await tjDbManager.query(`ALTER TABLE "workspace_${organizationId}"."${relation.id}" ADD COLUMN age integer`);

        const tjdbQueryRunner = tjDbManager.connection.createQueryRunner();
        await tjdbQueryRunner.connect();
        try {
          await service.confirm(migration, relation, tjdbQueryRunner);
        } finally {
          await tjdbQueryRunner.release();
        }

        const confirmed = await appManager.findOne(InternalTableMigration, { where: { id: migration.id } });
        expect(confirmed.resultingSchema.columns.some((c: any) => c.name === 'age')).toBe(true);

        const application = await appManager.findOne(InternalTableMigrationApplication, {
          where: { migrationId: migration.id, relationId: relation.id },
        });
        expect(application.appliedAt).not.toBeNull();
      });

      it('confirm records an empty shape once the relation itself has been dropped', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const migration = await service.record(payload('drop_table', {}), internalTable, relation);
        await tjDbManager.query(`DROP TABLE "workspace_${organizationId}"."${relation.id}" CASCADE`);

        const tjdbQueryRunner = tjDbManager.connection.createQueryRunner();
        await tjdbQueryRunner.connect();
        try {
          await service.confirm(migration, relation, tjdbQueryRunner);
        } finally {
          await tjdbQueryRunner.release();
        }

        const confirmed = await appManager.findOne(InternalTableMigration, { where: { id: migration.id } });
        expect(confirmed.resultingSchema.columns).toEqual([]);
      });

      it('discard removes both the migration and its application, never touching anything else', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const kept = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );
        const discarded = await service.record(
          payload('add_column', { column: { column_name: 'score' } }),
          internalTable,
          relation
        );

        await service.discard(discarded, relation);

        expect(await appManager.findOne(InternalTableMigration, { where: { id: discarded.id } })).toBeNull();
        expect(
          await appManager.findOne(InternalTableMigrationApplication, { where: { migrationId: discarded.id } })
        ).toBeNull();
        expect(await appManager.findOne(InternalTableMigration, { where: { id: kept.id } })).not.toBeNull();
      });
    });

    describe('.adjudicatePending | crash recovery', () => {
      it('does nothing when there is nothing pending', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        await expect(service.adjudicatePending(internalTable, relation)).resolves.toBeUndefined();
      });

      it('confirms a pending migration whose DDL actually ran, and discards one that never did', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const applied = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );
        const neverRan = await service.record(
          payload('add_column', { column: { column_name: 'does_not_exist' } }),
          internalTable,
          relation
        );
        // Simulates a crash after the DDL for `applied` committed but before this service marked it so.
        await tjDbManager.query(`ALTER TABLE "workspace_${organizationId}"."${relation.id}" ADD COLUMN age integer`);
        // Back-date both past the grace window so adjudicatePending treats them as crash-recovery
        // candidates rather than "recorded moments ago by a still-running request".
        await appManager.query(
          `UPDATE internal_table_migrations SET created_at = now() - interval '1 minute' WHERE id = ANY($1)`,
          [[applied.id, neverRan.id]]
        );

        await service.adjudicatePending(internalTable, relation);

        const confirmed = await appManager.findOne(InternalTableMigration, { where: { id: applied.id } });
        expect(confirmed.resultingSchema.columns.some((c: any) => c.name === 'age')).toBe(true);
        expect(
          (await appManager.findOne(InternalTableMigrationApplication, { where: { migrationId: applied.id } }))
            .appliedAt
        ).not.toBeNull();

        expect(await appManager.findOne(InternalTableMigration, { where: { id: neverRan.id } })).toBeNull();
        expect(
          await appManager.findOne(InternalTableMigrationApplication, { where: { migrationId: neverRan.id } })
        ).toBeNull();
      });

      it('leaves a freshly-recorded migration pending even when its snapshot does not yet match, instead of discarding it', async () => {
        // The cross-request race: this migration's DDL hasn't run yet from adjudicatePending's
        // point of view (created just now, snapshot doesn't show it) - indistinguishable from a
        // migration that will never run without the grace window. Must not be discarded, or the
        // still-running request's own confirm() call becomes a no-op against a deleted row.
        const { internalTable, relation } = await usersTableAndRelation();
        const migration = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );

        await service.adjudicatePending(internalTable, relation);

        const stillPending = await appManager.findOne(InternalTableMigration, { where: { id: migration.id } });
        expect(stillPending).not.toBeNull();
        expect(stillPending.resultingSchema).toBeNull();
        expect(
          (await appManager.findOne(InternalTableMigrationApplication, { where: { migrationId: migration.id } }))
            .appliedAt
        ).toBeNull();
      });

      it('discards a migration whose snapshot never came to match once it is older than the grace window', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const migration = await service.record(
          payload('add_column', { column: { column_name: 'does_not_exist' } }),
          internalTable,
          relation
        );
        await appManager.query(
          `UPDATE internal_table_migrations SET created_at = now() - interval '1 minute' WHERE id = $1`,
          [migration.id]
        );

        await service.adjudicatePending(internalTable, relation);

        expect(await appManager.findOne(InternalTableMigration, { where: { id: migration.id } })).toBeNull();
      });

      it('leaves already-applied migrations untouched', async () => {
        const { internalTable, relation } = await usersTableAndRelation();
        const migration = await service.record(
          payload('add_column', { column: { column_name: 'age' } }),
          internalTable,
          relation
        );
        await appManager.update(
          InternalTableMigrationApplication,
          { migrationId: migration.id },
          { appliedAt: new Date() }
        );

        await service.adjudicatePending(internalTable, relation);

        const stillThere = await appManager.findOne(InternalTableMigration, { where: { id: migration.id } });
        expect(stillThere).not.toBeNull();
        expect(stillThere.resultingSchema).toBeNull();
      });
    });
  });
});
