import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { initTestApp, closeTestApp, createAdmin } from 'test-helper';

/**
 * Slug-update validation matrix on a NON-git workspace (git sync disabled).
 *
 * Covers the gaps that the git-sync specs don't: the plain update-path uniqueness
 * rules for a front-end app / module, independent of any git remote. Git-enabled
 * single-branch and multi-branch slug rules live in the @group gitsync suite
 * (git-sync.spec.ts) since they need a configured provider.
 *
 * What the DB + code enforce here (git off ⇒ writes land on the default-branch
 * DRAFT version_type='version' row; uniqueness is instance-wide, per apps.type,
 * case-insensitive — see util.service.update + the app_versions slug triggers):
 *   - a slug update persists and the app is resolvable by the new slug
 *   - a second app of the SAME type cannot take a slug already in use (400)
 *   - the collision check is case-insensitive
 *   - an app and a module MAY share a slug (namespaces are per apps.type)
 *   - deleting the holder frees the slug for another app to claim
 *
 * @group platform
 */
describe('PUT /apps/:id | slug update rules (git sync disabled)', () => {
  let app: INestApplication;
  let cookie: string[];
  let workspaceId: string;

  const agent = () => request(app.getHttpServer());
  const auth = (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', workspaceId);

  const createApp = async (name: string, type: 'front-end' | 'module' = 'front-end'): Promise<string> => {
    const path = type === 'module' ? '/api/modules' : '/api/apps';
    const res = await auth(agent().post(path)).send({ icon: 'home', name, type }).expect(201);
    return res.body.id;
  };
  const putSlug = (appId: string, slug: string) => auth(agent().put(`/api/apps/${appId}`)).send({ app: { slug } });
  const getSlug = async (appId: string): Promise<string> => {
    const res = await auth(agent().get(`/api/apps/${appId}`)).expect(200);
    return res.body.slug;
  };

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const admin = await createAdmin(app, 'slug-update-admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  it('persists a slug update and makes the app resolvable by the new slug', async () => {
    const appId = await createApp('slug-persist-app');
    await putSlug(appId, 'custom-slug-persist').expect(200);
    expect(await getSlug(appId)).toBe('custom-slug-persist');
  });

  it('rejects a slug already taken by another front-end app (instance-wide, same type)', async () => {
    await createApp('slug-holder-app').then((id) => putSlug(id, 'custom-slug-dup').expect(200));

    const app2 = await createApp('slug-taker-app');
    const res = await putSlug(app2, 'custom-slug-dup');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already taken/i);
  });

  it('rejects a slug that collides only by case (case-insensitive uniqueness)', async () => {
    await createApp('slug-ci-holder').then((id) => putSlug(id, 'custom-slug-ci').expect(200));

    const app2 = await createApp('slug-ci-taker');
    const res = await putSlug(app2, 'Custom-Slug-CI');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already taken/i);
  });

  it('allows an app and a module to share the same slug (slug namespaces are per apps.type)', async () => {
    const frontEndId = await createApp('slug-shared-app', 'front-end');
    await putSlug(frontEndId, 'custom-slug-shared').expect(200);

    const moduleId = await createApp('slug-shared-module', 'module');
    // Same slug string, different apps.type ⇒ no collision.
    await putSlug(moduleId, 'custom-slug-shared').expect(200);
    expect(await getSlug(moduleId)).toBe('custom-slug-shared');
  });

  it('frees a slug for reuse once the holder app is deleted', async () => {
    const app1 = await createApp('slug-delete-holder');
    await putSlug(app1, 'custom-slug-reuse').expect(200);

    // A second app cannot take it while app1 holds it.
    const app2 = await createApp('slug-delete-taker');
    await putSlug(app2, 'custom-slug-reuse').expect(400);

    // Delete the holder — hard delete removes its app_versions row (the slug carrier).
    await auth(agent().delete(`/api/apps/${app1}`)).expect(200);

    // Now the slug is free — app2 can claim it.
    await putSlug(app2, 'custom-slug-reuse').expect(200);
    expect(await getSlug(app2)).toBe('custom-slug-reuse');
  });
});
