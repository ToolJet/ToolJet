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
