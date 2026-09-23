/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, NONEXISTENT_UUID, setTestLicenseTerms, restoreLicensePlan } from 'test-helper';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

const BASE = '/api/v2/ext/workspaces';

describe('ExternalApisWorkspacesControllerV2 (EE enterprise)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => closeTestApp(app), 60000);

  it('should reject requests with no token or an invalid one', async () => {
    await request(app.getHttpServer()).get(BASE).expect(403);
    await request(app.getHttpServer()).get(BASE).set('Authorization', 'Basic wrong-token').expect(403);
  });

  describe('POST /api/v2/ext/workspaces', () => {
    it('should mark the first workspace ever created as the platform default', async () => {
      const suffix = Date.now();
      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `First Workspace ${suffix}`, slug: `first-workspace-${suffix}` })
        .expect(201);
      expect(res.body).toMatchObject({ name: `First Workspace ${suffix}`, status: 'active', default: true });
    });

    it('should create a non-default workspace once a default already exists', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Existing Workspace ${suffix}`, slug: `existing-workspace-${suffix}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Second Workspace ${suffix}`, slug: `second-workspace-${suffix}` })
        .expect(201);
      expect(res.body.default).toBe(false);
    });

    it('should reject a duplicate name or slug', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Dup Name ${suffix}`, slug: `dup-slug-a-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Dup Name ${suffix}`, slug: `dup-slug-b-${suffix}` })
        .expect(409);
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Different Name ${suffix}`, slug: `dup-slug-a-${suffix}` })
        .expect(409);
    });

    it('should reject an invalid slug', async () => {
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: 'Bad Slug Workspace', slug: 'Not A Valid Slug!' })
        .expect(400);
    });
  });

  describe('GET /api/v2/ext/workspaces', () => {
    it('should match by search and paginate', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Findable${suffix} One`, slug: `findable-${suffix}-one` })
        .expect(201);
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Findable${suffix} Two`, slug: `findable-${suffix}-two` })
        .expect(201);

      const searched = await request(app.getHttpServer())
        .get(`${BASE}?search=findable${suffix}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(searched.body.pagination.total_count).toBe(2);

      const paged = await request(app.getHttpServer())
        .get(`${BASE}?search=findable${suffix}&page=1&per_page=1`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(paged.body.data).toHaveLength(1);
      expect(paged.body.pagination).toMatchObject({ page: 1, per_page: 1, total_count: 2 });
    });

    it('should filter by status', async () => {
      const suffix = Date.now();
      // First workspace in this test becomes the platform default (can't be archived), so the
      // one under test here is the second, non-default one.
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `StatusFilter${suffix} Default`, slug: `status-filter-${suffix}-default` })
        .expect(201);
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `StatusFilter${suffix}`, slug: `status-filter-${suffix}` })
        .expect(201);
      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);

      const archived = await request(app.getHttpServer())
        .get(`${BASE}?search=statusfilter${suffix}&status=archived`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(archived.body.data.map((w: { id: string }) => w.id)).toEqual([created.body.id]);
    });

    it('should filter by default', async () => {
      const suffix = Date.now();
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `DefaultFilter${suffix}`, slug: `default-filter-${suffix}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`${BASE}?search=defaultfilter${suffix}&default=true`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(res.body.data.map((w: { id: string }) => w.id)).toEqual([created.body.id]);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier', () => {
    it('should resolve by id, slug, and name, and 404 for a nonexistent one', async () => {
      const suffix = Date.now();
      const uniqueName = `Resolve Me ${suffix}`;
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: uniqueName, slug: `resolve-me-${suffix}` })
        .expect(201);

      const byId = await request(app.getHttpServer())
        .get(`${BASE}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byId.body.id).toBe(created.body.id);

      const bySlug = await request(app.getHttpServer())
        .get(`${BASE}/${created.body.slug}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(bySlug.body.id).toBe(created.body.id);

      const byName = await request(app.getHttpServer())
        .get(`${BASE}/${encodeURIComponent(uniqueName)}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byName.body.id).toBe(created.body.id);

      await request(app.getHttpServer())
        .get(`${BASE}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('PATCH /api/v2/ext/workspaces/:workspaceIdentifier', () => {
    it('should update name and slug', async () => {
      const suffix = Date.now();
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Old Name ${suffix}`, slug: `old-slug-${suffix}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: `New Name ${suffix}`, slug: `new-slug-${suffix}` })
        .expect(200);
      expect(res.body).toMatchObject({ name: `New Name ${suffix}`, slug: `new-slug-${suffix}` });
    });

    it('should 409 when renaming to a name or slug that already exists', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Taken Name ${suffix}`, slug: `taken-slug-${suffix}` })
        .expect(201);
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Renameable ${suffix}`, slug: `renameable-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`${BASE}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ name: `Taken Name ${suffix}` })
        .expect(409);
    });

    it('should reject default: false directly', async () => {
      const suffix = Date.now();
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `NoUnset${suffix}`, slug: `no-unset-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`${BASE}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ default: false })
        .expect(422);
    });

    it('should reject making a workspace default while archiving it in the same request', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Default${suffix}`, slug: `default-${suffix}` })
        .expect(201);
      const other = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Other${suffix}`, slug: `other-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`${BASE}/${other.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ default: true, status: 'archived' })
        .expect(422);
    });

    it('should reject making an already-archived workspace the default', async () => {
      const suffix = Date.now();
      const defaultWorkspace = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Default${suffix}`, slug: `default-${suffix}` })
        .expect(201);
      const other = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `Other${suffix}`, slug: `other-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`${BASE}/${other.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ status: 'archived' })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`${BASE}/${other.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ default: true })
        .expect(422);

      expect(defaultWorkspace.body.default).toBe(true);
    });

    it('should 409 when archiving the default workspace via status', async () => {
      const suffix = Date.now();
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `CantArchive${suffix}`, slug: `cant-archive-${suffix}` })
        .expect(201);
      expect(created.body.default).toBe(true);

      await request(app.getHttpServer())
        .patch(`${BASE}/${created.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ status: 'archived' })
        .expect(409);
    });

    it('should atomically move default to another workspace via default: true', async () => {
      const suffix = Date.now();
      const first = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `MoveDefaultA${suffix}`, slug: `move-default-a-${suffix}` })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `MoveDefaultB${suffix}`, slug: `move-default-b-${suffix}` })
        .expect(201);
      expect(first.body.default).toBe(true);
      expect(second.body.default).toBe(false);

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/${second.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ default: true })
        .expect(200);
      expect(res.body.default).toBe(true);

      const firstAfter = await request(app.getHttpServer())
        .get(`${BASE}/${first.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(firstAfter.body.default).toBe(false);
    });

    it('should 404 for a nonexistent workspace', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/${NONEXISTENT_UUID}`)
        .set('Authorization', getExtAuth())
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/archive and /unarchive', () => {
    it('should archive then unarchive a non-default workspace, and 409 on repeat', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `KeepDefault${suffix}`, slug: `keep-default-${suffix}` })
        .expect(201);
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `ArchiveMe${suffix}`, slug: `archive-me-${suffix}` })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);
      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(409);

      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(201);
      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/unarchive`)
        .set('Authorization', getExtAuth())
        .expect(409);
    });

    it('should 409 when archiving the default workspace', async () => {
      const suffix = Date.now();
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `DefaultNoArchive${suffix}`, slug: `default-no-archive-${suffix}` })
        .expect(201);
      expect(created.body.default).toBe(true);

      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(409);
    });

    it('should 404 for a nonexistent workspace', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/${NONEXISTENT_UUID}/archive`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/set-default', () => {
    it('should make a workspace the default, unsetting the previous one', async () => {
      const suffix = Date.now();
      const first = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `SetDefaultA${suffix}`, slug: `set-default-a-${suffix}` })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `SetDefaultB${suffix}`, slug: `set-default-b-${suffix}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`${BASE}/${second.body.id}/set-default`)
        .set('Authorization', getExtAuth())
        .expect(201);
      expect(res.body.default).toBe(true);

      const firstAfter = await request(app.getHttpServer())
        .get(`${BASE}/${first.body.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(firstAfter.body.default).toBe(false);
    });

    it('should 409 if already the default', async () => {
      const suffix = Date.now();
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `AlreadyDefault${suffix}`, slug: `already-default-${suffix}` })
        .expect(201);
      expect(created.body.default).toBe(true);

      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/set-default`)
        .set('Authorization', getExtAuth())
        .expect(409);
    });

    it('should reject making an archived workspace the default', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `KeepDefault2${suffix}`, slug: `keep-default-2-${suffix}` })
        .expect(201);
      const created = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `ArchivedCantDefault${suffix}`, slug: `archived-cant-default-${suffix}` })
        .expect(201);
      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE}/${created.body.id}/set-default`)
        .set('Authorization', getExtAuth())
        .expect(422);
    });

    it('should 404 for a nonexistent workspace', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/${NONEXISTENT_UUID}/set-default`)
        .set('Authorization', getExtAuth())
        .expect(404);
    });
  });

  describe('License limits', () => {
    it('should reject creating a workspace when the license workspace limit is reached', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `LimitDefault${suffix}`, slug: `limit-default-${suffix}` })
        .expect(201);

      try {
        setTestLicenseTerms(app, { features: { externalApi: true }, workspaces: 1 } as any);
        await request(app.getHttpServer())
          .post(BASE)
          .set('Authorization', getExtAuth())
          .send({ name: `OverLimit${suffix}`, slug: `over-limit-${suffix}` })
          .expect(451);
      } finally {
        restoreLicensePlan(app);
      }
    });

    it('should reject unarchiving a workspace when it would exceed the license workspace limit', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `LimitDefault2${suffix}`, slug: `limit-default-2-${suffix}` })
        .expect(201);
      const other = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `LimitOther${suffix}`, slug: `limit-other-${suffix}` })
        .expect(201);
      await request(app.getHttpServer())
        .post(`${BASE}/${other.body.id}/archive`)
        .set('Authorization', getExtAuth())
        .expect(201);

      try {
        setTestLicenseTerms(app, { features: { externalApi: true }, workspaces: 1 } as any);
        await request(app.getHttpServer())
          .post(`${BASE}/${other.body.id}/unarchive`)
          .set('Authorization', getExtAuth())
          .expect(451);
      } finally {
        restoreLicensePlan(app);
      }
    });

    it('should reject reactivating an archived workspace via PATCH when it would exceed the license workspace limit', async () => {
      const suffix = Date.now();
      await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `LimitDefault3${suffix}`, slug: `limit-default-3-${suffix}` })
        .expect(201);
      const other = await request(app.getHttpServer())
        .post(BASE)
        .set('Authorization', getExtAuth())
        .send({ name: `LimitOther3${suffix}`, slug: `limit-other-3-${suffix}` })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`${BASE}/${other.body.id}`)
        .set('Authorization', getExtAuth())
        .send({ status: 'archived' })
        .expect(200);

      try {
        setTestLicenseTerms(app, { features: { externalApi: true }, workspaces: 1 } as any);
        await request(app.getHttpServer())
          .patch(`${BASE}/${other.body.id}`)
          .set('Authorization', getExtAuth())
          .send({ status: 'active' })
          .expect(451);
      } finally {
        restoreLicensePlan(app);
      }
    });
  });
});
