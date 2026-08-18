/** @group gitsync */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import simpleGit from 'simple-git';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';

/**
 * Regression test for the "delete one app wipes the whole repo" bug.
 *
 * When a workspace's local mirror is incomplete (apps that live in git were never pulled),
 * deleting one app must remove ONLY that app from git. The old path diffed the local DB against
 * git and `git rm`'d every app missing locally — so deleting the single synced app wiped all the
 * others. removeTargetedAppsFromRepo instead removes exactly the co_relation_ids it is given.
 *
 * We drive the real method against a real git repo and assert the blast radius is exactly the
 * targeted app(s). The method only touches `this.transactionLogger`, so we build a bare instance
 * off the prototype instead of wiring the full DI graph.
 */
describe('WorkspaceBranchService.removeTargetedAppsFromRepo — only the targeted app is removed', () => {
  let repo: string;

  const svc = Object.create(WorkspaceBranchService.prototype) as WorkspaceBranchService;

  (svc as any).transactionLogger = { log: () => {}, error: () => {} };

  const removeTargeted = (ids: string[]): Promise<void> => (svc as any).removeTargetedAppsFromRepo(repo, ids);

  const writeAppJson = (rel: string, coRelationId: string) => {
    const full = path.join(repo, rel, 'app', 'app.json');
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, JSON.stringify({ id: coRelationId, updatedAt: '2020-01-01T00:00:00.000Z' }));
  };

  const appDir = (rel: string) => path.join(repo, rel);
  const exists = (rel: string) => fs.existsSync(appDir(rel));

  // Remote-like repo: 10 apps + 2 modules committed. Mirrors "remote has 10 apps" from the report.
  beforeEach(async () => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-del-'));

    // Hard guard: this test runs real `git init`/`git commit`. A stray GIT_DIR/GIT_WORK_TREE
    // env var (leaked from the shell or another tool) makes git ignore cwd-based repo discovery
    // entirely and operate on whatever those vars point at - which once landed this test's seed
    // commit on top of the real repo's HEAD instead of the temp dir. Fail loud instead of silently
    // committing into the wrong repo.
    const realRepoRoot = path.resolve(__dirname, '../../../../../..');
    if (!path.resolve(repo).startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      throw new Error(`Expected an isolated tmpdir, got: ${repo}`);
    }
    if (process.env.GIT_DIR || process.env.GIT_WORK_TREE) {
      throw new Error(
        `Refusing to run - GIT_DIR/GIT_WORK_TREE is set in the environment and would redirect git commands away from the isolated ${repo} (would target ${realRepoRoot} instead)`
      );
    }

    for (let i = 1; i <= 10; i++) writeAppJson(`apps/app-${i}`, `corel-app-${i}`);
    writeAppJson('modules/mod-1', 'corel-mod-1');
    writeAppJson('modules/mod-2', 'corel-mod-2');

    const git = simpleGit({ baseDir: repo });
    await git.init();
    await git.addConfig('user.email', 'test@tooljet.io');
    await git.addConfig('user.name', 'test');
    await git.add('.');
    await git.commit('seed 10 apps + 2 modules');
  });

  afterEach(() => fs.rmSync(repo, { recursive: true, force: true }));

  it('removes ONLY the single deleted app, leaving the other 9 apps and all modules intact', async () => {
    await removeTargeted(['corel-app-3']);

    // The one deleted app is gone from the working tree…
    expect(exists('apps/app-3')).toBe(false);
    // …and every other app survives.
    for (const i of [1, 2, 4, 5, 6, 7, 8, 9, 10]) {
      expect(exists(`apps/app-${i}`)).toBe(true);
    }
    // Modules are a different resource type — untouched.
    expect(exists('modules/mod-1')).toBe(true);
    expect(exists('modules/mod-2')).toBe(true);

    // Git sees exactly one app's files staged for deletion, nothing else.
    const status = await simpleGit({ baseDir: repo }).status();
    expect(status.deleted).toContain('apps/app-3/app/app.json');
    expect(status.deleted.every((f) => f.startsWith('apps/app-3/'))).toBe(true);
  });

  it('removes exactly the targeted set across apps and modules in a coalesced burst', async () => {
    await removeTargeted(['corel-app-2', 'corel-app-9', 'corel-mod-1']);

    expect(exists('apps/app-2')).toBe(false);
    expect(exists('apps/app-9')).toBe(false);
    expect(exists('modules/mod-1')).toBe(false);

    // Untargeted resources remain.
    for (const i of [1, 3, 4, 5, 6, 7, 8, 10]) {
      expect(exists(`apps/app-${i}`)).toBe(true);
    }
    expect(exists('modules/mod-2')).toBe(true);
  });

  it('is a no-op for an empty id set — never touches the repo', async () => {
    await removeTargeted([]);

    for (let i = 1; i <= 10; i++) expect(exists(`apps/app-${i}`)).toBe(true);
    expect(exists('modules/mod-1')).toBe(true);
    expect(exists('modules/mod-2')).toBe(true);

    const status = await simpleGit({ baseDir: repo }).status();
    expect(status.deleted).toHaveLength(0);
  });

  it('ignores unknown co_relation_ids without removing anything', async () => {
    await removeTargeted(['corel-does-not-exist']);

    for (let i = 1; i <= 10; i++) expect(exists(`apps/app-${i}`)).toBe(true);
    const status = await simpleGit({ baseDir: repo }).status();
    expect(status.deleted).toHaveLength(0);
  });
});
