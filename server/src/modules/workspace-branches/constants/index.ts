export enum FEATURE_KEY {
  LIST_BRANCHES = 'LIST_BRANCHES',
  CREATE_BRANCH = 'CREATE_BRANCH',
  SWITCH_BRANCH = 'SWITCH_BRANCH',
  DELETE_BRANCH = 'DELETE_BRANCH',
  PUSH_WORKSPACE = 'PUSH_WORKSPACE',
  PULL_WORKSPACE = 'PULL_WORKSPACE',
  CHECK_UPDATES = 'CHECK_UPDATES',
  LIST_REMOTE_BRANCHES = 'LIST_REMOTE_BRANCHES',
  FETCH_PULL_REQUESTS = 'FETCH_PULL_REQUESTS',
  ENSURE_DRAFT = 'ENSURE_DRAFT',
}

// Git-sync background queue. Lives in src so module registration (CE + EE)
// can reference it; the EE service/processor implement the actual jobs.
export const GIT_SYNC_QUEUE = 'git-sync-queue';

export const GIT_SYNC_JOBS = {
  CREATE_BRANCH: 'git-create-branch',
  PULL_BRANCH: 'git-pull-branch',
  DELETE_BRANCH: 'git-delete-branch',
  PUSH_APP_DELETION: 'git-push-app-deletion',
} as const;
