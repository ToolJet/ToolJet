/**
 * Reads the git commit a resource's content currently matches, off the rows the API already
 * returns. Both casings are accepted: the versions endpoint serialises entity fields as-is
 * (camelCase) while the branches endpoint goes through decamelize.
 *
 * Null means "no commit recorded" — a row from before the columns existed, or a resource that
 * has never been pushed or pulled. The header tag treats that as "nothing to show".
 */

const pick = (row, camel, snake) => row?.[camel] ?? row?.[snake] ?? null;

/** The commit an app/module/workflow version was last pushed to or pulled from. */
export function commitFromVersion(version) {
  const sha = pick(version, 'syncedCommitSha', 'synced_commit_sha');
  if (!sha) return null;
  return {
    sha,
    message: pick(version, 'syncedCommitMessage', 'synced_commit_message'),
    at: pick(version, 'syncedAt', 'synced_at'),
  };
}

/** The commit the workspace's last pull landed on, for the dashboard header. */
export function commitFromBranch(branch) {
  const sha = pick(branch, 'workspacePullCommitSha', 'workspace_pull_commit_sha');
  if (!sha) return null;
  return {
    sha,
    message: pick(branch, 'workspacePullCommitMessage', 'workspace_pull_commit_message'),
    at: pick(branch, 'workspacePullAt', 'workspace_pull_at'),
  };
}
