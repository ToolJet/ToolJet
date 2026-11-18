import { BadRequestException, INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { User } from '@entities/user.entity';
import { UserDataSourceActivity } from '@entities/user_data_source_activity.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { AbilityService } from '@modules/ability/service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { MODULES } from '@modules/app/constants/modules';
import { DataSourceActivityService } from '@modules/data-sources/dashboard/activity.service';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import {
  TestUser,
  closeTestApp,
  createAdmin,
  createEndUser,
  ensureAppEnvironments,
  findEntity,
  getAllEnvironments,
  getDefaultDataSource,
  getEntityRepository,
  initTestApp,
  resolveOrSeedDefaultBranch,
  updateEntity,
  withRealTransactions,
} from 'test-helper';

type Option = { key: string; value: string; encrypted: boolean };

const urlOption = (value: string): Option => ({ key: 'url', value, encrypted: false });

// CE resolves no granular data-source grants, so a per-data-source use grant is layered onto the
// real permission resolve for one user (mirrors data-sources-dashboard-bulk.e2e-spec.ts).
function grantDataSources(user: User, grant: { use?: string[] }) {
  const original = AbilityService.prototype.resourceActionsPermission;
  return jest.spyOn(AbilityService.prototype, 'resourceActionsPermission').mockImplementation(async function (
    this: AbilityService,
    ...args: Parameters<AbilityService['resourceActionsPermission']>
  ) {
    const permissions = await original.apply(this, args);
    const dataSourcePermissions = permissions[MODULES.GLOBAL_DATA_SOURCE];
    if (args[0].id !== user.id || !dataSourcePermissions) return permissions;
    return {
      ...permissions,
      [MODULES.GLOBAL_DATA_SOURCE]: { ...dataSourcePermissions, usableDataSourcesId: grant.use ?? [] },
    };
  });
}

const multiBranchGit = (defaultBranch: WorkspaceBranch) =>
  jest.spyOn(GitSyncConfigsUtilService.prototype, 'getDetails').mockResolvedValue({
    isEnabled: true,
    isMultiBranchingEnabled: true,
    options: {
      type: null,
      defaultBranch: { id: defaultBranch.id, name: defaultBranch.name },
      isBranchingEnabled: true,
    },
    orgGit: null,
  } as never);

/** @group platform */
describe('DataSourcesDashboardController save all environments', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  const withMultiEnvironment = () => {
    const licenseTerms = nestApp.get(LicenseTermsService);
    const original = licenseTerms.getLicenseTerms.bind(licenseTerms);
    return jest
      .spyOn(licenseTerms, 'getLicenseTerms')
      .mockImplementation((field, organizationId) =>
        field === LICENSE_FIELD.MULTI_ENVIRONMENT ? Promise.resolve(true) : original(field, organizationId)
      );
  };

  // Workspace with its environments and default branch, plus a REST API data source created
  // through the real endpoint so every environment has its options row.
  const createDataSource = async (admin: TestUser, name: string): Promise<string> => {
    const created = await request(nestApp.getHttpServer())
      .post('/api/data-sources')
      .set('tj-workspace-id', admin.workspace.id)
      .set('Cookie', admin.cookie)
      .send({ name, kind: 'restapi', options: [urlOption('https://initial.example.com')] })
      .expect(201);
    return created.body.id;
  };

  const setup = async (email: string) => {
    const admin = await createAdmin(nestApp, email);
    const org = admin.workspace.id;
    await ensureAppEnvironments(nestApp, org);
    const branch = await resolveOrSeedDefaultBranch(org);
    const dataSourceId = await createDataSource(admin, 'Orders API');
    const environments = await getAllEnvironments(nestApp, org);
    const env = (name: string) => environments.find((environment) => environment.name === name);
    return { admin, org, branch, dataSourceId, env };
  };

  const saveAll = (user: TestUser, dataSourceId: string, body: Record<string, unknown>, branchId?: string) =>
    request(nestApp.getHttpServer())
      .put(`/api/v2/data-sources/${dataSourceId}${branchId ? `?branch_id=${branchId}` : ''}`)
      .set('tj-workspace-id', user.workspace.id)
      .set('Cookie', user.cookie)
      .send(body);

  const urlIn = async (dataSourceId: string, org: string, environment: AppEnvironment) =>
    (await nestApp.get(AppEnvironmentUtilService).getOptions(dataSourceId, org, environment.id)).options?.url?.value;

  describe('PUT /api/v2/data-sources/:id | Save all environments', () => {
    it('should save every listed environment in one call with one audit entry each', async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all@tooljet.io');
      withMultiEnvironment();
      const spy = jest.spyOn(nestApp.get(EventEmitter2), 'emit');

      await saveAll(admin, dataSourceId, {
        environments: [
          { environment_id: env('development').id, options: [urlOption('https://dev.example.com')] },
          { environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] },
        ],
      }).expect(204);

      expect(await urlIn(dataSourceId, org, env('development'))).toBe('https://dev.example.com');
      expect(await urlIn(dataSourceId, org, env('staging'))).toBe('https://staging.example.com');
      expect(await urlIn(dataSourceId, org, env('production'))).toBe('https://initial.example.com');
      const audits = spy.mock.calls.filter(([event]) => event === 'auditLogEntry').map(([, payload]) => payload);
      expect(audits).toHaveLength(2);
      expect(audits).toEqual(
        ['development', 'staging'].map((name) =>
          expect.objectContaining({
            actionType: 'DATA_SOURCE_UPDATE',
            resourceType: MODULES.GLOBAL_DATA_SOURCE,
            resourceId: dataSourceId,
            userId: admin.user.id,
            resourceData: expect.objectContaining({
              dataSourceKind: 'restapi',
              environmentId: env(name).id,
              updatedFields: ['options'],
            }),
            metadata: expect.objectContaining({
              transactionId: expect.any(String),
              route: `[PUT] /api/v2/data-sources/${dataSourceId}`,
              totalDuration: expect.any(Number),
            }),
          })
        )
      );
    });

    it('should refuse a name another data source uses, once and before writing any environment', async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all-name-taken@tooljet.io');
      await createDataSource(admin, 'Billing API');
      withMultiEnvironment();

      const res = await saveAll(admin, dataSourceId, {
        name: 'Billing API',
        environments: [
          { environment_id: env('development').id, options: [urlOption('https://dev.example.com')] },
          { environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] },
        ],
      }).expect(400);

      expect(res.body.message).toBe('A data source with name "Billing API" already exists in this workspace');
      expect(await findEntity(DataSource, { id: dataSourceId })).toMatchObject({ name: 'Orders API' });
      expect(await urlIn(dataSourceId, org, env('development'))).toBe('https://initial.example.com');
    });

    it('should write nothing and name the environment when one entry is refused', async () => {
      const { admin, org, branch, dataSourceId, env } = await setup('ds-save-all-constants@tooljet.io');
      withMultiEnvironment();
      multiBranchGit(branch);

      const res = await saveAll(
        admin,
        dataSourceId,
        {
          environments: [
            { environment_id: env('development').id, options: [urlOption('https://dev.example.com')] },
            {
              environment_id: env('staging').id,
              options: [{ key: 'password', value: '{{secrets.db_password}}', encrypted: true }],
            },
          ],
        },
        branch.id
      ).expect(400);

      expect(res.body.message).toMatch(/^staging: Constants cannot be added directly/);
      expect(await urlIn(dataSourceId, org, env('development'))).toBe('https://initial.example.com');
    });

    it('should apply the name and the options together', async () => {
      const { admin, org, branch, dataSourceId, env } = await setup('ds-save-all-name@tooljet.io');
      withMultiEnvironment();

      await saveAll(admin, dataSourceId, {
        name: 'Orders API v2',
        environments: [{ environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] }],
      }).expect(204);

      expect(await findEntity(DataSource, { id: dataSourceId })).toMatchObject({ name: 'Orders API v2' });
      expect(await findEntity(DataSourceVersion, { dataSourceId, branchId: branch.id })).toMatchObject({
        name: 'Orders API v2',
      });
      expect(await urlIn(dataSourceId, org, env('staging'))).toBe('https://staging.example.com');
    });

    it('should record last_edited_at once for the call', async () => {
      const { admin, branch, dataSourceId, env } = await setup('ds-save-all-activity@tooljet.io');
      withMultiEnvironment();
      const recordEdit = jest.spyOn(DataSourceActivityService.prototype, 'recordEdit');

      await saveAll(admin, dataSourceId, {
        environments: [
          { environment_id: env('development').id, options: [urlOption('https://dev.example.com')] },
          { environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] },
        ],
      }).expect(204);

      expect(recordEdit).toHaveBeenCalledTimes(1);
      expect(
        await getEntityRepository(UserDataSourceActivity).find({ where: { userId: admin.user.id, dataSourceId } })
      ).toEqual([expect.objectContaining({ branchId: branch.id, lastEditedAt: expect.any(Date) })]);
    });
  });

  describe('PUT /api/v2/data-sources/:id | Without the multi-environment licence', () => {
    it('should refuse two entries', async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all-basic-two@tooljet.io');

      await saveAll(admin, dataSourceId, {
        environments: [
          { environment_id: env('development').id, options: [urlOption('https://dev.example.com')] },
          { environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] },
        ],
      }).expect(400);

      expect(await urlIn(dataSourceId, org, env('development'))).toBe('https://initial.example.com');
    });

    it('should write one entry to every environment, as the v1 update does', async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all-basic-one@tooljet.io');

      await saveAll(admin, dataSourceId, {
        environments: [{ environment_id: env('staging').id, options: [urlOption('https://everywhere.example.com')] }],
      }).expect(204);

      for (const name of ['development', 'staging', 'production']) {
        expect(await urlIn(dataSourceId, org, env(name))).toBe('https://everywhere.example.com');
      }
    });
  });

  describe('PUT /api/v2/data-sources/:id | Refusals', () => {
    it('should refuse a user who can only use the data source', async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all-use@tooljet.io');
      const endUser = await createEndUser(nestApp, 'ds-save-all-use-user@tooljet.io', { workspace: admin.workspace });
      grantDataSources(endUser.user, { use: [dataSourceId] });

      await saveAll(endUser, dataSourceId, {
        environments: [{ environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] }],
      }).expect(403);

      expect(await urlIn(dataSourceId, org, env('staging'))).toBe('https://initial.example.com');
    });

    it('should refuse duplicate environments, another workspace environment, empty options and a sample data source', async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all-refusals@tooljet.io');
      const other = await setup('ds-save-all-refusals-other@tooljet.io');
      withMultiEnvironment();
      const entry = (environment: AppEnvironment) => ({
        environment_id: environment.id,
        options: [urlOption('https://x.example.com')],
      });

      await saveAll(admin, dataSourceId, { environments: [entry(env('staging')), entry(env('staging'))] }).expect(400);
      await saveAll(admin, dataSourceId, { environments: [entry(other.env('staging'))] }).expect(404);
      await saveAll(admin, dataSourceId, { environments: [] }).expect(400);
      await saveAll(admin, dataSourceId, { environments: [{ environment_id: env('staging').id, options: [] }] }).expect(
        400
      );
      expect(await urlIn(dataSourceId, org, env('staging'))).toBe('https://initial.example.com');
      await updateEntity(DataSource, dataSourceId, { type: 'sample' } as never);
      await saveAll(admin, dataSourceId, { environments: [entry(env('staging'))] }).expect(400);
    });
  });

  describe('PUT /api/v2/data-sources/:id | Git-synced default branch', () => {
    it('should allow a secrets-only change and refuse any other change', async () => {
      const { admin, org, branch, dataSourceId, env } = await setup('ds-save-all-git@tooljet.io');
      await getEntityRepository(DataSourceVersion).update({ dataSourceId, branchId: branch.id }, { isSynced: true });
      withMultiEnvironment();
      multiBranchGit(branch);

      await saveAll(
        admin,
        dataSourceId,
        {
          environments: [
            {
              environment_id: env('staging').id,
              options: [{ key: 'client_secret', value: 'new-secret', encrypted: true }],
            },
          ],
        },
        branch.id
      ).expect(204);

      const res = await saveAll(
        admin,
        dataSourceId,
        {
          environments: [
            {
              environment_id: env('staging').id,
              options: [{ key: 'client_secret', value: 'newer-secret', encrypted: true }],
            },
            { environment_id: env('production').id, options: [urlOption('https://changed.example.com')] },
          ],
        },
        branch.id
      ).expect(403);

      expect(res.body.message).toMatch(/^production: This data source is synced with git/);
      expect(await urlIn(dataSourceId, org, env('production'))).toBe('https://initial.example.com');
    });
  });

  describe('PUT /api/v2/data-sources/:id | Workspace scope', () => {
    it("should 404 for another workspace's branch id or data source id and write nothing", async () => {
      const { admin, org, dataSourceId, env } = await setup('ds-save-all-scope@tooljet.io');
      const other = await setup('ds-save-all-scope-other@tooljet.io');
      const body = (environment: AppEnvironment) => ({
        environments: [{ environment_id: environment.id, options: [urlOption('https://x.example.com')] }],
      });

      await saveAll(admin, dataSourceId, body(env('staging')), other.branch.id).expect(404);
      await saveAll(admin, other.dataSourceId, body(env('staging'))).expect(404);

      expect(await urlIn(dataSourceId, org, env('staging'))).toBe('https://initial.example.com');
      expect(await urlIn(other.dataSourceId, other.org, other.env('staging'))).toBe('https://initial.example.com');
    });

    it('should put null for an encrypted option value in the audit entry', async () => {
      const { admin, dataSourceId, env } = await setup('ds-save-all-audit-secret@tooljet.io');
      const spy = jest.spyOn(nestApp.get(EventEmitter2), 'emit');

      await saveAll(admin, dataSourceId, {
        environments: [
          {
            environment_id: env('staging').id,
            options: [urlOption('https://x.example.com'), { key: 'password', value: 'hunter2', encrypted: true }],
          },
        ],
      }).expect(204);

      const audits = spy.mock.calls.filter(([event]) => event === 'auditLogEntry').map(([, payload]) => payload);
      expect(audits).toEqual([
        expect.objectContaining({
          metadata: {
            options: [urlOption('https://x.example.com'), { key: 'password', value: null, encrypted: true }],
            transactionId: expect.any(String),
            route: `[PUT] /api/v2/data-sources/${dataSourceId}`,
            totalDuration: expect.any(Number),
          },
        }),
      ]);
    });
  });

  // Real transactions end the suite transaction, so this describe stays last in the file.
  describe('PUT /api/v2/data-sources/:id | Rollback', () => {
    it('should roll back every environment when a later one fails to write', async () => {
      await withRealTransactions(async () => {
        const email = `ds-save-all-rollback-${randomUUID()}@tooljet.io`;
        try {
          const { admin, org, dataSourceId, env } = await setup(email);
          withMultiEnvironment();
          const original = DataSourcesUtilService.prototype.updateWithManager;
          jest
            .spyOn(DataSourcesUtilService.prototype, 'updateWithManager')
            .mockImplementationOnce(function (this: DataSourcesUtilService, ...args) {
              return original.apply(this, args);
            })
            .mockRejectedValueOnce(new BadRequestException('Write failed'));

          const res = await saveAll(admin, dataSourceId, {
            environments: [
              { environment_id: env('development').id, options: [urlOption('https://dev.example.com')] },
              { environment_id: env('staging').id, options: [urlOption('https://staging.example.com')] },
            ],
          }).expect(400);

          expect(res.body.message).toBe('staging: Write failed');
          expect(await urlIn(dataSourceId, org, env('development'))).toBe('https://initial.example.com');
        } finally {
          const workspaces = `SELECT ou.organization_id FROM organization_users ou
            JOIN users u ON u.id = ou.user_id WHERE u.email = $1`;
          await getDefaultDataSource().query(`DELETE FROM data_sources WHERE organization_id IN (${workspaces})`, [
            email,
          ]);
          await getDefaultDataSource().query(`DELETE FROM organizations WHERE id IN (${workspaces})`, [email]);
        }
      });
    });
  });
});
