import { expect } from 'chai';
import nock = require('nock');
import * as fs from 'fs';
import * as path from 'path';

import {
  CLI_VERSION,
  COMPATIBILITY_PATH,
  MIN_SERVER_CLI_API,
  SKIP_VERSION_CHECK_ENV,
  VersionMismatchError,
  compareVersions,
  ensureCompatible,
  resetCompatibilityChecks,
} from '../../src/lib/compatibility';
import { openSession } from '../../src/lib/app/session';
import { ApiClient } from '../../src/lib/library/api-client';

/* The CLI and the server release separately: before a command uses a server, each side's floor is checked. */

const url = 'https://tooljet.test';
const compatible = { serverVersion: '3.21.95', cliApiVersion: MIN_SERVER_CLI_API, minCliVersion: CLI_VERSION };

describe('compareVersions', () => {
  it('orders by major, minor and patch', () => {
    expect(compareVersions('1.2.3', '1.2.3')).to.equal(0);
    expect(compareVersions('1.2.3', '1.10.0')).to.be.below(0);
    expect(compareVersions('2.0.0', '1.99.99')).to.be.above(0);
  });

  it('puts a prerelease before its release, and orders prereleases', () => {
    expect(compareVersions('1.0.0-beta.1', '1.0.0')).to.be.below(0);
    expect(compareVersions('1.0.0', '1.0.0-beta.1')).to.be.above(0);
    expect(compareVersions('1.0.0-beta.2', '1.0.0-beta.10')).to.be.below(0);
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).to.be.below(0);
    expect(compareVersions('1.0.0-beta', '1.0.0-beta.1')).to.be.below(0);
  });

  it('never blocks on a version it cannot read', () => {
    expect(compareVersions('next', '1.0.0')).to.equal(0);
  });
});

describe('ensureCompatible', () => {
  const saved = process.env[SKIP_VERSION_CHECK_ENV];
  beforeEach(() => {
    delete process.env[SKIP_VERSION_CHECK_ENV];
    resetCompatibilityChecks();
  });
  afterEach(() => {
    process.env[SKIP_VERSION_CHECK_ENV] = saved;
    resetCompatibilityChecks();
  });

  const failure = (promise: Promise<unknown>) =>
    promise.then(
      () => undefined,
      (e: Error) => e
    );

  it('passes when the CLI and the server meet each other’s floor', async () => {
    nock(url).get(COMPATIBILITY_PATH).reply(200, compatible);
    await ensureCompatible(url);
  });

  it('asks for a CLI upgrade when the server needs a newer CLI', async () => {
    nock(url)
      .get(COMPATIBILITY_PATH)
      .reply(200, { ...compatible, minCliVersion: '99.0.0' });
    const error = await failure(ensureCompatible(url));
    expect(error).to.be.instanceOf(VersionMismatchError);
    expect(error!.message).to.include(`This ToolJet CLI (${CLI_VERSION}) is too old for ${url}, which needs 99.0.0`);
    expect(error!.message).to.include('npm i -g @tooljet/cli@latest');
  });

  it('asks for a ToolJet upgrade when the server speaks an older CLI API', async () => {
    nock(url)
      .get(COMPATIBILITY_PATH)
      .reply(200, { ...compatible, serverVersion: '3.16.40-lts', cliApiVersion: MIN_SERVER_CLI_API - 1 });
    const error = await failure(ensureCompatible(url));
    expect(error).to.be.instanceOf(VersionMismatchError);
    expect(error!.message).to.include(`ToolJet at ${url} (3.16.40-lts) is too old for this ToolJet CLI`);
    expect(error!.message).to.include(`npm i -g ${url}/api/code-mode/cli/tooljet-cli.tgz`);
  });

  it('treats a server without the check as too old', async () => {
    nock(url).get(COMPATIBILITY_PATH).reply(404, { message: 'Cannot GET' });
    const error = await failure(ensureCompatible(url));
    expect(error).to.be.instanceOf(VersionMismatchError);
    expect(error!.message).to.include(`ToolJet at ${url} is too old`);
  });

  it('leaves a server that fails or cannot be reached to the command’s own request', async () => {
    nock(url).get(COMPATIBILITY_PATH).reply(503, 'upgrading');
    await ensureCompatible(url);
    resetCompatibilityChecks();
    nock(url).get(COMPATIBILITY_PATH).replyWithError('ECONNREFUSED');
    await ensureCompatible(url);
  });

  it('checks each server once per command', async () => {
    nock(url).get(COMPATIBILITY_PATH).once().reply(200, compatible);
    await Promise.all([ensureCompatible(url), ensureCompatible(`${url}/`)]);
    await ensureCompatible(url);
  });

  it('is off with TOOLJET_SKIP_VERSION_CHECK=1', async () => {
    process.env[SKIP_VERSION_CHECK_ENV] = '1';
    await ensureCompatible(url); // no request: nock would refuse it
  });

  it('runs before the session exchange, so a mismatch never reaches the token', async () => {
    nock(url)
      .get(COMPATIBILITY_PATH)
      .reply(200, { ...compatible, minCliVersion: '99.0.0' });
    const error = await failure(openSession({ url, token: 'pat' }));
    expect(error).to.be.instanceOf(VersionMismatchError);
  });

  it('runs before the library client’s first request', async () => {
    nock(url)
      .get(COMPATIBILITY_PATH)
      .reply(200, { ...compatible, cliApiVersion: 0 });
    const error = await failure(new ApiClient(url, 'pat').login());
    expect(error).to.be.instanceOf(VersionMismatchError);
  });

  it('lets the request through when they match', async () => {
    nock(url).get(COMPATIBILITY_PATH).reply(200, compatible);
    nock(url).get('/api/personal-access-tokens/validate').reply(200, { email: 'me@example.com', organizationId: 'o1' });
    expect(await new ApiClient(url, 'pat').login()).to.deep.equal({ email: 'me@example.com', organizationId: 'o1' });
  });
});

describe('this CLI and the server in the same commit', () => {
  const constants = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'server', 'src', 'modules', 'app', 'constants', 'cli-compatibility.ts'),
    'utf8'
  );
  const read = (name: string) => /=\s*'?([^';\s]+)'?;/.exec(constants.split(`export const ${name}`)[1] ?? '')?.[1];

  it('work together, so raising one side’s floor needs the other side to meet it', () => {
    const minCliVersion = read('MIN_CLI_VERSION');
    const cliApiVersion = Number(read('CLI_API_VERSION'));
    expect(minCliVersion, 'MIN_CLI_VERSION').to.match(/^\d+\.\d+\.\d+/);
    expect(Number.isInteger(cliApiVersion), 'CLI_API_VERSION').to.equal(true);
    expect(compareVersions(CLI_VERSION, minCliVersion!)).to.be.at.least(0);
    expect(cliApiVersion).to.be.at.least(MIN_SERVER_CLI_API);
  });
});
