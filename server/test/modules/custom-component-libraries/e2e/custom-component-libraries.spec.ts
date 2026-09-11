/**
 * Custom Component Libraries (CCL) E2E Tests
 *
 * Verifies the EE custom-component-libraries endpoints (server/ee/custom-component-libraries/):
 *   POST   /custom-component-libraries                          | create (PAT)
 *   POST   /custom-component-libraries/find-or-create            | idempotent create-or-return (PAT)
 *   GET    /custom-component-libraries                           | list (JWT)
 *   POST   /custom-component-libraries/:correlationId/revisions  | publish a revision (PAT, multipart)
 *   POST   /custom-component-libraries/:correlationId/dev        | upload a dev bundle (PAT, multipart)
 *   GET    /custom-component-libraries/:id/revisions/:v/files/:f | serve revision bytes (public)
 *   GET    /custom-component-libraries/:id/dev/:userId/files/:f  | serve dev bytes (public)
 *   GET    /custom-component-libraries/:id/dev/:userId/stream    | SSE dev-bundle updates (JWT)
 *   GET    /custom-component-libraries/:correlationId            | get by correlationId (PAT)
 *   DELETE /custom-component-libraries/:id                       | delete (JWT, admin-only)
 *
 * Bundle bytes are written to disk (StorageService), so this suite points
 * CUSTOM_COMPONENT_STORAGE_PATH at an isolated temp dir and uses a fresh (uncached)
 * app instance -- StorageService reads the env var once, at construction time.
 *
 * @group platform
 */
import * as os from 'os';
import * as path from 'path';

process.env.CUSTOM_COMPONENT_STORAGE_PATH = path.join(os.tmpdir(), `ccl-e2e-${Date.now()}`);

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  createAdmin,
  createEndUser,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  updateEntity,
  createPat,
  createLibrary,
  createLibraryRevision,
  createDevBundle,
  buildManifest,
  BUNDLE_JS,
  BUNDLE_CSS,
} from 'test-helper';
import { AppVersion } from '@entities/app_version.entity';

describe('CustomComponentLibrariesController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    // No closeTestApp here: this app is a freshApp instance (needed so StorageService picks up
    // this file's CUSTOM_COMPONENT_STORAGE_PATH override), and the license-gating describe below
    // creates a second app in the same file. Closing this one first destroys its DataSource while
    // the harness's module-level suite QueryRunner still references it, so the next initTestApp's
    // edition-switch cleanup throws QueryRunnerAlreadyReleasedError trying to roll back a dead
    // connection. Leaving it open lets that handoff roll back a still-live connection instead;
    // the process's final forceExit cleans it up.

    const api = () => request(app.getHttpServer());

    /** Creates an admin + a PAT scoped to their workspace, ready to use as `Authorization: Bearer`. */
    async function adminWithPat(email: string) {
      const admin = await createAdmin(app, email);
      const token = await createPat(app, admin.cookie, admin.workspace.id);
      return { admin, token };
    }

    function publish(
      token: string,
      correlationId: string,
      overrides: { version?: string; manifest?: Record<string, any>; includeCss?: boolean } = {}
    ) {
      const req = api()
        .post(`/api/custom-component-libraries/${correlationId}/revisions`)
        .set('Authorization', `Bearer ${token}`)
        .field('version', overrides.version ?? '1.0.0')
        .attach('bundle', BUNDLE_JS, 'index.js')
        .attach('manifest', Buffer.from(JSON.stringify(overrides.manifest ?? buildManifest())), 'manifest.json');
      if (overrides.includeCss) req.attach('css', BUNDLE_CSS, 'index.css');
      return req;
    }

    describe('POST /api/custom-component-libraries | create', () => {
      it('rejects requests with no PAT (401)', async () => {
        await api().post('/api/custom-component-libraries').send({ name: 'lib' }).expect(401);
      });

      it('rejects a session cookie in place of a PAT (401)', async () => {
        const admin = await createAdmin(app, 'ccl-create-jwt-only@tooljet.io');
        await api()
          .post('/api/custom-component-libraries')
          .set('Cookie', admin.cookie)
          .send({ name: 'lib' })
          .expect(401);
      });

      it('creates a library scoped to the token workspace (201)', async () => {
        const { token } = await adminWithPat('ccl-create-admin@tooljet.io');

        const res = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'my-lib' })
          .expect(201);

        expect(res.body).toMatchObject({ id: expect.any(String), name: 'my-lib' });
      });

      it('rejects a duplicate name within the same workspace (409)', async () => {
        const { token } = await adminWithPat('ccl-dup-admin@tooljet.io');

        await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'dup-lib' })
          .expect(201);

        await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'dup-lib' })
          .expect(409);
      });

      it('allows the same name across different workspaces', async () => {
        const { token: tokenA } = await adminWithPat('ccl-org-a-admin@tooljet.io');
        const { token: tokenB } = await adminWithPat('ccl-org-b-admin@tooljet.io');

        await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ name: 'shared-name' })
          .expect(201);

        await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${tokenB}`)
          .send({ name: 'shared-name' })
          .expect(201);
      });
    });

    describe('POST /api/custom-component-libraries/find-or-create', () => {
      it('creates a library on first call, returns the same one on the second (idempotent)', async () => {
        const { token } = await adminWithPat('ccl-foc-admin@tooljet.io');
        const correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

        const first = await api()
          .post('/api/custom-component-libraries/find-or-create')
          .set('Authorization', `Bearer ${token}`)
          .send({ correlationId, name: 'foc-lib' })
          .expect(201);
        expect(first.body).toMatchObject({ correlationId, created: true });

        const second = await api()
          .post('/api/custom-component-libraries/find-or-create')
          .set('Authorization', `Bearer ${token}`)
          .send({ correlationId, name: 'foc-lib' })
          .expect(201);
        expect(second.body).toMatchObject({ id: first.body.id, correlationId, created: false });
      });
    });

    describe('GET /api/custom-component-libraries | list', () => {
      it('rejects requests with no session (401)', async () => {
        await api().get('/api/custom-component-libraries').expect(401);
      });

      it('returns an empty array for a workspace with no libraries', async () => {
        const admin = await createAdmin(app, 'ccl-list-empty@tooljet.io');
        const res = await api()
          .get('/api/custom-component-libraries')
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(200);
        expect(res.body).toEqual([]);
      });

      it('returns libraries with their revisions and dev bundles, org-scoped', async () => {
        const admin = await createAdmin(app, 'ccl-list-admin@tooljet.io');
        const otherAdmin = await createAdmin(app, 'ccl-list-other@tooljet.io');

        const library = await createLibrary(admin.workspace.id, { name: 'listed-lib' });
        await createLibraryRevision(library.id, { version: '1.0.0' });
        await createDevBundle(library.id, admin.user.id);
        await createLibrary(otherAdmin.workspace.id, { name: 'other-orgs-lib' });

        const res = await api()
          .get('/api/custom-component-libraries')
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({
          id: library.id,
          name: 'listed-lib',
          revisions: expect.arrayContaining([expect.objectContaining({ version: '1.0.0' })]),
          devBundles: expect.arrayContaining([expect.objectContaining({ userId: admin.user.id })]),
        });
      });
    });

    describe('POST /api/custom-component-libraries/:correlationId/revisions | publish', () => {
      it('publishes a revision and the file is retrievable afterward (201)', async () => {
        const { token } = await adminWithPat('ccl-pub-admin@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'pub-lib' })
          .expect(201);

        const pubRes = await publish(token, created.body.correlationId, { includeCss: true }).expect(201);
        expect(pubRes.body).toMatchObject({ version: '1.0.0' });

        const fileRes = await api()
          .get(`/api/custom-component-libraries/${created.body.id}/revisions/1.0.0/files/index.js`)
          .expect(200);
        expect(fileRes.headers['cache-control']).toBe('public, max-age=31536000, immutable');
        expect(fileRes.text).toBe(BUNDLE_JS.toString());
      });

      it('rejects an unknown correlationId (404)', async () => {
        const { token } = await adminWithPat('ccl-pub-unknown@tooljet.io');
        await publish(token, '00000000-0000-0000-0000-000000000000').expect(404);
      });

      it('rejects a manifest with no components (400)', async () => {
        const { token } = await adminWithPat('ccl-pub-badmanifest@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'badmanifest-lib' })
          .expect(201);

        await publish(token, created.body.correlationId, { manifest: { components: {} } }).expect(400);
      });

      it('rejects a duplicate version for the same library (409)', async () => {
        const { token } = await adminWithPat('ccl-pub-dupver@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'dupver-lib' })
          .expect(201);

        await publish(token, created.body.correlationId).expect(201);
        await publish(token, created.body.correlationId).expect(409);
      });

      it('rejects an oversized bundle (413)', async () => {
        const { token } = await adminWithPat('ccl-pub-oversize@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'oversize-lib' })
          .expect(201);

        const bigBundle = Buffer.alloc(11 * 1024 * 1024, 'a'); // over the 10MB prod limit
        await api()
          .post(`/api/custom-component-libraries/${created.body.correlationId}/revisions`)
          .set('Authorization', `Bearer ${token}`)
          .field('version', '1.0.0')
          .attach('bundle', bigBundle, 'index.js')
          .attach('manifest', Buffer.from(JSON.stringify(buildManifest())), 'manifest.json')
          .expect(413);
      }, 30000);
    });

    describe('POST /api/custom-component-libraries/:correlationId/dev | uploadDev', () => {
      it('uploads a dev bundle and overwrites it on a second upload (one mutable slot)', async () => {
        const { admin, token } = await adminWithPat('ccl-dev-admin@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'dev-lib' })
          .expect(201);

        await api()
          .post(`/api/custom-component-libraries/${created.body.correlationId}/dev`)
          .set('Authorization', `Bearer ${token}`)
          .attach('bundle', Buffer.from('v1'), 'index.js')
          .attach('manifest', Buffer.from(JSON.stringify(buildManifest())), 'manifest.json')
          .expect(201);

        await api()
          .post(`/api/custom-component-libraries/${created.body.correlationId}/dev`)
          .set('Authorization', `Bearer ${token}`)
          .attach('bundle', Buffer.from('v2'), 'index.js')
          .attach('manifest', Buffer.from(JSON.stringify(buildManifest())), 'manifest.json')
          .expect(201);

        const fileRes = await api()
          .get(`/api/custom-component-libraries/${created.body.id}/dev/${admin.user.id}/files/index.js`)
          .expect(200);
        expect(fileRes.headers['cache-control']).toBe('no-store');
        expect(fileRes.text).toBe('v2');
      });
    });

    describe('GET /api/custom-component-libraries/:id/revisions/:version/files/:file | serve (public)', () => {
      it('serves without any auth header', async () => {
        const { token } = await adminWithPat('ccl-serve-noauth@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'serve-lib' })
          .expect(201);
        await publish(token, created.body.correlationId).expect(201);

        await api()
          .get(`/api/custom-component-libraries/${created.body.id}/revisions/1.0.0/files/manifest.json`)
          .expect(200);
      });

      it('returns 404 for an unknown version', async () => {
        const library = await createLibrary((await createAdmin(app, 'ccl-serve-404@tooljet.io')).workspace.id);
        await api().get(`/api/custom-component-libraries/${library.id}/revisions/9.9.9/files/index.js`).expect(404);
      });
    });

    describe('GET /api/custom-component-libraries/:correlationId | get', () => {
      it('returns the library for the token workspace', async () => {
        const { token } = await adminWithPat('ccl-get-admin@tooljet.io');
        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'get-lib' })
          .expect(201);

        const res = await api()
          .get(`/api/custom-component-libraries/${created.body.correlationId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
        expect(res.body).toMatchObject({ id: created.body.id, name: 'get-lib' });
      });

      it("returns 404 for another workspace's correlationId", async () => {
        const { token: tokenA } = await adminWithPat('ccl-get-org-a@tooljet.io');
        const { token: tokenB } = await adminWithPat('ccl-get-org-b@tooljet.io');

        const created = await api()
          .post('/api/custom-component-libraries')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ name: 'orgA-lib' })
          .expect(201);

        await api()
          .get(`/api/custom-component-libraries/${created.body.correlationId}`)
          .set('Authorization', `Bearer ${tokenB}`)
          .expect(404);
      });
    });

    describe('DELETE /api/custom-component-libraries/:id | delete', () => {
      it('rejects a non-admin member (403)', async () => {
        const admin = await createAdmin(app, 'ccl-del-admin1@tooljet.io');
        const endUser = await createEndUser(app, 'ccl-del-enduser@tooljet.io', { workspace: admin.workspace });
        const library = await createLibrary(admin.workspace.id);

        await api()
          .delete(`/api/custom-component-libraries/${library.id}`)
          .set('Cookie', endUser.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(403);
      });

      it('deletes the library and cascades revisions/dev bundles (admin)', async () => {
        const admin = await createAdmin(app, 'ccl-del-admin2@tooljet.io');
        const library = await createLibrary(admin.workspace.id);
        await createLibraryRevision(library.id);
        await createDevBundle(library.id, admin.user.id);

        await api()
          .delete(`/api/custom-component-libraries/${library.id}`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(200);

        await api()
          .get(`/api/custom-component-libraries/${library.id}/revisions/1.0.0/files/manifest.json`)
          .expect(404);
      });

      it('blocks deletion when an app pins the library (409)', async () => {
        const admin = await createAdmin(app, 'ccl-del-inuse@tooljet.io');
        const library = await createLibrary(admin.workspace.id);
        const pinKey = library.correlationId.replace(/-/g, '');

        const testApp = await createApplication(app, { name: 'pinning-app', user: admin.user as any });
        const version = await createApplicationVersion(app, testApp as any);
        await updateEntity(AppVersion, version.id, {
          globalSettings: { ...version.globalSettings, customComponentLibraries: { [pinKey]: '1.0.0' } } as any,
        });

        const res = await api()
          .delete(`/api/custom-component-libraries/${library.id}`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(409);

        // The global exception filter forwards only `.message` (a string) from the thrown
        // ConflictException -- the `apps` list it also carries is asserted at the service
        // unit-test layer instead, since it never reaches the HTTP response body.
        expect(res.body.message).toMatch(/in use by 1 app/);
      });

      it('returns 404 for a nonexistent library', async () => {
        const admin = await createAdmin(app, 'ccl-del-404@tooljet.io');
        await api()
          .delete('/api/custom-component-libraries/00000000-0000-0000-0000-000000000000')
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(404);
      });
    });

    describe('GET /api/custom-component-libraries/:id/dev/:userId/stream | SSE (minimal)', () => {
      it('returns 404 when the library is not in the caller workspace (guard runs before subscribing)', async () => {
        const admin = await createAdmin(app, 'ccl-sse-404@tooljet.io');
        await api()
          .get(`/api/custom-component-libraries/00000000-0000-0000-0000-000000000000/dev/${admin.user.id}/stream`)
          .set('Cookie', admin.cookie)
          .set('tj-workspace-id', admin.workspace.id)
          .expect(404);
      });

      it('establishes a 200 SSE connection for a library in the caller workspace', async () => {
        const admin = await createAdmin(app, 'ccl-sse-200@tooljet.io');
        const library = await createLibrary(admin.workspace.id);

        // Resolve as soon as headers arrive -- an SSE stream never ends on its own,
        // so we destroy the socket instead of waiting for supertest's normal 'end'.
        const res: { status: number; headers: Record<string, string> } = await new Promise((resolve, reject) => {
          api()
            .get(`/api/custom-component-libraries/${library.id}/dev/${admin.user.id}/stream`)
            .set('Cookie', admin.cookie)
            .set('tj-workspace-id', admin.workspace.id)
            .parse((httpRes, callback) => {
              callback(null, {});
              // @types/superagent types this as `Response`, but the parse callback actually
              // receives the raw Node IncomingMessage (that's the point of overriding parse:
              // it runs before superagent builds its Response wrapper).
              (httpRes as unknown as NodeJS.ReadableStream & { destroy: () => void }).destroy();
            })
            .then((r) => resolve({ status: r.status, headers: r.headers as Record<string, string> }))
            .catch(reject);
        });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');
      });
    });
  });

  describe('license gating (plan: basic)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      // No freshApp here: this block doesn't touch file storage, so it can safely use the
      // normal cached path. Using freshApp (like the describe above) for a second app in the
      // same file breaks the harness's suite-transaction cleanup (QueryRunnerAlreadyReleasedError)
      // when the first freshApp is closed before this one starts.
      ({ app } = await initTestApp({ edition: 'ee', plan: 'basic' }));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    it('denies list access when the plan lacks the custom-component-libraries feature (451)', async () => {
      const admin = await createAdmin(app, 'ccl-license-basic@tooljet.io');
      await request(app.getHttpServer())
        .get('/api/custom-component-libraries')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id)
        .expect(451);
    });
  });
});
