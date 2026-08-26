/**
 * @group database
 */
import { INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { resetDB, createUser, setDataSources, closeTestApp, ensureAppEnvironments } from 'test-helper';
import { setupTestTables } from '../../../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { OrganizationTjdbConfigurations } from '@entities/organization_tjdb_configurations.entity';
import { encryptTooljetDatabasePassword } from '@helpers/tooljet_db.helper';
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

describe('TooljetDbTableOperationsService', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let appManager: EntityManager;
    let tjDbManager: EntityManager;
    let service: TooljetDbTableOperationsService;
    let organizationId: string;

    beforeAll(async () => {
      const mockLicenseService = { getLicenseTerms: jest.fn() };
      const mockLicenseTermsService = { getLicenseTerms: jest.fn() };
      const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../.env.test'],
            load: [() => getEnvVars()],
          }),
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
          ]),
        ],
        providers: [
          TooljetDbTableOperationsService,
          TooljetDbRelationResolverService,
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

      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      appManager = defaultDataSource.manager;
      const tooljetDbDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
      tjDbManager = tooljetDbDataSource.manager;

      service = moduleFixture.get<TooljetDbTableOperationsService>(TooljetDbTableOperationsService);
    });

    beforeEach(async () => {
      await resetDB();

      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      organizationId = adminUserData.organization.id;
      await ensureAppEnvironments(app, organizationId);

      const schemaName = `workspace_${organizationId}`;
      await tjDbManager.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      await setupTestTables(appManager, tjDbManager, service, organizationId);
    });

    afterEach(async () => {
      if (organizationId && tjDbManager) {
        try {
          await tjDbManager.query(`DROP SCHEMA IF EXISTS "workspace_${organizationId}" CASCADE`);
        } catch {
          // ignore cleanup errors
        }
      }
    });

    afterAll(async () => {
      await resetDB();
      await closeTestApp(app);
    }, 60_000);

    describe('.editColumn | edit_column action', () => {
      it('should throw NotFoundException instead of writing a literal "undefined" configuration key when the column has no tracked uuid', async () => {
        // Simulates the gap UpdateInternalTablesConfigurationsColumn1718542399701 left behind:
        // a physical column with no entry in configurations.columns.column_names.
        await expect(
          service.perform(organizationId, 'edit_column', {
            table_name: 'users',
            column: { column_name: 'not_a_tracked_column', data_type: 'character varying' },
          })
        ).rejects.toThrow('Column not found: not_a_tracked_column');

        const usersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });
        const relation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: usersTable.id },
        });
        expect(relation.configurations.columns.configurations['undefined']).toBeUndefined();
      });
    });

    describe('.joinTable | join_tables action', () => {
      it('should reject a join whose from-table belongs to another workspace, even when every joined-to table is legitimately owned', async () => {
        // The `from` table is the only foreign one here. `joins` carries a real join against
        // `orders`, a table this workspace legitimately owns (seeded by setupTestTables) - that's
        // what populates the pre-fix tableSet at all, letting the foreign `from.name` slip past the
        // "Tables are not chosen" guard and reach buildJoinQuery's unvalidated `.from()` unchecked.
        const otherUser = await createUser(app, {
          email: 'other-join@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const foreignTable = await appManager.save(
          appManager.create(InternalTable, {
            organizationId: otherUser.organization.id,
            tableName: 'foreign_table',
            co_relation_id: uuidv4(),
          })
        );
        const ordersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'orders' },
        });

        // join_tables needs a tenant DB config to get past the earlier "schema configuration
        // doesn't exist" guard and actually reach tableSet validation - setupTestTables never
        // provisions one (that's done by the real org-onboarding flow, not exercised here). The
        // role/password don't need to work: pre-fix, validation lets the query through and the
        // bogus credentials fail at connection time (a distinct, later error); post-fix, the
        // foreign from-table is rejected before a connection is ever attempted.
        await appManager.save(
          appManager.create(OrganizationTjdbConfigurations, {
            organizationId,
            pgUser: 'nonexistent_tjdb_test_role',
            pgPassword: await encryptTooljetDatabasePassword('bogus-password'),
          })
        );

        await expect(
          service.perform(organizationId, 'join_tables', {
            joinQueryJson: {
              from: { name: foreignTable.id },
              fields: [{ name: 'id', table: ordersTable.id }],
              joins: [
                {
                  joinType: 'INNER',
                  table: ordersTable.id,
                  conditions: {
                    operator: 'AND',
                    conditionsList: [
                      {
                        operator: '=',
                        leftField: { type: 'Column', table: ordersTable.id, columnName: 'id' },
                        rightField: { type: 'Column', table: ordersTable.id, columnName: 'id' },
                      },
                    ],
                  },
                },
              ],
            },
          })
        ).rejects.toThrow(NotFoundException);
      });

      it('should name the from/join targets by relation id while keeping the SQL aliases as display names', async () => {
        // buildJoinQuery uses one map for two jobs: the display name is the SQL *alias* that select
        // fields, aggregates, group-bys, order-bys and filter conditions all address columns
        // through, while .from() and the join target name a *physical* table. Only the latter
        // resolves to a relation id.
        //
        // The relation ids are deliberately moved off the logical ids first, rather than relying on
        // create_table to have minted independent ones. That keeps the assertion below non-vacuous
        // however these fixtures were built: were the two ids equal, it would pass whether or not
        // the resolver was consulted at all.
        //
        // This asserts the generated SQL rather than running the query: join_tables is the only
        // handler that opens its own Postgres connection, and every spec runs inside an uncommitted
        // transaction (test/jest-transaction-setup.ts), so a second connection cannot see tables
        // this suite created. The naming is a property of the emitted SQL regardless.
        const usersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });
        const ordersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'orders' },
        });

        const usersRelationId = uuidv4();
        const ordersRelationId = uuidv4();
        await appManager.update(InternalTableRelation, { internalTableId: usersTable.id }, { id: usersRelationId });
        await appManager.update(InternalTableRelation, { internalTableId: ordersTable.id }, { id: ordersRelationId });

        const resolver = app.get(TooljetDbRelationResolverService);
        const relationIdByLogicalId = await resolver.resolve(organizationId, [usersTable.id, ordersTable.id]);

        const queryBuilder = (
          service as unknown as {
            buildJoinQuery: (
              queryJson: unknown,
              internalTableIdToNameMap: Record<string, string>,
              relationIdByLogicalId: Map<string, string>,
              connection: unknown
            ) => { getQuery: () => string };
          }
        ).buildJoinQuery(
          {
            from: { name: usersTable.id, type: 'Table' },
            fields: [],
            joins: [
              {
                joinType: 'INNER',
                table: ordersTable.id,
                conditions: {
                  operator: 'AND',
                  conditionsList: [
                    {
                      operator: '=',
                      leftField: { type: 'Column', table: usersTable.id, columnName: 'id' },
                      rightField: { type: 'Column', table: ordersTable.id, columnName: 'user_id' },
                    },
                  ],
                },
              },
            ],
            conditions: {
              operator: 'AND',
              conditionsList: [
                {
                  operator: '>',
                  leftField: { type: 'Column', table: ordersTable.id, columnName: 'total' },
                  rightField: { type: 'Value', value: 20 },
                },
              ],
            },
            group_by: { [usersTable.id]: ['name'] },
            aggregates: { total_spent: { aggFx: 'sum', column: 'total', table_id: ordersTable.id } },
            order_by: [{ table: usersTable.id, columnName: 'name', direction: 'ASC' }],
          },
          { [usersTable.id]: 'users', [ordersTable.id]: 'orders' },
          relationIdByLogicalId,
          tjDbManager.connection
        );

        const sql = queryBuilder.getQuery();

        // Physical targets are the relation ids...
        expect(sql).toContain(`"${usersRelationId}" "users"`);
        expect(sql).toContain(`"${ordersRelationId}" "orders"`);
        // ...and the logical ids appear nowhere, which is what would happen if .from()/the join
        // target had been left naming the table by internal_tables.id.
        expect(sql).not.toContain(usersTable.id);
        expect(sql).not.toContain(ordersTable.id);
        // Aliases stay display names, and every other clause still addresses columns through them.
        expect(sql).toContain('"users"."id" = "orders"."user_id"');
        expect(sql).toContain('"orders"."total" >');
        expect(sql).toContain('SUM("orders"."total") AS "orders_total_sum"');
        expect(sql).toContain('GROUP BY "users"."name"');
        expect(sql).toContain('ORDER BY "users"."name" ASC');
      });
    });

    describe('.viewTable | view_table action', () => {
      it('should not report columns from an identically named table in another schema', async () => {
        // A second workspace schema holding a table with the same physical name proves the
        // INFORMATION_SCHEMA.COLUMNS query is filtered by table_schema, not just table_name.
        const otherUser = await createUser(app, {
          email: 'other-view@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const otherOrganizationId = otherUser.organization.id;
        const usersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });

        await tjDbManager.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${otherOrganizationId}"`);
        await tjDbManager.query(
          `CREATE TABLE "workspace_${otherOrganizationId}"."${usersTable.id}" (decoy_column text)`
        );

        const result = await service.perform(organizationId, 'view_table', { table_name: 'users' });

        expect(result.columns.map((column) => column.column_name)).not.toContain('decoy_column');
      });
    });
  });
});
