/** @group gitsync */
import {
  classifyGitError,
  sanitizeGitError,
  maybeScrubbedCappedStack,
  extractConflictGroups,
  formatConflictTrace,
} from '@ee/workspace-branches/git-error-classifier';
import { GIT_SYNC_JOBS } from '@modules/workspace-branches/constants';

describe('git-error-classifier', () => {
  describe('classifyGitError → code', () => {
    const cases: Array<[string, any, string]> = [
      ['AUTH via status 401', { message: 'x', status: 401 }, 'AUTH_FAILED'],
      ['AUTH via status 403', { message: 'x', status: 403 }, 'AUTH_FAILED'],
      ['AUTH via message', { message: 'fatal: Authentication failed for repo' }, 'AUTH_FAILED'],
      ['AUTH via could not read username', { message: 'could not read Username' }, 'AUTH_FAILED'],
      ['AUTH via permission denied', { message: 'Permission denied (publickey)' }, 'AUTH_FAILED'],
      ['NON_FAST_FORWARD non-fast-forward', { message: 'non-fast-forward' }, 'NON_FAST_FORWARD'],
      ['NON_FAST_FORWARD updates were rejected', { message: 'Updates were rejected' }, 'NON_FAST_FORWARD'],
      ['NON_FAST_FORWARD failed to push', { message: 'failed to push some refs' }, 'NON_FAST_FORWARD'],
      ['REF via 404', { message: 'x', status: 404 }, 'REF_NOT_FOUND'],
      ['REF reference does not exist', { message: 'reference does not exist' }, 'REF_NOT_FOUND'],
      ['REF couldnt find remote ref', { message: "couldn't find remote ref feat" }, 'REF_NOT_FOUND'],
      ['NETWORK timed out', { message: 'Connection timed out' }, 'NETWORK'],
      ['NETWORK could not resolve host', { message: 'Could not resolve host: example.com' }, 'NETWORK'],
      ['NETWORK connection refused', { message: 'connection refused' }, 'NETWORK'],
      ['CONFLICT', { message: 'merge conflict in app.json' }, 'CONFLICT'],
      ['GENERIC fallback', { message: 'something unexpected' }, 'GENERIC'],
      ['GENERIC when no message', {}, 'GENERIC'],
    ];
    it.each(cases)('%s', (_label, error, expectedCode) => {
      expect(classifyGitError(error, GIT_SYNC_JOBS.PULL_BRANCH).code).toBe(expectedCode);
    });

    it('does not classify a bare "not found" as REF_NOT_FOUND (private-repo auth case)', () => {
      expect(classifyGitError({ message: 'Repository not found' }, GIT_SYNC_JOBS.PULL_BRANCH).code).toBe('GENERIC');
    });
  });

  describe('classifyGitError → title (per job) + safeMessage', () => {
    it('maps each known job to its title', () => {
      expect(classifyGitError({ message: '' }, GIT_SYNC_JOBS.CREATE_BRANCH).title).toBe('Branch creation failed');
      expect(classifyGitError({ message: '' }, GIT_SYNC_JOBS.PULL_BRANCH).title).toBe('Pull failed');
      expect(classifyGitError({ message: '' }, GIT_SYNC_JOBS.DELETE_BRANCH).title).toBe('Branch deletion failed');
      expect(classifyGitError({ message: '' }, GIT_SYNC_JOBS.PUSH_APP_DELETION).title).toBe('App deletion sync failed');
    });
    it('falls back to a generic title for an unknown job', () => {
      expect(classifyGitError({ message: '' }, 'unknown-job').title).toBe('Git operation failed');
    });
    it('returns a safe (never-echoed) message for the resolved code', () => {
      const r = classifyGitError({ message: 'x', status: 401 }, GIT_SYNC_JOBS.PULL_BRANCH);
      expect(r.safeMessage).toContain('authentication failed');
      expect(r.safeMessage).not.toContain('x');
    });
  });

  describe('sanitizeGitError', () => {
    it('redacts x-access-token credentials', () => {
      // Non-URL context so the x-access-token rule (not the ://user:pass@ rule) does the redaction.
      expect(sanitizeGitError('remote: x-access-token:ghs_abcd1234@github.com/o/r.git')).toBe(
        'remote: x-access-token:[REDACTED]@github.com/o/r.git'
      );
      // In a full clone URL the ://user:pass@ rule collapses it — still fully redacted, token gone.
      const url = sanitizeGitError('https://x-access-token:ghs_abcd1234@github.com/o/r.git');
      expect(url).not.toContain('ghs_abcd1234');
      expect(url).toContain('[REDACTED]@');
    });
    it('redacts Authorization basic/bearer headers', () => {
      expect(sanitizeGitError('Authorization: Bearer abcDEF123.-_=')).toBe('Authorization: Bearer [REDACTED]');
      expect(sanitizeGitError('authorization: basic dXNlcjpwYXNz')).toBe('authorization: basic [REDACTED]');
    });
    it('redacts github app/pat tokens', () => {
      expect(sanitizeGitError('token ghp_' + 'a'.repeat(36))).toBe('token [REDACTED]');
      expect(sanitizeGitError('token github_pat_' + 'A'.repeat(30))).toBe('token [REDACTED]');
    });
    it('redacts user:pass in a URL', () => {
      expect(sanitizeGitError('cloning https://user:secretpass@host/x')).toBe('cloning https://[REDACTED]@host/x');
    });
    it('redacts a PEM private-key blob', () => {
      const pem = '-----BEGIN RSA PRIVATE KEY-----\nAAAA\nBBBB\n-----END RSA PRIVATE KEY-----';
      expect(sanitizeGitError(`key=${pem} done`)).toBe('key=[REDACTED] done');
    });
    it('is a no-op on clean input and tolerates null/undefined', () => {
      expect(sanitizeGitError('plain message')).toBe('plain message');
      expect(sanitizeGitError(undefined as any)).toBe('');
    });
  });

  describe('maybeScrubbedCappedStack', () => {
    it('returns undefined when there is no stack', () => {
      expect(maybeScrubbedCappedStack({})).toBeUndefined();
      expect(maybeScrubbedCappedStack({ stack: '' })).toBeUndefined();
    });
    it('scrubs secrets and caps the length at 8192 bytes', () => {
      const stack = 'ghp_' + 'z'.repeat(40) + ' ' + 'x'.repeat(9000);
      const out = maybeScrubbedCappedStack({ stack })!;
      expect(out).toContain('[REDACTED]');
      expect(out.length).toBeLessThanOrEqual(8192);
    });
  });

  describe('extractConflictGroups', () => {
    it('returns null when the message is not a conflict payload', () => {
      expect(extractConflictGroups(new Error('boom'))).toBeNull();
      expect(extractConflictGroups({} as any)).toBeNull();
    });
    it('returns null for malformed JSON that mentions conflictGroups', () => {
      expect(extractConflictGroups(new Error('conflictGroups: not json'))).toBeNull();
    });
    it('returns null for an empty conflictGroups array', () => {
      expect(extractConflictGroups(new Error(JSON.stringify({ conflictGroups: [] })))).toBeNull();
    });
    it('parses a valid conflict payload', () => {
      const groups = [{ label: 'Apps', conflicts: [{ name: 'a', status: 'incoming', coRelationId: 'c1' }] }];
      expect(extractConflictGroups(new Error(JSON.stringify({ conflictGroups: groups })))).toEqual(groups);
    });
  });

  describe('formatConflictTrace', () => {
    it('renders a readable list with names, status and short corr-ids', () => {
      const out = formatConflictTrace([
        {
          label: 'Conflicting apps',
          conflictKey: 'my-app',
          conflicts: [{ name: 'my-app', status: 'incoming', coRelationId: 'abcdef1234567890' }],
        },
      ]);
      expect(out).toContain('Naming conflicts detected:');
      expect(out).toContain("Conflicting apps — 'my-app'");
      expect(out).toContain('• my-app   (incoming)  #abcdef12');
    });
    it('caps at 50 items and reports the remainder', () => {
      const conflicts = Array.from({ length: 60 }, (_, i) => ({
        name: `a${i}`,
        status: 'incoming',
        coRelationId: `c${i}`,
      }));
      const out = formatConflictTrace([{ label: 'Apps', conflicts }]);
      expect(out).toContain('…and 10 more');
    });
  });
});
