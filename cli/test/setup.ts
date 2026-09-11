import nock = require('nock');
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');

chai.use(
  (chaiAsPromised as unknown as { default: Chai.ChaiPlugin }).default ?? (chaiAsPromised as unknown as Chai.ChaiPlugin)
);

// Exported as `mochaHooks` (mocha's root-hook-plugin convention for files loaded
// via `--require`/.mocharc `require:`) rather than calling before/after at the
// top level, since the BDD globals aren't defined yet at require-time.
export const mochaHooks = {
  beforeAll(): void {
    nock.disableNetConnect();
    // upload-form tests spin up a real local HTTP server to inspect the
    // multipart body on the wire — only loopback connections are allowed through.
    nock.enableNetConnect(/^127\.0\.0\.1/);
  },

  afterEach(): void {
    if (!nock.isDone()) {
      const pending = nock.pendingMocks();
      nock.cleanAll();
      throw new Error(`Not all nock interceptors were used:\n${pending.join('\n')}`);
    }
    nock.cleanAll();
  },

  afterAll(): void {
    nock.enableNetConnect();
  },
};
