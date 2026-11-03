import { execFileSync } from 'child_process';

import { AppJson } from './project';
import { ApiError, Session } from './session';

/*
  Git sync keeps one draft per workspace branch. A project that lives in the workspace's git repository works on
  the draft of the branch it is checked out on: `git checkout feature-x` then `tooljet app dev` edits feature-x's
  draft, as the editor does with feature-x selected. `"branch"` in app.json names the branch instead of git, and a
  checked-out version (`tooljet app checkout`) wins over both.
*/

/** The branch a folder's git checkout is on; null outside a git checkout or on a detached HEAD. */
export const gitBranchOf = (dir: string): string | null => {
  try {
    // symbolic-ref answers on a branch with no commits yet too, and fails on a detached HEAD.
    const name = execFileSync('git', ['-C', dir, 'symbolic-ref', '--short', '-q', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return name || null;
  } catch {
    return null;
  }
};

interface BranchDraft {
  branch: { id: string; name: string; isDefault: boolean } | null;
  version: { id: string; name: string; status: string } | null;
}

export interface WorkingApp {
  app: AppJson;
  /** The workspace branch the project works on, when git sync picked it. */
  branch?: { name: string; isDefault: boolean };
}

/**
 * The app as the commands should use it: with `version` set to the branch's draft when git sync decides it. A
 * workspace without git sync answers with no branch, and the project follows the app's editing version as before.
 */
export async function workingApp(session: Session, root: string, app: AppJson): Promise<WorkingApp> {
  if (app.version || !app.appId) return { app };
  const named = app.branch;
  const branch = named ?? gitBranchOf(root);
  if (!branch) return { app };

  const lookup = () =>
    session.api(`/code-mode-source/${app.appId}/branch-draft?branch=${encodeURIComponent(branch)}`) as Promise<BranchDraft>;
  let found: BranchDraft;
  try {
    found = await lookup();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new Error(
        `The workspace has no git branch "${branch}"${named ? ' (app.json "branch")' : ' (the branch this folder is on)'}. ` +
          'Create it in ToolJet or push it from git first, or check out the branch the app is on.'
      );
    }
    throw err;
  }
  const workspaceBranch = found.branch;
  if (!workspaceBranch) return { app };
  let draft = found.version;
  if (!draft) {
    // The branch has not loaded the app yet: opening it on that branch loads it, as the editor does.
    await session.api(`/apps/${app.appId}?branch_id=${encodeURIComponent(workspaceBranch.id)}`);
    draft = (await lookup()).version;
    if (!draft) throw new Error(`Branch "${branch}" has no draft of this app yet. Open the app on that branch in ToolJet.`);
  }
  return {
    app: { ...app, version: { id: draft.id, name: draft.name } },
    branch: { name: workspaceBranch.name, isDefault: workspaceBranch.isDefault },
  };
}

export const branchLine = (branch: { name: string; isDefault: boolean }) =>
  `On git branch ${branch.name}: working on its draft${branch.isDefault ? ' (the default branch)' : ''}`;
