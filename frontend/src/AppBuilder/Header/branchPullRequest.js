import { buildGitPrUrl } from '@/_helpers/gitPrUrl';

// What the branch menu's pull request button does, from the branch's review status (see
// workspaceBranchesService.getBranchReviewStatus). The pull request comes first: reviews are requested on it, and
// ToolJet's check on it holds the merge until every app committed on the branch is approved.
export const pullRequestAction = (status) =>
  status?.pullRequest?.status === 'open'
    ? { label: 'View pull request', url: status.pullRequest.url, disabled: false, reason: null }
    : { label: 'Create pull request', url: null, disabled: false, reason: null };

// The commit ToolJet's pull request comment approves, once every app is approved and the pull request is open.
export const approvedCommitNote = (status) => {
  const comment = status?.reviewComment;
  if (comment?.state !== 'approved' || !comment.commit) return null;
  return `Approved for commit ${comment.commit.slice(0, 7)}. A new commit needs a new approval.`;
};

// Provider-neutral git config reads. orgGit carries whichever provider is active — git_https for
// GitHub, git_lab for GitLab — so reading only git_https broke Create PR / default-branch detection
// on GitLab workspaces (repoUrl came back empty → "Unable to determine repository URL").
const resolveRepoUrl = (orgGit) =>
  orgGit?.git_https?.https_url || orgGit?.git_https?.repository || orgGit?.git_lab?.gitlab_url || '';
export const resolveDefaultBranchName = (orgGit) =>
  orgGit?.git_https?.github_branch || orgGit?.git_lab?.gitlab_branch || 'main';
// Only assert a provider when one is actually known/enabled; otherwise leave it undefined so
// buildGitPrUrl falls back to host detection instead of mislabeling the repo as GitHub.
const resolveGitType = (orgGit) =>
  orgGit?.git_type ||
  orgGit?.gitType ||
  (orgGit?.git_lab?.is_enabled ? 'gitlab' : orgGit?.git_https?.is_enabled ? 'github_https' : undefined);

// Where the pull request button goes: the branch's open pull request, else the provider's page for a new one.
export const pullRequestUrl = (status, orgGit, branchName) =>
  pullRequestAction(status).url ??
  buildGitPrUrl({
    repoUrl: resolveRepoUrl(orgGit),
    gitType: resolveGitType(orgGit),
    sourceBranch: branchName,
    defaultBranch: resolveDefaultBranchName(orgGit),
  });
