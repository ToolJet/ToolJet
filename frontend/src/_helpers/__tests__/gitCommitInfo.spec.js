import { commitFromBranch, commitFromVersion } from '../gitCommitInfo';

describe('commitFromVersion', () => {
  it('should read the camelCase fields the versions endpoint returns', () => {
    expect(
      commitFromVersion({
        syncedCommitSha: 'a3f9c21',
        syncedCommitMessage: 'Add sales dashboard filters',
        syncedAt: '2026-11-13T10:42:00.000Z',
      })
    ).toEqual({ sha: 'a3f9c21', message: 'Add sales dashboard filters', at: '2026-11-13T10:42:00.000Z' });
  });

  it('should read the snake_case fields a decamelized response would carry', () => {
    expect(
      commitFromVersion({
        synced_commit_sha: 'a3f9c21',
        synced_commit_message: 'Add sales dashboard filters',
        synced_at: '2026-11-13T10:42:00.000Z',
      })
    ).toEqual({ sha: 'a3f9c21', message: 'Add sales dashboard filters', at: '2026-11-13T10:42:00.000Z' });
  });

  it('should return null when the version has no commit, so the tag stays closed', () => {
    expect(commitFromVersion({ syncedCommitSha: null, syncedCommitMessage: 'orphan message' })).toBeNull();
    expect(commitFromVersion(undefined)).toBeNull();
  });

  it('should keep a commit whose message and time are missing', () => {
    expect(commitFromVersion({ syncedCommitSha: 'a3f9c21' })).toEqual({ sha: 'a3f9c21', message: null, at: null });
  });
});

describe('commitFromBranch', () => {
  it('should read the workspace pull commit in either casing', () => {
    const expected = { sha: 'b7e4d10', message: 'Release 3.21', at: '2026-11-13T10:42:00.000Z' };
    expect(
      commitFromBranch({
        workspacePullCommitSha: 'b7e4d10',
        workspacePullCommitMessage: 'Release 3.21',
        workspacePullAt: '2026-11-13T10:42:00.000Z',
      })
    ).toEqual(expected);
    expect(
      commitFromBranch({
        workspace_pull_commit_sha: 'b7e4d10',
        workspace_pull_commit_message: 'Release 3.21',
        workspace_pull_at: '2026-11-13T10:42:00.000Z',
      })
    ).toEqual(expected);
  });

  it('should return null for a branch that has never been pulled', () => {
    expect(commitFromBranch({ name: 'feature/dashboard' })).toBeNull();
    expect(commitFromBranch(null)).toBeNull();
  });
});
