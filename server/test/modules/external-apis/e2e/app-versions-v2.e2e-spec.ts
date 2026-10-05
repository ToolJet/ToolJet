/**
 * @group platform
 */

/**
 * Deliberate spec deviations, don't change these tests to match the spec:
 *   1. Release requires the version to already be in production (when multi-environment is
 *      licensed) instead of promoting it implicitly.
 *   2. Error body is Nest's default ({ statusCode, message }); spec error codes aren't surfaced.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { AppHistoryUtilService } from '@ee/app-history/util.service';
import { SourceControlProviderService } from '@ee/app-git/source-control-provider';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string, appId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/apps/${appId}/versions`;
}

describe('ExternalApisAppVersionsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;
  let versionRepo: Repository<AppVersion>;
  let envRepo: Repository<AppEnvironment>;
  let appRepo: Repository<App>;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
    const ds = getDefaultDataSource();
    versionRepo = ds.getRepository(AppVersion);
    envRepo = ds.getRepository(AppEnvironment);
    appRepo = ds.getRepository(App);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedWorkspace(tag: string) {
    const { user } = await createUser(app, { email: `avv2-${tag}-${Date.now()}@tooljet.io` });
    const seeded = await createApplication(app, { name: `Versions ${tag} ${Date.now()}`, user });
    const [development, staging, production] = await envRepo.find({
      where: { organizationId: user.organizationId },
      order: { priority: 'ASC' },
    });
    return { user, orgId: user.organizationId, seeded, environments: { development, staging, production } };
  }

  async function seedVersion(
    seeded: App & { organizationId: string },
    { status, environmentId }: { status: AppVersionStatus; environmentId?: string }
  ): Promise<AppVersion> {
    const version = await createApplicationVersion(app, seeded, {
      name: 'v',
      ...(environmentId && { currentEnvironmentId: environmentId }),
    });
    await versionRepo.update(version.id, { status });
    return versionRepo.findOneOrFail({ where: { id: version.id } });
  }

  it('should reject a request with no token', async () => {
    const { orgId, seeded } = await seedWorkspace('auth');
    await request(app.getHttpServer()).get(base(orgId, seeded.id)).expect(403);
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/versions', () => {
    it('should create a draft in the lowest environment from an existing version', async () => {
      const { orgId, seeded, environments } = await seedWorkspace('create');
      const source = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      const historySpy = jest.spyOn(app.get(AppHistoryUtilService), 'queuePrebuiltDelta').mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post(base(orgId, seeded.id))
        .set('Authorization', getExtAuth())
        .send({ name: 'v2.0.0', description: 'Q3 changes', version_from_id: source.id })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'v2.0.0',
        description: 'Q3 changes',
        status: 'draft',
        environment_id: environments.development.id,
        parent_version_id: source.id,
        created_by: expect.any(String),
        published_at: null,
        released_at: null,
      });
      expect(historySpy).toHaveBeenCalledWith(
        res.body.id,
        'initial_snapshot',
        expect.anything(),
        false,
        res.body.created_by
      );
    });

    it('should reject an invalid name, a source from another app, and a duplicate name', async () => {
      const { user, orgId, seeded } = await seedWorkspace('create-invalid');
      const source = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      const other = await createApplication(app, { name: `Other ${Date.now()}`, user });
      const foreign = await seedVersion(other as App & { organizationId: string }, {
        status: AppVersionStatus.PUBLISHED,
      });

      await request(app.getHttpServer())
        .post(base(orgId, seeded.id))
        .set('Authorization', getExtAuth())
        .send({ name: 'has space', version_from_id: source.id })
        .expect(400);

      await request(app.getHttpServer())
        .post(base(orgId, seeded.id))
        .set('Authorization', getExtAuth())
        .send({ name: 'v-foreign', version_from_id: foreign.id })
        .expect(422);

      await request(app.getHttpServer())
        .post(base(orgId, seeded.id))
        .set('Authorization', getExtAuth())
        .send({ name: source.name, version_from_id: source.id })
        .expect(409);
    });
  });

  describe('POST .../versions/:versionId/save', () => {
    it('should save a draft once, without tagging when git sync is off', async () => {
      const { orgId, seeded } = await seedWorkspace('save');
      const draft = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });
      const gitSpy = jest.spyOn(app.get(SourceControlProviderService), 'getSourceControlService');

      const res = await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${draft.id}/save`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({ id: draft.id, status: 'published', published_at: expect.any(String) });
      expect(gitSpy).not.toHaveBeenCalled();

      await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${draft.id}/save`)
        .set('Authorization', getExtAuth())
        .expect(409);
    });
  });

  describe('POST .../versions/:versionId/promote', () => {
    it('should promote one environment by default, or straight to a chosen higher one', async () => {
      const { orgId, seeded, environments } = await seedWorkspace('promote');
      const draft = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });
      const saved = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      const jumper = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });

      await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${draft.id}/promote`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(422);

      const stepped = await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${saved.id}/promote`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(200);
      expect(stepped.body).toMatchObject({
        id: saved.id,
        status: 'published',
        environment_id: environments.staging.id,
      });

      const jumped = await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${jumper.id}/promote`)
        .set('Authorization', getExtAuth())
        .send({ target_environment_id: environments.production.id })
        .expect(200);
      expect(jumped.body).toMatchObject({ environment_id: environments.production.id });

      await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${jumper.id}/promote`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(422);
    });

    it('should reject a target that is not above the current environment', async () => {
      const { orgId, seeded, environments } = await seedWorkspace('promote-target');
      const version = await seedVersion(seeded, {
        status: AppVersionStatus.PUBLISHED,
        environmentId: environments.staging.id,
      });

      for (const target of [environments.development.id, environments.staging.id, randomUUID()]) {
        await request(app.getHttpServer())
          .post(`${base(orgId, seeded.id)}/${version.id}/promote`)
          .set('Authorization', getExtAuth())
          .send({ target_environment_id: target })
          .expect(422);
      }

      const unchanged = await versionRepo.findOneOrFail({ where: { id: version.id } });
      expect(unchanged.currentEnvironmentId).toBe(environments.staging.id);
    });

    it('should refuse to promote when multi-environment is not licensed', async () => {
      const { orgId, seeded } = await seedWorkspace('promote-license');
      const version = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      const licenseTermsService = app.get(LicenseTermsService, { strict: false });
      const getLicenseTerms = licenseTermsService.getLicenseTerms.bind(licenseTermsService);
      jest
        .spyOn(licenseTermsService, 'getLicenseTerms')
        .mockImplementation((type, organizationId) =>
          type === LICENSE_FIELD.MULTI_ENVIRONMENT ? Promise.resolve(false) : getLicenseTerms(type, organizationId)
        );

      await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${version.id}/promote`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(403);
    });
  });

  describe('POST .../versions/:versionId/release', () => {
    it('should only release a saved version that has reached production', async () => {
      const { orgId, seeded, environments } = await seedWorkspace('release');
      const draft = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });
      const inDevelopment = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      const inProduction = await seedVersion(seeded, {
        status: AppVersionStatus.PUBLISHED,
        environmentId: environments.production.id,
      });

      for (const version of [draft, inDevelopment]) {
        await request(app.getHttpServer())
          .post(`${base(orgId, seeded.id)}/${version.id}/release`)
          .set('Authorization', getExtAuth())
          .expect(422);
      }

      const res = await request(app.getHttpServer())
        .post(`${base(orgId, seeded.id)}/${inProduction.id}/release`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({ id: inProduction.id, status: 'released', released_at: expect.any(String) });
      const releasedApp = await appRepo.findOneOrFail({ where: { id: seeded.id } });
      expect(releasedApp.currentVersionId).toBe(inProduction.id);
    });

    it('should move the previous release back to published', async () => {
      const { orgId, seeded, environments } = await seedWorkspace('rerelease');
      const first = await seedVersion(seeded, {
        status: AppVersionStatus.PUBLISHED,
        environmentId: environments.production.id,
      });
      const second = await seedVersion(seeded, {
        status: AppVersionStatus.PUBLISHED,
        environmentId: environments.production.id,
      });

      for (const version of [first, second]) {
        await request(app.getHttpServer())
          .post(`${base(orgId, seeded.id)}/${version.id}/release`)
          .set('Authorization', getExtAuth())
          .expect(200);
      }

      const res = await request(app.getHttpServer())
        .get(base(orgId, seeded.id))
        .set('Authorization', getExtAuth())
        .expect(200);
      const statusById = Object.fromEntries(res.body.data.map((v) => [v.id, v.status]));
      expect(statusById).toEqual({ [first.id]: 'published', [second.id]: 'released' });
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/versions', () => {
    it('should filter by status and environment, and paginate', async () => {
      const { orgId, seeded, environments } = await seedWorkspace('list');
      const draft = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });
      await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED, environmentId: environments.staging.id });
      const inProduction = await seedVersion(seeded, {
        status: AppVersionStatus.PUBLISHED,
        environmentId: environments.production.id,
      });

      const drafts = await request(app.getHttpServer())
        .get(`${base(orgId, seeded.id)}?status=draft`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(drafts.body.data.map((v) => v.id)).toEqual([draft.id]);

      const production = await request(app.getHttpServer())
        .get(`${base(orgId, seeded.id)}?environment_id=${environments.production.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(production.body.data.map((v) => v.id)).toEqual([inProduction.id]);

      const firstPage = await request(app.getHttpServer())
        .get(`${base(orgId, seeded.id)}?per_page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.pagination).toEqual({ page: 1, per_page: 2, total_count: 3 });

      await request(app.getHttpServer())
        .get(`${base(orgId, seeded.id)}?status=archived`)
        .set('Authorization', getExtAuth())
        .expect(400);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/versions/:versionId', () => {
    it('should return a version, and 404 for a version of another app or a malformed id', async () => {
      const { user, orgId, seeded, environments } = await seedWorkspace('get');
      const version = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });
      const other = await createApplication(app, { name: `Other ${Date.now()}`, user });

      const res = await request(app.getHttpServer())
        .get(`${base(orgId, seeded.id)}/${version.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body).toEqual({
        id: version.id,
        name: version.name,
        description: null,
        status: 'draft',
        environment_id: environments.development.id,
        parent_version_id: null,
        created_by: null,
        published_at: null,
        released_at: null,
      });

      for (const path of [`${base(orgId, other.id)}/${version.id}`, `${base(orgId, seeded.id)}/not-a-uuid`]) {
        await request(app.getHttpServer()).get(path).set('Authorization', getExtAuth()).expect(404);
      }
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/versions/:versionId', () => {
    it('should rename a draft but refuse to edit a saved version or an empty update', async () => {
      const { orgId, seeded } = await seedWorkspace('patch');
      const draft = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });
      const saved = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });

      const res = await request(app.getHttpServer())
        .patch(`${base(orgId, seeded.id)}/${draft.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'v1.3.0-rc', description: 'Release candidate' })
        .expect(200);
      expect(res.body).toMatchObject({ name: 'v1.3.0-rc', description: 'Release candidate', status: 'draft' });

      await request(app.getHttpServer())
        .patch(`${base(orgId, seeded.id)}/${draft.id}`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .patch(`${base(orgId, seeded.id)}/${saved.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'renamed' })
        .expect(400);

      const unchanged = await versionRepo.findOneOrFail({ where: { id: saved.id } });
      expect(unchanged.name).toBe(saved.name);
    });
  });

  describe('DELETE /api/v2/ext/workspaces/:workspaceIdentifier/apps/:appIdentifier/versions/:versionId', () => {
    it('should delete a version but keep the released one', async () => {
      const { orgId, seeded } = await seedWorkspace('delete');
      const released = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      const removable = await seedVersion(seeded, { status: AppVersionStatus.PUBLISHED });
      await appRepo.update(seeded.id, { currentVersionId: released.id });

      await request(app.getHttpServer())
        .delete(`${base(orgId, seeded.id)}/${released.id}`)
        .set('Authorization', getExtAuth())
        .expect(409);

      await request(app.getHttpServer())
        .delete(`${base(orgId, seeded.id)}/${removable.id}`)
        .set('Authorization', getExtAuth())
        .expect(204);

      expect(await versionRepo.findOne({ where: { id: removable.id } })).toBeNull();
    });

    it('should keep the last remaining version', async () => {
      const { orgId, seeded } = await seedWorkspace('delete-last');
      const only = await seedVersion(seeded, { status: AppVersionStatus.DRAFT });

      await request(app.getHttpServer())
        .delete(`${base(orgId, seeded.id)}/${only.id}`)
        .set('Authorization', getExtAuth())
        .expect(409);
    });
  });
});

describe('ExternalApisAppVersionsControllerV2 (EE plan: starter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should reject version routes on the starter plan', async () => {
    const { user } = await createUser(app, { email: `avv2-starter-${Date.now()}@tooljet.io` });
    const seeded = await createApplication(app, { name: 'Starter App', user });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId, seeded.id))
      .set('Authorization', getExtAuth())
      .expect(451);
  });
});

describe('ExternalApisAppVersionsControllerV2 (CE)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('should not register the version routes on CE', async () => {
    const { user } = await createUser(app, { email: `avv2-ce-${Date.now()}@tooljet.io` });
    const seeded = await createApplication(app, { name: 'CE App', user });
    await request(app.getHttpServer())
      .get(base(user.defaultOrganizationId, seeded.id))
      .set('Authorization', getExtAuth())
      .expect(404);
  });
});
