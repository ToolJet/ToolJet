/**
 * Task B1: raw SQL migration steps. `POST .../table/:tableId/migrations/sql` runs the caller's SQL
 * as the workspace's own tenant role (never the TJDB admin), reconciles column identity, then
 * records the migration - after success, with no pending window (Correction 2 in the H7 plan).
 *
 * Every test here opens its own real, separate Postgres connection as the tenant role
 * (createTooljetDatabaseConnection) - it cannot see anything still sitting inside this spec file's
 * uncommitted suite transaction. Each test runs inside withRealTransactions to get real, committed
 * role/schema/config rows, and builds its own workspace from scratch (same shape
 * tooljetdb-data-operations.spec.ts's sql_execution/join_tables block uses for the same reason).
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
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  withRealTransactions,
  setUpTjdbWorkspace,
  cleanupTjdbWorkspace,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { TooljetDbController } from '@ee/tooljet-db/controller';

describe('TooljetDb raw SQL migration', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tjdbAvailable: boolean;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    function headers(organizationId: string, cookie: string[]) {
      return { Cookie: cookie, 'tj-workspace-id': organizationId };
    }

    async function createTable(organizationId: string, cookie: string[], tableName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table`)
        .set(headers(organizationId, cookie))
        .send({
          table_name: tableName,
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
            },
            {
              column_name: 'gpa',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          ],
          foreign_keys: [],
        });
      expect([200, 201]).toContain(res.statusCode);
    }

    async function tableAndRelation(organizationId: string, tableName: string) {
      const manager = getDefaultDataSource().manager;
      const internalTable = await manager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName },
      });
      const relation = await manager.findOneOrFail(InternalTableRelation, {
        where: { internalTableId: internalTable.id },
      });
      return { internalTable, relation };
    }

    function runRawSql(
      organizationId: string,
      cookie: string[],
      tableId: string,
      body: { sql: string; refs?: Record<string, string> }
    ) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/migrations/sql`)
        .set(headers(organizationId, cookie))
        .send({ refs: {}, ...body });
    }

    async function promote(organizationId: string, cookie: string[], tableId: string, sourceEnvironmentId: string) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/promote`)
        .set(headers(organizationId, cookie))
        .send({ environment_id: sourceEnvironmentId });
    }

    it('should run a DDL statement as the tenant role, add no pending window, and mint a fresh uuid only for the new column', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = workspace.organizationId;
          const { tenantSchema, cookie } = workspace;

          await createTable(organizationId, cookie, 'raw_sql_ddl_tbl');
          const { internalTable, relation } = await tableAndRelation(organizationId, 'raw_sql_ddl_tbl');
          const priorGpaUuid = relation.configurations.columns.column_names['gpa'];
          const priorIdUuid = relation.configurations.columns.column_names['id'];

          // `character varying -> double precision` is still a row-dependent cast the structured
          // routes refuse, which is what this exercises - but the target type has to stay inside
          // `TJDB`, or the unsupported-column-type gate rejects the migration before any of the
          // identity assertions below are reachable.
          const res = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `ALTER TABLE "{{self}}" ALTER COLUMN gpa TYPE double precision USING gpa::double precision; ALTER TABLE "{{self}}" ADD COLUMN note character varying`,
          });
          expect([200, 201]).toContain(res.statusCode);

          // DDL actually ran - the column's Postgres type changed.
          const [column] = await getTooljetDbDataSource().query(
            `SELECT data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'gpa'`,
            [tenantSchema, relation.id]
          );
          expect(column.data_type).toBe('double precision');

          // Column identity: unaffected columns keep their uuid, the new one gets a fresh one.
          const manager = getDefaultDataSource().manager;
          const updatedRelation = await manager.findOneOrFail(InternalTableRelation, { where: { id: relation.id } });
          const columnNames = updatedRelation.configurations.columns.column_names;
          expect(columnNames['id']).toBe(priorIdUuid);
          expect(columnNames['gpa']).toBe(priorGpaUuid);
          expect(columnNames['note']).toBeTruthy();
          expect(columnNames['note']).not.toBe(priorGpaUuid);
          expect(columnNames['note']).not.toBe(priorIdUuid);

          // No pending window: the migration and its application row are both already "confirmed".
          const migration = await manager.findOneOrFail(InternalTableMigration, {
            where: { internalTableId: internalTable.id, kind: 'raw_sql' as any },
          });
          expect(migration.resultingSchema).not.toBeNull();

          // The recorded resultingSchema carries the same minted uuid as the relation's own
          // column_names - a later migration's replay reads column identity off this migration's
          // resultingSchema, so the two must agree, not just the relation.
          const noteColumn = migration.resultingSchema.columns.find((c: any) => c.name === 'note');
          expect(noteColumn.uuid).toBe(columnNames['note']);

          const application = await manager.findOneOrFail(InternalTableMigrationApplication, {
            where: { migrationId: migration.id, relationId: relation.id },
          });
          expect(application.appliedAt).not.toBeNull();
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    it('should leave no migration and no application row when the SQL fails', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = workspace.organizationId;
          const { cookie } = workspace;

          await createTable(organizationId, cookie, 'raw_sql_fail_tbl');
          const { internalTable } = await tableAndRelation(organizationId, 'raw_sql_fail_tbl');

          const before = await getDefaultDataSource().manager.count(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });

          const res = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `ALTER TABLE "{{self}}" ADD COLUMN not_a_real_type NOSUCHTYPE`,
          });
          expect(res.statusCode).toBeGreaterThanOrEqual(400);

          const after = await getDefaultDataSource().manager.count(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });
          expect(after).toBe(before);
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    // Bug A: the SQL itself succeeds, but something after it (here, the migration record write)
    // throws. Before the fix, the SQL had already been committed on its own connection with no
    // transaction wrapping it - so it stayed applied with no migration row for anything to ever
    // detect. After the fix, the SQL's own connection is still inside a transaction when the later
    // failure happens, so rolling it back undoes the SQL too.
    it('should roll back the SQL when the migration record write fails after it', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = workspace.organizationId;
          const { cookie, tenantSchema } = workspace;

          await createTable(organizationId, cookie, 'raw_sql_record_fail_tbl');
          const { internalTable, relation } = await tableAndRelation(organizationId, 'raw_sql_record_fail_tbl');

          const migrationsBefore = await getDefaultDataSource().manager.count(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });

          // Spy on the instance the controller actually calls through, not app.get()'s own copy -
          // TooljetDbModule is cached twice (with and without the controller), same gotcha
          // tjdb-promote.spec.ts's lock/permission tests work around.
          const rawSqlMigrationService = (app.get(TooljetDbController) as any).rawSqlMigrationService;
          const recordRawSqlSpy = jest
            .spyOn(rawSqlMigrationService.migrationRecorderService, 'recordRawSql')
            .mockRejectedValueOnce(new Error('boom'));

          try {
            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN never_recorded character varying`,
            });
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
          } finally {
            recordRawSqlSpy.mockRestore();
          }

          const migrationsAfter = await getDefaultDataSource().manager.count(InternalTableMigration, {
            where: { internalTableId: internalTable.id },
          });
          expect(migrationsAfter).toBe(migrationsBefore);

          const [column] = await getTooljetDbDataSource().query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'never_recorded'`,
            [tenantSchema, relation.id]
          );
          expect(column).toBeUndefined();
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    it('should 403 a caller without tjdb_crud, and still succeed for one with it', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = workspace.organizationId;
          const { cookie, organization } = workspace;

          await createTable(organizationId, cookie, 'raw_sql_gate_tbl');
          const { internalTable } = await tableAndRelation(organizationId, 'raw_sql_gate_tbl');

          const endUserEmail = `raw-sql-no-crud-${uuidv4()}@tooljet.io`;
          await createUser(app, {
            email: endUserEmail,
            groups: ['end-user'],
            organization,
          });
          const { tokenCookie: endUserCookie } = await login(app, endUserEmail);

          const forbidden = await runRawSql(organizationId, endUserCookie, internalTable.id, {
            sql: `ALTER TABLE "{{self}}" ADD COLUMN gate_probe character varying`,
          });
          expect(forbidden.statusCode).toBe(403);

          const allowed = await runRawSql(organizationId, cookie, internalTable.id, {
            sql: `ALTER TABLE "{{self}}" ADD COLUMN gate_probe character varying`,
          });
          expect([200, 201]).toContain(allowed.statusCode);
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    it('should run the SQL as the workspace tenant role, not the TJDB admin - a different workspace stays unreachable', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = workspace.organizationId;
          const { cookie } = workspace;

          await createTable(organizationId, cookie, 'raw_sql_isolation_tbl');
          const { internalTable } = await tableAndRelation(organizationId, 'raw_sql_isolation_tbl');

          // A schema this org's tenant role has no grant on - simulates reaching another workspace.
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_unreachable_probe"`);
          try {
            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `CREATE TABLE "workspace_unreachable_probe"."should_fail" (id integer)`,
            });
            expect(res.statusCode).toBeGreaterThanOrEqual(400);

            const exists = await getTooljetDbDataSource().query(
              `SELECT 1 FROM information_schema.tables WHERE table_schema = 'workspace_unreachable_probe' AND table_name = 'should_fail'`
            );
            expect(exists).toHaveLength(0);
          } finally {
            await getTooljetDbDataSource().query(`DROP SCHEMA IF EXISTS "workspace_unreachable_probe" CASCADE`);
          }
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    it('should run migration SQL with lock_timeout set, so a blocked DDL fails fast', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const { organizationId: orgId, cookie } = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = orgId;

          await createTable(organizationId, cookie, 'locks_probe');
          const manager = getDefaultDataSource().manager;
          const internalTable = await manager.findOne(InternalTable, {
            where: { organizationId, tableName: 'locks_probe' },
          });

          // Asserted from inside the migration's own session - the only place the setting is
          // observable. A wrong or missing lock_timeout fails the request.
          const res = await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/${internalTable.id}/migrations/sql`)
            .set(headers(organizationId, cookie))
            .send({
              sql: `DO $$ BEGIN
                      IF current_setting('lock_timeout') <> '3s' THEN
                        RAISE EXCEPTION 'lock_timeout was %', current_setting('lock_timeout');
                      END IF;
                    END $$;`,
              refs: {},
            });

          expect(res.status).toBe(201);
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    it('should replay migration SQL with lock_timeout set, so a promote sees the same guard as authoring', async () => {
      expect(tjdbAvailable).toBe(true);

      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const { organizationId: orgId, cookie } = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
          organizationId = orgId;

          await createTable(organizationId, cookie, 'locks_probe_replay');
          const manager = getDefaultDataSource().manager;
          const internalTable = await manager.findOneOrFail(InternalTable, {
            where: { organizationId, tableName: 'locks_probe_replay' },
          });
          const environments = await manager.find(AppEnvironment, {
            where: { organizationId },
            order: { priority: 'ASC' },
          });
          const devEnvId = environments[0].id;

          // Same assertion as the authoring-path test above, but this SQL only ever runs through
          // replayRawSqlMigration (the second promote below) - the authoring POST that records it
          // runs against a table with no target relation yet, so nothing replays it until then.
          const sql = `DO $$ BEGIN
                      IF current_setting('lock_timeout') <> '3s' THEN
                        RAISE EXCEPTION 'lock_timeout was %', current_setting('lock_timeout');
                      END IF;
                    END $$;`;

          const recorded = await runRawSql(organizationId, cookie, internalTable.id, { sql });
          expect(recorded.status).toBe(201);

          const promoted = await promote(organizationId, cookie, internalTable.id, devEnvId);
          expect([200, 201]).toContain(promoted.status);
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    // Task: unsupported-column-type gate (assertNoUnsupportedColumnTypes /
    // unsupportedColumnTypes) - rejects a raw SQL migration that leaves a *new or type-changed*
    // column with a type ToolJet Database's structured routes can't represent. Covers the gate's
    // own table, a sibling reached through `refs`, and the pre-existing-column grandfather case.
    describe('unsupported column type gate', () => {
      it('should reject an array type on the migrated table, roll back the DDL, and record no migration', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie, tenantSchema } = workspace;

            await createTable(organizationId, cookie, 'gate_array_tbl');
            const { internalTable, relation } = await tableAndRelation(organizationId, 'gate_array_tbl');

            const migrationsBefore = await getDefaultDataSource().manager.count(InternalTableMigration, {
              where: { internalTableId: internalTable.id },
            });

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN tags text[]`,
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('tags');
            expect(res.body.message).toContain('text[]');

            const migrationsAfter = await getDefaultDataSource().manager.count(InternalTableMigration, {
              where: { internalTableId: internalTable.id },
            });
            expect(migrationsAfter).toBe(migrationsBefore);

            const [column] = await getTooljetDbDataSource().query(
              `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'tags'`,
              [tenantSchema, relation.id]
            );
            expect(column).toBeUndefined();
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should still allow a migration adding a supported type', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'gate_supported_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'gate_supported_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN nickname varchar`,
            });
            expect([200, 201]).toContain(res.statusCode);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should reject a modifier-carrying unsupported type, keeping the modifier in the error text', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'gate_numeric_mod_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'gate_numeric_mod_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN amount numeric(10,2)`,
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('numeric(10,2)');
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should allow a modifier-carrying supported type, proving modifier stripping end-to-end', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'gate_varchar_mod_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'gate_varchar_mod_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN bio character varying(255)`,
            });
            expect([200, 201]).toContain(res.statusCode);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should reject an unsupported type introduced on a sibling table reached via {{table.<name>}}, naming that table', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'gate_sibling_a_tbl');
            await createTable(organizationId, cookie, 'gate_sibling_b_tbl');
            const { internalTable: tableA } = await tableAndRelation(organizationId, 'gate_sibling_a_tbl');

            const res = await runRawSql(organizationId, cookie, tableA.id, {
              sql: `ALTER TABLE "{{table.gate_sibling_b_tbl}}" ADD COLUMN tags text[]`,
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('tags');
            expect(res.body.message).toContain('gate_sibling_b_tbl');
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should grandfather a pre-existing unsupported column left untouched by a later migration', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie, tenantSchema } = workspace;

            await createTable(organizationId, cookie, 'gate_grandfather_tbl');
            const { internalTable, relation } = await tableAndRelation(organizationId, 'gate_grandfather_tbl');

            // Bypass the gated route entirely - DDL straight against the tenant schema, the same
            // admin connection the isolation test above uses to create/drop a probe schema. This
            // is how a column ToolJet Database doesn't support could have existed on the table
            // before this check was introduced.
            await getTooljetDbDataSource().query(
              `ALTER TABLE "${tenantSchema}"."${relation.id}" ADD COLUMN legacy_tags text[]`
            );

            // unsupportedColumnTypes matches columns on uuid, not name, and treats a uuid-less
            // column as new on every migration (see its own doc comment) - so a column added by
            // raw DDL with no uuid recorded would misread as "new" forever, never grandfathered.
            // Seed the uuid a real recordRawSqlMigration would have minted for it, so the before/
            // after comparison sees the same column both times, exactly as if this column had been
            // authored through the gate before the check existed.
            const legacyColumnUuid = uuidv4();
            relation.configurations.columns.column_names['legacy_tags'] = legacyColumnUuid;
            relation.configurations.columns.configurations = relation.configurations.columns.configurations || {};
            relation.configurations.columns.configurations[legacyColumnUuid] = {};
            await getDefaultDataSource().manager.save(InternalTableRelation, relation);

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN note character varying`,
            });
            expect([200, 201]).toContain(res.statusCode);

            const [column] = await getTooljetDbDataSource().query(
              `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'note'`,
              [tenantSchema, relation.id]
            );
            expect(column).toBeDefined();
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });
    });

    describe('{{table.<name>}} references', () => {
      it('should resolve {{table.<name>}} by current display name, same as an explicit refs entry', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'table_ref_a_tbl');
            await createTable(organizationId, cookie, 'table_ref_b_tbl');
            const { internalTable: tableA } = await tableAndRelation(organizationId, 'table_ref_a_tbl');

            const res = await runRawSql(organizationId, cookie, tableA.id, {
              sql: `ALTER TABLE "{{table.table_ref_b_tbl}}" ADD COLUMN note character varying`,
            });
            expect(res.statusCode).toBe(201);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should 404 when {{table.<name>}} names a table absent from the workspace', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'table_ref_missing_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'table_ref_missing_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{table.does_not_exist_tbl}}" ADD COLUMN note character varying`,
            });
            expect(res.statusCode).toBe(404);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });
    });

    describe('DDL token-check enforcement', () => {
      it('should reject a literal table name in ALTER TABLE position', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'ddl_literal_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'ddl_literal_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE ddl_literal_tbl ADD COLUMN note character varying`,
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('{{self}}');
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should reject a hardcoded uuid in CREATE TABLE position', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'ddl_hardcoded_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'ddl_hardcoded_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `CREATE TABLE "11111111-1111-1111-1111-111111111111" (id integer primary key)`,
            });
            expect(res.statusCode).toBe(400);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should still accept {{self}} in ALTER TABLE position', async () => {
        expect(tjdbAvailable).toBe(true);

        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'raw-sql' });
            organizationId = workspace.organizationId;
            const { cookie } = workspace;

            await createTable(organizationId, cookie, 'ddl_self_ok_tbl');
            const { internalTable } = await tableAndRelation(organizationId, 'ddl_self_ok_tbl');

            const res = await runRawSql(organizationId, cookie, internalTable.id, {
              sql: `ALTER TABLE "{{self}}" ADD COLUMN note character varying`,
            });
            expect(res.statusCode).toBe(201);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });
    });
  });
});
