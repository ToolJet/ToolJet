import nock = require('nock');
import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ApiClient } from '../../src/lib/library/api-client';

const BASE_URL = 'https://app.tooljet.test';
const TOKEN = 'test-token-123';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient(BASE_URL, TOKEN);
  });

  it('sends the Authorization bearer header on every request', async () => {
    const scope = nock(BASE_URL, { reqheaders: { authorization: `Bearer ${TOKEN}` } })
      .get('/api/personal-access-tokens/validate')
      .reply(200, { email: 'me@example.com', organizationId: 'org-1' });

    await client.login();

    expect(scope.isDone()).to.be.true;
  });

  describe('login', () => {
    it('resolves with email/organizationId on success', async () => {
      nock(BASE_URL).get('/api/personal-access-tokens/validate').reply(200, {
        email: 'me@example.com',
        organizationId: 'org-1',
      });

      const result = await client.login();

      expect(result).to.deep.equal({ email: 'me@example.com', organizationId: 'org-1' });
    });

    it('throws the parsed API error message on failure', async () => {
      nock(BASE_URL)
        .get('/api/personal-access-tokens/validate')
        .reply(401, { statusCode: 401, message: 'Invalid CLI token' });

      await expect(client.login()).to.be.rejectedWith('Invalid CLI token');
    });
  });

  describe('createLibrary', () => {
    it('POSTs to /custom-component-libraries with the given name', async () => {
      const scope = nock(BASE_URL)
        .post('/api/custom-component-libraries', { name: 'My Library' })
        .reply(201, { id: 'id-1', name: 'My Library', correlationId: 'corr-1' });

      const result = await client.createLibrary('My Library');

      expect(result).to.deep.equal({ id: 'id-1', name: 'My Library', correlationId: 'corr-1' });
      expect(scope.isDone()).to.be.true;
    });
  });

  describe('verifyLibrary', () => {
    it('returns exists:true on a 200 response', async () => {
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(200, {});

      expect(await client.verifyLibrary('corr-1')).to.deep.equal({ exists: true });
    });

    it('returns exists:false on a 404, instead of throwing', async () => {
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(404, {});

      expect(await client.verifyLibrary('corr-1')).to.deep.equal({ exists: false });
    });

    it('throws on other error statuses', async () => {
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(500, { message: 'Internal error' });

      await expect(client.verifyLibrary('corr-1')).to.be.rejectedWith('Internal error');
    });
  });

  describe('findOrCreateLibrary', () => {
    it('POSTs correlationId + name and returns the resolved library', async () => {
      const scope = nock(BASE_URL)
        .post('/api/custom-component-libraries/find-or-create', { correlationId: 'corr-1', name: 'My Library' })
        .reply(200, {
          id: 'id-1',
          name: 'My Library',
          correlationId: 'corr-1',
          created: true,
          organizationId: 'org-1',
        });

      const result = await client.findOrCreateLibrary('corr-1', 'My Library');

      expect(result.created).to.be.true;
      expect(scope.isDone()).to.be.true;
    });
  });

  describe('uploadDev / publishRevision (multipart)', () => {
    let distDir: string;

    beforeEach(() => {
      distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-cli-dist-'));
      fs.writeFileSync(path.join(distDir, 'index.js'), 'console.log(1);');
      fs.writeFileSync(path.join(distDir, 'manifest.json'), '{"components":{}}');
    });

    afterEach(() => fs.rmSync(distDir, { recursive: true, force: true }));

    it('uploadDev POSTs the built bundle to the dev endpoint', async () => {
      const scope = nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/dev')
        .reply(200, { devUploadedAt: '2026-01-01T00:00:00.000Z' });

      const result = await client.uploadDev('corr-1', distDir);

      expect(result).to.deep.equal({ devUploadedAt: '2026-01-01T00:00:00.000Z' });
      expect(scope.isDone()).to.be.true;
    });

    it('publishRevision POSTs the built bundle + version to the revisions endpoint', async () => {
      const scope = nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(201, { id: 'rev-1', version: '1.0.0', bundleUrl: 'https://cdn/x' });

      const result = await client.publishRevision('corr-1', distDir, '1.0.0', 'Initial release');

      expect(result.version).to.equal('1.0.0');
      expect(scope.isDone()).to.be.true;
    });

    it('publishRevision surfaces the parsed API error on failure (e.g. duplicate version)', async () => {
      nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(409, { message: 'Version 1.0.0 already exists' });

      await expect(client.publishRevision('corr-1', distDir, '1.0.0')).to.be.rejectedWith(
        'Version 1.0.0 already exists'
      );
    });
  });
});
