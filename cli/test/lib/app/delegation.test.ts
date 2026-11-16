import { expect } from 'chai';
import * as fs from 'fs';
import nock = require('nock');
import * as os from 'os';
import * as path from 'path';

import { ApiClient } from '../../../src/lib/library/api-client';
import { devBundleOwnerId, findOrCreateLibrary } from '../../../src/lib/app/remote';
import { openSession, resolveTarget } from '../../../src/lib/app/session';

/*
  An MCP server a user connected with OAuth runs the CLI with that user's OAuth delegation in TOOLJET_SESSION_TOKEN.
  ToolJet takes a delegation only in the x-tooljet-delegation header (jwt.strategy.ts): sent as the tj_auth_token
  session cookie it is refused with 401, so every request must carry it in the header, with no cookie beside it.
  The root hook (test/setup.ts) fails a test that leaves a faked route unused, so each route below is really called.
*/

const jwt = (payload: Record<string, unknown>) =>
  ['h', Buffer.from(JSON.stringify(payload)).toString('base64url'), 's'].join('.');

const url = 'https://tooljet.test';
const delegation = jwt({ sub: 'user-1', oauthGrantId: 'g1', oauthTokenId: 't1', aud: 'tooljet:mcp:delegation' });
const delegationHeaders = { 'x-tooljet-delegation': delegation, 'tj-workspace-id': 'w1' };
const asDelegation = { reqheaders: delegationHeaders, badheaders: ['cookie', 'authorization'] };
const delegated = () => openSession({ url, token: delegation, kind: 'delegation', workspaceId: 'w1' });

describe('an OAuth delegation in TOOLJET_SESSION_TOKEN', () => {
  const keep = { ...process.env };
  afterEach(() => {
    for (const k of ['TOOLJET_URL', 'TOOLJET_PAT', 'TOOLJET_TOKEN', 'TOOLJET_SESSION_TOKEN', 'TOOLJET_WORKSPACE_ID']) {
      if (keep[k] === undefined) delete process.env[k];
      else process.env[k] = keep[k];
    }
  });

  it('is resolved as a delegation, not a session', () => {
    delete process.env.TOOLJET_PAT;
    delete process.env.TOOLJET_TOKEN;
    process.env.TOOLJET_URL = url;
    process.env.TOOLJET_SESSION_TOKEN = delegation;
    process.env.TOOLJET_WORKSPACE_ID = 'w1';
    expect(resolveTarget()).to.deep.equal({ url, token: delegation, kind: 'delegation', workspaceId: 'w1' });
  });

  it('reaches the session API in the delegation header, without the session cookie', async () => {
    nock(url, asDelegation).get('/api/code-mode-source/app-1/branch-draft').reply(200, { ok: true });
    const session = await delegated();
    expect(await session.api('/code-mode-source/app-1/branch-draft')).to.deep.equal({ ok: true });
  });

  it('leaves a session travelling as the cookie, never in the delegation header', async () => {
    const token = jwt({ username: 'user-1', sub: 'dev@tooljet.io' });
    nock(url, {
      reqheaders: { cookie: `tj_auth_token=${token}`, 'tj-workspace-id': 'w1' },
      badheaders: ['x-tooljet-delegation'],
    })
      .get('/api/code-mode-source/app-1/branch-draft')
      .reply(200, { ok: true });
    const session = await openSession({ url, token, kind: 'session', workspaceId: 'w1' });
    expect(await session.api('/code-mode-source/app-1/branch-draft')).to.deep.equal({ ok: true });
  });

  it('names the user by the subject, which is their id', async () => {
    const session = await delegated();
    expect(session.userId).to.equal('user-1');
    nock(url, asDelegation)
      .get('/api/custom-component-libraries')
      .reply(200, [{ id: 'lib-1', devBundles: [{ userId: 'user-2' }, { userId: 'user-1' }] }]);
    expect(await devBundleOwnerId(session, 'lib-1')).to.equal('user-1');
  });

  it('reaches the library routes in the delegation header', async () => {
    nock(url, asDelegation)
      .post('/api/custom-component-libraries/find-or-create')
      .reply(200, { id: 'lib-1', name: 'n', correlationId: 'c', created: true });
    expect((await findOrCreateLibrary(await delegated(), 'c', 'n')).id).to.equal('lib-1');
  });

  it("uploads a build to the app's library in the delegation header", async () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-dist-'));
    fs.writeFileSync(path.join(dist, 'index.js'), 'export {};');
    fs.writeFileSync(path.join(dist, 'manifest.json'), '{}');
    nock(url, asDelegation).post('/api/custom-component-libraries/c/dev').reply(201, { devUploadedAt: 'now' });
    try {
      const client = new ApiClient(url, delegation, { workspaceId: 'w1', kind: 'delegation' });
      expect(await client.uploadDev('c', dist)).to.deep.equal({ devUploadedAt: 'now' });
    } finally {
      fs.rmSync(dist, { recursive: true, force: true });
    }
  });

  it('refuses a redirect, which would carry the delegation to another host', async () => {
    nock(url)
      .get('/api/code-mode-source/app-1/branch-draft')
      .reply(302, undefined, { Location: 'https://elsewhere.test/api/x' });
    nock(url)
      .get('/api/custom-component-libraries/c')
      .reply(302, undefined, { Location: 'https://elsewhere.test/api/x' });
    const session = await delegated();
    const client = new ApiClient(url, delegation, { workspaceId: 'w1', kind: 'delegation' });
    for (const call of [session.api('/code-mode-source/app-1/branch-draft'), client.verifyLibrary('c')]) {
      const error = await call.then(
        () => undefined,
        (e: Error) => e
      );
      expect(error?.message).to.match(/redirect mode is set to error/);
    }
  });

  it('says the OAuth access may have run out when ToolJet answers 401', async () => {
    nock(url, asDelegation).get('/api/code-mode-source/app-1/branch-draft').reply(401, { message: 'Unauthorized' });
    const session = await delegated();
    const error = await session.api('/code-mode-source/app-1/branch-draft').then(
      () => undefined,
      (e: Error) => e
    );
    expect(error?.message)
      .to.include('failed (HTTP 401)')
      .and.to.include("The OAuth connection's access may have expired");
  });
});
