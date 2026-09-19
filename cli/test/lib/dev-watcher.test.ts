import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';

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
  let buildStub: sinon.SinonStub;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-cli-watch-'));
    fs.mkdirSync(path.join(projectRoot, 'src'));
    buildStub = sinon.stub(builder, 'build');
  });

  afterEach(() => {
    sinon.restore();
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('runs an initial build on ready', async () => {
    buildStub.resolves(fakeResult());
    const onRebuild = sinon.stub().resolves();

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => onRebuild.callCount >= 1);
    await watcher.stop();

    expect(onRebuild.callCount).to.equal(1);
  });

  it('rebuilds once on a file change, after the debounce window', async () => {
    buildStub.resolves(fakeResult());
    const onRebuild = sinon.stub().resolves();

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 30, onRebuild });
    await waitUntil(() => onRebuild.callCount >= 1); // initial build

    fs.writeFileSync(path.join(projectRoot, 'src', 'a.ts'), 'export {}');
    await waitUntil(() => onRebuild.callCount >= 2);
    await watcher.stop();

    expect(onRebuild.callCount).to.equal(2);
  });

  it('collapses rapid successive changes within the debounce window into a single rebuild', async () => {
    buildStub.resolves(fakeResult());
    const onRebuild = sinon.stub().resolves();

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 100, onRebuild });
    await waitUntil(() => onRebuild.callCount >= 1); // initial build

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

    expect(onRebuild.callCount).to.equal(2);
  });

  it('reports build failures to onRebuild as an {error} result instead of throwing', async () => {
    buildStub.rejects(new Error('esbuild exploded'));
    const onRebuild = sinon.stub().resolves();

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => onRebuild.callCount >= 1);
    await watcher.stop();

    expect(onRebuild.firstCall.args[0]).to.have.property('error');
    expect((onRebuild.firstCall.args[0] as { error: Error }).error.message).to.equal('esbuild exploded');
  });

  it('does not crash the watcher if onRebuild itself throws while reporting an error', async () => {
    buildStub.rejects(new Error('esbuild exploded'));
    const onRebuild = sinon.stub().rejects(new Error('reporting also failed'));
    const consoleErrorStub = sinon.stub(console, 'error');

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => onRebuild.callCount >= 1);
    await watcher.stop();

    expect(consoleErrorStub.called).to.be.true;
  });

  it('stop() waits for an in-flight build/upload before resolving, and no further rebuilds happen after', async () => {
    let resolveBuild!: (r: BuildResult) => void;
    buildStub.onFirstCall().returns(
      new Promise<BuildResult>((resolve) => {
        resolveBuild = resolve;
      })
    );
    const onRebuild = sinon.stub().resolves();

    const watcher = DevWatcher.start({ projectRoot, debounceMs: 10, onRebuild });
    await waitUntil(() => buildStub.callCount >= 1); // initial build kicked off but not resolved yet

    const stopPromise = watcher.stop();
    let stopped = false;
    void stopPromise.then(() => (stopped = true));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(stopped).to.be.false; // stop() shouldn't resolve while the build is still in flight

    buildStub.resolves(fakeResult());
    resolveBuild(fakeResult());
    await stopPromise;

    expect(onRebuild.callCount).to.equal(1);

    // A file change right after stop() must not trigger another rebuild.
    fs.writeFileSync(path.join(projectRoot, 'src', 'late.ts'), 'export {}');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onRebuild.callCount).to.equal(1);
  });
});
