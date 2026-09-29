/** @group gitsync */
import { GitSyncWebhookService } from '@ee/git-sync-webhooks/services/git-sync-webhook.service';

// Only the pure payload-summary / branch-extraction helpers are exercised here — the
// queue/DB paths (enqueue/recordEvent) are covered by the webhook e2e. Construct with no
// injected deps since these helpers don't touch `this`.
const svc = new (GitSyncWebhookService as any)() as any;

describe('GitSyncWebhookService (pure payload helpers)', () => {
  describe('extractPayloadSummary', () => {
    it('github push → ref/before/after/pusher/commit-count (no diffs)', () => {
      const summary = svc.extractPayloadSummary('github', 'push', {
        ref: 'refs/heads/main',
        before: 'aaa',
        after: 'bbb',
        pusher: { name: 'dev' },
        commits: [{}, {}, {}],
      });
      expect(summary).toEqual({ ref: 'refs/heads/main', before: 'aaa', after: 'bbb', pusher: 'dev', commits: 3 });
    });

    it('github push with no commits → commits: 0', () => {
      expect(svc.extractPayloadSummary('github', 'push', { ref: 'refs/heads/main' }).commits).toBe(0);
    });

    it('github pull_request → action/number/merged/base/head', () => {
      expect(
        svc.extractPayloadSummary('github', 'pull_request', {
          action: 'closed',
          pull_request: { number: 42, merged: true, base: { ref: 'main' }, head: { ref: 'feat' } },
        })
      ).toEqual({ action: 'closed', number: 42, merged: true, base: 'main', head: 'feat' });
    });

    it('github delete → ref/ref_type', () => {
      expect(svc.extractPayloadSummary('github', 'delete', { ref: 'feat', ref_type: 'branch' })).toEqual({
        ref: 'feat',
        ref_type: 'branch',
      });
    });

    it('github unknown event → { event }', () => {
      expect(svc.extractPayloadSummary('github', 'ping', {})).toEqual({ event: 'ping' });
    });

    it('gitlab → ref/event_name/project_id', () => {
      expect(
        svc.extractPayloadSummary('gitlab', 'push', { ref: 'refs/heads/main', event_name: 'push', project: { id: 7 } })
      ).toEqual({ ref: 'refs/heads/main', event_name: 'push', project_id: 7 });
    });

    it('bitbucket push → branch/oldBranch/commit-count from push.changes[0]', () => {
      expect(
        svc.extractPayloadSummary('bitbucket', 'push', {
          push: { changes: [{ new: { name: 'feat-1' }, old: { name: 'feat-1' }, commits: [{}, {}] }] },
        })
      ).toEqual({ branch: 'feat-1', oldBranch: 'feat-1', commits: 2 });
    });

    it('bitbucket push with no changes → commits: 0, no branch', () => {
      expect(svc.extractPayloadSummary('bitbucket', 'push', {})).toEqual({
        branch: undefined,
        oldBranch: undefined,
        commits: 0,
      });
    });

    it('bitbucket pull_request → state/number/base/head', () => {
      expect(
        svc.extractPayloadSummary('bitbucket', 'pull_request', {
          pullrequest: {
            id: 9,
            state: 'MERGED',
            destination: { branch: { name: 'main' } },
            source: { branch: { name: 'feat' } },
          },
        })
      ).toEqual({ state: 'MERGED', number: 9, base: 'main', head: 'feat' });
    });

    it('bitbucket delete → the deleted branch name from push.changes[0].old', () => {
      expect(
        svc.extractPayloadSummary('bitbucket', 'delete', {
          push: { changes: [{ new: null, old: { type: 'branch', name: 'feat-1' } }] },
        })
      ).toEqual({ branch: 'feat-1' });
    });

    it('bitbucket unknown event → { event }', () => {
      expect(svc.extractPayloadSummary('bitbucket', 'unknown', {})).toEqual({ event: 'unknown' });
    });
  });

  describe('extractBranchFromSummary', () => {
    it('github push strips refs/heads/', () => {
      expect(svc.extractBranchFromSummary('github', 'push', { ref: 'refs/heads/feat-1' })).toBe('feat-1');
    });
    it('github pull_request → base branch', () => {
      expect(svc.extractBranchFromSummary('github', 'pull_request', { base: 'main' })).toBe('main');
    });
    it('github delete → ref only when ref_type is branch', () => {
      expect(svc.extractBranchFromSummary('github', 'delete', { ref: 'feat', ref_type: 'branch' })).toBe('feat');
      expect(svc.extractBranchFromSummary('github', 'delete', { ref: 'v1', ref_type: 'tag' })).toBeNull();
    });
    it('github unknown → null', () => {
      expect(svc.extractBranchFromSummary('github', 'ping', {})).toBeNull();
    });
    it('gitlab strips refs/heads/', () => {
      expect(svc.extractBranchFromSummary('gitlab', 'push', { ref: 'refs/heads/g-branch' })).toBe('g-branch');
    });
    it('bitbucket push → the summary branch (already a bare name)', () => {
      expect(svc.extractBranchFromSummary('bitbucket', 'push', { branch: 'b-branch' })).toBe('b-branch');
    });
    it('bitbucket pull_request → base branch', () => {
      expect(svc.extractBranchFromSummary('bitbucket', 'pull_request', { base: 'main' })).toBe('main');
    });
    it('bitbucket delete → the deleted branch', () => {
      expect(svc.extractBranchFromSummary('bitbucket', 'delete', { branch: 'feat-1' })).toBe('feat-1');
    });
    it('bitbucket push with no branch (e.g. branch deleted) / unknown event → null', () => {
      expect(svc.extractBranchFromSummary('bitbucket', 'push', {})).toBeNull();
      expect(svc.extractBranchFromSummary('bitbucket', 'unknown', { branch: 'x' })).toBeNull();
    });
  });
});
