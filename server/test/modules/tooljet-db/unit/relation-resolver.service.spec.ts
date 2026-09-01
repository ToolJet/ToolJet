/**
 * @group database
 */
import { BadRequestException, ForbiddenException, INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';
import { TooljetDbMigrationRecorderService } from '@modules/tooljet-db/services/tooljet-db-migration-recorder.service';
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
    let postgrestProxyService: PostgrestProxyService;
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
          PostgrestProxyService,
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
      service = app.get(TooljetDbRelationResolverService);
      postgrestProxyService = app.get(PostgrestProxyService);
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
      adminEnvironmentId = environments.find((env: { priority: number }) => env.priority === 1).id;
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
      it('should load the relation row created for a seeded table', async () => {
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

      // The other coexisting shape: the relation backfill migration set id = internal_table_id, so
      // rows predating create_table's independent ids still have the two equal. Nothing may assume
      // the ids always differ any more than it may assume they are always equal.
      it('should resolve a relation whose id equals its logical table id', async () => {
        const table = await appManager.save(
          appManager.create(InternalTable, { organizationId, tableName: 'legacy_table', co_relation_id: uuidv4() })
        );
        await appManager.save(
          appManager.create(InternalTableRelation, {
            id: table.id, // migration-A shape: relation id === internal_table_id
            internalTableId: table.id,
            environmentId: adminEnvironmentId,
            branchId: adminBranchId,
          })
        );

        expect(await service.resolve(organizationId, [table.id])).toEqual(new Map([[table.id, table.id]]));
        expect((await service.getRelation(organizationId, table.id)).id).toBe(table.id);
        expect(await service.resolveLogicalIds(organizationId, [table.id])).toEqual(new Map([[table.id, table.id]]));
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

      it('should throw NotFoundException for a soft-deleted table', async () => {
        const table = await appManager.findOne(InternalTable, {
          where: { organizationId, tableName: 'orders' },
        });
        await appManager.update(InternalTable, { id: table.id }, { deletedAt: new Date() });

        await expect(service.getRelation(organizationId, table.id)).rejects.toThrow(NotFoundException);
      });
    });

    /**
     * PostgrestProxyService.resolveAndRewrite() disambiguates two reasons an id can be missing
     * from resolve()'s map: not owned by this workspace (tenancy - H2's fail-closed positional
     * rule), or owned but not promoted into the requested (environment, branch) - always 404,
     * regardless of position.
     */
    describe('PostgrestProxyService.resolveAndRewrite | tenancy vs promotion disambiguation', () => {
      async function createOwnTableWithRelation(tableName: string, environmentId: string) {
        const table = await appManager.save(
          appManager.create(InternalTable, { organizationId, tableName, co_relation_id: uuidv4() })
        );
        const relation = await appManager.save(
          appManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: table.id,
            environmentId,
            branchId: adminBranchId,
          })
        );
        return { table, relation };
      }

      async function resolveAndRewrite(url: string, environmentId: string) {
        return (postgrestProxyService as any).resolveAndRewrite(url, organizationId, environmentId);
      }

      it('should return 404 for an embedded reference to a table this workspace owns but has not promoted into the named environment', async () => {
        const stagingEnvId = (await appManager.findOne(AppEnvironment, { where: { organizationId, priority: 2 } })).id;
        // Owned by this workspace and promoted into staging - the path must resolve cleanly so
        // the failure under test is isolated to the embedded reference.
        const { table: pathTable } = await createOwnTableWithRelation('promoted_to_staging', stagingEnvId);
        // Owned by this workspace but only ever promoted to development - absent from staging.
        const { table: unpromotedTable } = await createOwnTableWithRelation('dev_only', adminEnvironmentId);

        await expect(
          resolveAndRewrite(`/${pathTable.id}?${unpromotedTable.id}.title=eq.x`, stagingEnvId)
        ).rejects.toThrow(/have no relation in this environment/);
      });

      it('should still return 400 for an embedded reference to another workspace uuid', async () => {
        const { table: pathTable } = await createOwnTableWithRelation('owns_this_one', adminEnvironmentId);
        const { table: foreignTable } = await createForeignTableWithRelation('foreign_embedded');

        await expect(
          resolveAndRewrite(`/${pathTable.id}?${foreignTable.id}.title=eq.x`, adminEnvironmentId)
        ).rejects.toThrow(BadRequestException);
      });

      it('should still return 404 for an unowned uuid in the path', async () => {
        const { table: foreignTable } = await createForeignTableWithRelation('foreign_path');

        await expect(resolveAndRewrite(`/${foreignTable.id}?select=name`, adminEnvironmentId)).rejects.toThrow(
          NotFoundException
        );
      });
    });

    describe('CE', () => {
      it('should refuse a request that names a non-development environment', async () => {
        getLicenseTerms.mockResolvedValue(false); // MULTI_ENVIRONMENT off
        const stagingEnvId = (await appManager.findOne(AppEnvironment, { where: { organizationId, priority: 2 } })).id;

        await expect(service.resolve(organizationId, [], stagingEnvId)).rejects.toThrow(ForbiddenException);
      });
    });

    /**
     * Task 7 (DEV-89): the licence x request matrix end to end. This is the entire safety
     * argument for environment isolation now that a Postgres schema boundary no longer exists -
     * every row pins one cell so a regression in resolveEnvironmentId or resolve()/getRelation's
     * predicates fails here first, not in a later module that merely calls this one.
     */
    describe('.resolve/.getRelation | environment-aware fail-closed matrix', () => {
      async function getEnvByPriority(priority: number) {
        return appManager.findOneOrFail(AppEnvironment, { where: { organizationId, priority } });
      }

      it('unlicensed + names production: 403 from resolveEnvironmentId, never a relation', async () => {
        getLicenseTerms.mockResolvedValue(false);
        const productionEnv = await getEnvByPriority(3);
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'users' } });

        await expect(service.resolve(organizationId, [table.id], productionEnv.id)).rejects.toThrow(ForbiddenException);
        await expect(service.getRelation(organizationId, table.id, productionEnv.id)).rejects.toThrow(
          ForbiddenException
        );
      });

      it('unlicensed + names nothing: resolves to the development relation', async () => {
        getLicenseTerms.mockResolvedValue(false);
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'users' } });
        const devRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        const resolved = await service.resolve(organizationId, [table.id]);
        expect(resolved.get(table.id)).toBe(devRelation.id);
      });

      it('unlicensed + names development explicitly: development relation, no throw', async () => {
        getLicenseTerms.mockResolvedValue(false);
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'users' } });
        const devRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        const resolved = await service.resolve(organizationId, [table.id], adminEnvironmentId);
        expect(resolved.get(table.id)).toBe(devRelation.id);
        expect(await service.getRelation(organizationId, table.id, adminEnvironmentId)).toMatchObject({
          id: devRelation.id,
        });
      });

      it('licensed + names production, relation exists: resolves to the production relation id', async () => {
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'users' } });
        const productionEnv = await getEnvByPriority(3);
        const prodRelation = await appManager.save(
          appManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: table.id,
            environmentId: productionEnv.id,
            branchId: adminBranchId,
          })
        );

        const resolved = await service.resolve(organizationId, [table.id], productionEnv.id);
        expect(resolved.get(table.id)).toBe(prodRelation.id);
        expect((await service.getRelation(organizationId, table.id, productionEnv.id)).id).toBe(prodRelation.id);
      });

      it('licensed + names production, no relation: omitted from the map, 404 from getRelation', async () => {
        // 'orders' has never been promoted to production - setupTestTables only mints development.
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'orders' } });
        const productionEnv = await getEnvByPriority(3);

        const resolved = await service.resolve(organizationId, [table.id], productionEnv.id);
        expect(resolved.has(table.id)).toBe(false);
        await expect(service.getRelation(organizationId, table.id, productionEnv.id)).rejects.toThrow(
          NotFoundException
        );
      });

      it("licensed + a foreign workspace's environment id: no match - the org predicate holds regardless of environment id", async () => {
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'users' } });
        const foreignUserData = await createUser(app, {
          email: 'foreign-env-matrix@tooljet.io',
          groups: ['all_users', 'admin'],
        });
        const foreignEnvironments = await ensureAppEnvironments(app, foreignUserData.organization.id);
        const foreignDevEnv = foreignEnvironments.find((env: { priority: number }) => env.priority === 1);

        // organizationId's own table only ever has relations under organizationId's own
        // environments - passing a foreign org's environment id must not match it via
        // environment_id alone; it.organization_id is what actually rules this out.
        const resolved = await service.resolve(organizationId, [table.id], foreignDevEnv.id);
        expect(resolved.has(table.id)).toBe(false);
      });

      /**
       * Task 6 (DEV-90): a workspace licensed at upgrade time has its data at the highest priority
       * and an empty relation at development. If the licence lapses, resolveEnvironmentId pins
       * development for every unnamed request - the shape of every released app's bare run route -
       * so the request resolves cleanly against the empty development relation: 200 with zero rows,
       * indistinguishable from data loss. The workspace cannot address its own data; that is a
       * licence answer (403), not a promotion answer (404) and never a silent empty success.
       */
      it('unlicensed + a sibling relation exists above development: 403, not an empty resolve', async () => {
        getLicenseTerms.mockResolvedValue(false);
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'orders' } });
        const productionEnv = await getEnvByPriority(3);
        await appManager.save(
          appManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: table.id,
            environmentId: productionEnv.id,
            branchId: adminBranchId,
          })
        );

        await expect(service.resolve(organizationId, [table.id])).rejects.toThrow(ForbiddenException);
      });

      // Regression guard: every ordinary CE workspace has exactly one (development) relation per
      // table. Unlicensed must still resolve normally when there is no sibling to be locked out of -
      // this is the case at 'unlicensed + names nothing' above, restated here to pin it against this
      // task's condition explicitly (single relation, no higher-priority sibling -> no 403).
      it('unlicensed + no sibling relation: resolves normally, no throw', async () => {
        getLicenseTerms.mockResolvedValue(false);
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'orders' } });
        const devRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: table.id },
        });

        const resolved = await service.resolve(organizationId, [table.id]);
        expect(resolved.get(table.id)).toBe(devRelation.id);
      });

      // The common path: licensed workspaces read development tables that also have a production
      // sibling all the time (that's what "promoted" means). This is the branch that actually
      // reaches getLicenseTerms - it must not throw, and it's the branch that makes a missing
      // LicenseTermsService dependency a 500 on every licensed EE read of a promoted table, not
      // just the unlicensed 403 case.
      it('licensed + resolved to development + a sibling relation exists above development: resolves normally, no throw', async () => {
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'orders' } });
        const devRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: table.id },
        });
        const productionEnv = await getEnvByPriority(3);
        await appManager.save(
          appManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId: table.id,
            environmentId: productionEnv.id,
            branchId: adminBranchId,
          })
        );

        const resolved = await service.resolve(organizationId, [table.id]);
        expect(resolved.get(table.id)).toBe(devRelation.id);
      });

      it('never falls back to the priority-1 relation on a refused request', async () => {
        getLicenseTerms.mockResolvedValue(false);
        const stagingEnv = await getEnvByPriority(2);
        const table = await appManager.findOneOrFail(InternalTable, { where: { organizationId, tableName: 'users' } });

        // The point of this case: a refusal must never quietly resolve to development's relation
        // instead - resolve() either throws or it does not return at all, it never substitutes.
        let resolved: Map<string, string> | undefined;
        try {
          resolved = await service.resolve(organizationId, [table.id], stagingEnv.id);
        } catch (err) {
          expect(err).toBeInstanceOf(ForbiddenException);
        }
        expect(resolved).toBeUndefined();
      });
    });
  });
});
