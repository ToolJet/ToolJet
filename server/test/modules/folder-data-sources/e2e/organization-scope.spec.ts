/**
 * Regression: POST /api/folder-data-sources (and PUT /api/folder-data-sources/:folderId) never
 * cross-checked folder_id, data_source_id, or branch_id against the caller's own organizationId.
 * The ability guard only resolves folder *ownership* for the owner-grant route and never looks at
 * data_source_id/branch_id at all, and an admin's unconditional `can(...)` grant bypasses even that
 * folder lookup — so any of the three ids could be borrowed from another workspace (or omitted, or
 * made up) and still reach FolderDataSourcesUtilService, which writes/deletes rows with no FK-level
 * org check of its own.
 *
 * FolderDataSourcesService.{create,bulkCreate,remove} now re-validate all three ids against
 * organizationId before delegating to the util service (src/modules/folder-data-sources/service.ts).
 *
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createUser,
  login,
  resolveOrSeedDefaultBranch,
  ensureAppEnvironments,
} from 'test-helper';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';

describe('POST/PUT /api/folder-data-sources | organization scoping (IDOR regression)', () => {
  let app: INestApplication;

  // Workspace 1 (W1) — the workspace every request below is made as.
  let org1Id: string;
  let admin1Cookie: string[];
  let folder1Id: string; // data_source-type folder owned by W1
  let appFolder1Id: string; // front-end (app) folder owned by W1 — wrong folder *type*
  let dataSource1Id: string;

  // Workspace 2 (W2) — only ever referenced by id from W1 requests, never logged into below.
  let org2Id: string;
  let admin2Cookie: string[];
  let dataSource2Id: string;
  let branch2Id: string;

  const as = (cookie: string[]) => (r: request.Test) => r.set('Cookie', cookie).set('tj-workspace-id', org1Id);
  const agent = () => request(app.getHttpServer());

  const dsOptions = (url: string) => [
    { key: 'url', value: url },
    { key: 'auth_type', value: 'none' },
    { key: 'headers', value: [['', '']] },
    { key: 'ssl_certificate', value: 'none', encrypted: false },
  ];

  beforeAll(async () => {
    ({ app } = await initTestApp());

    const w1 = await createUser(app, { email: 'org-scope-w1-admin@tooljet.io', groups: ['all_users', 'admin'] });
    org1Id = w1.organization.id;
    await ensureAppEnvironments(app, org1Id);
    ({ tokenCookie: admin1Cookie } = await login(app, 'org-scope-w1-admin@tooljet.io'));

    const w2 = await createUser(app, { email: 'org-scope-w2-admin@tooljet.io', groups: ['all_users', 'admin'] });
    org2Id = w2.organization.id;
    await ensureAppEnvironments(app, org2Id);
    ({ tokenCookie: admin2Cookie } = await login(app, 'org-scope-w2-admin@tooljet.io'));
    branch2Id = (await resolveOrSeedDefaultBranch(org2Id)).id;

    dataSource1Id = (
      await as(admin1Cookie)(agent().post('/api/data-sources'))
        .send({ name: 'w1-ds', kind: 'restapi', options: dsOptions('http://w1.example.com'), scope: 'global' })
        .expect(201)
    ).body.id;
    folder1Id = (
      await as(admin1Cookie)(agent().post('/api/folders'))
        .send({ name: 'w1-ds-folder', type: DATA_SOURCE_FOLDER_TYPE })
        .expect(201)
    ).body.id;
    appFolder1Id = (
      await as(admin1Cookie)(agent().post('/api/folders'))
        .send({ name: 'w1-app-folder', type: 'front-end' })
        .expect(201)
    ).body.id;

    const asOrg2 = (r: request.Test) => r.set('Cookie', admin2Cookie).set('tj-workspace-id', org2Id);
    dataSource2Id = (
      await asOrg2(agent().post('/api/data-sources'))
        .send({ name: 'w2-ds', kind: 'restapi', options: dsOptions('http://w2.example.com'), scope: 'global' })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('should 201 for a same-organization folder, data source, and branch (sanity)', async () => {
    await as(admin1Cookie)(agent().post('/api/folder-data-sources'))
      .send({ folder_id: folder1Id, data_source_id: dataSource1Id })
      .expect(201);
    await as(admin1Cookie)(agent().put(`/api/folder-data-sources/${folder1Id}`))
      .send({ data_source_id: dataSource1Id })
      .expect(200);
  });

  it('should 404 when folder_id belongs to a front-end (app) folder, not a data-source folder', async () => {
    await as(admin1Cookie)(agent().post('/api/folder-data-sources'))
      .send({ folder_id: appFolder1Id, data_source_id: dataSource1Id })
      .expect(404);
  });

  it('should 404 when data_source_id belongs to a different organization', async () => {
    await as(admin1Cookie)(agent().post('/api/folder-data-sources'))
      .send({ folder_id: folder1Id, data_source_id: dataSource2Id })
      .expect(404);
  });

  it('should 404 when branch_id belongs to a different organization', async () => {
    await as(admin1Cookie)(agent().post(`/api/folder-data-sources?branch_id=${branch2Id}`))
      .send({ folder_id: folder1Id, data_source_id: dataSource1Id })
      .expect(404);
  });

  it('should 400 when folder_id is missing', async () => {
    await as(admin1Cookie)(agent().post('/api/folder-data-sources'))
      .send({ data_source_id: dataSource1Id })
      .expect(400);
  });

  it('should 404 when folder_id does not exist', async () => {
    const madeUpFolderId = '00000000-0000-4000-8000-000000000000';
    await as(admin1Cookie)(agent().post('/api/folder-data-sources'))
      .send({ folder_id: madeUpFolderId, data_source_id: dataSource1Id })
      .expect(404);
    await as(admin1Cookie)(agent().put(`/api/folder-data-sources/${madeUpFolderId}`))
      .send({ data_source_id: dataSource1Id })
      .expect(404);
  });
});
