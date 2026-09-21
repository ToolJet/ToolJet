import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  createDataSource,
  updateEntity,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';

/**
 * Query transformation options are normalized at the API boundary (DataQueriesService).
 *
 * The editor always stamps a valid transformationLanguage on any query that supports a
 * post-processing transformation (getDefaultOptions in the client). A PAT/MCP caller writes query
 * options directly and can leave it null/absent — which makes the client's runTransformation fall
 * through both language branches and return `{}`, silently dropping the query's data. The backend
 * defaults it to javascript (keeping an explicit python) for any query that carries transformation
 * config, so a malformed transformation config can't be persisted. Queries with no transformation
 * config (runjs, plain rest queries) are left untouched.
 *
 * @group platform
 */
describe('Query transformation options are normalized via the API', () => {
  let nestApp: INestApplication;
  let workspaceId: string;
  let cookie: string[];
  let user: { id: string; organizationId: string };
  let version: AppVersion;
  let dataSourceId: string;

  const agent = () => request(nestApp.getHttpServer());
  const asAdmin = (r: request.Test) => r.set('tj-workspace-id', workspaceId).set('Cookie', cookie);

  const createQuery = (options: Record<string, unknown>) =>
    asAdmin(agent().post(`/api/data-queries/data-sources/${dataSourceId}/versions/${version.id}`)).send({
      kind: 'restapi',
      name: `q${uuidv4().slice(0, 8)}`,
      options,
    });

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    const admin = await createAdmin(nestApp, 'query-transform-admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;
    user = admin.user;

    const application = await createApplication(nestApp, { name: `q-transform-${uuidv4()}`, user });
    version = await createApplicationVersion(nestApp, application as App & { organizationId: string }, { name: 'v1' });
    await updateEntity(AppVersion, version.id, { status: AppVersionStatus.DRAFT });
    const dataSource = await createDataSource(nestApp, {
      appVersion: version,
      kind: 'restapi',
      name: `ds-${uuidv4()}`,
    });
    dataSourceId = dataSource.id;
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  it('defaults a missing transformationLanguage to javascript when transformation config is present', async () => {
    const res = await createQuery({ enableTransformation: true, transformation: 'return data;' });
    expect(res.status).toBe(201);
    expect(res.body.options?.transformationLanguage).toBe('javascript');
  });

  it('coerces a null transformationLanguage to javascript', async () => {
    const res = await createQuery({
      enableTransformation: true,
      transformation: 'return data;',
      transformationLanguage: null,
    });
    expect(res.status).toBe(201);
    expect(res.body.options?.transformationLanguage).toBe('javascript');
  });

  it('keeps an explicit python transformationLanguage', async () => {
    const res = await createQuery({
      enableTransformation: true,
      transformation: 'data',
      transformationLanguage: 'python',
    });
    expect(res.status).toBe(201);
    expect(res.body.options?.transformationLanguage).toBe('python');
  });

  it('leaves options untouched when there is no transformation config', async () => {
    const res = await createQuery({ method: 'get', url: '' });
    expect(res.status).toBe(201);
    expect(res.body.options?.transformationLanguage).toBeUndefined();
  });
});
