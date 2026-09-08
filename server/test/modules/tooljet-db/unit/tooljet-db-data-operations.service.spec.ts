/**
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
import { TooljetDbMigrationRecorderService } from '@modules/tooljet-db/services/tooljet-db-migration-recorder.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { resetDB, createUser, setDataSources, closeTestApp, ensureAppEnvironments } from 'test-helper';
import { setupTestTables } from '../../../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
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

describe('TooljetDbDataOperationsService', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let appManager: EntityManager;
    let tjDbManager: EntityManager;
    let tableOperationsService: TooljetDbTableOperationsService;
    let dataOperationsService: TooljetDbDataOperationsService;
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

      const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
      appManager = defaultDataSource.manager;
      const tooljetDbDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
      tjDbManager = tooljetDbDataSource.manager;

      tableOperationsService = moduleFixture.get<TooljetDbTableOperationsService>(TooljetDbTableOperationsService);

      // sqlExecution/resolveTableNameToRelationIdMap only touch `manager` and
      // `tableOperationsService` - the other constructor deps (postgrestProxyService,
      // tooljetDbManager, configService, tooljetDbBulkUploadService, relationResolverService) are
      // unused by the method under test, so plain stand-ins are enough; there's no batching door
      // here that would need them.
      dataOperationsService = new TooljetDbDataOperationsService(
        appManager,
        tableOperationsService,
        {} as any,
        tjDbManager,
        {} as any,
        {} as any,
        {} as any
      );
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

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
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

    describe('.resolveTableNameToRelationIdMap', () => {
      it('should map display names to relation ids, not logical internal_table ids', async () => {
        // create_table already mints an independent relation id (never internalTable.id) - reading
        // it back keeps the assertion below non-vacuous without fighting the FK
        // internal_table_migration_applications now holds on it.
        const usersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });
        const ordersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'orders' },
        });

        const usersRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: usersTable.id },
        });
        const ordersRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: ordersTable.id },
        });
        const usersRelationId = usersRelation.id;
        const ordersRelationId = ordersRelation.id;

        const internalTableInfo: Array<{ id: string; tableName: string }> = [];
        const map = await (
          dataOperationsService as unknown as {
            resolveTableNameToRelationIdMap: (
              tablesUsedInQuery: string[],
              organizationId: string,
              environmentId: string | undefined,
              internalTableInfo: Array<{ id: string; tableName: string }>
            ) => Promise<Record<string, string>>;
          }
        ).resolveTableNameToRelationIdMap(['users', 'orders'], organizationId, undefined, internalTableInfo);

        expect(map).toEqual({ users: usersRelationId, orders: ordersRelationId });
        expect(map.users).not.toEqual(usersTable.id);
        expect(map.orders).not.toEqual(ordersTable.id);

        // internalTableInfo (feeds TooljetDatabaseError's error-translation context) must carry
        // the same relation ids, not the logical ids.
        expect(internalTableInfo).toEqual(
          expect.arrayContaining([
            { id: usersRelationId, tableName: 'users' },
            { id: ordersRelationId, tableName: 'orders' },
          ])
        );
      });
    });

    describe('.parseTableNameInAST', () => {
      it('should mutate the AST to replace logical table names with their relation ids', () => {
        const ast = {
          type: 'select',
          from: [
            {
              table: 'users',
              type: 'table',
              as: null,
            },
          ],
        };
        const relationId = 'd19c6721-1ac1-4d9c-9edc-a4592f42e7dc';
        const map = { users: relationId };

        (
          dataOperationsService as unknown as {
            parseTableNameInAST: (parsedSql: unknown, internalTableNameToRelationIdMap: Record<string, string>) => void;
          }
        ).parseTableNameInAST(ast, map);

        expect(ast.from[0].table).toBe(relationId);
      });
    });

    describe('.resolveTableNameToRelationIdMap | internalTableInfo out-param mutation', () => {
      it('should partially populate internalTableInfo even when a table fails to resolve', async () => {
        const usersTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });
        const usersRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: usersTable.id },
        });
        const usersRelationId = usersRelation.id;

        const internalTableInfo: Array<{ id: string; tableName: string }> = [];

        await expect(
          (
            dataOperationsService as unknown as {
              resolveTableNameToRelationIdMap: (
                tablesUsedInQuery: string[],
                organizationId: string,
                environmentId: string | undefined,
                internalTableInfo: Array<{ id: string; tableName: string }>
              ) => Promise<Record<string, string>>;
            }
          ).resolveTableNameToRelationIdMap(
            ['users', 'non_existent_table'],
            organizationId,
            undefined,
            internalTableInfo
          )
        ).rejects.toThrow();

        // The successful resolution (users) should still be appended
        expect(internalTableInfo).toEqual([{ id: usersRelationId, tableName: 'users' }]);
      });
    });
  });

  // Task 2: resolve columnId -> current column name before building the PostgREST/join call.
  // Fully mocked - no DB, no Nest module - since the resolver itself (Task 1) already has its
  // own unit tests, and nothing sends `columnId` from the frontend yet (Task 4), so there's no
  // integration path to exercise here.
  describe('Column identity resolution (mocked)', () => {
    const organizationId = 'org-1';
    const environmentId = 'env-1';
    const tableId = 'table-1';
    const context = { app: { organization_id: organizationId, environment_id: environmentId } };

    function buildService(overrides: {
      relationResolverService?: any;
      postgrestProxyService?: any;
      tableOperationsService?: any;
      manager?: any;
      tooljetDbBulkUploadService?: any;
    }) {
      const relationResolverService = overrides.relationResolverService ?? {
        resolveColumnName: jest.fn().mockResolvedValue(null),
        resolveColumnNames: jest.fn().mockResolvedValue(new Map()),
      };
      const postgrestProxyService = overrides.postgrestProxyService ?? { perform: jest.fn().mockResolvedValue({}) };
      const tableOperationsService = overrides.tableOperationsService ?? { perform: jest.fn().mockResolvedValue([]) };
      const manager = overrides.manager ?? { findOne: jest.fn().mockResolvedValue({ tableName: 'users' }) };
      const tooljetDbBulkUploadService = overrides.tooljetDbBulkUploadService ?? {};

      const service = new TooljetDbDataOperationsService(
        manager,
        tableOperationsService,
        postgrestProxyService,
        {} as any,
        {} as any,
        tooljetDbBulkUploadService,
        relationResolverService
      );
      return { service, relationResolverService, postgrestProxyService, tableOperationsService, manager };
    }

    describe('.createRow', () => {
      it('should use the raw column string when no columnId is present (legacy queries)', async () => {
        const { service, postgrestProxyService, relationResolverService } = buildService({});

        await service.createRow({ table_id: tableId, create_row: { c1: { column: 'name', value: 'Alice' } } }, context);

        expect(relationResolverService.resolveColumnNames).not.toHaveBeenCalled();
        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.any(String),
          'POST',
          expect.any(Object),
          { name: 'Alice' },
          environmentId
        );
      });

      it('should resolve columnId to the current name even when it differs from the stored column string (rename)', async () => {
        const resolvedMap = new Map([['col-uuid-1', 'new_name']]);
        const { service, postgrestProxyService, relationResolverService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
        });

        await service.createRow(
          {
            table_id: tableId,
            create_row: { c1: { column: 'old_name', columnId: 'col-uuid-1', value: 'Alice' } },
          },
          context
        );

        expect(relationResolverService.resolveColumnNames).toHaveBeenCalledWith(
          organizationId,
          tableId,
          ['col-uuid-1'],
          environmentId
        );
        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.any(String),
          'POST',
          expect.any(Object),
          { new_name: 'Alice' },
          environmentId
        );
      });

      it('should fall back to the stored column string when the columnId no longer resolves (deleted column)', async () => {
        const { service, postgrestProxyService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(new Map()),
          },
        });

        await service.createRow(
          {
            table_id: tableId,
            create_row: { c1: { column: 'old_name', columnId: 'deleted-uuid', value: 'Alice' } },
          },
          context
        );

        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.any(String),
          'POST',
          expect.any(Object),
          { old_name: 'Alice' },
          environmentId
        );
      });
    });

    describe('.updateRows', () => {
      it('should resolve columnId in both the columns map and where_filters', async () => {
        const resolvedMap = new Map([
          ['col-uuid-1', 'new_name'],
          ['col-uuid-2', 'new_email'],
        ]);
        const { service, postgrestProxyService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
        });

        await service.updateRows(
          {
            table_id: tableId,
            update_rows: {
              columns: { c1: { column: 'old_name', columnId: 'col-uuid-1', value: 'Bob' } },
              where_filters: {
                f1: { column: 'old_email', columnId: 'col-uuid-2', operator: 'eq', value: 'x@y.com' },
              },
            },
          },
          context
        );

        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.stringContaining('new_email='),
          'PATCH',
          expect.any(Object),
          { new_name: 'Bob' },
          environmentId
        );
      });
    });

    describe('.deleteRows', () => {
      it('should resolve order_column via order_column_id and where_filters columns', async () => {
        const { service, postgrestProxyService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn().mockResolvedValue('new_order_col'),
            resolveColumnNames: jest.fn().mockResolvedValue(new Map([['col-uuid-filter', 'new_filter_col']])),
          },
        });

        await service.deleteRows(
          {
            table_id: tableId,
            delete_rows: {
              where_filters: {
                f1: { column: 'old_filter_col', columnId: 'col-uuid-filter', operator: 'eq', value: 1 },
              },
              limit: 5,
              order_column: 'old_order_col',
              order_column_id: 'col-uuid-order',
            },
          },
          context
        );

        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.stringMatching(/new_filter_col=.*order=new_order_col/),
          'DELETE',
          expect.any(Object),
          {},
          environmentId
        );
      });

      it('should fall back to the raw order_column when there is no order_column_id (legacy queries)', async () => {
        const { service, postgrestProxyService } = buildService({});

        await service.deleteRows(
          {
            table_id: tableId,
            delete_rows: {
              where_filters: { f1: { column: 'id', operator: 'eq', value: 1 } },
              limit: 5,
              order_column: 'id',
            },
          },
          context
        );

        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.stringContaining('order=id'),
          'DELETE',
          expect.any(Object),
          {},
          environmentId
        );
      });
    });

    describe('.listRows', () => {
      it('should resolve where_filters/order_filters columnId to the current name', async () => {
        const resolvedMap = new Map([
          ['col-uuid-where', 'new_where_col'],
          ['col-uuid-order', 'new_order_col'],
        ]);
        const { service, postgrestProxyService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
        });

        await service.listRows(
          {
            table_id: tableId,
            list_rows: {
              where_filters: {
                f1: { column: 'old_where_col', columnId: 'col-uuid-where', operator: 'eq', value: 1 },
              },
              order_filters: {
                o1: { column: 'old_order_col', columnId: 'col-uuid-order', order: 'asc' },
              },
            },
          },
          context
        );

        expect(postgrestProxyService.perform).toHaveBeenCalledWith(
          expect.stringMatching(/new_where_col=.*new_order_col/),
          'GET',
          expect.any(Object),
          {},
          environmentId
        );
      });

      it('should resolve columnId on aggregates and group_by before building the select clause', async () => {
        const resolvedMap = new Map([
          ['col-uuid-agg', 'new_agg_col'],
          ['col-uuid-group', 'new_group_col'],
        ]);
        const { service, postgrestProxyService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
        });

        const listRowsOptions = {
          aggregates: {
            agg1: { aggFx: 'count', column: 'old_agg_col', columnId: 'col-uuid-agg' },
          },
          group_by: {
            g1: [{ column: 'old_group_col', columnId: 'col-uuid-group' }, 'untouched_col'],
          },
        };
        const originalAggregateRef = listRowsOptions.aggregates.agg1;

        await service.listRows({ table_id: tableId, list_rows: listRowsOptions }, context);

        const [url] = postgrestProxyService.perform.mock.calls[0];
        expect(url).toContain('new_agg_col');
        expect(url).toContain('new_group_col');
        expect(url).toContain('untouched_col');
        expect(url).not.toContain('old_agg_col');
        expect(url).not.toContain('old_group_col');
        // The caller's original options object was never mutated.
        expect(originalAggregateRef.column).toBe('old_agg_col');
      });
    });

    describe('.joinTables', () => {
      it('should resolve leftField/rightField columnId on join conditions to the current name', async () => {
        const resolvedMap = new Map([['col-uuid-left', 'new_left_col']]);
        const { service, tableOperationsService, relationResolverService } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
        });

        await service.joinTables(
          {
            join_table: {
              from: { name: 'table-a', type: 'Table' },
              fields: [{ name: 'name', table: 'table-a' }],
              joins: [
                {
                  joinType: 'INNER',
                  table: 'table-b',
                  conditions: {
                    operator: 'AND',
                    conditionsList: [
                      {
                        operator: '=',
                        leftField: {
                          type: 'Column',
                          table: 'table-a',
                          columnName: 'old_left_col',
                          columnId: 'col-uuid-left',
                        },
                        rightField: { type: 'Column', table: 'table-b', columnName: 'id' },
                      },
                    ],
                  },
                },
              ],
            },
          },
          context
        );

        expect(relationResolverService.resolveColumnNames).toHaveBeenCalledWith(
          organizationId,
          'table-a',
          ['col-uuid-left'],
          environmentId
        );
        const performedJson = tableOperationsService.perform.mock.calls[0][2].joinQueryJson;
        expect(performedJson.joins[0].conditions.conditionsList[0].leftField.columnName).toBe('new_left_col');
        // rightField has no columnId - stays untouched
        expect(performedJson.joins[0].conditions.conditionsList[0].rightField.columnName).toBe('id');
      });

      it('should resolve columnId on fields (SELECT), order_by, group_by, and aggregates - not just conditions', async () => {
        const perTableResolvedNames: Record<string, Map<string, string>> = {
          'table-a': new Map([['col-uuid-name', 'new_name']]),
          'table-b': new Map([
            ['col-uuid-sort', 'new_sort_col'],
            ['col-uuid-group', 'new_group_col'],
            ['col-uuid-agg', 'new_agg_col'],
          ]),
        };
        const resolveColumnNames = jest.fn((_orgId, tableId) =>
          Promise.resolve(perTableResolvedNames[tableId] ?? new Map())
        );
        const { service, tableOperationsService } = buildService({
          relationResolverService: { resolveColumnName: jest.fn(), resolveColumnNames },
        });

        const joinTableOptions = {
          from: { name: 'table-a', type: 'Table' },
          fields: [{ name: 'old_name', table: 'table-a', columnId: 'col-uuid-name' }],
          joins: [
            {
              joinType: 'INNER',
              table: 'table-b',
              conditions: { operator: 'AND', conditionsList: [] },
            },
          ],
          order_by: [{ table: 'table-b', columnName: 'old_sort_col', columnId: 'col-uuid-sort', direction: 'ASC' }],
          group_by: {
            'table-b': [{ column: 'old_group_col', columnId: 'col-uuid-group' }, 'untouched_col'],
          },
          aggregates: {
            agg1: { aggFx: 'count', column: 'old_agg_col', columnId: 'col-uuid-agg', table_id: 'table-b' },
          },
        };
        // Deep-frozen snapshot to prove joinTables never mutates the caller's queryOptions (finding #7).
        const originalFieldsRef = joinTableOptions.fields[0];
        const originalOrderByRef = joinTableOptions.order_by[0];

        await service.joinTables({ join_table: joinTableOptions }, context);

        const performedJson = tableOperationsService.perform.mock.calls[0][2].joinQueryJson;
        expect(performedJson.fields[0].name).toBe('new_name');
        expect(performedJson.order_by[0].columnName).toBe('new_sort_col');
        expect(performedJson.group_by['table-b']).toEqual(['new_group_col', 'untouched_col']);
        expect(performedJson.aggregates.agg1.column).toBe('new_agg_col');

        // The caller's original objects were never touched - resolution happened on a clone.
        expect(originalFieldsRef.name).toBe('old_name');
        expect(originalOrderByRef.columnName).toBe('old_sort_col');
        expect(performedJson.fields[0]).not.toBe(originalFieldsRef);
      });
    });

    describe('.bulkUpdateWithPrimaryKey', () => {
      it('should resolve each primary_key entry via primary_key_ids before calling the bulk-upload service (composite key)', async () => {
        const resolvedMap = new Map([['col-uuid-pk-a', 'new_pk_a']]);
        const bulkUploadService = {
          bulkUpdateRowsWithPrimaryKey: jest.fn().mockResolvedValue({ status: 'ok', data: [] }),
        };
        const { service } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
          tooljetDbBulkUploadService: bulkUploadService,
        });

        await service.bulkUpdateWithPrimaryKey(
          {
            table_id: tableId,
            bulk_update_with_primary_key: {
              // Composite primary key - the frontend always sends an array. `pk_b` has no
              // columnId (legacy/unresolvable) and must fall back to its stored name, while
              // `pk_a` resolves to its renamed current name via col-uuid-pk-a.
              primary_key: ['pk_a', 'pk_b'],
              primary_key_ids: ['col-uuid-pk-a', undefined],
              rows_update: [{ pk_a: 1, pk_b: 2 }],
            },
          },
          context
        );

        // Both PK columns must reach the bulk-upload service as an array (never collapsed to
        // one column), each independently resolved by its own columnId.
        expect(bulkUploadService.bulkUpdateRowsWithPrimaryKey).toHaveBeenCalledWith(
          [{ pk_a: 1, pk_b: 2 }],
          tableId,
          ['new_pk_a', 'pk_b'],
          organizationId,
          environmentId
        );
      });

      it('should treat a single (non-array) primary_key as one column, matching bulkUpdateRowsWithPrimaryKey normalization', async () => {
        const bulkUploadService = {
          bulkUpdateRowsWithPrimaryKey: jest.fn().mockResolvedValue({ status: 'ok', data: [] }),
        };
        const { service } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(new Map([['col-uuid-pk', 'new_pk']])),
          },
          tooljetDbBulkUploadService: bulkUploadService,
        });

        await service.bulkUpdateWithPrimaryKey(
          {
            table_id: tableId,
            bulk_update_with_primary_key: {
              primary_key: 'old_pk',
              primary_key_ids: ['col-uuid-pk'],
              rows_update: [{ old_pk: 1 }],
            },
          },
          context
        );

        expect(bulkUploadService.bulkUpdateRowsWithPrimaryKey).toHaveBeenCalledWith(
          [{ old_pk: 1 }],
          tableId,
          ['new_pk'],
          organizationId,
          environmentId
        );
      });
    });

    describe('.bulkUpsertUsingPrimaryKey', () => {
      it('should resolve each primary_key entry via primary_key_ids before calling the bulk-upload service', async () => {
        const resolvedMap = new Map([['col-uuid-pk1', 'new_pk1']]);
        const bulkUploadService = {
          bulkUpsertRowsWithPrimaryKey: jest
            .fn()
            .mockResolvedValue({ status: 'ok', inserted: 1, updated: 0, rows: [] }),
        };
        const { service } = buildService({
          relationResolverService: {
            resolveColumnName: jest.fn(),
            resolveColumnNames: jest.fn().mockResolvedValue(resolvedMap),
          },
          tooljetDbBulkUploadService: bulkUploadService,
        });

        await service.bulkUpsertUsingPrimaryKey(
          {
            table_id: tableId,
            bulk_upsert_with_primary_key: {
              primary_key: ['old_pk1', 'pk2'],
              primary_key_ids: ['col-uuid-pk1'],
              rows: [{ old_pk1: 1, pk2: 2 }],
            },
          },
          context
        );

        expect(bulkUploadService.bulkUpsertRowsWithPrimaryKey).toHaveBeenCalledWith(
          [{ old_pk1: 1, pk2: 2 }],
          tableId,
          ['new_pk1', 'pk2'],
          organizationId,
          environmentId
        );
      });
    });
  });
});
