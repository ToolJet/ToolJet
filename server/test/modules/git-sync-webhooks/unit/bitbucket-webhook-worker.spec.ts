/**
 * GitSyncWebhookWorker — the Bitbucket payload parsing inside the auto-sync worker.
 *
 * Bitbucket's payloads are shaped unlike GitHub's/GitLab's: no flat `ref` field, pushes (including
 * tag pushes and branch deletes) arrive as `push.changes[0]` with `new`/`old` nodes, and pull
 * requests live under `pullrequest` with state 'MERGED'. These tests pin that parsing — tag-push
 * detection, branch-name extraction, and the merged-PR decision. The worker is built via
 * Object.create; the DB/pull side effects (findBranch, pullViaService) are fakes. The end-to-end
 * decision flow for GitHub is covered in e2e/webhook-worker.spec.ts.
 *
 * @group gitsync
 */
import { GitSyncWebhookWorker } from '@ee/git-sync-webhooks/processors/git-sync-webhook.worker';

type TagPush = { tagName: string; commitHash: string | null } | null;
type Branch = { id: string; name: string; isDefault: boolean; lastSyncedCommit?: string };

/** Typed handles on the private helpers under test. */
type WorkerInternals = {
  extractTagPush(provider: string, payload: unknown): TagPush;
  extractBranchName(provider: string, event: string, payload: unknown): string | null;
  handlePullRequest(orgId: string, payload: unknown, provider: string): Promise<Record<string, unknown>>;
  findBranch: jest.Mock;
  pullViaService: jest.Mock;
};

const ORG = 'org-1';
const TAG = '0f8fad5b-d9cb-469f-a165-70867728950e/v1';

const buildWorker = (branches: Branch[] = []) => {
  const worker = Object.create(GitSyncWebhookWorker.prototype) as WorkerInternals;
  worker.findBranch = jest.fn(async (_org: string, name: string) => branches.find((b) => b.name === name) ?? null);
  worker.pullViaService = jest.fn().mockResolvedValue(undefined);
  return worker;
};

const pushChange = (change: Record<string, unknown>) => ({ push: { changes: [change] } });

describe('GitSyncWebhookWorker — bitbucket payloads', () => {
  describe('extractTagPush', () => {
    const worker = buildWorker();

    it('detects a created tag and its commit hash from push.changes[0].new', () => {
      const payload = pushChange({ new: { type: 'tag', name: TAG, target: { hash: 'abc123' } }, old: null });
      expect(worker.extractTagPush('bitbucket', payload)).toEqual({ tagName: TAG, commitHash: 'abc123' });
    });

    it('detects a deleted tag from push.changes[0].old, with no commit hash', () => {
      const payload = pushChange({ new: null, old: { type: 'tag', name: TAG, target: { hash: 'abc123' } } });
      expect(worker.extractTagPush('bitbucket', payload)).toEqual({ tagName: TAG, commitHash: null });
    });

    it('returns null for a branch push (not a tag push)', () => {
      const payload = pushChange({ new: { type: 'branch', name: 'main', target: { hash: 'abc' } } });
      expect(worker.extractTagPush('bitbucket', payload)).toBeNull();
    });

    it('returns null when the payload has no changes', () => {
      expect(worker.extractTagPush('bitbucket', {})).toBeNull();
    });

    it('does not read a GitHub-style `ref` for Bitbucket', () => {
      expect(worker.extractTagPush('bitbucket', { ref: `refs/tags/${TAG}`, after: 'abc' })).toBeNull();
    });
  });

  describe('extractBranchName', () => {
    const worker = buildWorker();

    it('push → the pushed branch from push.changes[0].new', () => {
      expect(worker.extractBranchName('bitbucket', 'push', pushChange({ new: { name: 'feat-1' } }))).toBe('feat-1');
    });

    it('pull_request → the destination branch', () => {
      const payload = { pullrequest: { destination: { branch: { name: 'main' } } } };
      expect(worker.extractBranchName('bitbucket', 'pull_request', payload)).toBe('main');
    });

    it('delete → the deleted branch from push.changes[0].old (new is null)', () => {
      const payload = pushChange({ new: null, old: { type: 'branch', name: 'feat-1' } });
      expect(worker.extractBranchName('bitbucket', 'delete', payload)).toBe('feat-1');
    });

    it('returns null for missing fields or an unknown event', () => {
      expect(worker.extractBranchName('bitbucket', 'push', {})).toBeNull();
      expect(worker.extractBranchName('bitbucket', 'delete', {})).toBeNull();
      expect(worker.extractBranchName('bitbucket', 'unknown', pushChange({ new: { name: 'x' } }))).toBeNull();
    });
  });

  describe('handlePullRequest', () => {
    const mergedPr = (overrides: Record<string, unknown> = {}) => ({
      pullrequest: {
        state: 'MERGED',
        destination: { branch: { name: 'main' } },
        source: { branch: { name: 'feat-1' }, commit: { hash: 'head-sha' } },
        ...overrides,
      },
    });
    const main: Branch = { id: 'b-main', name: 'main', isDefault: true };

    it.each(['OPEN', 'DECLINED', 'SUPERSEDED'])(
      'ignores a %s pull request (only MERGED is actionable)',
      async (state) => {
        const worker = buildWorker([main]);
        await expect(worker.handlePullRequest(ORG, mergedPr({ state }), 'bitbucket')).resolves.toEqual({
          action: 'ignored',
          reason: 'PR not merged',
        });
        expect(worker.pullViaService).not.toHaveBeenCalled();
      }
    );

    it('pulls the default branch when a PR is merged into it', async () => {
      const worker = buildWorker([main, { id: 'b-feat', name: 'feat-1', isDefault: false }]);

      await expect(worker.handlePullRequest(ORG, mergedPr(), 'bitbucket')).resolves.toEqual({
        action: 'pulled',
        branch: 'main',
        branchId: 'b-main',
        trigger: 'pr_merged',
      });
      expect(worker.pullViaService).toHaveBeenCalledWith(ORG, 'main', 'b-main');
    });

    it("flags selfOriginated when the source branch's last synced commit is the PR head", async () => {
      const worker = buildWorker([
        main,
        { id: 'b-feat', name: 'feat-1', isDefault: false, lastSyncedCommit: 'head-sha' },
      ]);

      await expect(worker.handlePullRequest(ORG, mergedPr(), 'bitbucket')).resolves.toMatchObject({
        action: 'pulled',
        selfOriginated: true,
      });
    });

    it('skips a PR merged into a non-default branch', async () => {
      const worker = buildWorker([main, { id: 'b-dev', name: 'develop', isDefault: false }]);
      const payload = mergedPr({ destination: { branch: { name: 'develop' } } });

      await expect(worker.handlePullRequest(ORG, payload, 'bitbucket')).resolves.toEqual({
        action: 'skipped',
        reason: 'PR merged into non-default branch "develop"',
      });
      expect(worker.pullViaService).not.toHaveBeenCalled();
    });

    it('skips a PR merged into a branch the workspace does not track', async () => {
      const worker = buildWorker([main]);
      const payload = mergedPr({ destination: { branch: { name: 'untracked' } } });

      await expect(worker.handlePullRequest(ORG, payload, 'bitbucket')).resolves.toEqual({
        action: 'skipped',
        reason: 'Target branch "untracked" not tracked',
      });
    });
  });
});
