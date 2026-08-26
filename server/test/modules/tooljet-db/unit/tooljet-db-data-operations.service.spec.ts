/**
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
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
import { v4 as uuidv4 } from 'uuid';

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
      // tooljetDbManager, configService, tooljetDbBulkUploadService) are unused by the method under
      // test, so plain stand-ins are enough; there's no batching door here that would need them.
      dataOperationsService = new TooljetDbDataOperationsService(
        appManager,
        tableOperationsService,
        {} as any,
        tjDbManager,
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
        // The relation ids are moved off the logical ids here rather than relying on create_table
        // to have minted independent ones, so the assertion stays non-vacuous no matter how these
        // fixtures were built: if the two ids were equal it would pass whether or not the resolver
        // was consulted at all.
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

        const internalTableInfo: Array<{ id: string; tableName: string }> = [];
        const map = await (
          dataOperationsService as unknown as {
            resolveTableNameToRelationIdMap: (
              tablesUsedInQuery: string[],
              organizationId: string,
              internalTableInfo: Array<{ id: string; tableName: string }>
            ) => Promise<Record<string, string>>;
          }
        ).resolveTableNameToRelationIdMap(['users', 'orders'], organizationId, internalTableInfo);

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
  });
});
