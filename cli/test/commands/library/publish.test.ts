import nock = require('nock');
import { expect } from 'chai';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';

import ComponentPublish from '../../../src/commands/library/publish';
import { Auth } from '../../../src/lib/library/auth';
import { ProjectConfig } from '../../../src/lib/library/project-config';
import { runCommand } from '../../helpers/run-command';
import {
  withTempCwd,
  writeValidProjectFixture,
  writeTsErrorProjectFixture,
  writeEmptyProjectFixture,
} from '../../helpers/fixtures';

const BASE_URL = 'https://app.tooljet.test';
const CONFIG = { libraryName: 'My Library', correlationId: 'corr-1' };

describe('library publish', () => {
  const cwd = withTempCwd();
  afterEach(() => sinon.restore());

  it('rejects a malformed --version before touching auth, build, or network', async () => {
    const result = await runCommand(ComponentPublish, ['--version', '1.2.3.4']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('--version must be in the format');
  });

  it('rejects a version with a leading zero (e.g. "01")', async () => {
    const result = await runCommand(ComponentPublish, ['--version', '01']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('--version must be in the format');
  });

  it('accepts a bare "0" as a valid version segment', async () => {
    // Only checks that "0" clears the flag-format validation itself, without
    // going through a real build/publish — verifyLibrary is left unmocked so
    // resolveTarget fails fast right after validation passes.
    writeValidProjectFixture(cwd.get());
    sinon.stub(Auth, 'resolveOrExit').returns({ workspaceId: 'org-1', apiToken: 'token-abc', url: BASE_URL });
    sinon.stub(ProjectConfig, 'readFileOrExit').returns(CONFIG);
    nock(BASE_URL).get('/api/custom-component-libraries/corr-1').replyWithError('stop here');

    const result = await runCommand(ComponentPublish, ['--version', '0']);

    expect(result.stdout).to.not.include('--version must be in the format');
  });

  describe('resolveTarget (stored login)', () => {
    beforeEach(() => {
      writeValidProjectFixture(cwd.get());
      sinon.stub(Auth, 'resolveOrExit').returns({ workspaceId: 'org-1', apiToken: 'token-abc', url: BASE_URL });
      sinon.stub(ProjectConfig, 'readFileOrExit').returns(CONFIG);
    });

    it('publishes directly when the library already exists in the workspace', async () => {
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(200, {});
      nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(201, { id: 'rev-1', version: '1.0.0', bundleUrl: 'x' });

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0']);

      expect(result.exitCode).to.be.undefined;
      expect(result.stdout).to.include('Published as 1.0.0 on org-1 workspace');
    }).timeout(30000);

    it('prompts to create the library when missing, then publishes after confirmation', async () => {
      sinon.stub(inquirer, 'prompt').resolves({ confirmed: true });
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(404);
      nock(BASE_URL)
        .post('/api/custom-component-libraries/find-or-create', { correlationId: 'corr-1', name: 'My Library' })
        .reply(200, {
          id: 'id-1',
          name: 'My Library',
          correlationId: 'corr-1',
          created: true,
          organizationId: 'org-1',
        });
      nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(201, { id: 'rev-1', version: '1.0.0', bundleUrl: 'x' });

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0']);

      expect(result.exitCode).to.be.undefined;
      expect(result.stdout).to.include('Created library "My Library" on org-1 workspace');
    }).timeout(30000);

    it('aborts without publishing when the user declines to create the missing library', async () => {
      sinon.stub(inquirer, 'prompt').resolves({ confirmed: false });
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(404);

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0']);

      expect(result.exitCode).to.equal(1);
      expect(result.stdout).to.include('Aborted — library not created.');
    });

    it('exits 1 when verifyLibrary fails', async () => {
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').replyWithError('network down');

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0']);

      expect(result.exitCode).to.equal(1);
    });
  });

  describe('resolveTarget (--url/--token)', () => {
    beforeEach(() => writeValidProjectFixture(cwd.get()));

    it('requires --url and --token to be provided together', async () => {
      const result = await runCommand(ComponentPublish, ['--version', '1.0.0', '--url', BASE_URL]);

      expect(result.exitCode).to.equal(1);
      expect(result.stdout).to.include('--url and --token must be provided together');
    });

    it('rejects an invalid --url without making any network call', async () => {
      const result = await runCommand(ComponentPublish, ['--version', '1.0.0', '--url', 'not-a-url', '--token', 'tok']);

      expect(result.exitCode).to.equal(1);
    });

    it('bypasses stored login and finds/creates the library directly', async () => {
      sinon.stub(ProjectConfig, 'readFileOrExit').returns(CONFIG);
      // Stubbed rather than spied: if this branch has a bug that calls it after all,
      // a spy would fall through to the real implementation (real fs access).
      const authSpy = sinon.stub(Auth, 'resolveOrExit');

      nock(BASE_URL)
        .post('/api/custom-component-libraries/find-or-create', { correlationId: 'corr-1', name: 'My Library' })
        .reply(200, {
          id: 'id-1',
          name: 'My Library',
          correlationId: 'corr-1',
          created: false,
          organizationId: 'org-1',
        });
      nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(201, { id: 'rev-1', version: '1.0.0', bundleUrl: 'x' });

      const result = await runCommand(ComponentPublish, [
        '--version',
        '1.0.0',
        '--url',
        BASE_URL,
        '--token',
        'flag-token',
      ]);

      expect(result.exitCode).to.be.undefined;
      expect(result.stdout).to.include('Found existing library on org-1 workspace');
      expect(authSpy.called).to.be.false;
    }).timeout(30000);
  });

  describe('build gating', () => {
    beforeEach(() => {
      sinon.stub(Auth, 'resolveOrExit').returns({ workspaceId: 'org-1', apiToken: 'token-abc', url: BASE_URL });
      sinon.stub(ProjectConfig, 'readFileOrExit').returns(CONFIG);
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(200, {});
    });

    it('aborts before uploading when the build has TS errors and --skip-type-check is not set', async () => {
      writeTsErrorProjectFixture(cwd.get());

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0']);

      expect(result.exitCode).to.equal(1);
      expect(result.stdout).to.include('Aborting - build reported');
    }).timeout(30000);

    it('publishes despite TS errors when --skip-type-check is set', async () => {
      writeTsErrorProjectFixture(cwd.get());
      nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(201, { id: 'rev-1', version: '1.0.0', bundleUrl: 'x' });

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0', '--skip-type-check']);

      expect(result.exitCode).to.be.undefined;
      expect(result.stdout).to.include('Published as 1.0.0 on org-1 workspace');
    }).timeout(30000);

    it('aborts when the build has zero components, regardless of --skip-type-check', async () => {
      writeEmptyProjectFixture(cwd.get());

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0', '--skip-type-check']);

      expect(result.exitCode).to.equal(1);
      expect(result.stdout).to.include('Aborting - no components found');
    }).timeout(30000);

    it('surfaces the parsed API error when publishRevision fails (e.g. duplicate version)', async () => {
      writeValidProjectFixture(cwd.get());
      nock(BASE_URL)
        .post('/api/custom-component-libraries/corr-1/revisions')
        .reply(409, { message: 'Version 1.0.0 already exists' });

      const result = await runCommand(ComponentPublish, ['--version', '1.0.0']);

      expect(result.exitCode).to.equal(1);
      expect(result.stdout).to.include('Version 1.0.0 already exists');
    }).timeout(30000);
  });
});
