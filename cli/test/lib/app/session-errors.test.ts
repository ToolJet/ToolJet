import { expect } from 'chai';
import nock = require('nock');

import { findOrCreateLibrary } from '../../../src/lib/app/remote';
import { openSession } from '../../../src/lib/app/session';
import { ApiClient } from '../../../src/lib/library/api-client';

/* A plan error (451) means something else on another server: an HTTP error says which server answered. */

describe('HTTP errors name the server', () => {
  const url = 'https://tooljet.test';
  const body = JSON.stringify({ message: 'This feature is not included in this plan' });
  const session = () => openSession({ url, token: 'jwt', kind: 'session', workspaceId: 'w1' });

  it('the app routes', async () => {
    nock(url).get('/api/apps/a1').reply(451, body);
    const error = await (await session()).api('/apps/a1').catch((e: Error) => e);
    expect((error as Error).message).to.equal(
      `GET /apps/a1 failed (HTTP 451) on ${url}: This feature is not included in this plan`
    );
  });

  it('the library routes', async () => {
    nock(url).post('/api/custom-component-libraries/find-or-create').reply(451, body);
    const error = await findOrCreateLibrary(await session(), 'c1', 'Orders').catch((e: Error) => e);
    expect((error as Error).message).to.include(`(HTTP 451) on ${url}:`);
  });

  it('the session exchange', async () => {
    nock(url).post('/api/personal-access-tokens/session').reply(451, body);
    const error = await openSession({ url, token: 'pat' }).catch((e: Error) => e);
    expect((error as Error).message).to.include(url);
  });

  it('the upload client', async () => {
    nock(url).get('/api/custom-component-libraries/c1').reply(451, body);
    const error = await new ApiClient(url, 'pat').verifyLibrary('c1').catch((e: Error) => e);
    expect((error as Error).message).to.include(`(on ${url})`);
  });

  describe('when TOOLJET_URL chose the server', () => {
    const saved = process.env.TOOLJET_URL;
    afterEach(() => {
      if (saved === undefined) delete process.env.TOOLJET_URL;
      else process.env.TOOLJET_URL = saved;
    });

    it('says so when that server rejects the token, as it overrides the login', async () => {
      process.env.TOOLJET_URL = `${url}/`;
      nock(url).post('/api/personal-access-tokens/session').reply(401, '{}');
      const error = await openSession({ url, token: 'pat' }).catch((e: Error) => e);
      expect((error as Error).message).to.contain('TOOLJET_URL is set in your environment');
    });

    it('says so when that server cannot be reached', async () => {
      process.env.TOOLJET_URL = url;
      nock(url).post('/api/personal-access-tokens/session').replyWithError('connect ECONNREFUSED');
      const error = await openSession({ url, token: 'pat' }).catch((e: Error) => e);
      expect((error as Error).message).to.match(/Could not reach ToolJet.*TOOLJET_URL is set in your environment/);
    });

    it('stays quiet when the server came from elsewhere', async () => {
      delete process.env.TOOLJET_URL;
      nock(url).post('/api/personal-access-tokens/session').reply(401, '{}');
      const error = await openSession({ url, token: 'pat' }).catch((e: Error) => e);
      expect((error as Error).message).to.not.contain('TOOLJET_URL');
    });
  });
});
