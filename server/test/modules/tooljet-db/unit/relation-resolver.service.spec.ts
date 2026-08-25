/**
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { resetDB, createUser, setDataSources, closeTestApp } from 'test-helper';
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

describe('TooljetDbRelationResolverService', () => {
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

    describe('substrate entities', () => {
      it('should load the relation row H1 backfilled for a seeded table', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });

        const relation = await appManager.findOne(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        expect(relation).toMatchObject({
          id: table.id, // H2 invariant: relation id === logical id
          internalTableId: table.id,
          environmentId: expect.any(String),
          branchId: expect.any(String),
          configurations: expect.objectContaining({ columns: expect.any(Object) }),
          baselineError: null,
        });
      });
    });
  });
});
