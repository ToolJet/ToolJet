import { expect } from 'chai';
import nock = require('nock');

import { devBundleOwnerId } from '../../../src/lib/app/remote';
import { openSession } from '../../../src/lib/app/session';

/*
  The dev track keys each user's bundle by user id. The library list names builds by user id only, so the CLI finds its
  own by the id its session token carries, not by email.
*/

const jwt = (payload: Record<string, unknown>) =>
  ['h', Buffer.from(JSON.stringify(payload)).toString('base64url'), 's'].join('.');

describe('the dev bundle a build was uploaded to', () => {
  const url = 'https://tooljet.test';
  const token = jwt({ username: 'user-1', sub: 'dev@tooljet.io' });
  const session = () => openSession({ url, token, kind: 'session', workspaceId: 'w1' });
  afterEach(() => nock.cleanAll());

  it("is the signed-in user's, found by user id in a list without emails", async () => {
    nock(url)
      .get('/api/custom-component-libraries')
      .reply(200, [{ id: 'lib-1', devBundles: [{ userId: 'user-2' }, { userId: 'user-1' }] }]);
    const s = await session();
    expect(s.userId).to.equal('user-1');
    expect(await devBundleOwnerId(s, 'lib-1')).to.equal('user-1');
  });

  it('is not picked up yet while the list has only other people', async () => {
    nock(url)
      .get('/api/custom-component-libraries')
      .reply(200, [{ id: 'lib-1', devBundles: [{ userId: 'user-2' }] }]);
    const error = await devBundleOwnerId(await session(), 'lib-1').catch((e: Error) => e);
    expect((error as Error).message).to.include("hasn't picked up your upload");
  });

  it('falls back to the email an older server listed, for a token without a user id', async () => {
    nock(url)
      .get('/api/custom-component-libraries')
      .reply(200, [{ id: 'lib-1', devBundles: [{ userId: 'user-9', userEmail: 'Dev@tooljet.io' }] }]);
    const s = await openSession({ url, token: jwt({ sub: 'dev@tooljet.io' }), kind: 'session', workspaceId: 'w1' });
    expect(await devBundleOwnerId(s, 'lib-1')).to.equal('user-9');
  });
});
