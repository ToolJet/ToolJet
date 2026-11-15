import { expect } from 'chai';
import nock = require('nock');

import { ApiClient } from '../../../src/lib/library/api-client';
import { devBundleOwnerId, findOrCreateLibrary } from '../../../src/lib/app/remote';
import { openSession, resolveTarget } from '../../../src/lib/app/session';

/*
  An MCP server a user connected with OAuth runs the CLI with that user's OAuth delegation in TOOLJET_SESSION_TOKEN.
  ToolJet takes a delegation only in the x-tooljet-delegation header (jwt.strategy.ts): sent as the tj_auth_token
  session cookie it is refused with 401, so every request must carry it in the header, with no cookie beside it.
*/

const jwt = (payload: Record<string, unknown>) =>
  ['h', Buffer.from(JSON.stringify(payload)).toString('base64url'), 's'].join('.');

const url = 'https://tooljet.test';
const delegation = jwt({ sub: 'user-1', oauthGrantId: 'g1', oauthTokenId: 't1', aud: 'tooljet:mcp:delegation' });
const delegationHeaders = { 'x-tooljet-delegation': delegation, 'tj-workspace-id': 'w1' };

describe('an OAuth delegation in TOOLJET_SESSION_TOKEN', () => {
  const keep = { ...process.env };
  afterEach(() => {
    nock.cleanAll();
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

  it('is resolved as a delegation when its audience is a list', () => {
    delete process.env.TOOLJET_PAT;
    delete process.env.TOOLJET_TOKEN;
    process.env.TOOLJET_URL = url;
    process.env.TOOLJET_SESSION_TOKEN = jwt({ sub: 'user-1', aud: ['tooljet:mcp:delegation'] });
    process.env.TOOLJET_WORKSPACE_ID = 'w1';
    expect(resolveTarget().kind).to.equal('delegation');
  });

  it('reaches the session API in the delegation header, without the session cookie', async () => {
    const scope = nock(url, { reqheaders: delegationHeaders, badheaders: ['cookie'] })
      .get('/api/code-mode-source/app-1/branch-draft')
      .reply(200, { ok: true });
    const session = await openSession({ url, token: delegation, kind: 'delegation', workspaceId: 'w1' });
    expect(await session.api('/code-mode-source/app-1/branch-draft')).to.deep.equal({ ok: true });
    expect(scope.isDone()).to.equal(true);
  });

  it('names the user by the subject, which is their id', async () => {
    const session = await openSession({ url, token: delegation, kind: 'delegation', workspaceId: 'w1' });
    expect(session.userId).to.equal('user-1');
    nock(url)
      .get('/api/custom-component-libraries')
      .reply(200, [{ id: 'lib-1', devBundles: [{ userId: 'user-2' }, { userId: 'user-1' }] }]);
    expect(await devBundleOwnerId(session, 'lib-1')).to.equal('user-1');
  });

  it('reaches the library routes in the delegation header', async () => {
    const scope = nock(url, { reqheaders: delegationHeaders, badheaders: ['cookie', 'authorization'] })
      .post('/api/custom-component-libraries/find-or-create')
      .reply(200, { id: 'lib-1', name: 'n', correlationId: 'c', created: true });
    const session = await openSession({ url, token: delegation, kind: 'delegation', workspaceId: 'w1' });
    await findOrCreateLibrary(session, 'c', 'n');
    expect(scope.isDone()).to.equal(true);
  });

  it('reaches the upload API in the delegation header', async () => {
    const scope = nock(url, { reqheaders: delegationHeaders, badheaders: ['cookie', 'authorization'] })
      .get('/api/custom-component-libraries/c')
      .reply(200, { exists: true });
    const client = new ApiClient(url, delegation, { workspaceId: 'w1', kind: 'delegation' });
    await client.verifyLibrary('c');
    expect(scope.isDone()).to.equal(true);
  });
});
