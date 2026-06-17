/** @group platform */
import { classifyGitError, sanitizeGitError, maybeScrubbedCappedStack } from '@ee/workspace-branches/git-error-classifier';
import { GIT_SYNC_JOBS } from '@modules/workspace-branches/constants';

describe('git-error-classifier', () => {
  describe('classifyGitError | maps known failures to safe messages', () => {
    it('maps auth failures to AUTH_FAILED without echoing stderr', () => {
      // real ghp_ tokens are 40 chars; use realistic length so the scrubber regex hits
      const err = new Error(
        'fatal: Authentication failed for https://x-access-token:ghp_SECRETSECRETSECRETSECRET12345678@github.com/o/r',
      );
      const { code, title, safeMessage } = classifyGitError(err, GIT_SYNC_JOBS.CREATE_BRANCH);
      expect(code).toBe('AUTH_FAILED');
      expect(title).toBe('Branch creation failed');
      expect(safeMessage).not.toMatch(/ghp_SECRETSECRETSECRETSECRET12345678/);
      expect(safeMessage).not.toMatch(/x-access-token/);
    });

    it('maps non-fast-forward to NON_FAST_FORWARD', () => {
      const err = new Error('Updates were rejected because the tip of your current branch is behind (non-fast-forward)');
      expect(classifyGitError(err, GIT_SYNC_JOBS.PUSH_APP_DELETION).code).toBe('NON_FAST_FORWARD');
    });

    it('maps missing ref to REF_NOT_FOUND', () => {
      expect(classifyGitError(new Error('Reference does not exist'), GIT_SYNC_JOBS.DELETE_BRANCH).code).toBe('REF_NOT_FOUND');
    });

    it('maps network timeout to NETWORK', () => {
      expect(classifyGitError(new Error('Connection timed out after 30000ms'), GIT_SYNC_JOBS.PULL_BRANCH).code).toBe('NETWORK');
    });

    it('falls back to GENERIC for unknown errors and never echoes the raw message', () => {
      // realistic leaked token length: 40-char suffix
      const { code, safeMessage } = classifyGitError(
        new Error('totally novel ghp_LEAKLEAKLEAKLEAKLEAK12345678 error'),
        GIT_SYNC_JOBS.PULL_BRANCH,
      );
      expect(code).toBe('GENERIC');
      expect(safeMessage).not.toMatch(/ghp_LEAKLEAKLEAKLEAKLEAK12345678/);
    });

    it('produces a per-job title for each known job name', () => {
      expect(classifyGitError(new Error('x'), GIT_SYNC_JOBS.CREATE_BRANCH).title).toBe('Branch creation failed');
      expect(classifyGitError(new Error('x'), GIT_SYNC_JOBS.PULL_BRANCH).title).toBe('Branch pull failed');
      expect(classifyGitError(new Error('x'), GIT_SYNC_JOBS.DELETE_BRANCH).title).toBe('Branch deletion failed');
      expect(classifyGitError(new Error('x'), GIT_SYNC_JOBS.PUSH_APP_DELETION).title).toBe('App deletion sync failed');
    });
  });

  describe('sanitizeGitError | scrubs secrets', () => {
    it.each([
      // realistic 40-char ghp_ token
      ['x-access-token', 'https://x-access-token:ghp_abc123abc123abc123abc12345678@github.com/o/r.git'],
      // realistic github_pat (55+ chars after prefix in real tokens)
      ['github_pat', 'remote uses github_pat_11ABCDEF0_longtokenvaluehereXXXXXXXXXX here'],
      ['basic header', 'http.extraHeader=Authorization: Basic dXNlcjpwYXNz'],
      ['user:pass url', 'cloning https://alice:s3cret@example.com/repo.git'],
    ])('removes %s', (_label, raw) => {
      const out = sanitizeGitError(raw);
      expect(out).not.toMatch(/ghp_abc123abc123abc123abc12345678|github_pat_11ABCDEF0_longtokenvaluehereXXXXXXXXXX|dXNlcjpwYXNz|s3cret/);
      expect(out).toMatch(/\[REDACTED\]/);
    });
  });

  describe('maybeScrubbedCappedStack | caps + scrubs', () => {
    it('returns a string when error has a stack', () => {
      expect(maybeScrubbedCappedStack(new Error('x'))).toBeDefined();
    });
    it('caps at ~8KB and scrubs tokens', () => {
      const e = new Error('boom');
      // realistic 40-char ghp_ so regex matches
      e.stack = 'ghp_SCRUBSCRUBSCRUBSCRUBSCRUB12345678\n' + 'x'.repeat(20000);
      const out = maybeScrubbedCappedStack(e)!;
      expect(out.length).toBeLessThanOrEqual(8192);
      expect(out).not.toMatch(/ghp_SCRUBSCRUBSCRUBSCRUBSCRUB12345678/);
    });
  });
});
