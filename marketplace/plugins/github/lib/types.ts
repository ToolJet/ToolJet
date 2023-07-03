export type SourceOptions = {
  auth_type: string;
  personal_token: string;
};

export type QueryOptions = {
  operation: Operation;
  username?: string;
  repo?: string;
  owner?: string;
  state?: 'open' | 'closed' | 'all';
};

export enum Operation {
  GetUserInfo = 'get_user_info',
  GetRepo = 'get_repo',
  GetRepoIssues = 'get_repo_issues',
  GetRepoPullRequests = 'get_repo_pull_requests',
}
