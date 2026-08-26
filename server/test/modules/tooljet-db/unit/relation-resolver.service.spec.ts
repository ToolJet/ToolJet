/**
 * @group database
 */
import { ForbiddenException, INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
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
import { AppEnvironment } from '@entities/app_environments.entity';
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

describe('TooljetDbRelationResolverService', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let appManager: EntityManager;
    let tjDbManager: EntityManager;
    let tableOperationsService: TooljetDbTableOperationsService;
    let service: TooljetDbRelationResolverService;
    let organizationId: string;
    let adminEnvironmentId: string;
    let adminBranchId: string;
    let getLicenseTerms: jest.Mock;

    beforeAll(async () => {
      const mockLicenseService = { getLicenseTerms: jest.fn() };
      const mockLicenseTermsService = { getLicenseTerms: jest.fn() };
      const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };
      getLicenseTerms = mockLicenseTermsService.getLicenseTerms;

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
      service = app.get(TooljetDbRelationResolverService);
    });

    beforeEach(async () => {
      await resetDB();
      getLicenseTerms.mockResolvedValue(true); // MULTI_ENVIRONMENT on by default

      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['all_users', 'admin'],
      });
      organizationId = adminUserData.organization.id;
      const environments = await ensureAppEnvironments(app, organizationId);
      adminEnvironmentId = environments.find((env) => env.priority === 1).id;
      adminBranchId = (await resolveOrSeedDefaultBranch(organizationId)).id;

      const schemaName = `workspace_${organizationId}`;
      await tjDbManager.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
    });

    /**
     * Builds a relation for another workspace's table, using THIS workspace's own environment
     * and branch ids. That is deliberately the wrong org's relation pointing at the right
     * environment/branch - it isolates the Workspace predicate as the only thing standing between
     * a cross-workspace id and a match, since resolve()'s environment/branch predicates would
     * otherwise also filter a normally-shaped foreign relation out for an unrelated reason.
     */
    async function createForeignTableWithRelation(tableName: string) {
      const otherUser = await createUser(app, {
        email: `${tableName}@tooljet.io`,
        groups: ['all_users', 'admin'],
      });
      const table = await appManager.save(
        appManager.create(InternalTable, {
          organizationId: otherUser.organization.id,
          tableName,
          co_relation_id: uuidv4(),
        })
      );
      const relation = await appManager.save(
        appManager.create(InternalTableRelation, {
          id: uuidv4(),
          internalTableId: table.id,
          environmentId: adminEnvironmentId,
          branchId: adminBranchId,
        })
      );
      return { table, relation };
    }

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
      it('should load the relation row backfilled for a seeded table', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });

        const relation = await appManager.findOne(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        // The relation id is independent of the logical table id. Only rows written by the backfill
        // migration coincide; this table was built by createTable, so its ids diverge.
        expect(relation.id).not.toBe(table.id);
        expect(relation).toMatchObject({
          internalTableId: table.id,
          environmentId: expect.any(String),
          branchId: expect.any(String),
          configurations: expect.objectContaining({ columns: expect.any(Object) }),
          baselineError: null,
        });
      });
    });

    describe('.resolve | environment-blind resolution', () => {
      it('should map a logical table id to its development relation id', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });

        const relation = await appManager.findOne(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        const resolved = await service.resolve(organizationId, [table.id]);

        expect(resolved.get(table.id)).toBe(relation.id);
      });

      it('should omit a table belonging to another workspace', async () => {
        const { table: foreignTable } = await createForeignTableWithRelation('foreign_table');

        const resolved = await service.resolve(organizationId, [foreignTable.id]);

        expect(resolved.has(foreignTable.id)).toBe(false);
      });

      it('should omit a soft-deleted table', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'orders' },
        });
        await appManager.update(InternalTable, { id: table.id }, { deletedAt: new Date() });

        const resolved = await service.resolve(organizationId, [table.id]);

        expect(resolved.has(table.id)).toBe(false);
      });

      it('should resolve every id in one call without dropping any', async () => {
        const tables = await appManager.find(InternalTable, { where: { organizationId } });

        const resolved = await service.resolve(
          organizationId,
          tables.map((t) => t.id)
        );

        expect(resolved.size).toBe(tables.length);
      });
    });

    describe('.resolveLogicalIds | reverse resolution', () => {
      it('should map a relation id back to its logical table id', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'users' },
        });
        const relation = await appManager.findOne(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        const resolved = await service.resolveLogicalIds(organizationId, [relation.id]);

        // Holds under either resolution direction while relation id === logical table id; revisit
        // this assertion once the two diverge, same caveat as the .resolve base case above.
        expect(resolved.get(relation.id)).toBe(table.id);
      });

      it('should omit a relation belonging to another workspace', async () => {
        const { relation: foreignRelation } = await createForeignTableWithRelation('foreign_table_reverse');

        const resolved = await service.resolveLogicalIds(organizationId, [foreignRelation.id]);

        expect(resolved.has(foreignRelation.id)).toBe(false);
      });

      it('should omit the relation of a soft-deleted table', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'orders' },
        });
        const relation = await appManager.findOne(InternalTableRelation, {
          where: { internalTableId: table.id },
        });
        await appManager.update(InternalTable, { id: table.id }, { deletedAt: new Date() });

        const resolved = await service.resolveLogicalIds(organizationId, [relation.id]);

        expect(resolved.has(relation.id)).toBe(false);
      });
    });

    describe('.getRelation | single lookup', () => {
      it('should throw NotFoundException for a table with no relation in the environment', async () => {
        const orphan = await appManager.save(
          appManager.create(InternalTable, {
            organizationId,
            tableName: 'orphan',
            co_relation_id: uuidv4(),
          })
        );

        await expect(service.getRelation(organizationId, orphan.id)).rejects.toThrow(NotFoundException);
      });
    });

    describe('CE', () => {
      it('should refuse a request that names a non-development environment', async () => {
        getLicenseTerms.mockResolvedValue(false); // MULTI_ENVIRONMENT off
        const stagingEnvId = (await appManager.findOne(AppEnvironment, { where: { organizationId, priority: 2 } })).id;

        await expect(service.resolve(organizationId, [], stagingEnvId)).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
