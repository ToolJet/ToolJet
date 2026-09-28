// Single source of truth for the "Create PR/MR" deep-link, shared by the App Builder header branch
// dropdown and the workspace-level branch dropdown. These two used to carry independent copies of
// this logic, which drifted: the header copy read the repo URL only from the GitHub provider, so on
// GitLab workspaces it produced no URL ("Unable to determine repository URL for PR creation").
//
// Pure function — no store/React access — so it is unit-testable and behaves identically in both
// call sites.

// Turn a clone URL into an https web base (no trailing .git). Handles scp-style ssh remotes:
//   git@host:owner/repo.git      → https://host/owner/repo
//   https://host/owner/repo.git  → https://host/owner/repo
function toWebBase(url) {
  const base = String(url)
    .trim()
    .replace(/\.git$/, '');
  const scp = base.match(/^git@([^:]+):(.+)$/);
  return scp ? `https://${scp[1]}/${scp[2]}` : base;
}

// Provider is decided by the configured gitType (authoritative), NOT by the repo host — that's what
// makes self-hosted GitHub Enterprise / GitLab work, since their hosts aren't github.com/gitlab.com.
// Host detection is only a fallback for callers that don't pass a gitType. The cloud host regex is
// used solely to canonicalize the web base; a self-hosted host falls back to the configured repo URL.
export function buildGitPrUrl({ repoUrl, gitType, sourceBranch, defaultBranch }) {
  if (!repoUrl || !sourceBranch) return null;

  const targetBranch = defaultBranch || 'main';
  // Tolerant of scp-style remotes and dots in repo names (e.g. git-sync-2.0-repo). Anchored to the
  // end so `owner` is the first path segment and `repo` captures any remaining subgroup path.
  const githubMatch = repoUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
  const gitlabMatch = repoUrl.match(/gitlab\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
  const bitbucketMatch = repoUrl.match(/bitbucket\.org[:/]([^/]+)\/(.+?)(\.git)?$/);

  const isGithub = gitType === 'github_https' || (!gitType && !!githubMatch);
  const isGitlab = gitType === 'gitlab' || (!gitType && !!gitlabMatch);

  if (isGithub) {
    // Cloud → canonical github.com base; Enterprise → configured repo URL as the base.
    const base = githubMatch ? `https://github.com/${githubMatch[1]}/${githubMatch[2]}` : toWebBase(repoUrl);
    // GitHub compare accepts refs with slashes raw; don't URL-encode the branch names.
    return `${base}/compare/${targetBranch}...${sourceBranch}?expand=1`;
  }

  if (isGitlab) {
    // Cloud → canonical gitlab.com base; self-hosted → configured repo URL as the base.
    const base = gitlabMatch ? `https://gitlab.com/${gitlabMatch[1]}/${gitlabMatch[2]}` : toWebBase(repoUrl);
    return `${base}/-/merge_requests/new?merge_request[source_branch]=${encodeURIComponent(
      sourceBranch
    )}&merge_request[target_branch]=${encodeURIComponent(targetBranch)}`;
  }

  // Bitbucket has no ToolJet gitType; detected by host only.
  if (bitbucketMatch) {
    const [, owner, repo] = bitbucketMatch;
    return `https://bitbucket.org/${owner}/${repo}/pull-requests/new?source=${sourceBranch}&dest=${targetBranch}`;
  }

  return null;
}
