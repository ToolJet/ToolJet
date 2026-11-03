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
});
