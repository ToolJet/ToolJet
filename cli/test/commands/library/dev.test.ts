import nock = require('nock');
import { expect } from 'chai';
import * as inquirer from 'inquirer';
import { mock } from 'node:test';

import Dev from '../../../src/commands/library/dev';
import { ApiClient } from '../../../src/lib/library/api-client';
import { Auth } from '../../../src/lib/library/auth';
import { BuildResult } from '../../../src/lib/library/builder';
import { DevWatcher } from '../../../src/lib/library/dev-watcher';
import { ProjectConfig } from '../../../src/lib/library/project-config';
import { CLI_ROOT, instantiateCommand } from '../../helpers/run-command';

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

// run() never resolves by design (`await new Promise(() => {})` keeps the watcher
// alive), so these tests stub DevWatcher.start, capture the onRebuild callback
// dev.ts hands it, and invoke that callback directly. Nothing real is left
// running afterwards: the stubbed start() creates no chokidar watcher and no
// timers, so the abandoned run() promise holds no handles.
async function startDev(argv: string[] = []): Promise<{
  onRebuild: (result: BuildResult | { error: Error }) => Promise<void>;
  stdout: () => string;
  stopMock: ReturnType<typeof mock.fn>;
  signalListeners: NodeJS.SignalsListener[];
}> {
  const signalsBefore = new Set([...process.listeners('SIGINT'), ...process.listeners('SIGTERM')]);

  const writeMock = mock.method(process.stdout, 'write', () => true);
  const stopMock = mock.fn(async () => {});

  let captured: ((result: BuildResult | { error: Error }) => Promise<void>) | undefined;
  mock.method(DevWatcher, 'start', (options: { onRebuild: (r: BuildResult | { error: Error }) => Promise<void> }) => {
    captured = options.onRebuild;
    return { stop: stopMock };
  });

  void Dev.run(argv, CLI_ROOT);

  const deadline = Date.now() + 5000;
  while (!captured) {
    if (Date.now() > deadline) throw new Error('DevWatcher.start was never called');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const signalListeners = [...process.listeners('SIGINT'), ...process.listeners('SIGTERM')].filter(
    (listener) => !signalsBefore.has(listener)
  ) as NodeJS.SignalsListener[];

  // Reading the captured output also restores process.stdout.write. Unlike
  // runCommand(), this helper's mock has to outlive the call that installed it
  // (run() never returns), and leaving it installed past the test body would
  // swallow mocha's own reporter line for that test.
  let restored = false;

  return {
    onRebuild: captured,
    stdout: () => {
      const output = writeMock.mock.calls.map((c) => c.arguments[0]).join('');
      if (!restored) {
        restored = true;
        writeMock.mock.restore();
      }

      return output;
    },
    stopMock,
    signalListeners,
  };
}

function buildResult(overrides: Partial<BuildResult> = {}): BuildResult {
  return {
    distDir: '/tmp/dist',
    buildMs: 120,
    bundleSizeKb: 4,
    cssSizeKb: 0,
    hasCss: false,
    tsErrors: 0,
    tsErrorReport: '',
    componentCount: 1,
    warnings: [],
    ...overrides,
  };
}

describe('library dev - run() wiring', () => {
  let cleanupSignals: NodeJS.SignalsListener[] = [];

  beforeEach(() => {
    mock.method(Auth, 'resolveOrExit', () => ({ workspaceId: 'org-1', apiToken: 'token-abc', url: BASE_URL }));
    mock.method(ProjectConfig, 'readFileOrExit', () => CONFIG);
    mock.method(ApiClient.prototype, 'verifyLibrary', async () => ({ exists: true }));
  });

  afterEach(() => {
    // run() is never allowed to finish, so its SIGINT/SIGTERM handlers would
    // otherwise pile up on the shared process across tests.
    for (const listener of cleanupSignals) {
      process.removeListener('SIGINT', listener);
      process.removeListener('SIGTERM', listener);
    }
    cleanupSignals = [];
    mock.restoreAll();
  });

  it('announces the connected workspace and library before watching', async () => {
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    expect(dev.stdout()).to.include('Connected to org-1 workspace');
    expect(dev.stdout()).to.include('Library: My Library (dev track)');
    expect(dev.stdout()).to.include('Watching src/ for changes...');
  }).timeout(30000);

  it('reports the build time and uploads to the dev track on a successful rebuild', async () => {
    const uploadMock = mock.method(ApiClient.prototype, 'uploadDev', async () => ({ devUploadedAt: 'now' }));
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    await dev.onRebuild(buildResult({ distDir: '/tmp/some-dist' }));

    expect(dev.stdout()).to.include('Built in');
    expect(dev.stdout()).to.include('Uploaded to dev track');
    expect(uploadMock.mock.calls[0].arguments).to.deep.equal(['corr-1', '/tmp/some-dist']);
  }).timeout(30000);

  it('reports a build failure without attempting an upload', async () => {
    const uploadMock = mock.method(ApiClient.prototype, 'uploadDev', async () => {
      throw new Error('uploadDev should not be called after a failed build');
    });
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    await dev.onRebuild({ error: new Error('esbuild exploded') });

    expect(dev.stdout()).to.include('build failed - esbuild exploded');
    expect(uploadMock.mock.callCount()).to.equal(0);
  }).timeout(30000);

  it('prints the TypeScript error report but still uploads', async () => {
    const uploadMock = mock.method(ApiClient.prototype, 'uploadDev', async () => ({ devUploadedAt: 'now' }));
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    await dev.onRebuild(buildResult({ tsErrors: 2, tsErrorReport: 'TS2322: not assignable' }));

    expect(dev.stdout()).to.include('TypeScript compiled (2 errors)');
    expect(dev.stdout()).to.include('TS2322: not assignable');
    expect(uploadMock.mock.callCount()).to.equal(1);
  }).timeout(30000);

  it('prints manifest warnings but still uploads', async () => {
    const uploadMock = mock.method(ApiClient.prototype, 'uploadDev', async () => ({ devUploadedAt: 'now' }));
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    await dev.onRebuild(buildResult({ warnings: ['Prop "x" in component "C": initialValue is computed'] }));

    expect(dev.stdout()).to.include('Warning');
    expect(dev.stdout()).to.include('Prop "x" in component "C": initialValue is computed');
    expect(uploadMock.mock.callCount()).to.equal(1);
  }).timeout(30000);

  it('skips the upload when the manifest has no components', async () => {
    const uploadMock = mock.method(ApiClient.prototype, 'uploadDev', async () => {
      throw new Error('uploadDev should not be called with an empty manifest');
    });
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    await dev.onRebuild(buildResult({ componentCount: 0 }));

    expect(dev.stdout()).to.include('Skipping upload - no components found in manifest.');
    expect(uploadMock.mock.callCount()).to.equal(0);
  }).timeout(30000);

  it('reports an upload failure without crashing the watch loop', async () => {
    mock.method(ApiClient.prototype, 'uploadDev', async () => {
      throw new Error('502 Bad Gateway');
    });
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;

    await dev.onRebuild(buildResult());
    // A second rebuild still goes through, proving the failure didn't tear anything down.
    await dev.onRebuild(buildResult());

    expect(dev.stdout()).to.include('upload failed - 502 Bad Gateway');
  }).timeout(30000);

  it('awaits watcher.stop() before exiting on SIGINT', async () => {
    const dev = await startDev();
    cleanupSignals = dev.signalListeners;
    expect(dev.signalListeners).to.have.lengthOf(2); // SIGINT + SIGTERM

    let stopResolved = false;
    dev.stopMock.mock.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      stopResolved = true;
    });

    // Recorded rather than thrown: shutdown() is invoked as `void shutdown()`, so
    // throwing here would surface as an unhandled rejection instead of failing
    // the assertion. Nothing runs after process.exit(0) in shutdown() anyway.
    //
    // stopResolved is sampled *at the moment exit is called*, not afterwards —
    // checking it after the fact passes either way, since a non-awaited
    // watcher.stop() still resolves on its own before the assertions run.
    let exitCode: number | undefined;
    let stopHadResolvedAtExit: boolean | undefined;
    mock.method(process, 'exit', ((code?: number) => {
      exitCode = code;
      stopHadResolvedAtExit = stopResolved;
    }) as unknown as typeof process.exit);

    const [sigintListener] = dev.signalListeners;
    sigintListener('SIGINT');

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(stopResolved).to.be.true;
    expect(stopHadResolvedAtExit, 'process.exit was called before watcher.stop() finished').to.be.true;
    expect(exitCode).to.equal(0);
    expect(dev.stdout()).to.include('Stopping watcher');
  }).timeout(30000);
});
