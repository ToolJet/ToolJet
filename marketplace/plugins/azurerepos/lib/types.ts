export type SourceOptions = {
  organization_name: string;
  personal_access_token: string;
};
export type QueryOptions = {
  operation: Operation;
  project_name: string;
  repository_name: string;
  status?: 'completed' | 'active' | 'abandoned' | 'all';
};

export enum Operation {
  GetAzureRepo = 'get_azure_repo',
  GetRepoCommits = 'get_repo_commits',
  GetProjectPullRequests = 'get_project_pull_requests',
  GetRepositoryBranches = 'get_repo_branches',
  getRepositoryPushes = 'get_repo_pushes'
}
