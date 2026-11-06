import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Project } from '../../../src/lib/app/project';
import { pickVersion } from '../../../src/lib/app/remote';
import { checkoutVersion, cloneApp, pullProject } from '../../../src/lib/app/workspace';
import { ApiError, type Session } from '../../../src/lib/app/session';
import { readSourceState } from '../../../src/lib/app/source-upload';

/*
  clone, pull and checkout against a fake ToolJet: two versions of one app. v1 is released and has one query; v2 is
  the editing draft with a code page (routes in its registry) and two queries on a ToolJet DB table.
*/

const codeRoot = {
  component: {
    component: 'LibraryComponent',
    definition: {
      properties: {
        codePage: { value: '{{true}}' },
        correlationId: { value: 'corr-1234' },
        routes: {
          value: JSON.stringify([
            { id: 'orders', path: '/', title: 'Orders', pageId: 'p2' },
            { id: 'order', path: '/orders/:id', pageId: 'p3' },
          ]),
        },
      },
    },
  },
};

const v2 = {
  id: 'app-1',
  name: 'Orders Desk',
  slug: 'orders-desk',
  editing_version: { id: 'ver-2', name: 'v2', status: 'DRAFT', global_settings: {} },
  pages: [
    { id: 'p1', handle: 'home', name: 'Orders', components: { root: codeRoot } },
    { id: 'p2', handle: 'home-orders', name: 'Orders: Orders', hidden: { value: '{{true}}' } },
  ],
  data_queries: [
    { name: 'orders', kind: 'tooljetdb', options: { operation: 'list_rows', table_id: 't1' } },
    {
      name: 'setStatus',
      kind: 'tooljetdb',
      options: { operation: 'update_rows', table_id: 't1', parameters: [{ name: 'id' }, { name: 'status' }] },
    },
  ],
};

const v1 = {
  ...v2,
  editing_version: { id: 'ver-1', name: 'v1', status: 'RELEASED', global_settings: {} },
  pages: [{ id: 'p0', handle: 'home', name: 'Home', components: {} }],
  data_queries: [{ name: 'orders', kind: 'tooljetdb', options: { operation: 'list_rows', table_id: 't1' } }],
};

/** What the fake stores as v2's code: nothing (the default), two files, or a ToolJet without the endpoint (404). */
type StoredCode = 'none' | 'stored' | 'missing-endpoint';

const storedFiles = [
  { path: 'frontend/src/App.tsx', content: 'export default () => <h1>Stored</h1>;\n' },
  { path: 'frontend/src/routes/orders.tsx', content: 'export const Orders = () => null;\n' },
];

function fakeSession(stored: StoredCode = 'none'): Session & { calls: string[] } {
  const calls: string[] = [];
  const source = '/code-mode-source/app-1/versions/ver-2';
  const summary = { exists: true, revision: 2, owner: 'platform', contentHash: 'hash-2' };
  const routes: Record<string, unknown> = {
    // A workspace without git sync: no branch, so the editing version.
    '/code-mode-source/app-1/branch-draft': { branch: null, version: null },
    '/apps/app-1': v2,
    '/v2/apps/app-1/versions/ver-2': v2,
    '/v2/apps/app-1/versions/ver-1': v1,
    '/apps/app-1/versions': {
      versions: [
        { id: 'ver-2', name: 'v2', status: 'DRAFT' },
        { id: 'ver-1', name: 'v1', status: 'RELEASED' },
      ],
    },
    ...(stored === 'none' ? { [source]: { exists: false } } : {}),
    ...(stored === 'stored' ? { [source]: summary, [`${source}?content=1`]: { ...summary, files: storedFiles } } : {}),
    '/tooljet-db/organizations/org-1/tables': { result: [{ id: 't1', table_name: 'orders' }] },
    '/tooljet-db/organizations/org-1/table/orders': {
      result: {
        columns: [
          { column_name: 'id', data_type: 'integer', constraints_type: { is_primary_key: true } },
          { column_name: 'status', data_type: 'character varying', constraints_type: { is_not_null: true } },
        ],
      },
    },
  };
  return {
    url: 'http://tooljet.test',
    token: 'unused',
    organizationId: 'org-1',
    email: 'dev@example.com',
    calls,
    api: async (p: string, init?: { method?: string }) => {
      calls.push(`${init?.method ?? 'GET'} ${p}`);
      if (init?.method && init.method !== 'GET') throw new Error(`unexpected write ${init.method} ${p}`);
      if (stored === 'missing-endpoint' && p.startsWith(source)) {
        throw new ApiError(`GET ${p} failed (HTTP 404)`, 404, '');
      }
      if (!(p in routes)) throw new Error(`no route ${p}`);
      return JSON.parse(JSON.stringify(routes[p]));
    },
  };
}

describe('tooljet app clone, pull and checkout', () => {
  let tmp: string;
  let cwd: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-app-'));
    cwd = process.cwd();
    process.chdir(tmp);
  });
  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('clone links the project to the app, copies the code page routes and pulls typed hooks', async () => {
    const session = fakeSession();
    const result = await cloneApp(session, 'app-1');
    expect(result.dir).to.equal('orders-desk');
    expect(result.hasCodePage).to.equal(true);
    const app = result.project.readApp();
    expect(app).to.include({ name: 'Orders Desk', appId: 'app-1' });
    expect(app.codePage).to.deep.equal({ handle: 'home', name: 'Orders' });
    expect(app.routes).to.deep.equal([
      { id: 'orders', path: '/', title: 'Orders' },
      { id: 'order', path: '/orders/:id' },
    ]);
    expect(app.version).to.equal(undefined);
    const config = JSON.parse(
      fs.readFileSync(path.join(tmp, 'orders-desk', 'frontend', '.tooljet', 'config.json'), 'utf8')
    );
    expect(config.correlationId).to.equal('corr-1234');
    const gen = fs.readFileSync(path.join(tmp, 'orders-desk', 'frontend', 'src', 'tooljet.gen.ts'), 'utf8');
    expect(gen).to.match(/\bsetStatus: \{ data: /);
    expect(gen).to.contain('status: string');
    expect(session.calls.every((c) => c.startsWith('GET '))).to.equal(true);
  });

  it('clone records the instance the app came from, which the project then uses', async () => {
    const result = await cloneApp(fakeSession(), 'app-1');
    expect(result.instance).to.equal('http://tooljet.test');
    expect(JSON.parse(fs.readFileSync(path.join(tmp, 'orders-desk', '.tooljet', 'instance.json'), 'utf8'))).to.deep.equal({
      url: 'http://tooljet.test',
    });
    expect(fs.readFileSync(path.join(tmp, 'orders-desk', '.gitignore'), 'utf8')).to.contain('.tooljet/instance.json');
  });

  it('clone keeps an app name with quotes, a backslash and a $ as it is', async () => {
    const name = 'ToolJet app called "Talent \\ Pipeline" $&';
    const session = fakeSession();
    const api = session.api;
    session.api = async (p: string, init?: { method?: string }) => {
      const res = await api(p, init);
      return p.startsWith('/apps/') && res?.slug ? { ...res, name } : res;
    };
    const result = await cloneApp(session, 'app-1', 'talent-pipeline');
    expect(result.project.readApp()).to.include({ name, appId: 'app-1' });
    expect(result.project.readLibraryConfig().libraryName).to.equal(name);
  });

  it('clone writes the code ToolJet stores for the editing version and records it', async () => {
    const session = fakeSession('stored');
    const result = await cloneApp(session, 'app-1');
    expect(result.source).to.deep.equal({ revision: 2, owner: 'platform', written: 2 });
    const root = path.join(tmp, 'orders-desk');
    expect(fs.readFileSync(path.join(root, 'frontend/src/App.tsx'), 'utf8')).to.contain('Stored');
    expect(fs.existsSync(path.join(root, 'frontend/src/routes/orders.tsx'))).to.equal(true);
    const state = { revision: 2, owner: 'platform', versionId: 'ver-2', contentHash: 'hash-2' };
    expect(readSourceState(root)).to.deep.equal(state);
    expect(session.calls).to.include('GET /code-mode-source/app-1/versions/ver-2?content=1');
  });

  it('clone keeps the starter template when no code is stored, and when ToolJet has no stored source at all', async () => {
    for (const stored of ['none', 'missing-endpoint'] as const) {
      const dir = `clone-${stored}`;
      const result = await cloneApp(fakeSession(stored), 'app-1', dir);
      expect(result.hasCodePage).to.equal(true);
      expect(result.source).to.equal(null);
      expect(readSourceState(path.join(tmp, dir))).to.equal(undefined);
    }
  });

  it('clone refuses a folder that is not empty', async () => {
    fs.mkdirSync(path.join(tmp, 'busy'));
    fs.writeFileSync(path.join(tmp, 'busy', 'keep.txt'), 'x');
    let error: Error | undefined;
    await cloneApp(fakeSession(), 'app-1', 'busy').catch((e) => (error = e));
    expect(error?.message).to.contain('not empty');
    expect(fs.readdirSync(path.join(tmp, 'busy'))).to.deep.equal(['keep.txt']);
  });

  it('pull reads the editing version and writes the snapshot', async () => {
    const { project } = await cloneApp(fakeSession(), 'app-1');
    fs.rmSync(path.join(project.root, '.tooljet'), { recursive: true });
    const session = fakeSession();
    const snapshot = await pullProject(session, project);
    // Which branch the project works on first (none here), then the editing version.
    expect(session.calls.slice(0, 2)).to.deep.equal(['GET /code-mode-source/app-1/branch-draft', 'GET /apps/app-1']);
    expect(snapshot).to.include({ versionId: 'ver-2', versionName: 'v2' });
    expect(snapshot.queries.map((q) => q.name)).to.deep.equal(['orders', 'setStatus']);
    expect(snapshot.queries[1].params).to.deep.equal(['id', 'status']);
    expect(project.readSnapshot()?.versionId).to.equal('ver-2');
  });

  it('checkout points the project at a version by name, pulls it and says when it is read only', async () => {
    const { project } = await cloneApp(fakeSession(), 'app-1');
    const session = fakeSession();
    const result = await checkoutVersion(session, project, 'v1');
    expect(result.version).to.deep.equal({ id: 'ver-1', name: 'v1', status: 'RELEASED' });
    expect(result.readOnly).to.equal(true);
    expect(project.readApp().version).to.deep.equal({ id: 'ver-1', name: 'v1' });
    expect(result.snapshot.queries.map((q) => q.name)).to.deep.equal(['orders']);
    expect(session.calls).to.include('GET /v2/apps/app-1/versions/ver-1');
    // A later pull keeps reading the checked-out version.
    const again = fakeSession();
    expect((await pullProject(again, project)).versionId).to.equal('ver-1');
    expect(again.calls[0]).to.equal('GET /v2/apps/app-1/versions/ver-1');
  });

  it('checkout --editing goes back to the editing version', async () => {
    const { project } = await cloneApp(fakeSession(), 'app-1');
    await checkoutVersion(fakeSession(), project, 'ver-1');
    const result = await checkoutVersion(fakeSession(), project, null);
    expect(result.version).to.equal(null);
    expect(result.readOnly).to.equal(false);
    expect(project.readApp().version).to.equal(undefined);
    expect(result.snapshot.versionId).to.equal('ver-2');
  });

  it('checkout of an unknown version changes nothing and lists the versions', async () => {
    const { project } = await cloneApp(fakeSession(), 'app-1');
    const before = fs.readFileSync(path.join(project.root, 'app.json'), 'utf8');
    let error: Error | undefined;
    await checkoutVersion(fakeSession(), project, 'v9').catch((e) => (error = e));
    expect(error?.message).to.equal('No version "v9". Versions: v2 (draft), v1 (released)');
    expect(fs.readFileSync(path.join(project.root, 'app.json'), 'utf8')).to.equal(before);
  });

  it('app.json rejects a malformed version', () => {
    const dir = path.join(tmp, 'p');
    fs.mkdirSync(dir);
    fs.writeFileSync(
      path.join(dir, 'app.json'),
      JSON.stringify({
        name: 'x',
        codePage: { handle: 'home', name: 'Home' },
        routes: [{ id: 'a', path: '/' }],
        version: 'v1',
      })
    );
    expect(() => new Project(dir).readApp()).to.throw('"version" must be');
  });
});

describe('pickVersion', () => {
  const versions = [
    { id: 'a', name: 'v1' },
    { id: 'b', name: 'V2' },
    { id: 'c', name: 'dup' },
    { id: 'd', name: 'dup' },
  ];
  it('takes an id, an exact name or a unique name in any case', () => {
    expect(pickVersion(versions, 'b').id).to.equal('b');
    expect(pickVersion(versions, 'v1').id).to.equal('a');
    expect(pickVersion(versions, 'v2').id).to.equal('b');
  });
  it('asks for the id when two versions share the name', () => {
    expect(() => pickVersion(versions, 'dup')).to.throw('give its id');
  });
});

describe('resolveTarget with an in-product session', () => {
  const keep = { ...process.env };
  afterEach(() => {
    for (const k of ['TOOLJET_URL', 'TOOLJET_PAT', 'TOOLJET_TOKEN', 'TOOLJET_SESSION_TOKEN', 'TOOLJET_WORKSPACE_ID']) {
      if (keep[k] === undefined) delete process.env[k];
      else process.env[k] = keep[k];
    }
  });

  it('uses the session as is when there is no personal access token', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { resolveTarget } = require('../../../src/lib/app/session');
    delete process.env.TOOLJET_PAT;
    delete process.env.TOOLJET_TOKEN;
    process.env.TOOLJET_URL = 'http://localhost:3055/';
    process.env.TOOLJET_SESSION_TOKEN = 'header.eyJzdWIiOiJhQGIuYyJ9.sig';
    process.env.TOOLJET_WORKSPACE_ID = 'org-1';
    expect(resolveTarget()).to.deep.equal({
      url: 'http://localhost:3055',
      token: 'header.eyJzdWIiOiJhQGIuYyJ9.sig',
      kind: 'session',
      workspaceId: 'org-1',
    });
  });

  it('prefers a personal access token, and needs the workspace with a session', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { resolveTarget } = require('../../../src/lib/app/session');
    process.env.TOOLJET_URL = 'http://localhost:3055';
    process.env.TOOLJET_SESSION_TOKEN = 's';
    process.env.TOOLJET_PAT = 'tj_pat_x';
    expect(resolveTarget().kind).to.equal(undefined);
    delete process.env.TOOLJET_PAT;
    delete process.env.TOOLJET_WORKSPACE_ID;
    expect(() => resolveTarget()).to.throw(/TOOLJET_WORKSPACE_ID/);
  });
});
