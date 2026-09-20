import nock = require('nock');
import { expect } from 'chai';
import * as inquirer from 'inquirer';
import { mock } from 'node:test';

import Dev from '../../../src/commands/library/dev';
import { Auth } from '../../../src/lib/library/auth';
import { ProjectConfig } from '../../../src/lib/library/project-config';
import { instantiateCommand } from '../../helpers/run-command';

const BASE_URL = 'https://app.tooljet.test';
const CONFIG = { libraryName: 'My Library', correlationId: 'corr-1' };

class ExitSignal extends Error {}

// resolveTarget() takes only { url?, token? } and doesn't depend on argv parsing,
// so it's called directly here rather than driving the whole (infinite) run().
async function callResolveTarget(
  instance: Dev,
  flags: { url?: string; token?: string }
): Promise<{ result?: unknown; stdout: string; exitCode?: number }> {
  const writeMock = mock.method(process.stdout, 'write', () => true);
  let exitCode: number | undefined;
  const exitMock = mock.method(process, 'exit', ((code?: number) => {
    exitCode = code ?? 0;
    throw new ExitSignal();
  }) as unknown as typeof process.exit);

  let result: unknown;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (instance as any).resolveTarget(flags);
  } catch (err) {
    if (!(err instanceof ExitSignal)) throw err;
  } finally {
    writeMock.mock.restore();
    exitMock.mock.restore();
  }

  const stdout = writeMock.mock.calls.map((c) => c.arguments[0]).join('');
  return { result, stdout, exitCode };
}

describe('library dev - resolveTarget', () => {
  afterEach(() => mock.restoreAll());

  describe('stored login', () => {
    beforeEach(() => {
      mock.method(Auth, 'resolveOrExit', () => ({ workspaceId: 'org-1', apiToken: 'token-abc', url: BASE_URL }));
      mock.method(ProjectConfig, 'readFileOrExit', () => CONFIG);
    });

    it('resolves directly when the library exists', async () => {
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(200, {});

      const instance = await instantiateCommand(Dev);
      const { result, exitCode } = await callResolveTarget(instance, {});

      expect(exitCode).to.be.undefined;
      expect(result).to.deep.equal({
        workspaceId: 'org-1',
        apiToken: 'token-abc',
        url: BASE_URL,
        config: CONFIG,
      });
    });

    it('creates the library after confirmation when missing', async () => {
      mock.method(inquirer, 'prompt', async () => ({ confirmed: true }));
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

      const instance = await instantiateCommand(Dev);
      const { exitCode, stdout } = await callResolveTarget(instance, {});

      expect(exitCode).to.be.undefined;
      expect(stdout).to.include('Created library "My Library" on org-1 workspace');
    });

    it('aborts when the user declines to create the missing library', async () => {
      mock.method(inquirer, 'prompt', async () => ({ confirmed: false }));
      nock(BASE_URL).get('/api/custom-component-libraries/corr-1').reply(404);

      const instance = await instantiateCommand(Dev);
      const { exitCode, stdout } = await callResolveTarget(instance, {});

      expect(exitCode).to.equal(1);
      expect(stdout).to.include('Aborted — library not created.');
    });
  });

  describe('--url/--token', () => {
    it('requires both flags together', async () => {
      const instance = await instantiateCommand(Dev);
      const { exitCode, stdout } = await callResolveTarget(instance, { url: BASE_URL });

      expect(exitCode).to.equal(1);
      expect(stdout).to.include('--url and --token must be provided together');
    });

    it('bypasses stored login entirely', async () => {
      mock.method(ProjectConfig, 'readFileOrExit', () => CONFIG);
      // The no-op implementation is required: mock.method() without one calls
      // through to the real Auth.resolveOrExit (real fs access) if this branch
      // has a bug that reaches it.
      const authMock = mock.method(Auth, 'resolveOrExit', () => {
        throw new Error('Auth.resolveOrExit should not be called on the --url/--token path');
      });

      nock(BASE_URL)
        .post('/api/custom-component-libraries/find-or-create', { correlationId: 'corr-1', name: 'My Library' })
        .reply(200, {
          id: 'id-1',
          name: 'My Library',
          correlationId: 'corr-1',
          created: false,
          organizationId: 'org-1',
        });

      const instance = await instantiateCommand(Dev);
      const { exitCode, result } = await callResolveTarget(instance, { url: BASE_URL, token: 'flag-token' });

      expect(exitCode).to.be.undefined;
      expect(result).to.deep.equal({
        workspaceId: 'org-1',
        apiToken: 'flag-token',
        url: BASE_URL,
        config: CONFIG,
      });
      expect(authMock.mock.callCount()).to.equal(0);
    });
  });
});

describe('library dev - flag wiring', () => {
  afterEach(() => mock.restoreAll());

  // run() blocks forever once it starts the watcher (`await new Promise(() => {})`),
  // so flag parsing is checked directly via the instance's own parse() rather than
  // driving run() itself — that keeps this test from ever leaving a dangling,
  // still-running command behind once it completes.
  it('defaults --debounce to 300', async () => {
    const instance = await instantiateCommand(Dev);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { flags } = await (instance as any).parse(Dev);

    expect(flags.debounce).to.equal(300);
    expect(flags.url).to.be.undefined;
    expect(flags.token).to.be.undefined;
  });

  it('parses --debounce, --url, and --token', async () => {
    const instance = await instantiateCommand(Dev, ['--debounce', '500', '--url', BASE_URL, '--token', 'flag-token']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { flags } = await (instance as any).parse(Dev);

    expect(flags).to.deep.include({ debounce: 500, url: BASE_URL, token: 'flag-token' });
  });
});
