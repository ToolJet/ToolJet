import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mock } from 'node:test';

import { DevWatcher } from '../../src/lib/library/dev-watcher';
import * as builder from '../../src/lib/library/builder';
import { BuildResult } from '../../src/lib/library/builder';

function fakeResult(overrides: Partial<BuildResult> = {}): BuildResult {
  return {
    distDir: '/tmp/dist',
    buildMs: 1,
    bundleSizeKb: 1,
    cssSizeKb: 0,
    hasCss: false,
    tsErrors: 0,
    tsErrorReport: '',
    componentCount: 1,
    ...overrides,
  };
}

// Waits until `predicate()` is true or the timeout elapses (chokidar's fs
// watching + the command's own debounce are both async on real timers).
async function waitUntil(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitUntil timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe('DevWatcher', () => {
  let projectRoot: string;
  let buildMock: ReturnType<typeof mock.method>;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-cli-watch-'));
    fs.mkdirSync(path.join(projectRoot, 'src'));
    // A default implementation is mandatory: mock.method() without one calls
    // through to the real esbuild/TS build. Each test overrides it as needed.
    buildMock = mock.method(builder, 'build', async () => fakeResult());
  });

  afterEach(() => {
    mock.restoreAll();
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('runs an initial build on ready', async () => {
    buildMock.mock.mockImplementation(async () => fakeResult());
    const onRebuild = mock.fn(async (_result: BuildResult | { error: Error }) => {});

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => onRebuild.mock.callCount() >= 1);
    await watcher.stop();

    expect(onRebuild.mock.callCount()).to.equal(1);
  });

  it('rebuilds once on a file change, after the debounce window', async () => {
    buildMock.mock.mockImplementation(async () => fakeResult());
    const onRebuild = mock.fn(async (_result: BuildResult | { error: Error }) => {});

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 30, onRebuild });
    await waitUntil(() => onRebuild.mock.callCount() >= 1); // initial build

    fs.writeFileSync(path.join(projectRoot, 'src', 'a.ts'), 'export {}');
    await waitUntil(() => onRebuild.mock.callCount() >= 2);
    await watcher.stop();

    expect(onRebuild.mock.callCount()).to.equal(2);
  });

  it('collapses rapid successive changes within the debounce window into a single rebuild', async () => {
    buildMock.mock.mockImplementation(async () => fakeResult());
    const onRebuild = mock.fn(async (_result: BuildResult | { error: Error }) => {});

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 100, onRebuild });
    await waitUntil(() => onRebuild.mock.callCount() >= 1); // initial build

    const file = path.join(projectRoot, 'src', 'a.ts');
    fs.writeFileSync(file, 'export const a = 1;');
    await new Promise((resolve) => setTimeout(resolve, 20));
    fs.writeFileSync(file, 'export const a = 2;');
    await new Promise((resolve) => setTimeout(resolve, 20));
    fs.writeFileSync(file, 'export const a = 3;');

    // Give it more than the debounce window to settle, then confirm only one
    // extra rebuild happened (not three).
    await new Promise((resolve) => setTimeout(resolve, 400));
    await watcher.stop();

    expect(onRebuild.mock.callCount()).to.equal(2);
  });

  it('reports build failures to onRebuild as an {error} result instead of throwing', async () => {
    buildMock.mock.mockImplementation(async () => {
      throw new Error('esbuild exploded');
    });
    const onRebuild = mock.fn(async (_result: BuildResult | { error: Error }) => {});

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => onRebuild.mock.callCount() >= 1);
    await watcher.stop();

    expect(onRebuild.mock.calls[0].arguments[0]).to.have.property('error');
    expect((onRebuild.mock.calls[0].arguments[0] as { error: Error }).error.message).to.equal('esbuild exploded');
  });

  it('does not crash the watcher if onRebuild itself throws while reporting an error', async () => {
    buildMock.mock.mockImplementation(async () => {
      throw new Error('esbuild exploded');
    });
    const onRebuild = mock.fn(async (_result: BuildResult | { error: Error }) => {
      throw new Error('reporting also failed');
    });
    const consoleErrorMock = mock.method(console, 'error', () => {});

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => onRebuild.mock.callCount() >= 1);
    await watcher.stop();

    expect(consoleErrorMock.mock.callCount()).to.be.greaterThan(0);
  });

  it('stop() waits for an in-flight build/upload before resolving, and no further rebuilds happen after', async () => {
    let resolveBuild!: (r: BuildResult) => void;
    const deferred = new Promise<BuildResult>((resolve) => {
      resolveBuild = resolve;
    });
    buildMock.mock.mockImplementationOnce(() => deferred, 0);
    const onRebuild = mock.fn(async (_result: BuildResult | { error: Error }) => {});

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => buildMock.mock.callCount() >= 1); // initial build kicked off but not resolved yet

    const stopPromise = watcher.stop();
    let stopped = false;
    void stopPromise.then(() => (stopped = true));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(stopped).to.be.false; // stop() shouldn't resolve while the build is still in flight

    buildMock.mock.mockImplementation(async () => fakeResult());
    resolveBuild(fakeResult());
    await stopPromise;

    expect(onRebuild.mock.callCount()).to.equal(1);

    // A file change right after stop() must not trigger another rebuild.
    fs.writeFileSync(path.join(projectRoot, 'src', 'late.ts'), 'export {}');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onRebuild.mock.callCount()).to.equal(1);
  });
});
