import nock = require('nock');
import { expect } from 'chai';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';

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
  const writeStub = sinon.stub(process.stdout, 'write').returns(true);
  let exitCode: number | undefined;
  const exitStub = sinon.stub(process, 'exit').callsFake(((code?: number) => {
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
    writeStub.restore();
    exitStub.restore();
  }

  const stdout = writeStub
    .getCalls()
    .map((c) => c.args[0])
    .join('');
  return { result, stdout, exitCode };
}

describe('library dev - resolveTarget', () => {
  afterEach(() => sinon.restore());

  describe('stored login', () => {
    beforeEach(() => {
      sinon.stub(Auth, 'resolveOrExit').returns({ workspaceId: 'org-1', apiToken: 'token-abc', url: BASE_URL });
      sinon.stub(ProjectConfig, 'readFileOrExit').returns(CONFIG);
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

      const instance = await instantiateCommand(Dev);
      const { exitCode, stdout } = await callResolveTarget(instance, {});

      expect(exitCode).to.be.undefined;
      expect(stdout).to.include('Created library "My Library" on org-1 workspace');
    });

    it('aborts when the user declines to create the missing library', async () => {
      sinon.stub(inquirer, 'prompt').resolves({ confirmed: false });
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

      const instance = await instantiateCommand(Dev);
      const { exitCode, result } = await callResolveTarget(instance, { url: BASE_URL, token: 'flag-token' });

      expect(exitCode).to.be.undefined;
      expect(result).to.deep.equal({
        workspaceId: 'org-1',
        apiToken: 'flag-token',
        url: BASE_URL,
        config: CONFIG,
      });
      expect(authSpy.called).to.be.false;
    });
  });
});

describe('library dev - flag wiring', () => {
  afterEach(() => sinon.restore());

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
